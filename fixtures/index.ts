import { test as base, request } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MailTmClient } from '../utils/mail/MailTmClient';

type Fixtures = {
  loginPage: LoginPage;
  mail: MailTmClient;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  // eslint-disable-next-line no-empty-pattern
  mail: async ({}, use) => {
    // SETUP
    const api = await request.newContext({
      baseURL: process.env.MAILTM_API_URL ?? 'https://api.mail.tm',
    });
    const mail = new MailTmClient(api);

    const fixedAddress = process.env.MAILTM_ADDRESS;
    const fixedPassword = process.env.MAILTM_PASSWORD;
    const usingFixedInbox = Boolean(fixedAddress && fixedPassword);

    if (usingFixedInbox) {
      await mail.login(fixedAddress!, fixedPassword!);
    } else {
      await mail.createInbox();
    }

    await use(mail); // the test runs here

    // TEARDOWN (runs even if the test fails)
    if (!usingFixedInbox) await mail.deleteAccount();
    await api.dispose();
  },
});

export { expect } from '@playwright/test';