import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export type MailSummary = {
  id: string;
  from: { address: string; name: string };
  subject: string;
  intro: string;
  createdAt: string;
};

export type MailMessage = MailSummary & {
  text?: string;
  html?: string[];
};

export class MailTmClient {
  private token = '';
  private accountId = '';
  address = '';

  constructor(private readonly api: APIRequestContext) {}

  // 1. Make a new random inbox and log into it
  async createInbox(): Promise<string> {
    const domain = await this.getActiveDomain();
    const address = `traqit-${Date.now()}-${randomString(6)}@${domain}`;
    const password = randomString(16);

    const res = await this.api.post('/accounts', { data: { address, password } });
    await ensureOk(res, 'create mail.tm account');

    await this.login(address, password);
    return address;
  }

  // 2. Get a token so we can read the inbox
  async login(address: string, password: string): Promise<void> {
    const res = await this.api.post('/token', { data: { address, password } });
    await ensureOk(res, 'get mail.tm token');

    const body = await res.json();
    this.token = body.token;
    this.accountId = body.id;
    this.address = address;
  }

  async listMessages(): Promise<MailSummary[]> {
    const res = await this.api.get('/messages', { headers: this.authHeaders() });
    await ensureOk(res, 'list messages');
    return unwrapCollection<MailSummary>(await res.json());
  }

  async listMessageIds(): Promise<string[]> {
    return (await this.listMessages()).map((m) => m.id);
  }

  async getMessage(id: string): Promise<MailMessage> {
    const res = await this.api.get(`/messages/${id}`, { headers: this.authHeaders() });
    await ensureOk(res, `get message ${id}`);
    return res.json();
  }

  // 3. Keep checking the inbox until a NEW email shows up (this is the "Refresh" button)
  async waitForMessage(
    options: { excludeIds?: string[]; subject?: RegExp; timeout?: number } = {},
  ): Promise<MailMessage> {
    const { excludeIds = [], subject, timeout = 60_000 } = options;
    let match: MailSummary | undefined;

    await expect
      .poll(
        async () => {
          try {
            const messages = await this.listMessages();
            match = messages.find(
              (m) => !excludeIds.includes(m.id) && (!subject || subject.test(m.subject)),
            );
          } catch {
            match = undefined; // network blip, just try again next round
          }
          return match?.id;
        },
        {
          message: `No email arrived at ${this.address} within ${timeout / 1000}s`,
          timeout,
          intervals: [2_000, 3_000, 5_000],
        },
      )
      .toBeTruthy();

    return this.getMessage(match!.id);
  }

  // 4. Clean up after the test
  async deleteAccount(): Promise<void> {
    if (!this.accountId) return;
    const res = await this.api.delete(`/accounts/${this.accountId}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok()) console.warn(`mail.tm cleanup failed: ${res.status()}`);
  }

  private async getActiveDomain(): Promise<string> {
    const res = await this.api.get('/domains');
    await ensureOk(res, 'list mail.tm domains');
    const domains = unwrapCollection<{ domain: string; isActive: boolean }>(await res.json());
    const active = domains.find((d) => d.isActive);
    if (!active) throw new Error('mail.tm returned no active domains');
    return active.domain;
  }

  private authHeaders() {
    if (!this.token) throw new Error('Call createInbox() or login() first');
    return { Authorization: `Bearer ${this.token}` };
  }
}

function unwrapCollection<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  const members = (body as Record<string, unknown>)?.['hydra:member'];
  return Array.isArray(members) ? (members as T[]) : [];
}

async function ensureOk(res: APIResponse, action: string): Promise<void> {
  if (res.ok()) return;
  throw new Error(`Failed to ${action}: HTTP ${res.status()} ${await res.text()}`);
}

function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}