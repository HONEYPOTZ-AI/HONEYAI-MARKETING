const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Base fetch function
async function _fetch<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const path = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/api') ? endpoint : '/api' + endpoint}`;

  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data;
}

// Typed API helper with methods attached
export const api: {
  <T = unknown>(endpoint: string, options?: ApiOptions): Promise<T>;
  get: <T = unknown>(endpoint: string) => Promise<T>;
  post: <T = unknown>(endpoint: string, body: unknown) => Promise<T>;
  patch: <T = unknown>(endpoint: string, body: unknown) => Promise<T>;
  delete: <T = unknown>(endpoint: string) => Promise<T>;
} = Object.assign(_fetch, {
  get: <T = unknown>(endpoint: string) => _fetch<T>(endpoint),
  post: <T = unknown>(endpoint: string, body: unknown) => _fetch<T>(endpoint, { method: 'POST', body }),
  patch: <T = unknown>(endpoint: string, body: unknown) => _fetch<T>(endpoint, { method: 'PATCH', body }),
  delete: <T = unknown>(endpoint: string) => _fetch<T>(endpoint, { method: 'DELETE' }),
});

// Auth
export async function login(email: string, password: string) {
  return api('/api/auth/login', { method: 'POST', body: { email, password } });
}

export async function register(email: string, password: string, fullName: string, teamName?: string) {
  return api('/api/auth/register', { method: 'POST', body: { email, password, fullName, teamName } });
}

export async function requestMagicLink(email: string) {
  return api('/api/auth/magic-link', { method: 'POST', body: { email } });
}

// Dashboard
export async function getDashboardMetrics() {
  return api('/api/analytics/dashboard');
}

// Posts
export async function getPosts(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return api(`/api/posts${qs}`);
}

export async function createPost(data: { content: string; platform: string; scheduledFor?: string; tags?: string[] }) {
  return api('/api/posts', { method: 'POST', body: data });
}

export async function generatePost(data: { topic: string; platform: string; tone?: string; length?: string }) {
  return api('/api/posts/generate', { method: 'POST', body: data });
}

// Campaigns
export async function getCampaigns(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return api(`/api/campaigns${qs}`);
}

// CRM
export async function getContacts(params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return api(`/api/crm/contacts${qs}`);
}

// Content
export async function generateContent(data: { topic: string; type: string; tone?: string; length?: string }) {
  return api('/api/content/generate', { method: 'POST', body: data });
}

// Billing
export async function getSubscription() {
  return api('/api/billing/subscription');
}

export async function getPlans() {
  return api('/api/billing/plans');
}
