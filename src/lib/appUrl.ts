/** Build absolute app URLs for GitHub Pages (includes repo base path). */
export function getAppUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${base}${normalizedPath}`;
}

/** Path segment shown in admin UI copy fields. */
export function getAppPath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
