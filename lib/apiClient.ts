export async function parseJsonSafe(res: Response): Promise<any> {
  if (res.status === 204 || res.status === 205) return null;
  let text = '';
  try {
    text = await res.text();
  } catch {
    return null;
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function fetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    return { ok: false, status: 0, data: { error: 'Network error. Please check your connection and try again.' } };
  }
  const data = await parseJsonSafe(res);
  return { ok: res.ok, status: res.status, data };
}
