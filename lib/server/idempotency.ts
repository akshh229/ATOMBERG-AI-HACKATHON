const cache = new Map<string, { expiresAt: number; value: unknown }>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
}

export function readIdempotentResult<T>(key: string) {
  cleanup();
  const entry = cache.get(key);
  return (entry?.value ?? null) as T | null;
}

export function writeIdempotentResult(key: string, value: unknown, ttlMs = 5 * 60_000) {
  cleanup();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}
