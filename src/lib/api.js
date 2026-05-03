const rawApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();

const normalizedApiBaseUrl = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, '')
  : '';

export function buildApiUrl(path) {
  if (typeof path !== 'string' || path.length === 0) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith('/')) return path;
  if (!normalizedApiBaseUrl) return path;
  return `${normalizedApiBaseUrl}${path}`;
}