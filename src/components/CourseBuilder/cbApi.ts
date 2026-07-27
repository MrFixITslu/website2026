// Thin fetch wrapper used by every ported Course Builder component.
//
// The standalone V79-Course-Builder app used its own cookie-based session.
// Inside the admin page it instead reuses the admin's existing Bearer-token
// session (the same token AdminApp already stores after /api/admin/login),
// so every request here is automatically authenticated as the signed-in
// administrator - no separate login screen needed.
const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
};

export function getAdminToken(): string | null {
  return safeSessionStorage.getItem('admin-token');
}

export async function cbFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers });
}
