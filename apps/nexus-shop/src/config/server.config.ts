import { z } from 'zod';

const environment =
  (
    globalThis as typeof globalThis & {
      process?: { env: Record<string, string | undefined> };
    }
  ).process?.env ?? {};

/*
 * NexusShop owns its server configuration.
 *
 * Keeping application runtime configuration separate from automation
 * configuration prevents the test framework from controlling application
 * implementation details.
 */
const serverEnvironmentSchema = z.object({
  NEXUS_SHOP_HOST: z.string().trim().default('127.0.0.1'),

  NEXUS_SHOP_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

const parsedConfiguration = serverEnvironmentSchema.safeParse(environment);

if (!parsedConfiguration.success) {
  const problems = parsedConfiguration.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid NexusShop server configuration:\n${problems}`);
}

/*
 * Export one immutable configuration object for the NexusShop server.
 */
export const serverConfig = Object.freeze({
  host: parsedConfiguration.data.NEXUS_SHOP_HOST,
  port: parsedConfiguration.data.NEXUS_SHOP_PORT,
});
