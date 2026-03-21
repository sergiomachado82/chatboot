import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock authService
vi.mock('../services/authService.js', () => ({
  verifyToken: vi.fn(),
}));

import { authMiddleware } from '../middleware/authMiddleware.js';
import { csrfProtection } from '../middleware/csrfProtection.js';
import { verifyToken } from '../services/authService.js';

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    method: 'GET',
    path: '/api/test',
    cookies: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.cookie = vi.fn().mockReturnValue(res);
  return res as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authMiddleware', () => {
  it('returns 401 without Authorization header', () => {
    const req = mockReq();
    const res = mockRes();
    const next: NextFunction = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with invalid token', () => {
    const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    vi.mocked(verifyToken).mockReturnValue({ valid: false, reason: 'invalid' });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next with valid token', () => {
    const payload = { id: '1', email: 'test@test.com', rol: 'admin' };
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    vi.mocked(verifyToken).mockReturnValue({ valid: true, payload });

    authMiddleware(req, res, next);

    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
  });
});

describe('csrfProtection', () => {
  it('allows GET requests without token', () => {
    const req = mockReq({ method: 'GET', cookies: {} });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects POST without CSRF token when cookie exists', () => {
    const req = mockReq({
      method: 'POST',
      path: '/api/agentes',
      cookies: { 'csrf-token': 'abc123' },
      headers: {},
    });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows POST with matching CSRF token', () => {
    const req = mockReq({
      method: 'POST',
      path: '/api/agentes',
      cookies: { 'csrf-token': 'abc123' },
      headers: { 'x-csrf-token': 'abc123' },
    });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('allows POST to exempt paths without token', () => {
    const req = mockReq({
      method: 'POST',
      path: '/api/auth/login',
      cookies: {},
      headers: {},
    });
    const res = mockRes();
    const next: NextFunction = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
