const DEFAULT_BASE_URL = 'http://localhost:3000';

export const getDataUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  // Client-side: use a relative URL so the request always targets the page's
  // own origin (works for any host, port, or tunnel). Server-side fetches
  // (React Server Components) need an absolute URL.
  if (typeof window !== 'undefined') return normalized;
  const base = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
  return `${base}${normalized}`;
};
