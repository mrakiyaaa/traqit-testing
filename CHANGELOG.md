# Changelog

## Known issues / TODO
- `expectLoggedIn()` only checks we left /login. Tighten it once the post-login landing page is confirmed.
- Every run creates a new Traqit user unless `MAILTM_ADDRESS` / `MAILTM_PASSWORD` are set in `.env`.
- No saved login session yet. Add a setup project with `storageState` so other tests skip the email step.
- No expired magic link test yet.
- App bug: the login email input has no `required`, so submitting an empty email does nothing (no error, no request). Fix in the app by adding `required`. Then remove `test.fail()` from "rejects empty email" in `tests/auth/login-negative.spec.ts`.
- App bug: the login form has `novalidate`, so malformed emails (e.g. `akila@`) are sent to Supabase `/auth/v1/otp` and the user only sees "Something went wrong. Try again." The format tests pass only because they read `validity.valid`. They do not prove the submit was blocked.
- "used link cannot sign in a second time" failed once in 3 full runs and passed when rerun alone. Cause unknown, probably the mail.tm step. Watch it.
- `docs/flows/magic-link-login.mmd` is listed below but is not in the repo yet. Add it.
- `tests/example.spec.ts` is the Playwright starter test against playwright.dev. Remove it or replace it.

## 2026-10-23
### Changed
- `tests/auth/login-negative.spec.ts`: took empty email out of the `invalidEmails` loop. It is now its own "rejects empty email" test, marked `test.fail()` because of the app bug above.

### Removed
- Placeholder `/enter your email/i` check from the empty email test. The app shows no such message.

## 2026-10-22
### Added
- Magic link login test in `tests/auth/magic-link-login.spec.ts`.
- `LoginPage` page object in `pages/LoginPage.ts`.
- `MailTmClient` in `utils/mail/MailTmClient.ts` to create temp inboxes and poll for emails through the mail.tm API.
- `extractMagicLink()` in `utils/mail/extractLink.ts` to pull the login link out of the email.
- Custom fixtures in `fixtures/index.ts` that inject `loginPage` and `mail`, and delete the inbox after each test.
- `.env` support via `dotenv` for `BASE_URL` and mail.tm settings.
- Flow diagram `docs/flows/magic-link-login.mmd` (v1).
- `tsconfig.json` so the editor finds Node types (`process`) and resolves `dotenv/config`. Uses `nodenext` module resolution.

### Changed
- `playwright.config.ts`: 120s test timeout, 1 worker to avoid email rate limits, traces/screenshots/video kept on failure.
