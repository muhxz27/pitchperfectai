import type { AIConfig } from './types';

declare const process: {
  env: Record<string, string | undefined>;
};

const PROVIDER_ENV = 'AI_PROVIDER';
const API_KEY_ENV = 'AI_API_KEY';
const MODEL_ENV = 'AI_MODEL';

export type AIConfigState =
  | { state: 'unconfigured'; missing: string[] }
  | { state: 'configured'; config: AIConfig };

export function readAIConfig(): AIConfigState {
  const provider = process.env[PROVIDER_ENV]?.trim().toLowerCase() ?? '';
  const apiKey = process.env[API_KEY_ENV]?.trim() ?? '';
  const model = process.env[MODEL_ENV]?.trim() ?? '';
  const missing: string[] = [];

  if (!provider) {
    missing.push(PROVIDER_ENV);
  }

  if (!apiKey) {
    missing.push(API_KEY_ENV);
  }

  if (!model) {
    missing.push(MODEL_ENV);
  }

  if (missing.length > 0) {
    return { state: 'unconfigured', missing };
  }

  return {
    state: 'configured',
    config: { provider, apiKey, model },
  };
}
