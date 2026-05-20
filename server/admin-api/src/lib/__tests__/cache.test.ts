import { cache } from '../cache';

describe('in-memory cache', () => {
  afterEach(() => {
    cache.del('test-key').catch(() => {});
    cache.del('test-key-2').catch(() => {});
    cache.delByPattern('test:*').catch(() => {});
  });

  it('returns fresh data when cache is empty', async () => {
    const data = await cache.getOrSet('test-key', 60, async () => ({ ok: true }));
    expect(data).toEqual({ ok: true });
  });

  it('returns cached data when key exists and is not expired', async () => {
    await cache.getOrSet('test-key-2', 60, async () => ({ ok: false }));
    const data = await cache.getOrSet('test-key-2', 60, async () => ({ ok: true }));
    expect(data).toEqual({ ok: false });
  });
});
