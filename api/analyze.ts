import { analyzeSpeech } from './_lib/ai/service';
import {
  methodNotAllowed,
  readJsonBody,
  sendError,
  sendJson,
} from './_lib/http';
import type { ApiRequest, ApiResponse } from './_lib/http';
import { validateSpeechInput } from './_lib/validation';

export default async function handler(
  request: ApiRequest,
  response: ApiResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    methodNotAllowed(response, 'POST');
    return;
  }

  const body = readJsonBody(request);

  if (!body.ok) {
    sendError(response, 400, 'INVALID_JSON', body.message);
    return;
  }

  const validation = validateSpeechInput(body.value);

  if (!validation.ok) {
    sendError(
      response,
      400,
      'INVALID_INPUT',
      'Check the request fields and try again.',
      validation.fields,
    );
    return;
  }

  const result = await analyzeSpeech(validation.value);

  if (!result.ok) {
    sendError(response, result.status, result.code, result.message);
    return;
  }

  sendJson(response, 200, {
    sampleMode: false,
    analysis: result.value,
  });
}
