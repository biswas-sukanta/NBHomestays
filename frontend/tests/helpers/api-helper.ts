import type { APIRequestContext } from '@playwright/test';
import { randomUUID } from 'crypto';

export type Role = 'ROLE_USER' | 'ROLE_HOST' | 'ROLE_ADMIN';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
