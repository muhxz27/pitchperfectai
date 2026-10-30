import { AIProviderError } from './errors';
import { resolveAIProvider } from './provider';
import type {
  AnalysisInput,
  RevisionInput,
  SpeechAnalysisResult,
  SpeechRevisionResult,
} from './types';

export type AIServiceErrorCode =
  | 'AI_NOT_CONFIGURED'
  | 'AI_PROVIDER_NOT_IMPLEMENTED'
  | 'AI_PROVIDER_RATE_LIMITED'
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_PROVIDER_AUTH_FAILED'
  | 'AI_PROVIDER_MALFORMED_RESPONSE'
  | 'AI_PROVIDER_ERROR';

export interface AIServiceFailure {
  ok: false;
  status: 501 | 502 | 503 | 504;
  code: AIServiceErrorCode;
  message: string;
}

export type AIServiceResult<T> = { ok: true; value: T } | AIServiceFailure;

type ServiceAction = 'analysis' | 'revision';

function providerFailure(
  error: unknown,
  action: ServiceAction,
): AIServiceFailure {
  const genericMessage = `The AI provider could not complete the ${action}. No result was returned. Try again later.`;

  if (!(error instanceof AIProviderError)) {
    return {
      ok: false,
      status: 502,
      code: 'AI_PROVIDER_ERROR',
      message: genericMessage,
    };
  }

  switch (error.kind) {
    case 'rate_limit':
      return {
        ok: false,
        status: 503,
        code: 'AI_PROVIDER_RATE_LIMITED',
        message: `The AI provider is handling too many requests right now, so the ${action} was not completed. Try again in a moment.`,
      };
    case 'timeout':
      return {
        ok: false,
        status: 504,
        code: 'AI_PROVIDER_TIMEOUT',
        message: `The AI provider took too long to complete the ${action}. No result was returned. Try again later.`,
      };
    case 'auth':
      return {
        ok: false,
        status: 502,
        code: 'AI_PROVIDER_AUTH_FAILED',
        message:
          'The AI provider rejected the server credentials, so no result was returned. Server configuration needs attention.',
      };
    case 'malformed_response':
      return {
        ok: false,
        status: 502,
        code: 'AI_PROVIDER_MALFORMED_RESPONSE',
        message: `The AI provider returned a response that could not be used, so the ${action} was not completed. Try again later.`,
      };
    case 'network':
    case 'provider':
      return {
        ok: false,
        status: 502,
        code: 'AI_PROVIDER_ERROR',
        message: genericMessage,
      };
  }
}

export async function analyzeSpeech(
  input: AnalysisInput,
): Promise<AIServiceResult<SpeechAnalysisResult>> {
  const resolution = resolveAIProvider();

  if (resolution.state === 'unconfigured') {
    return {
      ok: false,
      status: 503,
      code: 'AI_NOT_CONFIGURED',
      message: resolution.message,
    };
  }

  if (resolution.state === 'not_implemented') {
    return {
      ok: false,
      status: 501,
      code: 'AI_PROVIDER_NOT_IMPLEMENTED',
      message: resolution.message,
    };
  }

  try {
    return {
      ok: true,
      value: await resolution.provider.analyzeSpeech(input),
    };
  } catch (error) {
    return providerFailure(error, 'analysis');
  }
}

export async function reviseSpeech(
  input: RevisionInput,
): Promise<AIServiceResult<SpeechRevisionResult>> {
  const resolution = resolveAIProvider();

  if (resolution.state === 'unconfigured') {
    return {
      ok: false,
      status: 503,
      code: 'AI_NOT_CONFIGURED',
      message: resolution.message,
    };
  }

  if (resolution.state === 'not_implemented') {
    return {
      ok: false,
      status: 501,
      code: 'AI_PROVIDER_NOT_IMPLEMENTED',
      message: resolution.message,
    };
  }

  try {
    return {
      ok: true,
      value: await resolution.provider.reviseSpeech(input),
    };
  } catch (error) {
    return providerFailure(error, 'revision');
  }
}
