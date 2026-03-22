import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

export function mockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    user: undefined,
    ...overrides,
  };
}

export function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res) as unknown as Response['status'];
  res.json = vi.fn().mockReturnValue(res) as unknown as Response['json'];
  res.set = vi.fn().mockReturnValue(res) as unknown as Response['set'];
  res.end = vi.fn().mockReturnValue(res) as unknown as Response['end'];
  return res;
}

export function mockNext(): NextFunction {
  return vi.fn() as NextFunction;
}
