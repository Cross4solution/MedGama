const cache = new Map();

export async function getWithCache(key, fetcher, ttlMs = 0) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && (!ttlMs || (now - hit.t) < ttlMs)) return hit.v;
  const v = await Promise.resolve().then(fetcher);
  cache.set(key, { v, t: now });
  return v;
}

export function clearCache(key) {
  if (typeof key === 'string') cache.delete(key);
  else cache.clear();
}

export default { getWithCache, clearCache };
