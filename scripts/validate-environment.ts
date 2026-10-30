import { environment } from '../automation/config/environment.config';

/*
 * Print only non-sensitive configuration.
 *
 * Credentials and API keys are intentionally excluded so this validation
 * command remains safe for local terminals and future CI logs.
 */
console.log('AgenticQA Nexus environment configuration is valid.');
console.log(`Environment: ${environment.name}`);
console.log(`Web application configured: ${Boolean(environment.web.baseUrl)}`);
console.log(`API configured: ${Boolean(environment.api.baseUrl)}`);
console.log(`AI provider: ${environment.ai.provider}`);
