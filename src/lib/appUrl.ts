function baseWithSlash(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function normalize(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

/** Path (including hash) for an in-app route, e.g. `/CareerRaffleMachine/#/display/abc`. */
export function getAppPath(path: string): string {
  return `${baseWithSlash()}#${normalize(path)}`;
}

/** Absolute URL for an in-app route, safe to copy/paste or open on another machine. */
export function getAppUrl(path: string): string {
  return `${window.location.origin}${getAppPath(path)}`;
}
