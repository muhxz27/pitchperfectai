import { readAIConfig } from './config';
import { createGeminiProvider } from './gemini';
import type { AIConfig, AIProvider } from './types';

type ProviderFactory = (config: AIConfig) => AIProvider;

const providerFactories: Record<string, ProviderFactory> = {
  gemini: (config) => createGeminiProvider(config),
};

export type ProviderResolution =
  | { state: 'unconfigured'; message: string }
  | { state: 'not_implemented'; message: string }
  | { state: 'ready'; provider: AIProvider };

export function resolveAIProvider(): ProviderResolution {
  const configState = readAIConfig();

  if (configState.state === 'unconfigured') {
    return {
      state: 'unconfigured',
      message:
        'Live AI is not configured. Add server-side AI_PROVIDER, AI_API_KEY, and AI_MODEL environment variables to enable it. The app continues to use sample analysis.',
    };
  }

  const factory = providerFactories[configState.config.provider];

  if (!factory) {
    return {
      state: 'not_implemented',
      message:
        'A provider is configured, but no live AI adapter matches it. Set AI_PROVIDER to gemini. The app continues to use sample analysis.',
    };
  }

  return { state: 'ready', provider: factory(configState.config) };
}
