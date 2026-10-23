import { LoginPage } from '../../pages/LoginPage';
import { MailTmClient } from '../mail/MailTmClient';
import { extractMagicLink } from '../mail/extractLink';

/**
 * Does the whole "request link, wait for email, pull link out" dance.
 * Uses loginPage's page, so the link must be opened in that same page afterwards.
 */
export async function getMagicLink(loginPage: LoginPage, mail: MailTmClient): Promise<string> {
  await loginPage.goto();
  const existingIds = await mail.listMessageIds();
  await loginPage.requestMagicLink(mail.address);
  const email = await mail.waitForMessage({ excludeIds: existingIds });
  return extractMagicLink(email);
}