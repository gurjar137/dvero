export function formatINR(n: number): string {
  return '₹' + Math.round(n || 0).toLocaleString('en-IN');
}

export function slugify(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function generateOrderNumber(): string {
  return 'DV' + Math.floor(1000000 + Math.random() * 9000000);
}

export function typeFromCategory(category: string): 'shirt' | 'trouser' {
  return category === 'Trousers' ? 'trouser' : 'shirt';
}

export function hexToRgba(hex: string, opacityPercent: number): string {
  let h = String(hex || '#000000').replace('#', '').trim();
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) h = '000000';
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  const a = Math.max(0, Math.min(100, opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
