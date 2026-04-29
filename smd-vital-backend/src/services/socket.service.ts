import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import prismaClient from '../utils/prisma';

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
}

type AuthenticatedSocket = Socket & {
  data: {
    user?: SocketUser;
  };
};

export interface AppointmentRealtimeEvent {
  appointmentId: string;
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'status_changed'
    | 'encounter_started'
    | 'vitals_recorded'
    | 'note_added'
    | 'encounter_finished'
    | 'documents_sent';
  status?: string;
  previousStatus?: string | null;
  appointment?: unknown;
  trace?: unknown;
  actor?: {
    id: string;
    role: UserRole;
  };
  timestamp?: string;
}

interface AppointmentRealtimeTargets {
  userIds?: Array<string | null | undefined>;
  roles?: UserRole[];
}

export class SocketService {
  private static activeInstance?: SocketService;
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    SocketService.activeInstance = this;
    this.setupSocketAuth();
    this.setupSocketHandlers();
  }

  public static emitAppointmentEvent(
    event: AppointmentRealtimeEvent,
    targets: AppointmentRealtimeTargets = {}
  ): void {
    SocketService.activeInstance?.emitAppointmentEvent(event, targets);
  }

  public emitAppointmentEvent(
    event: AppointmentRealtimeEvent,
    targets: AppointmentRealtimeTargets = {}
  ): void {
    const payload = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString()
    };

    const rooms = new Set<string>(['ops', `appointment:${event.appointmentId}`]);
    targets.userIds?.forEach((userId) => {
      if (userId) {
        rooms.add(`user:${userId}`);
      }
    });
    targets.roles?.forEach((role) => rooms.add(`role:${role}`));

    rooms.forEach((room) => this.io.to(room).emit('appointment-event', payload));

    if (event.status) {
      rooms.forEach((room) => this.io.to(room).emit('appointment-status-changed', payload));
    }

    logger.info('Appointment realtime event emitted', {
      appointmentId: event.appointmentId,
      action: event.action,
      rooms: Array.from(rooms)
    });
  }

  private setupSocketAuth(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = this.extractToken(socket);
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
        const user = await prismaClient.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true
          }
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid socket user'));
        }

        socket.data.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };

        next();
      } catch (error: any) {
        logger.warn('Socket authentication failed', { message: error.message });
        next(new Error('Invalid token'));
      }
    });
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const user = socket.data.user;
      if (!user) {
        socket.disconnect(true);
        return;
      }

      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
      if (this.isOperationsRole(user.role)) {
        socket.join('ops');
      }

      logger.info('Client connected', { socketId: socket.id, userId: user.id, role: user.role });

      // Handle joining rooms
      socket.on('join-room', (roomId: string) => {
        if (!this.canJoinRoom(user, roomId)) {
          socket.emit('error', {
            message: 'Not allowed to join room',
            code: 'ROOM_FORBIDDEN'
          });
          return;
        }

        socket.join(roomId);
        logger.info('Client joined room', { socketId: socket.id, roomId });
      });

      // Handle leaving rooms
      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        logger.info('Client left room', { socketId: socket.id, roomId });
      });

      // Handle sending messages
      socket.on('send-message', (data: { roomId: string; message: string }) => {
        const { roomId, message } = data;
        
        // Broadcast message to room
        socket.to(roomId).emit('message-received', {
          message,
          timestamp: new Date().toISOString(),
          sender: socket.id
        });

        logger.info('Message sent', { socketId: socket.id, roomId, message });
      });

      // Handle appointment updates
      socket.on('appointment-update', (data: { appointmentId: string; status: string }) => {
        socket.emit('error', {
          message: 'Appointment status changes must use the authenticated API',
          code: 'READ_ONLY_SOCKET_EVENT'
        });

        logger.warn('Rejected client-side appointment update', {
          socketId: socket.id,
          userId: user.id,
          appointmentId: data.appointmentId,
          status: data.status
        });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected', { socketId: socket.id, reason });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('Socket error', { socketId: socket.id, error: error.message });
      });
    });
  }

  /**
   * Send notification to user
   */
  public sendNotificationToUser(userId: string, notification: {
    title: string;
    message: string;
    type: string;
    data?: any;
  }): void {
    this.io.to(`user:${userId}`).emit('notification', {
      userId,
      ...notification
    });

    logger.info('Notification sent to user', { userId, title: notification.title });
  }

  /**
   * Send notification to room
   */
  public sendNotificationToRoom(roomId: string, notification: {
    title: string;
    message: string;
    type: string;
    data?: any;
  }): void {
    this.io.to(roomId).emit('notification', notification);

    logger.info('Notification sent to room', { roomId, title: notification.title });
  }

  /**
   * Send appointment update
   */
  public sendAppointmentUpdate(appointmentId: string, status: string, userId?: string): void {
    const update: AppointmentRealtimeEvent = {
      appointmentId,
      action: 'status_changed',
      status,
      timestamp: new Date().toISOString()
    };

    if (userId) {
      this.io.to(`user:${userId}`).emit('appointment-status-changed', update);
    } else {
      this.emitAppointmentEvent(update);
    }

    logger.info('Appointment update sent', { appointmentId, status, userId });
  }

  /**
   * Send message to room
   */
  public sendMessageToRoom(roomId: string, message: {
    content: string;
    sender: string;
    timestamp: string;
  }): void {
    this.io.to(roomId).emit('message-received', message);

    logger.info('Message sent to room', { roomId, sender: message.sender });
  }

  /**
   * Send error to client
   */
  public sendErrorToClient(socketId: string, error: {
    message: string;
    code: string;
  }): void {
    this.io.to(socketId).emit('error', error);

    logger.info('Error sent to client', { socketId, error: error.message });
  }

  /**
   * Get connected clients count
   */
  public getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  /**
   * Get room clients count
   */
  public getRoomClientsCount(roomId: string): number {
    const room = this.io.sockets.adapter.rooms.get(roomId);
    return room ? room.size : 0;
  }

  /**
   * Get all rooms
   */
  public getAllRooms(): string[] {
    return Array.from(this.io.sockets.adapter.rooms.keys());
  }

  /**
   * Disconnect client
   */
  public disconnectClient(socketId: string): void {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      logger.info('Client disconnected by server', { socketId });
    }
  }

  /**
   * Disconnect all clients
   */
  public disconnectAllClients(): void {
    this.io.disconnectSockets();
    logger.info('All clients disconnected by server');
  }

  private extractToken(socket: Socket): string | null {
    const authToken = socket.handshake.auth?.['token'];
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const queryToken = socket.handshake.query?.['token'];
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    const authorization = socket.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.substring(7);
    }

    return null;
  }

  private canJoinRoom(user: SocketUser, roomId: string): boolean {
    if (roomId === `user:${user.id}` || roomId === `role:${user.role}`) {
      return true;
    }

    if (roomId === 'ops') {
      return this.isOperationsRole(user.role);
    }

    if (roomId.startsWith('appointment:')) {
      return this.isOperationsRole(user.role);
    }

    return this.isOperationsRole(user.role);
  }

  private isOperationsRole(role: UserRole): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }
}

