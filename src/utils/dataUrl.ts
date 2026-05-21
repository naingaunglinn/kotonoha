const DEFAULT_BASE_URL = 'http://localhost:3000';

export const getDataUrl = (path: string): string => {
  const base = process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
};
