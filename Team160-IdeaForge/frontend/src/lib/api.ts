const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'canteen.access_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({} as Record<string, unknown>));
  if (!res.ok) {
    let msg = 'Request failed';
    const errVal = (body as { error?: unknown }).error;
    if (typeof errVal === 'string') {
      msg = errVal;
    } else if (errVal && typeof errVal === 'object') {
      const e = errVal as { formErrors?: string[]; fieldErrors?: unknown };
      if (e.formErrors?.length) msg = e.formErrors.join('; ');
      else if (e.fieldErrors) msg = JSON.stringify(e.fieldErrors);
    }
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p: string, body?: unknown) =>
    request<T>(p, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: <T>(p: string) => request<T>(p, { method: 'DELETE' }),
};
