import { test } from '../../fixtures';
import { extractMagicLink } from '../../utils/mail/extractLink';

test.describe('Auth: magic link', () => {
  test('user can sign in using a magic link from email', async ({ page, loginPage, mail }) => {
    let magicLink = '';

    await test.step('Open the login page', async () => {
      await loginPage.goto();
    });

    // Remember emails already in the inbox so an old one can't fool us
    const existingIds = await mail.listMessageIds();

    await test.step(`Request a magic link for ${mail.address}`, async () => {
      await loginPage.requestMagicLink(mail.address);
    });

    await test.step('Wait for the email and extract the link', async () => {
      const email = await mail.waitForMessage({ excludeIds: existingIds, timeout: 60_000 });
      magicLink = extractMagicLink(email);
    });

    await test.step('Open the magic link', async () => {
      await page.goto(magicLink); // same browser, so the login cookie matches
    });

    await test.step('Verify the user is signed in', async () => {
      await loginPage.expectLoggedIn();
    });
  });
});