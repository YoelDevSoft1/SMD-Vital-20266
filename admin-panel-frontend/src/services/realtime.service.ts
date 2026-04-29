import { io, Socket } from 'socket.io-client';
import type { AppointmentRealtimeEvent } from '@/types';

type AppointmentEventHandler = (event: AppointmentRealtimeEvent) => void;

let socket: Socket | null = null;

function resolveSocketUrl() {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl) {
    return explicitSocketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl?.startsWith('http')) {
    return new URL(apiUrl).origin;
  }

  if (import.meta.env.DEV) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return window.location.origin;
}

export const realtimeService = {
  connect(onAppointmentEvent: AppointmentEventHandler) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return () => undefined;
    }

    if (socket) {
      socket.disconnect();
    }

    socket = io(resolveSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('appointment-event', onAppointmentEvent);
    socket.on('appointment-status-changed', onAppointmentEvent);

    return () => {
      socket?.off('appointment-event', onAppointmentEvent);
      socket?.off('appointment-status-changed', onAppointmentEvent);
      socket?.disconnect();
      socket = null;
    };
  },
};
