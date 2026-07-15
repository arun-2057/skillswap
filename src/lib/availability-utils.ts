/**
 * Timezone and slot generation utilities for booking/availability flows.
 */

export function getLocalTimezone(): string {
  if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat === 'undefined') {
    return 'UTC';
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatTime(hours: number, minutes = 0): string {
  const date = new Date(2000, 0, 1, hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function generateSlotsForDate(
  dateStr: string,
  availabilitySlots: { dayOfWeek: number; startTime: number; endTime: number }[],
  existingSessions: { scheduledAt: string; durationMinutes?: number }[],
  userTimezone: string,
  slotDurationMinutes = 60
): { utcStart: string; utcEnd: string; localStart: string; localEnd: string; isAvailable: boolean }[] {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = date.getDay();

  const matchingSlots = availabilitySlots.filter((slot) => slot.dayOfWeek === dayOfWeek);
  if (!matchingSlots.length) {
    return [];
  }

  const slots: { utcStart: string; utcEnd: string; localStart: string; localEnd: string; isAvailable: boolean }[] = [];

  for (const slot of matchingSlots) {
    const slotStart = new Date(`${dateStr}T${pad(slot.startTime)}:00:00`);
    const slotEnd = new Date(`${dateStr}T${pad(slot.endTime)}:00:00`);

    const current = new Date(slotStart);
    while (current.getTime() + slotDurationMinutes * 60 * 1000 <= slotEnd.getTime()) {
      const utcStart = new Date(current);
      const utcEnd = new Date(current.getTime() + slotDurationMinutes * 60 * 1000);

      const isBooked = existingSessions.some((session) => {
        const sessionStart = new Date(session.scheduledAt);
        const sessionEnd = new Date(sessionStart.getTime() + (session.durationMinutes || 60) * 60 * 1000);
        return utcStart < sessionEnd && utcEnd > sessionStart;
      });

      slots.push({
        utcStart: utcStart.toISOString(),
        utcEnd: utcEnd.toISOString(),
        localStart: utcStart.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone,
        }),
        localEnd: utcEnd.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone,
        }),
        isAvailable: !isBooked,
      });

      current.setMinutes(current.getMinutes() + slotDurationMinutes);
    }
  }

  return slots;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}
