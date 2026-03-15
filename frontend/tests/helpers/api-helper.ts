import type { APIRequestContext } from '@playwright/test';
import { randomUUID } from 'crypto';

export type Role = 'ROLE_USER' | 'ROLE_HOST' | 'ROLE_ADMIN';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

function seededCreds(role: Role): { email: string; password: string } | null {
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

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function registerViaApi(
  request: APIRequestContext,
  baseURL: string,
  role: Role = 'ROLE_USER'
): Promise<{ email: string; password: string; tokens: AuthTokens }> {
  const email = `pw_${role.toLowerCase()}_${randomUUID()}@test.com`;
  const password = 'Password123!';

  let lastStatus: number | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await request.post(`${baseURL}/api/auth/register`, {
      headers: { 'Content-Type': 'application/json' },
      data: { firstname: 'PW', lastname: 'Runner', email, password, role },
    });
    lastStatus = res.status();

    // Success
    if (res.ok()) {
      const body = (await res.json()) as { accessToken?: string; refreshToken?: string };
      if (!body.accessToken || !body.refreshToken) {
        throw new Error('Register response missing tokens');
      }
      return { email, password, tokens: { accessToken: body.accessToken, refreshToken: body.refreshToken } };
    }

    // Retry transient failures (server error/cold start/network)
    if (lastStatus >= 500 || lastStatus === 404 || lastStatus === 429) {
      await sleep(500 * (attempt + 1));
      continue;
    }

    // Non-retryable
    break;
  }

  const creds = seededCreds(role);
  if (creds) {
    const tokens = await authenticateViaApi(request, baseURL, creds.email, creds.password);
    return { email: creds.email, password: creds.password, tokens };
  }

  throw new Error(`Register failed: ${lastStatus ?? 'unknown'}`);
}

export async function authenticateViaApi(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await request.post(`${baseURL}/api/auth/authenticate`, {
    headers: { 'Content-Type': 'application/json' },
    data: { email, password },
  });

  if (!res.ok()) {
    throw new Error(`Authenticate failed: ${res.status()}`);
  }

  const body = (await res.json()) as { accessToken?: string; refreshToken?: string };
  if (!body.accessToken || !body.refreshToken) {
    throw new Error('Authenticate response missing tokens');
  }

  return { accessToken: body.accessToken, refreshToken: body.refreshToken };
}
