export const API = process.env.NEXT_PUBLIC_API_BASE!;
export const tokenKey = 'jm_access';
export const refreshKey = 'jm_refresh';

export function getAccessToken() { if (typeof window === 'undefined') return null; return localStorage.getItem(tokenKey); }
export function setTokens(a: string, r: string) { localStorage.setItem(tokenKey, a); localStorage.setItem(refreshKey, r); }
export function clearTokens() { localStorage.removeItem(tokenKey); localStorage.removeItem(refreshKey); }

export async function apiFetch(path: string, init?: RequestInit) {
  const token = getAccessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '', ...(init?.headers || {}) },
  });

  // If 401 and we have a refresh token, try to refresh
  if (res.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem(refreshKey);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          setTokens(tokens.accessToken, tokens.refreshToken);

          // Retry the original request with the new token
          const retryRes = await fetch(`${API}${path}`, {
            ...init,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens.accessToken}`, ...(init?.headers || {}) },
          });

          if (retryRes.ok) return retryRes.json();
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}