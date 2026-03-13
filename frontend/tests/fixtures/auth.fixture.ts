import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';
import { registerViaApi, type Role } from '../helpers/api-helper';

export type AuthFixture = {
  role: Role;
  tokens: { accessToken: string; refreshToken: string };
  accessToken: string;
  refreshToken: string;
};

async function attachTokensToBrowser(page: Page, accessToken: string, refreshToken: string) {
  await page.addInitScript(({ at, rt }) => {
    // Match frontend tokenStore.ts behavior
    sessionStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
  }, { at: accessToken, rt: refreshToken });
}

async function provisionUser(request: APIRequestContext, baseURL: string, role: Role) {
  const { tokens } = await registerViaApi(request, baseURL, role);
  return tokens;
}

export const authedTest = base.extend<AuthFixture>({
  role: ['ROLE_USER', { option: true }],

  tokens: async ({ request, baseURL, role }, use) => {
    expect(baseURL, 'Playwright baseURL must be set').toBeTruthy();
    const tokens = await provisionUser(request, baseURL!, role);
    await use(tokens);
  },

  accessToken: async ({ tokens }, use) => {
    await use(tokens.accessToken);
  },

  refreshToken: async ({ tokens }, use) => {
    await use(tokens.refreshToken);
  },

  page: async ({ page, accessToken, refreshToken }, use) => {
    await attachTokensToBrowser(page, accessToken, refreshToken);
    await use(page);
  }
});
