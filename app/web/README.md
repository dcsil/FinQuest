This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

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
