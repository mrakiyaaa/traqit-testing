import { test } from '../../fixtures';
import { getMagicLink } from '../../utils/auth/getMagicLink';

test.describe('Auth: login negative cases', () => {

  // ---------- 1 & 2: bad email input ----------
  test.describe('Email validation', () => {
    const invalidEmails = [
      { name: 'missing @', value: 'akila.test' },
      { name: 'missing domain', value: 'akila@' },
      { name: 'missing username', value: '@example.com' },
      { name: 'space inside', value: 'aki la@example.com' },
    ];

    // One loop = four separate tests in the report
    for (const { name, value } of invalidEmails) {
      test(`rejects ${name} email`, async ({ loginPage }) => {
        await loginPage.goto();
        await loginPage.requestMagicLink(value);
        await loginPage.expectEmailRejected();
      });
    }

    // App bug: the email input has no `required`, so an empty value counts as valid.
    // Submitting it does nothing: no error message, no request, no feedback to the user.
    // Fix in the app: add `required` to the email input. Remove test.fail() once fixed.
    test('rejects empty email', async ({ loginPage }) => {
      test.fail(true, 'App bug: email input is missing `required`, empty submit is silently ignored');
      await loginPage.goto();
      await loginPage.requestMagicLink('');
      await loginPage.expectEmailRejected();
    });
  });

  // ---------- 3: protected page ----------
  test('protected page redirects to /login when logged out', async ({ loginPage }) => {
    await loginPage.expectLoggedOut();
  });

  // ---------- 4 & 5: link abuse ----------
  test.describe('Magic link abuse', () => {

    test('tampered link does not sign in', async ({ page, loginPage, mail }) => {
      const link = await getMagicLink(loginPage, mail);

      await test.step('Open the link with a fake token', async () => {
        await page.goto(tamperToken(link), { waitUntil: 'domcontentloaded' });
      });

      await test.step('Verify the user is NOT signed in', async () => {
        await loginPage.expectLoggedOut();
      });
    });

    test('used link cannot sign in a second time', async ({ page, loginPage, mail }) => {
      const link = await getMagicLink(loginPage, mail);

      await test.step('First use signs in', async () => {
        await page.goto(link, { waitUntil: 'domcontentloaded' });
        await loginPage.expectLoggedIn();
      });

      await test.step('Sign out by wiping the session', async () => {
        // Supabase may keep the session in cookies OR localStorage, so clear both
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
      });

      await test.step('Second use is rejected', async () => {
        await page.goto(link, { waitUntil: 'domcontentloaded' });
        await loginPage.expectLoggedOut();
      });
    });
  });
});

/** Swaps the real token for a fake one, keeping the rest of the link intact. */
function tamperToken(link: string): string {
  const url = new URL(link);
  let changed = false;

  for (const key of ['token', 'token_hash']) {
    if (url.searchParams.has(key)) {
      url.searchParams.set(key, `invalid${Date.now()}`);
      changed = true;
    }
  }

  if (!changed) throw new Error(`No token found in link: ${link}`);
  return url.toString();
}