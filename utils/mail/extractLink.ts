import type { MailMessage } from './MailTmClient';

export function extractMagicLink(mail: MailMessage, hint: RegExp = /token|verify|magic/i): string {
  const html = (mail.html ?? []).join('\n');

  // All href="..." links from the HTML version
  const hrefs = [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)].map((m) => decodeEntities(m[1]));

  // All plain URLs from the text version (backup)
  const textUrls = (mail.text ?? '').match(/https?:\/\/[^\s<>"'\])]+/g) ?? [];

  const candidates = [...new Set([...hrefs, ...textUrls])].filter((url) => url.startsWith('http'));
  const link = candidates.find((url) => hint.test(url));

  if (!link) {
    throw new Error(`No magic link found. Links seen:\n${candidates.join('\n') || '(none)'}`);
  }
  return link;
}

// In email HTML, "&" is written as "&amp;". The link breaks if we don't fix that.
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x3D;|&#61;/gi, '=')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}