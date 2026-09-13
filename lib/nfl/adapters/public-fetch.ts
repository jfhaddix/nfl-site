type EdgeCacheStorage = CacheStorage & { default?: Cache };

export async function fetchPublicJson<T>(url: string, ttlSeconds: number): Promise<T> {
  const request = new Request(url, { headers: { Accept: "application/json" } });
  const edgeCache = (globalThis.caches as EdgeCacheStorage | undefined)?.default;

  if (edgeCache) {
    const cached = await edgeCache.match(request);
    if (cached) return cached.json() as Promise<T>;
  }

  const response = await fetch(request, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Public feed returned HTTP ${response.status}`);

  if (edgeCache) {
    const cacheable = new Response(response.clone().body, response);
    cacheable.headers.set("Cache-Control", `public, max-age=${ttlSeconds}`);
    await edgeCache.put(request, cacheable).catch(() => undefined);
  }

  return response.json() as Promise<T>;
}
