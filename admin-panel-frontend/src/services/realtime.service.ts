import { io, Socket } from 'socket.io-client';
import type { AppointmentRealtimeEvent } from '@/types';
import { REALTIME_EVENT_NAME } from '@/components/RealtimeIndicator';

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
    return `${window.location.protocol}//${window.location.hostname}:4040`;
  }

  return window.location.origin;
}

/**
 * Emite un CustomEvent global para que el RealtimeIndicator muestre el badge
 * "En vivo" sin acoplar el servicio al componente de UI.
 */
function emitRealtimeUpdate(payload: { appointmentId?: string; type?: string } = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: payload }));
  } catch {
    /* CustomEvent constructor puede fallar en navegadores antiguos — ignorar silenciosamente. */
  }
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

    socket.on('appointment-event', (event: AppointmentRealtimeEvent) => {
      onAppointmentEvent(event);
      emitRealtimeUpdate({
        appointmentId: event.appointmentId,
        type: 'appointment-event',
      });
    });

    socket.on('appointment-status-changed', (event: AppointmentRealtimeEvent) => {
      onAppointmentEvent(event);
      emitRealtimeUpdate({
        appointmentId: event.appointmentId,
        type: 'appointment-status-changed',
      });
    });

    return () => {
      socket?.off('appointment-event', onAppointmentEvent);
      socket?.off('appointment-status-changed', onAppointmentEvent);
      socket?.disconnect();
      socket = null;
    };
  },
};