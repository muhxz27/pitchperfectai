export type AIProviderErrorKind =
  | 'timeout'
  | 'rate_limit'
  | 'auth'
  | 'malformed_response'
  | 'network'
  | 'provider';

// Details stay server-side: the service layer maps every kind to a generic
// public message so provider payloads and credentials are never echoed.
export class AIProviderError extends Error {
  readonly kind: AIProviderErrorKind;

  constructor(kind: AIProviderErrorKind, detail: string) {
    super(detail);
    this.name = 'AIProviderError';
    this.kind = kind;
  }
}
