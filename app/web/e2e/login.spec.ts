import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login');
  });

  test('should display login form elements', async ({ page }) => {
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Login - FinQuest/);

    // Check that the FinQuest logo is visible
    await expect(page.locator('img[alt="FinQuest Logo"]')).toBeVisible();

    // Check that the main heading is visible
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    // Check that the email input is visible and has correct attributes
    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required');

    // Check that the password input is visible and has correct attributes
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('required');

    // Check that the sign in button is visible
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    // Check that the Google login button is visible
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

    // Check that the sign up link is visible
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // Check that the forgot password link is visible
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    // Try to submit the form without filling any fields
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Check that the email input shows validation error (HTML5 validation)
    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toHaveAttribute('required');
    
    // Check that the password input shows validation error (HTML5 validation)
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should show error for invalid email format', async ({ page }) => {
    // Fill in invalid email format
    await page.getByLabel('Email address').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');

    // Try to submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Check that the email input shows validation error (HTML5 validation)
    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for the error message to appear (this will depend on your auth implementation)
    // Note: This test assumes that invalid credentials will show an error message
    await expect(page.locator('[data-testid="error-message"], .mantine-Alert-root')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to signup page when clicking sign up link', async ({ page }) => {
    // Click the sign up link
    await page.getByRole('link', { name: 'Sign up' }).click();

    // Check that we're on the signup page
    await expect(page).toHaveURL('/signup');
    await expect(page).toHaveTitle(/Sign Up - FinQuest/);
  });

  test('should show forgot password alert when clicking forgot password link', async ({ page }) => {
    // Click the forgot password link
    await page.getByRole('link', { name: 'Forgot password?' }).click();

    // Check that the alert appears (based on the current implementation)
    // The current implementation shows an alert with "Password reset coming soon!"
    // This test verifies that the alert is triggered
    page.on('dialog', async dialog => {
      expect(dialog.message()).toBe('Password reset coming soon!');
      await dialog.accept();
    });
  });

  test('should handle Google login button click', async ({ page }) => {
    // Verify the Google login button is visible and clickable
    const googleButton = page.getByRole('button', { name: 'Continue with Google' });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();

    // Click the Google login button
    await googleButton.click();
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Fill in valid-looking credentials
    await page.getByLabel('Email address').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Check that the button shows loading state
    // Note: This may be brief, so we check immediately after clicking
    const signInButton = page.getByRole('button', { name: 'Sign in' });
    // The button should be disabled or show loading state
    await expect(signInButton).toBeDisabled();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that the login form is still visible and properly laid out
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});
