import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly sendMagicLinkButton: Locator;
  readonly githubButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('name@example.com');
    this.sendMagicLinkButton = page.getByRole('button', { name: /send magic link/i });
    this.githubButton = page.getByRole('button', { name: /continue with github/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async requestMagicLink(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.sendMagicLinkButton.click();
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 30_000 });
    await expect(this.emailInput).toBeHidden();

  }

      /**
   * The real proof you're logged out: try a protected page and get bounced.
   * Change '/app' if your protected pages live somewhere else.
   */
  async expectLoggedOut(): Promise<void> {
    await this.page.goto('/app');
    await expect(this.page).toHaveURL(/\/login/);
  }

    /**
   * Expect the email input to be invalid.
   */
  async expectEmailRejected(): Promise<void> {
    const isValid = await this.emailInput.evaluate((el) => (el as HTMLInputElement).validity.valid);
    expect(isValid).toBe(false);
    await expect(this.page).toHaveURL(/\/login/);
  }
  
}