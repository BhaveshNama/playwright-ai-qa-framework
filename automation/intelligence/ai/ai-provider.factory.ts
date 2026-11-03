import type { AiProvider, AiProviderName } from './ai-provider.interface';
import { disabledAiProvider } from './providers/disabled-ai.provider';

export function createAiProvider(providerName: string | undefined): AiProvider {
  const normalizedProvider = providerName?.trim().toLowerCase() ?? 'disabled';

  switch (normalizedProvider as AiProviderName) {
    case 'disabled':
      return disabledAiProvider;

    case 'azure-openai':
      throw new Error('Azure OpenAI provider is not implemented yet.');

    case 'openai':
      throw new Error('OpenAI provider is not implemented yet.');

    case 'anthropic':
      throw new Error('Anthropic provider is not implemented yet.');

    default:
      throw new Error(`Unsupported AI provider: ${normalizedProvider}`);
  }
}
