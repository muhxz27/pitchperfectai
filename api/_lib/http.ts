export interface ApiRequest {
  method?: string;
  body?: unknown;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

export type ApiErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_INPUT'
  | 'METHOD_NOT_ALLOWED'
  | 'AI_NOT_CONFIGURED'
  | 'AI_PROVIDER_NOT_IMPLEMENTED'
  | 'AI_PROVIDER_RATE_LIMITED'
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_PROVIDER_AUTH_FAILED'
  | 'AI_PROVIDER_MALFORMED_RESPONSE'
  | 'AI_PROVIDER_ERROR';

export function sendJson(
  response: ApiResponse,
  status: number,
  body: unknown,
): void {
  response.status(status);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.json(body);
}

export function sendError(
  response: ApiResponse,
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): void {
  sendJson(response, status, {
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
  });
}

export function methodNotAllowed(
  response: ApiResponse,
  allowed: string,
): void {
  response.setHeader('Allow', allowed);
  sendError(
    response,
    405,
    'METHOD_NOT_ALLOWED',
    `${allowed} is the only supported method for this endpoint.`,
  );
}

export type BodyResult =
  | { ok: true; value: unknown }
  | { ok: false; message: string };

export function readJsonBody(request: ApiRequest): BodyResult {
  if (request.body === undefined || request.body === null) {
    return { ok: false, message: 'Request body is required.' };
  }

  if (typeof request.body === 'string') {
    try {
      return { ok: true, value: JSON.parse(request.body) };
    } catch {
      return { ok: false, message: 'Request body must be valid JSON.' };
    }
  }

  return { ok: true, value: request.body };
}
