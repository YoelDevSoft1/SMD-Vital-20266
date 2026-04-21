export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface AppointmentWindow {
  id?: string;
  scheduledAt: Date;
  duration: number;
  status?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export function parseDateOnly(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Date must use YYYY-MM-DD format');
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }

  return parsed;
}

export function getDayRange(date: string | Date): { start: Date; end: Date; dateOnly: Date } {
  const source = typeof date === 'string' ? parseDateOnly(date) : date;
  const start = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth(), source.getUTCDate() + 1, 0, 0, 0, 0));

  return { start, end, dateOnly: start };
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function timeToMinutes(time: string): number {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Time must use HH:mm format');
  }

  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time');
  }

  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function validateTimeRange(range: TimeRange): void {
  const start = timeToMinutes(range.startTime);
  const end = timeToMinutes(range.endTime);
  if (end <= start) {
    throw new Error('End time must be after start time');
  }
}

const COLOMBIA_OFFSET_MINUTES = -5 * 60;

export function appointmentTimeToMinutes(scheduledAt: Date): number {
  const colombiaMs = scheduledAt.getTime() + COLOMBIA_OFFSET_MINUTES * 60 * 1000;
  const colombiaDate = new Date(colombiaMs);
  return colombiaDate.getUTCHours() * 60 + colombiaDate.getUTCMinutes();
}

export function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

export function isInsideAvailability(start: number, end: number, ranges: TimeRange[]): boolean {
  return ranges.some((range) => {
    const rangeStart = timeToMinutes(range.startTime);
    const rangeEnd = timeToMinutes(range.endTime);
    return start >= rangeStart && end <= rangeEnd;
  });
}

export function hasAppointmentConflict(
  start: number,
  end: number,
  appointments: AppointmentWindow[],
  ignoreAppointmentId?: string
): boolean {
  return appointments.some((appointment) => {
    if (ignoreAppointmentId && appointment.id === ignoreAppointmentId) {
      return false;
    }

    if (appointment.status && ['CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(appointment.status)) {
      return false;
    }

    const appointmentStart = appointmentTimeToMinutes(appointment.scheduledAt);
    const appointmentEnd = appointmentStart + appointment.duration;
    return rangesOverlap(start, end, appointmentStart, appointmentEnd);
  });
}

export function buildSlots(
  ranges: TimeRange[],
  appointments: AppointmentWindow[],
  duration: number,
  interval = 30
) {
  const slots: Array<{ startTime: string; endTime: string; isAvailable: boolean; reason?: string }> = [];

  for (const range of ranges) {
    validateTimeRange(range);
    const rangeStart = timeToMinutes(range.startTime);
    const rangeEnd = timeToMinutes(range.endTime);

    for (let start = rangeStart; start + duration <= rangeEnd; start += interval) {
      const end = start + duration;
      const hasConflict = hasAppointmentConflict(start, end, appointments);
      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        isAvailable: !hasConflict,
        ...(hasConflict ? { reason: 'Horario ocupado' } : {})
      });
    }
  }

  return slots;
}

export function extractCoordinates(value: unknown): Coordinates | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as { lat?: unknown; lng?: unknown; latitude?: unknown; longitude?: unknown };
  const lat = typeof candidate.lat === 'number' ? candidate.lat : candidate.latitude;
  const lng = typeof candidate.lng === 'number' ? candidate.lng : candidate.longitude;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return { lat, lng };
}

export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const latDistance = toRadians(to.lat - from.lat);
  const lngDistance = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);

  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDistance / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}
