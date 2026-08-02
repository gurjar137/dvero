const PREFIX = 'dvero_scroll:';

export function saveScrollPositionFor(targetPathWithQuery: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${PREFIX}${targetPathWithQuery}`, String(window.scrollY));
  } catch {}
}

export function consumeScrollPositionFor(currentPathWithQuery: string): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `${PREFIX}${currentPathWithQuery}`;
    const saved = sessionStorage.getItem(key);
    if (saved === null) return null;
    sessionStorage.removeItem(key);
    const value = parseInt(saved, 10);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
