import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { cacheControl, withETag } from '../middleware/cacheHeaders.js';

function mockReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

function mockRes(): Response & { _headers: Record<string, string>; _status: number; _ended: boolean; _body: unknown } {
  const res: Record<string, unknown> = {
    _headers: {} as Record<string, string>,
    _status: 200,
    _ended: false,
    _body: undefined,
  };
  res.set = vi.fn((key: string, value: string) => {
    (res._headers as Record<string, string>)[key] = value;
    return res;
  });
  res.status = vi.fn((code: number) => {
    res._status = code;
    return res;
  });
  res.end = vi.fn(() => {
    res._ended = true;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res._body = body;
    return res;
  });
  return res as unknown as Response & {
    _headers: Record<string, string>;
    _status: number;
    _ended: boolean;
    _body: unknown;
  };
}

const next: NextFunction = vi.fn();

describe('cacheControl', () => {
  it('sets Cache-Control header with correct max-age', () => {
    const req = mockReq();
    const res = mockRes();

    cacheControl(60)(req, res, next);

    expect(res._headers['Cache-Control']).toBe('public, max-age=60');
    expect(next).toHaveBeenCalled();
  });
});

describe('withETag', () => {
  it('generates ETag header on response', () => {
    const req = mockReq();
    const res = mockRes();

    withETag()(req, res, next);
    res.json({ data: 'test' });

    expect(res._headers['ETag']).toMatch(/^"[a-f0-9]{32}"$/);
  });

  it('returns 304 when If-None-Match matches ETag', () => {
    const body = { data: 'test' };
    const expectedEtag = `"${createHash('md5').update(JSON.stringify(body)).digest('hex')}"`;

    const req = mockReq({ 'if-none-match': expectedEtag });
    const res = mockRes();

    withETag()(req, res, next);
    res.json(body);

    expect(res._status).toBe(304);
    expect(res._ended).toBe(true);
  });

  it('does not set cache headers on routes without middleware', () => {
    const res = mockRes();

    expect(res._headers['Cache-Control']).toBeUndefined();
    expect(res._headers['ETag']).toBeUndefined();
  });
});
