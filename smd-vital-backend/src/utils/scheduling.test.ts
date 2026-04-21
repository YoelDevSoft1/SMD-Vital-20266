import { buildSlots, hasAppointmentConflict, isInsideAvailability, timeToMinutes } from './scheduling';

describe('scheduling utilities', () => {
  it('builds available slots inside daily availability and marks occupied ranges', () => {
    const slots = buildSlots(
      [{ startTime: '08:00', endTime: '10:00' }],
      [{ id: 'appointment-1', scheduledAt: new Date('2026-04-21T13:30:00.000Z'), duration: 30, status: 'CONFIRMED' }],
      30
    );

    expect(slots).toEqual([
      { startTime: '08:00', endTime: '08:30', isAvailable: true },
      { startTime: '08:30', endTime: '09:00', isAvailable: false, reason: 'Horario ocupado' },
      { startTime: '09:00', endTime: '09:30', isAvailable: true },
      { startTime: '09:30', endTime: '10:00', isAvailable: true },
    ]);
  });

  it('detects whether a requested appointment fits and conflicts', () => {
    const start = timeToMinutes('09:00');
    const end = timeToMinutes('10:00');

    expect(isInsideAvailability(start, end, [{ startTime: '08:00', endTime: '12:00' }])).toBe(true);
    expect(hasAppointmentConflict(start, end, [
      { id: 'appointment-1', scheduledAt: new Date('2026-04-21T14:30:00.000Z'), duration: 30, status: 'PENDING' },
    ])).toBe(true);
  });
});
