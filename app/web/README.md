This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

For local development, you need to have [pnpm](https://pnpm.io/) installed.

Install dependencies:

```bash
pnpm install
```

Then, run the development server:

````bash
pnpm dev

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

This project uses [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit testing.

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
````

### Writing Tests

Tests are located in the `src/test/` directory and follow these conventions:

- **Component Tests**: Test React components in isolation
- **Context Tests**: Test React context providers
- **Utility Tests**: Test helper functions and utilities

### Test Setup

The testing infrastructure includes:

- **Vitest**: Fast unit test framework with Vite integration
- **React Testing Library**: Testing utilities focused on user behavior
- **jsdom**: DOM environment for browser-like testing
- **Mantine Provider**: Pre-configured for component styling
- **Mocks**: Next.js router, Supabase client, and browser APIs

### Example Test

```tsx
import { render, screen } from "../test-utils";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## End-to-End Testing

This project uses [Playwright](https://playwright.dev/) for end-to-end testing to ensure the application works correctly across different browsers and user workflows.

### Running E2E Tests

```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Debug tests
pnpm test:e2e:debug

# Run specific test file
npx playwright test login.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### E2E Test Structure

Tests are located in the `e2e/` directory and cover:

- **Login Flow**: Complete authentication workflow including form validation, error handling, and navigation
- **User Interactions**: Button clicks, form submissions, and navigation flows
- **Cross-browser Testing**: Tests run on Chromium, Firefox, and WebKit
- **Responsive Design**: Mobile viewport compatibility testing

### E2E Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, and WebKit
- **Auto-start**: Development server starts automatically before tests
- **Parallel execution**: Tests run in parallel for faster execution
- **Retry logic**: Failed tests retry on CI

### CI Integration

E2E tests are automatically run in GitHub Actions on:

- Push to master branch (when web app files change)
- Pull requests to master branch (when web app files change)

The CI pipeline includes Playwright browser installation, test execution, and test report artifacts.

### Writing E2E Tests

When adding new e2e tests:

1. Create test files in the `e2e/` directory with `.spec.ts` extension
2. Use descriptive test names and group related tests with `test.describe()`
3. Follow the existing patterns for page navigation and assertions
4. Use `test.beforeEach()` for common setup
5. Test both happy path and error scenarios
6. Include accessibility and responsive design tests where relevant

### E2E Testing Best Practices

- Use semantic selectors (roles, labels) over CSS selectors when possible
- Wait for elements to be visible/ready before interacting
- Test user workflows end-to-end, not just individual components
- Include both positive and negative test cases
- Keep tests independent and avoid dependencies between tests
- Use meaningful test descriptions that explain the expected behavior

## Testing

This project uses [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for unit testing.

### Running Tests

```bash
# Run tests in watch mode
npm run test
# or
pnpm test

# Run tests once
npm run test:run
# or
pnpm test:run

# Run tests with UI
npm run test:ui
# or
pnpm test:ui

# Run tests with coverage
npm run test:coverage
# or
pnpm test:coverage
```

### Writing Tests

Tests are located in the `src/test/` directory and follow these conventions:

- **Component Tests**: Test React components in isolation
- **Context Tests**: Test React context providers
- **Utility Tests**: Test helper functions and utilities

### Test Setup

The testing infrastructure includes:

- **Vitest**: Fast unit test framework with Vite integration
- **React Testing Library**: Testing utilities focused on user behavior
- **jsdom**: DOM environment for browser-like testing
- **Mantine Provider**: Pre-configured for component styling
- **Mocks**: Next.js router, Supabase client, and browser APIs

### Example Test

```tsx
import { render, screen } from "../test-utils";
import MyComponent from "@/components/MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

For detailed testing documentation, see [src/test/README.md](./src/test/README.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
