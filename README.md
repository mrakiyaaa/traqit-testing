# Traqit Testing

A focused end-to-end testing workspace built with [Playwright](https://playwright.dev/) and TypeScript.

The project is configured for Chromium, loads environment variables from a local `.env` file, and keeps failure artifacts available for debugging.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the test environment

Create a `.env` file in the project root:

```env
BASE_URL=https://your-test-environment.example.com
```

`BASE_URL` is required when Playwright loads the configuration. Keep `.env` local; it is ignored by Git.

### 3. Run the tests

```bash
npx playwright test
```

Run the suite with a visible browser:

```bash
npx playwright test --headed
```

Run a single test file:

```bash
npx playwright test tests/example.spec.ts
```

List discovered tests without executing them:

```bash
npx playwright test --list
```

## Reports and Debugging

The configured reporter writes an HTML report without opening it automatically. Open the most recent report with:

```bash
npx playwright show-report
```

For an interactive debugging session:

```bash
npx playwright test --debug
```

On failure, Playwright can retain screenshots, videos, and traces according to the settings in `playwright.config.ts`. Generated reports and test artifacts are ignored by Git.

## Project Layout

```text
.
├── pages/                 # Page objects and reusable UI abstractions
├── tests/                 # Playwright test specifications
├── playwright.config.ts   # Shared test runner configuration
├── package.json           # Node.js project metadata and dependencies
├── package-lock.json      # Locked dependency versions
└── .env                   # Local environment variables (not committed)
```

## Configuration

The test runner currently uses:

- Chromium with the Playwright Desktop Chrome device profile
- A 30-second test timeout
- A 5-second expectation timeout
- Parallel execution locally
- Two retries and one worker in CI
- Trace collection on the first retry
- Screenshots and videos retained on failure

The test base URL comes from `BASE_URL`. Tests can use Playwright's `baseURL` support with relative paths, while tests that target a fixed external site may continue to use an explicit URL.

## Useful Commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install project dependencies |
| `npx playwright test` | Run all tests |
| `npx playwright test --list` | Verify test discovery and config loading |
| `npx playwright test --headed` | Run with a visible Chromium window |
| `npx playwright test --debug` | Open Playwright Inspector |
| `npx playwright show-report` | View the HTML test report |

## Adding Tests

1. Add a `.spec.ts` file under `tests/`.
2. Reuse page objects from `pages/` for shared interactions.
3. Prefer role- and label-based locators.
4. Keep environment-specific values in `.env` rather than in test source.
5. Run `npx playwright test --list` before the full suite to verify discovery.

## CI Notes

When `CI` is set, the configuration enables retries and limits execution to one worker. Ensure the CI environment provides `BASE_URL` securely before running the suite.
