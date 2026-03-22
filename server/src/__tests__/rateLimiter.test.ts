import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock redis to return null (no Redis, memory fallback)
vi.mock('../lib/redis.js', () => ({
  getRedis: vi.fn(() => null),
}));

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 100,
  },
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { createRateLimiter } from '../middleware/rateLimiter.js';

function mockReq(ip = '127.0.0.1'): Request {
  return { ip } as unknown as Request;
}

function mockRes(): Response & { _headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  const res = {
    _headers: headers,
    set: vi.fn((key: string, value: string) => {
      headers[key] = value;
    }),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { _headers: Record<string, string> };
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createRateLimiter (memory fallback)', () => {
  it('first request sets X-RateLimit-Limit header', async () => {
    const limiter = createRateLimiter('test-limit', 5, 60);
    const req = mockReq('10.0.0.1');
    const res = mockRes();
    const next: NextFunction = vi.fn();

    await limiter(req, res, next);

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(next).toHaveBeenCalled();
  });

  it('first request sets X-RateLimit-Remaining to maxRequests-1', async () => {
    const limiter = createRateLimiter('test-remaining', 10, 60);
    const req = mockReq('10.0.0.2');
    const res = mockRes();
    const next: NextFunction = vi.fn();

    await limiter(req, res, next);

    expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '9');
  });

  it('first request sets X-RateLimit-Reset header', async () => {
    const limiter = createRateLimiter('test-reset', 5, 60);
    const req = mockReq('10.0.0.3');
    const res = mockRes();
    const next: NextFunction = vi.fn();

    await limiter(req, res, next);

    // Reset should be a numeric string (epoch seconds)
    const resetCall = vi.mocked(res.set).mock.calls.find((c) => c[0] === 'X-RateLimit-Reset');
    expect(resetCall).toBeDefined();
    const resetValue = Number(resetCall![1]);
    expect(resetValue).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('multiple requests decrement Remaining', async () => {
    const limiter = createRateLimiter('test-decrement', 5, 60);
    const next: NextFunction = vi.fn();

    // First request
    const req1 = mockReq('10.0.0.4');
    const res1 = mockRes();
    await limiter(req1, res1, next);
    expect(res1._headers['X-RateLimit-Remaining']).toBe('4');

    // Second request (same IP)
    const req2 = mockReq('10.0.0.4');
    const res2 = mockRes();
    await limiter(req2, res2, next);
    expect(res2._headers['X-RateLimit-Remaining']).toBe('3');

    // Third request
    const req3 = mockReq('10.0.0.4');
    const res3 = mockRes();
    await limiter(req3, res3, next);
    expect(res3._headers['X-RateLimit-Remaining']).toBe('2');
  });

  it('exceeding limit returns 429', async () => {
    const limiter = createRateLimiter('test-exceed', 2, 60);
    const next: NextFunction = vi.fn();

    // Request 1 (ok)
    await limiter(mockReq('10.0.0.5'), mockRes(), next);
    // Request 2 (ok)
    await limiter(mockReq('10.0.0.5'), mockRes(), next);
    // Request 3 (exceeds limit of 2)
    const res3 = mockRes();
    await limiter(mockReq('10.0.0.5'), res3, next);

    expect(res3.status).toHaveBeenCalledWith(429);
    expect(res3.json).toHaveBeenCalledWith({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
    });
  });

  it('window reset allows new requests', async () => {
    const limiter = createRateLimiter('test-window-reset', 1, 1); // 1 request per 1 second
    const next: NextFunction = vi.fn();

    // First request (ok)
    const res1 = mockRes();
    await limiter(mockReq('10.0.0.6'), res1, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second request (exceeds)
    const res2 = mockRes();
    await limiter(mockReq('10.0.0.6'), res2, next);
    expect(res2.status).toHaveBeenCalledWith(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    // Third request after window reset (should succeed)
    const res3 = mockRes();
    const next3: NextFunction = vi.fn();
    await limiter(mockReq('10.0.0.6'), res3, next3);
    expect(next3).toHaveBeenCalled();
    expect(res3.status).not.toHaveBeenCalled();
  });

  it('headers present even on 429 response', async () => {
    const limiter = createRateLimiter('test-headers-429', 1, 60);
    const next: NextFunction = vi.fn();

    // First request (ok)
    await limiter(mockReq('10.0.0.7'), mockRes(), next);

    // Second request (exceeds, gets 429)
    const res2 = mockRes();
    await limiter(mockReq('10.0.0.7'), res2, next);

    expect(res2.status).toHaveBeenCalledWith(429);
    expect(res2._headers['X-RateLimit-Limit']).toBe('1');
    expect(res2._headers['X-RateLimit-Remaining']).toBe('0');
    expect(res2._headers['X-RateLimit-Reset']).toBeDefined();
  });
});
