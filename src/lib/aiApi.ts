import type { SpeechDraft } from './speechDraft';

export type AnalysisScore =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

export type AnalysisStatus = 'Strong' | 'Developing' | 'Focus';

export type AnalysisDimensionId =
  | 'opening-hook'
  | 'clarity'
  | 'structure'
  | 'audience-engagement'
  | 'conclusion';

export interface AnalysisDimensionResult {
  id: AnalysisDimensionId;
  name: string;
  score: AnalysisScore;
  status: AnalysisStatus;
  explanation: string;
}

export interface PriorityImprovementResult {
  dimensionId: AnalysisDimensionId;
  headline: string;
  whyItMatters: string;
  nextAction: string;
}

export interface StrengthResult {
  id: string;
  dimensionId: AnalysisDimensionId;
  title: string;
  explanation: string;
}

export interface SentenceFeedbackResult {
  id: string;
  dimensionId: AnalysisDimensionId;
  exampleSentence: string;
  issue: string;
  suggestedRevision: string;
}

export interface DeliveryTipResult {
  id: string;
  title: string;
  description: string;
}

export interface SpeechAnalysisResult {
  sampleMode: false;
  dimensions: AnalysisDimensionResult[];
  priorityImprovement: PriorityImprovementResult;
  strengths: StrengthResult[];
  sentenceFeedback: SentenceFeedbackResult[];
  deliveryTips: DeliveryTipResult[];
}

export interface RevisionChangeResult {
  id: string;
  originalExample: string;
  improvedExample: string;
  explanation: string;
}

export interface SpeechRevisionResult {
  sampleMode: false;
  improvedSpeech: {
    title: string;
    paragraphs: string[];
  };
  changes: RevisionChangeResult[];
}

export interface ApiFailure {
  code: string;
  message: string;
  retryable: boolean;
  fallbackAllowed: boolean;
}

export type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; failure: ApiFailure };

const REQUEST_TIMEOUT_MS = 60_000;

const DIMENSION_IDS = new Set<string>([
  'opening-hook',
  'clarity',
  'structure',
  'audience-engagement',
  'conclusion',
]);

const ANALYSIS_STATUSES = new Set<string>([
  'Strong',
  'Developing',
  'Focus',
]);

const FALLBACK_ALLOWED_CODES = new Set<string>([
  'AI_NOT_CONFIGURED',
  'AI_PROVIDER_NOT_IMPLEMENTED',
  'AI_PROVIDER_RATE_LIMITED',
  'AI_PROVIDER_TIMEOUT',
  'AI_PROVIDER_AUTH_FAILED',
  'AI_PROVIDER_MALFORMED_RESPONSE',
  'AI_PROVIDER_ERROR',
]);

const RETRYABLE_CODES = new Set<string>([
  'AI_PROVIDER_RATE_LIMITED',
  'AI_PROVIDER_TIMEOUT',
  'AI_PROVIDER_MALFORMED_RESPONSE',
  'AI_PROVIDER_ERROR',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isIdentifier(value: unknown): value is string {
  return isText(value, 120);
}

function isDimensionId(value: unknown): value is AnalysisDimensionId {
  return typeof value === 'string' && DIMENSION_IDS.has(value);
}

function isStatus(value: unknown): value is AnalysisStatus {
  return typeof value === 'string' && ANALYSIS_STATUSES.has(value);
}

function isScore(value: unknown): value is AnalysisScore {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 10
  );
}

function parseDimension(value: unknown): AnalysisDimensionResult | null {
  if (!isRecord(value)) return null;
  if (
    !isDimensionId(value.id) ||
    !isText(value.name, 80) ||
    !isScore(value.score) ||
    !isStatus(value.status) ||
    !isText(value.explanation, 2_000)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    score: value.score,
    status: value.status,
    explanation: value.explanation,
  };
}

function parsePriority(
  value: unknown,
): PriorityImprovementResult | null {
  if (!isRecord(value)) return null;
  if (
    !isDimensionId(value.dimensionId) ||
    !isText(value.headline, 400) ||
    !isText(value.whyItMatters, 2_000) ||
    !isText(value.nextAction, 2_000)
  ) {
    return null;
  }

  return {
    dimensionId: value.dimensionId,
    headline: value.headline,
    whyItMatters: value.whyItMatters,
    nextAction: value.nextAction,
  };
}

function parseStrength(value: unknown): StrengthResult | null {
  if (!isRecord(value)) return null;
  if (
    !isIdentifier(value.id) ||
    !isDimensionId(value.dimensionId) ||
    !isText(value.title, 200) ||
    !isText(value.explanation, 2_000)
  ) {
    return null;
  }

  return {
    id: value.id,
    dimensionId: value.dimensionId,
    title: value.title,
    explanation: value.explanation,
  };
}

function parseSentenceFeedback(
  value: unknown,
): SentenceFeedbackResult | null {
  if (!isRecord(value)) return null;
  if (
    !isIdentifier(value.id) ||
    !isDimensionId(value.dimensionId) ||
    !isText(value.exampleSentence, 2_000) ||
    !isText(value.issue, 2_000) ||
    !isText(value.suggestedRevision, 2_000)
  ) {
    return null;
  }

  return {
    id: value.id,
    dimensionId: value.dimensionId,
    exampleSentence: value.exampleSentence,
    issue: value.issue,
    suggestedRevision: value.suggestedRevision,
  };
}

function parseDeliveryTip(value: unknown): DeliveryTipResult | null {
  if (!isRecord(value)) return null;
  if (
    !isIdentifier(value.id) ||
    !isText(value.title, 200) ||
    !isText(value.description, 2_000)
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    description: value.description,
  };
}

function parseList<T>(
  value: unknown,
  maxItems: number,
  parseItem: (item: unknown) => T | null,
): T[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxItems) {
    return null;
  }

  const items: T[] = [];

  for (const entry of value) {
    const parsed = parseItem(entry);

    if (!parsed) {
      return null;
    }

    items.push(parsed);
  }

  return items;
}

export function parseAnalysisResponse(
  payload: unknown,
): SpeechAnalysisResult | null {
  if (!isRecord(payload) || payload.sampleMode !== false) {
    return null;
  }

  const analysis = payload.analysis;

  if (!isRecord(analysis)) {
    return null;
  }

  const dimensions = parseList(analysis.dimensions, 5, parseDimension);
  const priority = parsePriority(analysis.priorityImprovement);
  const strengths = parseList(analysis.strengths, 5, parseStrength);
  const sentenceFeedback = parseList(
    analysis.sentenceFeedback,
    8,
    parseSentenceFeedback,
  );
  const deliveryTips = parseList(
    analysis.deliveryTips,
    5,
    parseDeliveryTip,
  );

  if (
    !dimensions ||
    dimensions.length !== 5 ||
    !priority ||
    !strengths ||
    !sentenceFeedback ||
    !deliveryTips
  ) {
    return null;
  }

  return {
    sampleMode: false,
    dimensions,
    priorityImprovement: priority,
    strengths,
    sentenceFeedback,
    deliveryTips,
  };
}

function parseRevisionChange(
  value: unknown,
): RevisionChangeResult | null {
  if (!isRecord(value)) return null;
  if (
    !isIdentifier(value.id) ||
    !isText(value.originalExample, 2_000) ||
    !isText(value.improvedExample, 2_000) ||
    !isText(value.explanation, 2_000)
  ) {
    return null;
  }

  return {
    id: value.id,
    originalExample: value.originalExample,
    improvedExample: value.improvedExample,
    explanation: value.explanation,
  };
}

export function parseRevisionResponse(
  payload: unknown,
): SpeechRevisionResult | null {
  if (!isRecord(payload) || payload.sampleMode !== false) {
    return null;
  }

  const revision = payload.revision;

  if (!isRecord(revision) || !isRecord(revision.improvedSpeech)) {
    return null;
  }

  const improvedSpeech = revision.improvedSpeech;

  if (
    !isText(improvedSpeech.title, 200) ||
    !Array.isArray(improvedSpeech.paragraphs) ||
    improvedSpeech.paragraphs.length === 0 ||
    improvedSpeech.paragraphs.length > 12
  ) {
    return null;
  }

  const paragraphs: string[] = [];

  for (const paragraph of improvedSpeech.paragraphs) {
    if (!isText(paragraph, 20_000)) {
      return null;
    }

    paragraphs.push(paragraph);
  }

  const changes = parseList(revision.changes, 6, parseRevisionChange);

  if (!changes) {
    return null;
  }

  return {
    sampleMode: false,
    improvedSpeech: {
      title: improvedSpeech.title,
      paragraphs,
    },
    changes,
  };
}

function defaultMessage(status: number): string {
  if (status === 404 || status === 405) {
    return 'The AI endpoint isn’t reachable from this build. Live AI needs the server API, so a static preview of the site can’t provide it.';
  }

  if (status >= 500) {
    return 'The server could not complete the request. No result was returned. Try again in a moment.';
  }

  return 'The request was rejected before a result was returned. Check the draft and try again.';
}

function failureFromResponse(status: number, payload: unknown): ApiFailure {
  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
  const code =
    error && typeof error.code === 'string' ? error.code : 'HTTP_ERROR';
  const message =
    error && isText(error.message, 1_000)
      ? error.message
      : defaultMessage(status);

  if (code === 'INVALID_INPUT' || code === 'INVALID_JSON') {
    return {
      code,
      message,
      retryable: false,
      fallbackAllowed: false,
    };
  }

  return {
    code,
    message,
    retryable:
      RETRYABLE_CODES.has(code) ||
      code === 'HTTP_ERROR' ||
      status === 404 ||
      status === 405,
    fallbackAllowed:
      FALLBACK_ALLOWED_CODES.has(code) ||
      code === 'HTTP_ERROR' ||
      status === 404 ||
      status === 405 ||
      status >= 500,
  };
}

const CLIENT_TIMEOUT_FAILURE: ApiFailure = {
  code: 'CLIENT_TIMEOUT',
  message:
    'The server didn’t respond within 60 seconds, so no result was returned. The AI may be slow right now — try again.',
  retryable: true,
  fallbackAllowed: true,
};

const NETWORK_FAILURE: ApiFailure = {
  code: 'NETWORK_ERROR',
  message:
    'The browser couldn’t reach the analysis server. Check your connection, then try again.',
  retryable: true,
  fallbackAllowed: true,
};

const INVALID_RESPONSE_FAILURE: ApiFailure = {
  code: 'INVALID_RESPONSE',
  message:
    'The server returned a result this page couldn’t read, so nothing was displayed. Try again.',
  retryable: true,
  fallbackAllowed: true,
};

function requestBody(draft: SpeechDraft) {
  return {
    title: draft.title,
    speech: draft.speech,
    audience: draft.audience,
    goal: draft.goal,
  };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function post<T>(
  path: string,
  draft: SpeechDraft,
  parse: (payload: unknown) => T | null,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody(draft)),
      signal: controller.signal,
    });

    const payload = await readJson(response);

    if (!response.ok) {
      return {
        ok: false,
        failure: failureFromResponse(response.status, payload),
      };
    }

    const value = parse(payload);

    if (!value) {
      return { ok: false, failure: INVALID_RESPONSE_FAILURE };
    }

    return { ok: true, value };
  } catch {
    if (controller.signal.aborted) {
      return { ok: false, failure: CLIENT_TIMEOUT_FAILURE };
    }

    return { ok: false, failure: NETWORK_FAILURE };
  } finally {
    window.clearTimeout(timer);
  }
}

export function requestAnalysis(
  draft: SpeechDraft,
): Promise<ApiResult<SpeechAnalysisResult>> {
  return post('/api/analyze', draft, parseAnalysisResponse);
}

export function requestRevision(
  draft: SpeechDraft,
): Promise<ApiResult<SpeechRevisionResult>> {
  return post('/api/revise', draft, parseRevisionResponse);
}
