import path from 'node:path';
import process from 'node:process';

import dotenv from 'dotenv';
import { z } from 'zod';

/*
 * Load local environment values before validation.
 *
 * Using an explicit repository-root path keeps configuration loading
 * independent of the directory from which a test command is launched.
 */
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

/*
 * Environment configuration is validated at runtime because values originating
 * outside TypeScript cannot be trusted simply because the consuming code is typed.
 */
const environmentSchema = z.object({
  TEST_ENV: z.enum(['local', 'dev', 'qa']).default('local'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  BASE_URL: z.url(),

  API_BASE_URL: z.url(),

  /*
   * Credentials are optional until authenticated scenarios are implemented.
   * Empty strings from .env files are converted to undefined.
   */
  AUTOMATION_USERNAME: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),

  AUTOMATION_PASSWORD: z
    .string()
    .optional()
    .transform((value) => value || undefined),

  /*
   * AI remains disabled during the deterministic automation milestones.
   * Provider-specific configuration will be introduced with the agent layer.
   */
  AI_PROVIDER: z.string().trim().default('disabled'),

  AI_API_KEY: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const problems = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid AgenticQA Nexus environment configuration:\n${problems}`);
}

const values = parsedEnvironment.data;

/*
 * Export one immutable configuration object instead of allowing framework
 * modules to read process.env independently.
 */
export const environment = Object.freeze({
  name: values.TEST_ENV,
  logLevel: values.LOG_LEVEL,

  web: {
    baseUrl: values.BASE_URL,
  },

  api: {
    baseUrl: values.API_BASE_URL,
  },

  authentication: {
    username: values.AUTOMATION_USERNAME,
    password: values.AUTOMATION_PASSWORD,
  },

  ai: {
    provider: values.AI_PROVIDER,
    apiKey: values.AI_API_KEY,
  },
});

export type EnvironmentConfig = typeof environment;
