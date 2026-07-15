import { describe, expect, it } from 'vitest';

import {
  safeJsonArray,
  safeJsonObject,
  safeJsonParse,
  safeJsonStringify,
} from './safe-json';

describe('safeJsonParse', () => {
  it('returns the parsed value for valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
    expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    expect(safeJsonParse('42', 0)).toBe(42);
  });

  it('returns the default value for invalid JSON', () => {
    expect(safeJsonParse('not json', 'fallback')).toBe('fallback');
    expect(safeJsonParse('{bad', null)).toBeNull();
  });
});

describe('safeJsonStringify', () => {
  it('returns a JSON string for serializable values', () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2], 2)).toBe('[\n  1,\n  2\n]');
  });

  it('returns "{}" for values that cannot be serialized', () => {
    const circular: any = {};
    circular.self = circular;
    expect(safeJsonStringify(circular)).toBe('{}');
  });
});

describe('safeJsonArray', () => {
  it('returns the parsed array for a valid JSON array', () => {
    expect(safeJsonArray('["a","b"]')).toEqual(['a', 'b']);
  });

  it('returns the default for a non-array JSON value', () => {
    expect(safeJsonArray('{"a":1}', ['x'])).toEqual(['x']);
    expect(safeJsonArray('42')).toEqual([]);
  });

  it('returns the default for invalid JSON', () => {
    expect(safeJsonArray('[broken', ['fallback'])).toEqual(['fallback']);
  });

  it('defaults to an empty array when no default is provided', () => {
    expect(safeJsonArray('nope')).toEqual([]);
  });
});

describe('safeJsonObject', () => {
  it('returns the parsed object for a valid JSON object', () => {
    expect(safeJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('returns an array when given an array (arrays are objects)', () => {
    expect(safeJsonObject('[1,2]')).toEqual([1, 2]);
  });

  it('returns the default for primitives and null', () => {
    expect(safeJsonObject('42', { def: true })).toEqual({ def: true });
    expect(safeJsonObject('null', { def: true })).toEqual({ def: true });
  });

  it('returns the default for invalid JSON', () => {
    expect(safeJsonObject('{bad', { def: true })).toEqual({ def: true });
  });
});
