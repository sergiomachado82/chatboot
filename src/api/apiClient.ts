const API_BASE = '/api';
const API_TIMEOUT_MS = 15_000;

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const csrf = getCsrfToken();
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('agente');
      window.location.reload();
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(body.message ?? `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La solicitud tardo demasiado. Intenta de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
