import { describe, expect, it } from 'vitest';
import { formatIndianNumber, formatINR, formatINRCompact } from './format';

describe('formatIndianNumber', () => {
  it('formats lakh-scale with Indian grouping', () => {
    expect(formatIndianNumber(100000)).toBe('1,00,000');
    expect(formatIndianNumber(1234567)).toBe('12,34,567');
    expect(formatIndianNumber(12345678)).toBe('1,23,45,678');
  });

  it('leaves small numbers ungrouped', () => {
    expect(formatIndianNumber(999)).toBe('999');
    expect(formatIndianNumber(0)).toBe('0');
  });

  it('groups thousands', () => {
    expect(formatIndianNumber(1000)).toBe('1,000');
    expect(formatIndianNumber(99999)).toBe('99,999');
  });

  it('handles negatives and decimals', () => {
    expect(formatIndianNumber(-1234)).toBe('-1,234');
    expect(formatIndianNumber(1234.5)).toBe('1,234.50');
  });
});

describe('formatINR', () => {
  it('prefixes the rupee sign', () => {
    expect(formatINR(649)).toBe('₹649');
    expect(formatINR(120000)).toBe('₹1,20,000');
  });
});

describe('formatINRCompact', () => {
  it('uses k, L, Cr', () => {
    expect(formatINRCompact(950)).toBe('₹950');
    expect(formatINRCompact(45500)).toBe('₹45.5k');
    expect(formatINRCompact(120000)).toBe('₹1.2L');
    expect(formatINRCompact(30000000)).toBe('₹3Cr');
  });
});
