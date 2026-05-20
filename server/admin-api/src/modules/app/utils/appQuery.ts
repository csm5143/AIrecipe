export function stableQueryKey(query: Record<string, unknown>): string {
  const pairs = Object.keys(query)
    .sort()
    .map((key) => [key, String(query[key] ?? '')])
    .filter(([, value]) => value.length > 0);

  return pairs.length === 0
    ? 'default'
    : pairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
}
