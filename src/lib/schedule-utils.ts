export function parseEnumList(raw: unknown): string[] {
  if (raw === null || raw === undefined || raw === '') return [];
  if (Array.isArray(raw)) {
    return unique(raw.map(x => String(x).trim().replace(/^"+|"+$/g, '')).filter(Boolean));
  }
  return unique(
    String(raw)
      .replace(/\r/g, '')
      .replace(/\n/g, ',')
      .replace(/;/g, ',')
      .split(',')
      .map(x => x.trim().replace(/^"+|"+$/g, ''))
      .filter(Boolean)
  );
}

export function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

export function normalizeEmail(email: string): string {
  const e = email.trim();
  if (!e) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return '';
  return e;
}
