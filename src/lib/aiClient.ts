import {
  requestAnalysis,
  requestRevision,
  type ApiResult,
  type SpeechAnalysisResult,
  type SpeechRevisionResult,
} from './aiApi';
import type { SpeechDraft } from './speechDraft';

interface LoadOptions {
  force?: boolean;
}

const MAX_CACHE_ENTRIES = 8;

const analysisCache = new Map<
  string,
  Promise<ApiResult<SpeechAnalysisResult>>
>();
const revisionCache = new Map<
  string,
  Promise<ApiResult<SpeechRevisionResult>>
>();

function draftSignature(kind: string, draft: SpeechDraft): string {
  return [
    kind,
    draft.title,
    draft.audience,
    draft.goal,
    draft.speech,
  ].join('\u0000');
}

function load<T>(
  cache: Map<string, Promise<ApiResult<T>>>,
  key: string,
  request: () => Promise<ApiResult<T>>,
  force: boolean,
): Promise<ApiResult<T>> {
  if (force) {
    cache.delete(key);
  }

  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const promise = request();
  cache.set(key, promise);

  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next();

    if (!oldest.done) {
      cache.delete(oldest.value);
    }
  }

  return promise;
}

export function loadAnalysis(
  draft: SpeechDraft,
  options: LoadOptions = {},
): Promise<ApiResult<SpeechAnalysisResult>> {
  return load(
    analysisCache,
    draftSignature('analysis', draft),
    () => requestAnalysis(draft),
    options.force ?? false,
  );
}

export function loadRevision(
  draft: SpeechDraft,
  options: LoadOptions = {},
): Promise<ApiResult<SpeechRevisionResult>> {
  return load(
    revisionCache,
    draftSignature('revision', draft),
    () => requestRevision(draft),
    options.force ?? false,
  );
}
