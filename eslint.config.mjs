import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  // Generated files and runtime artifacts are not project source code.
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'allure-results/**',
      'allure-report/**',
      'artifacts/**',
      'coverage/**',
    ],
  },

  // Apply standard JavaScript quality rules.
  eslint.configs.recommended,

  // Apply TypeScript-specific recommended rules.
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],

    rules: {
      /*
       * Framework contracts should remain explicitly typed.
       * Prefer `unknown` and narrow the value when its type is not known.
       */
      '@typescript-eslint/no-explicit-any': 'error',

      /*
       * Unused code usually indicates incomplete or obsolete implementation.
       * An underscore prefix explicitly marks intentionally unused values.
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      /*
       * Empty functions can hide incomplete framework behaviour.
       */
      '@typescript-eslint/no-empty-function': 'error',
    },
  },

  {
    files: ['automation/tests/**/*.ts'],

    // These rules apply specifically to Playwright test files.
    ...playwright.configs['flat/recommended'],

    rules: {
      ...playwright.configs['flat/recommended'].rules,

      /*
       * A committed test.only() could silently reduce CI coverage.
       */
      'playwright/no-focused-test': 'error',

      /*
       * Fixed waits hide synchronization problems and increase flakiness.
       */
      'playwright/no-wait-for-timeout': 'error',

      /*
       * Tests should verify observable expected behaviour.
       */
      'playwright/expect-expect': 'error',
    },
  },
);
