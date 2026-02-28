/**
 * Tests for Utils.ts
 */
import { describe, it, expect } from 'vitest';
import {
  validateCPF,
  formatCPF,
  formatPhone,
  formatDate,
  formatCurrency,
  calculateAge,
  truncate,
  capitalize,
  titleCase,
  validateEmail,
  validatePhone,
  slugify,
  delay,
  unique,
  sortBy,
} from './utils';

describe('validateCPF', () => {
  it('should return true for valid CPF', () => {
    expect(validateCPF('123.456.789-00')).toBe(false); // This is not a valid CPF
    expect(validateCPF('111.444.777-35')).toBe(true); // Known valid CPF
  });

  it('should return false for CPF with wrong length', () => {
    expect(validateCPF('123')).toBe(false);
    expect(validateCPF('12345678900')).toBe(false);
  });

  it('should return false for CPF with repeated digits', () => {
    expect(validateCPF('111.111.111-11')).toBe(false);
    expect(validateCPF('000.000.000-00')).toBe(false);
  });
});

describe('formatCPF', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00');
    expect(formatCPF('11144477735')).toBe('111.444.777-35');
  });

  it('should return original string for invalid CPF', () => {
    expect(formatCPF('123')).toBe('123');
  });
});

describe('formatPhone', () => {
  it('should format phone with 11 digits (mobile)', () => {
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
  });

  it('should format phone with 10 digits (landline)', () => {
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
  });

  it('should return original for invalid phone', () => {
    expect(formatPhone('123')).toBe('123');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    // Using timezone-independent date
    const date = new Date(2024, 0, 15); // Month is 0-indexed
    const formatted = formatDate(date);
    expect(formatted).toMatch(/\d{2}\/\d{2}\/2024/);
  });

  it('should format Date object correctly', () => {
    const date = new Date(2024, 0, 15);
    const formatted = formatDate(date);
    expect(formatted).toMatch(/\d{2}\/\d{2}\/2024/);
  });
});

describe('formatCurrency', () => {
  it('should format currency correctly', () => {
    const formatted = formatCurrency(1000);
    expect(formatted).toContain('1.000');
    expect(formatted).toContain('R$');
  });
});

describe('calculateAge', () => {
  it('should calculate age correctly', () => {
    // Someone born 20 years ago
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 20);
    expect(calculateAge(birthDate)).toBe(20);
  });
});

describe('truncate', () => {
  it('should truncate text correctly', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
    expect(truncate('Hi', 10)).toBe('Hi'); // No truncation needed
  });

  it('should use custom suffix', () => {
    expect(truncate('Hello World', 8, '>>>')).toBe('Hello>>>');
  });
});

describe('capitalize', () => {
  it('should capitalize first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('Hello');
  });
});

describe('titleCase', () => {
  it('should convert to title case', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase('HELLO WORLD')).toBe('Hello World');
  });
});

describe('validateEmail', () => {
  it('should validate email correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('no@domain')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('should validate phone correctly', () => {
    expect(validatePhone('11999999999')).toBe(true);
    expect(validatePhone('1133334444')).toBe(true);
    expect(validatePhone('123')).toBe(false);
  });
});

describe('slugify', () => {
  it('should convert text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Teste Ção')).toBe('teste-cao');
  });
});

describe('delay', () => {
  it('should delay execution', async () => {
    const start = Date.now();
    await delay(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});

describe('unique', () => {
  it('should return unique values', () => {
    expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });
});

describe('sortBy', () => {
  it('should sort array by key ascending', () => {
    const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
    const sorted = sortBy(arr, 'name');
    expect(sorted[0]?.name).toBe('Alice');
    expect(sorted[1]?.name).toBe('Bob');
    expect(sorted[2]?.name).toBe('Charlie');
  });

  it('should sort array by key descending', () => {
    const arr = [{ value: 3 }, { value: 1 }, { value: 2 }];
    const sorted = sortBy(arr, 'value', 'desc');
    expect(sorted[0]?.value).toBe(3);
    expect(sorted[1]?.value).toBe(2);
    expect(sorted[2]?.value).toBe(1);
  });
});
