import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
};

vi.mock('../lib/redis.js', () => ({
  getRedis: vi.fn(() => mockRedis),
}));

vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { cache } from '../services/cacheService.js';
import { getRedis } from '../lib/redis.js';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getRedis).mockReturnValue(mockRedis as never);
});

describe('cacheService', () => {
  it('set + get returns deserialized value', async () => {
    const data = { nombre: 'Test', capacidad: 4 };
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.get.mockResolvedValue(JSON.stringify(data));

    await cache.set('test:key', data, 60);
    const result = await cache.get<typeof data>('test:key');

    expect(mockRedis.set).toHaveBeenCalledWith('test:key', JSON.stringify(data), 'EX', 60);
    expect(result).toEqual(data);
  });

  it('get returns null when key does not exist', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await cache.get('nonexistent');

    expect(result).toBeNull();
  });

  it('del removes the key', async () => {
    mockRedis.del.mockResolvedValue(1);

    await cache.del('test:key');

    expect(mockRedis.del).toHaveBeenCalledWith('test:key');
  });

  it('invalidatePattern deletes matching keys', async () => {
    mockRedis.keys.mockResolvedValue(['complejos:1', 'complejos:2', 'complejos:list']);
    mockRedis.del.mockResolvedValue(3);

    await cache.invalidatePattern('complejos:*');

    expect(mockRedis.keys).toHaveBeenCalledWith('complejos:*');
    expect(mockRedis.del).toHaveBeenCalledWith('complejos:1', 'complejos:2', 'complejos:list');
  });

  it('operations are no-op when Redis is unavailable', async () => {
    vi.mocked(getRedis).mockReturnValue(null);

    await expect(cache.set('key', 'val')).resolves.toBeUndefined();
    await expect(cache.get('key')).resolves.toBeNull();
    await expect(cache.del('key')).resolves.toBeUndefined();
    await expect(cache.invalidatePattern('*')).resolves.toBeUndefined();

    expect(mockRedis.set).not.toHaveBeenCalled();
    expect(mockRedis.get).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
    expect(mockRedis.keys).not.toHaveBeenCalled();
  });
});
