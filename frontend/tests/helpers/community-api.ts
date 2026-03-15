import type { Role } from './api-helper';
import { randomUUID } from 'crypto';

export type Tokens = { accessToken: string; refreshToken: string };

const DEFAULT_BASE = 'http://localhost:3000/api';

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 25000, ...rest } = init;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export function seededCreds(role: Role): { email: string; password: string } | null {
  if (role === 'ROLE_ADMIN') {
    return {
      email: process.env.PW_ADMIN_EMAIL || 'admin@nbh.com',
      password: process.env.PW_ADMIN_PASSWORD || 'admin123',
    };
  }

  if (role === 'ROLE_HOST') {
    return {
      email: process.env.PW_HOST_EMAIL || 'host@nbh.com',
      password: process.env.PW_HOST_PASSWORD || 'host123',
    };
  }

  if (role === 'ROLE_USER') {
    return {
      email: process.env.PW_USER_EMAIL || 'user@nbh.com',
      password: process.env.PW_USER_PASSWORD || 'user123',
    };
  }

  return null;
}

export async function login(email: string, password: string, baseURL?: string): Promise<Tokens> {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
    timeoutMs: 25000,
  });

  const body = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(`login failed: ${res.status}`);
  if (!body.accessToken || !body.refreshToken) throw new Error('login missing tokens');
  return { accessToken: body.accessToken, refreshToken: body.refreshToken };
}

function apiBase(baseURL?: string) {
  // Playwright baseURL is like http://localhost:3000
  if (!baseURL) return DEFAULT_BASE;
  const clean = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  return `${clean}/api`;
}

function authz(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function registerEphemeral(role: Role, baseURL?: string): Promise<{ email: string; password: string; tokens: Tokens }> {
  const email = `pw_${role.toLowerCase()}_${randomUUID()}@test.com`;
  const password = 'Password123!';

  let lastStatus: number | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetchWithTimeout(`${apiBase(baseURL)}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ firstname: 'PW', lastname: 'Runner', email, password, role }),
      timeoutMs: 25000,
    });
    lastStatus = res.status;
    const body = await res.json().catch(() => ({} as any));

    if (res.ok && body?.accessToken && body?.refreshToken) {
      return { email, password, tokens: { accessToken: body.accessToken, refreshToken: body.refreshToken } };
    }

    if (lastStatus >= 500 || lastStatus === 404 || lastStatus === 429) {
      await sleep(750 * (attempt + 1));
      continue;
    }

    break;
  }

  const creds = seededCreds(role);
  if (creds) {
    const tokens = await login(creds.email, creds.password, baseURL);
    return { email: creds.email, password: creds.password, tokens };
  }

  throw new Error(`register failed: ${lastStatus ?? 'unknown'}`);
}

export async function refreshAccessToken(refreshToken: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return res.status;
}

export async function getFeed(baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/feed?limit=1&layout=true`, { method: 'GET' });
  return res.status;
}

export async function pingHealth(baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/health/ping`, { method: 'GET', timeoutMs: 10000 });
  return res.status;
}

export async function createPost(token: string, text: string, baseURL?: string): Promise<{ status: number; postId?: string }> {
  const fd = new FormData();
  fd.set(
    'request',
    new Blob(
      [JSON.stringify({ locationName: 'PW Location', textContent: text })],
      { type: 'application/json' }
    )
  );

  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts`, {
    method: 'POST',
    headers: authz(token),
    body: fd,
  });

  const body = await res.json().catch(() => ({} as any));
  return { status: res.status, postId: body?.id };
}

export async function deletePost(token: string, postId: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}`, {
    method: 'DELETE',
    headers: authz(token),
    timeoutMs: 60000,
  });
  return res.status;
}

export async function likePost(token: string, postId: string, baseURL?: string, timeoutMs?: number) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}/like`, {
    method: 'POST',
    headers: authz(token),
    timeoutMs,
  });
  return res.status;
}

export async function unlikePost(token: string, postId: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}/like`, {
    method: 'DELETE',
    headers: authz(token),
  });
  return res.status;
}

export async function sharePost(postId: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}/share`, { method: 'POST' });
  return res.status;
}

export async function repost(token: string, postId: string, baseURL?: string) {
  const fd = new FormData();
  fd.set('request', new Blob([JSON.stringify({ locationName: 'PW Repost', textContent: 'PW Repost' })], { type: 'application/json' }));
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}/repost`, {
    method: 'POST',
    headers: authz(token),
    body: fd,
  });
  const body = await res.json().catch(() => ({} as any));
  return { status: res.status, postId: body?.id as string | undefined };
}

export async function addComment(token: string, postId: string, bodyText: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authz(token) },
    body: JSON.stringify({ body: bodyText }),
  });
  const body = await res.json().catch(() => ({} as any));
  return { status: res.status, commentId: body?.id as string | undefined };
}

export async function updatePostAsOther(token: string, postId: string, baseURL?: string) {
  const fd = new FormData();
  fd.set('request', new Blob([JSON.stringify({ locationName: 'PW', textContent: 'HACK' })], { type: 'application/json' }));
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}`, {
    method: 'PUT',
    headers: authz(token),
    body: fd,
  });
  return res.status;
}

export async function updateCommentAsOther(token: string, postId: string, commentId: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/posts/${postId}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...authz(token) },
    body: JSON.stringify({ body: 'HACK' }),
  });
  return res.status;
}

export async function deleteComment(token: string, commentId: string, baseURL?: string) {
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/comments/${commentId}`, {
    method: 'DELETE',
    headers: authz(token),
    timeoutMs: 60000,
  });
  return res.status;
}

export async function uploadMultiple(token: string, baseURL?: string) {
  const fd = new FormData();
  fd.append('files', new Blob([Buffer.from('fake')], { type: 'image/png' }), 'tiny.png');
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/images/upload-multiple`, {
    method: 'POST',
    headers: authz(token),
    body: fd,
  });
  return res.status;
}

export async function proxyUploadEndpoint(baseURL?: string) {
  const fd = new FormData();
  fd.append('files', new Blob([Buffer.from('fake')], { type: 'image/png' }), 'tiny.png');
  const res = await fetchWithTimeout(`${apiBase(baseURL)}/upload`, {
    method: 'POST',
    body: fd,
  });
  return res.status;
}
