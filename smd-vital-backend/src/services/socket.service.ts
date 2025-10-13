import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
// import { SocketEvents } from '../types';

export class SocketService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Handle joining rooms
      socket.on('join-room', (roomId: string) => {
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
        const { appointmentId, status } = data;
        
        // Broadcast appointment update to relevant users
        this.io.emit('appointment-status-changed', {
          appointmentId,
          status
        });

        logger.info('Appointment update broadcasted', { socketId: socket.id, appointmentId, status });
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
    this.io.emit('notification', {
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
    const update = {
      appointmentId,
      status,
      timestamp: new Date().toISOString()
    };

    if (userId) {
      this.io.emit('appointment-status-changed', update);
    } else {
      this.io.emit('appointment-status-changed', update);
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
}

