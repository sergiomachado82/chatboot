import { describe, it, expect } from 'vitest';
import { passwordSchema } from '../utils/passwordPolicy.js';

describe('passwordSchema', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Ab1xxxx');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without an uppercase letter', () => {
    const result = passwordSchema.safeParse('abcdefg1');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without a lowercase letter', () => {
    const result = passwordSchema.safeParse('ABCDEFG1');
    expect(result.success).toBe(false);
  });

  it('rejects passwords without a number', () => {
    const result = passwordSchema.safeParse('Abcdefgh');
    expect(result.success).toBe(false);
  });

  it('accepts a valid password', () => {
    const result = passwordSchema.safeParse('Abcdefg1');
    expect(result.success).toBe(true);
  });
});
