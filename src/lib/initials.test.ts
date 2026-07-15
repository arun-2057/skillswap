import { describe, expect, it } from 'vitest';

import { getInitials } from './initials';

describe('getInitials', () => {
  it('returns the fallback for missing or empty names', () => {
    expect(getInitials(null)).toBe('U');
    expect(getInitials(undefined)).toBe('U');
    expect(getInitials('')).toBe('U');
  });

  it('returns the first letter for a single-word name', () => {
    expect(getInitials('Cher')).toBe('C');
    expect(getInitials('john')).toBe('J');
  });

  it('returns up to two uppercase initials for multi-word names', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('john doe')).toBe('JD');
    expect(getInitials('Ada Lovelace Byron')).toBe('AL');
  });

  it('tolerates extra surrounding/inner whitespace', () => {
    expect(getInitials('  Jane  Doe ')).toBe('JD');
  });
});
