/**
 * API client for E-Commerce backend at API_URL (e.g. http://localhost:9090).
 * Used for auth login and proxying API requests.
 */

const DEFAULT_API_URL = 'http://localhost:9090';

export function getApiUrl(): string | null {
  const url =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    // When no database, default to local backend so auth works
    (!process.env.DATABASE_URL ? DEFAULT_API_URL : null);
  if (!url) return null;
  return url.replace(/\/$/, ''); // trim trailing slash
}

export function isRealApiMode(): boolean {
  return !!getApiUrl();
}

/**
 * Converts backend file preview URL to our proxy URL so images load (avoids CORS/auth issues).
 * e.g. http://localhost:9090/api/v1/files/preview-file/xxx.png -> /api/files/preview/xxx.png
 */
export function getImagePreviewProxyUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/\/api\/v1\/files\/preview-file\/(.+)$/);
  if (match) {
    return `/api/files/preview/${match[1]}`;
  }
  return url;
}

export interface BackendLoginResponse {
  token?: string;
  accessToken?: string;
  payload?: { token?: string; accessToken?: string; user?: { id: string; email: string; name?: string; role?: string } };
  data?: { token?: string; accessToken?: string; user?: { id: string; email: string; name?: string; role?: string } };
  user?: { id: string; email: string; name?: string; role?: string };
}

export type LoginResult =
  | { success: true; data: { id: string; email: string; name: string; role: string; accessToken: string } }
  | { success: false; error: string };

export async function loginWithBackend(
  email: string,
  password: string
): Promise<{ id: string; email: string; name: string; role: string; accessToken: string } | null> {
  const result = await loginWithBackendWithError(email, password);
  return result.success ? result.data : null;
}

export async function loginWithBackendWithError(
  email: string,
  password: string
): Promise<LoginResult> {
  const baseUrl = getApiUrl();
  if (!baseUrl) return { success: false, error: 'API not configured' };

  const res = await fetch(`${baseUrl}/api/v1/auths/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  if (!res.ok) {
    let errorMessage = 'Invalid password or email';
    try {
      const body = text ? JSON.parse(text) : {};
      errorMessage = body.message || body.error || errorMessage;
    } catch {
      // use default
    }
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Login failed:', res.status, text);
    }
    return { success: false, error: errorMessage };
  }

  const data: BackendLoginResponse = text ? JSON.parse(text) : {};

  // Extract token from various response shapes (payload.token, token, data.token, etc.)
  const token =
    data.payload?.token ||
    data.payload?.accessToken ||
    data.token ||
    data.accessToken ||
    data.data?.token ||
    data.data?.accessToken;

  // Extract user from various response shapes
  const user = data.user || data.payload?.user || data.data?.user;
  const id = user?.id ?? data.payload?.user?.id ?? data.data?.user?.id ?? 'unknown';
  const userEmail = user?.email ?? data.payload?.user?.email ?? data.data?.user?.email ?? email;
  const name = user?.name ?? data.payload?.user?.name ?? data.data?.user?.name ?? 'Admin';
  const role = user?.role ?? data.payload?.user?.role ?? data.data?.user?.role ?? 'admin';

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API] Login response missing token:', data);
    }
    return { success: false, error: 'Invalid response from server' };
  }

  return {
    success: true,
    data: {
      id: String(id),
      email: userEmail,
      name,
      role,
      accessToken: token,
    },
  };
}

export interface BackendDashboardPayload {
  totalRevenue?: number | string;
  totalOrder?: number | string;
  totalOrders?: number | string;
  totalCustomer?: number | string;
  totalCustomers?: number | string;
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

export async function fetchDashboardFromBackend(
  token?: string
): Promise<{ totalRevenue: number; totalOrders: number; totalCustomers: number } | null> {
  const { data, ok } = await fetchBackend<{
    success?: boolean;
    payload?: BackendDashboardPayload;
    data?: BackendDashboardPayload;
  }>('/api/v1/dashboard', { token });
  if (!ok) return null;
  const p = data?.payload ?? data?.data;
  if (!p || typeof p !== 'object') return null;
  return {
    totalRevenue: toNum(p.totalRevenue),
    totalOrders: toNum(p.totalOrders ?? p.totalOrder),
    totalCustomers: toNum(p.totalCustomers ?? p.totalCustomer),
  };
}

export interface UploadFileResponse {
  success?: boolean;
  payload?: {
    fileName?: string;
    fileType?: string;
    fileUrl?: string;
    fileSize?: number;
  };
}

export async function uploadFileToBackend(
  file: File,
  token?: string
): Promise<{ fileUrl: string } | null> {
  const baseUrl = getApiUrl();
  if (!baseUrl) return null;

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/files/upload-file`, {
      method: 'POST',
      headers,
      body: formData,
      cache: 'no-store',
    });
    const text = await res.text();
    const data: UploadFileResponse = text ? JSON.parse(text) : {};
    const fileUrl = data.payload?.fileUrl;
    if (!res.ok || !fileUrl) return null;
    return { fileUrl };
  } catch (error) {
    console.error('[API] uploadFile error:', error);
    return null;
  }
}

export async function fetchBackend<T = unknown>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<{ data?: T; ok: boolean; status: number }> {
  const baseUrl = getApiUrl();
  if (!baseUrl) {
    return { ok: false, status: 0 };
  }

  const { token, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const method = (fetchOptions.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      cache: 'no-store',
    });
    const text = await res.text();
    let data: T | undefined;
    try {
      data = text ? (JSON.parse(text) as T) : undefined;
    } catch {
      // non-JSON response
    }
    return { data, ok: res.ok, status: res.status };
  } catch (error) {
    console.error('[API] fetchBackend error:', path, error);
    return { ok: false, status: 0 };
  }
}
