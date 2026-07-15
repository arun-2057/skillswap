import { describe, expect, it } from 'vitest';

import { formatTime, generateSlotsForDate, getLocalTimezone } from './availability-utils';

const DATE = '2026-07-15';
const DAY_OF_WEEK = new Date(`${DATE}T00:00:00`).getDay();

describe('getLocalTimezone', () => {
  it('returns a non-empty timezone string', () => {
    const tz = getLocalTimezone();
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('formats morning and afternoon times in 12-hour en-US notation', () => {
    expect(formatTime(0, 0)).toBe('12:00 AM');
    expect(formatTime(9, 0)).toBe('9:00 AM');
    expect(formatTime(12, 0)).toBe('12:00 PM');
    expect(formatTime(13, 5)).toBe('1:05 PM');
  });
});

describe('generateSlotsForDate', () => {
  const tz = getLocalTimezone();
  const availabilitySlots = [{ dayOfWeek: DAY_OF_WEEK, startTime: 9, endTime: 11 }];

  it('returns no slots when no availability matches the day', () => {
    const slots = generateSlotsForDate(
      DATE,
      [{ dayOfWeek: (DAY_OF_WEEK + 1) % 7, startTime: 9, endTime: 11 }],
      [],
      tz,
    );
    expect(slots).toEqual([]);
  });

  it('generates one slot per slotDuration across the availability window', () => {
    const slots = generateSlotsForDate(DATE, availabilitySlots, [], tz, 60);
    expect(slots).toHaveLength(2);
    expect(slots[0].localStart).toBe('9:00 AM');
    expect(slots[1].localStart).toBe('10:00 AM');
    expect(slots[1].localEnd).toBe('11:00 AM');
  });

  it('respects a custom slot duration', () => {
    const slots = generateSlotsForDate(DATE, availabilitySlots, [], tz, 30);
    expect(slots).toHaveLength(4);
  });

  it('marks overlapping sessions as unavailable while leaving others available', () => {
    const base = generateSlotsForDate(DATE, availabilitySlots, [], tz, 60);
    const slots = generateSlotsForDate(
      DATE,
      availabilitySlots,
      [{ scheduledAt: base[0].utcStart, durationMinutes: 60 }],
      tz,
      60,
    );

    expect(slots[0].isAvailable).toBe(false);
    expect(slots[1].isAvailable).toBe(true);
  });

  it('produces UTC start instants that precede their end instants', () => {
    const slots = generateSlotsForDate(DATE, availabilitySlots, [], tz, 60);
    for (const slot of slots) {
      expect(new Date(slot.utcStart).getTime()).toBeLessThan(
        new Date(slot.utcEnd).getTime(),
      );
    }
  });
});
