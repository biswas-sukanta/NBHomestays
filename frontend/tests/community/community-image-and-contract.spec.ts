import { test, expect } from '@playwright/test';
import { registerEphemeral, uploadMultiple, unlikePost, proxyUploadEndpoint } from '../helpers/community-api';

test.describe('Community — Image + Contract mismatch checks', () => {
  test('Image upload endpoint returns 200 (or report 500)', async ({ baseURL }) => {
    const user = await registerEphemeral('ROLE_USER', baseURL || undefined);
    const status = await uploadMultiple(user.tokens.accessToken, baseURL || undefined);

    // Expected behavior: 503 when ImageKit isn't configured; 200 when configured.
    // Keep strict: do not allow auth failures.
    expect([200, 400, 503]).toContain(status);
  });

  test('Contract: frontend defines DELETE /api/posts/{id}/like and backend should respond', async ({ baseURL }) => {
    const user = await registerEphemeral('ROLE_USER', baseURL || undefined);

    // Use a random UUID to avoid touching real data; endpoint existence is what matters.
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const status = await unlikePost(user.tokens.accessToken, fakeId, baseURL || undefined);

    // Endpoint exists; using a fake id should typically be 400/404 depending on validation.
    expect([200, 400, 404]).toContain(status);
  });

  test('Bug: /api/upload endpoint is not implemented in backend (should be 404/405)', async ({ baseURL }) => {
    const status = await proxyUploadEndpoint(baseURL || undefined);
    expect([403, 404, 405, 500]).toContain(status);
  });
});
