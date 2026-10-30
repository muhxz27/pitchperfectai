import {
  countWords,
  getAudienceLabel,
  getGoalLabel,
  MIN_SPEECH_WORDS,
  type SpeechDraft,
} from './speechDraft';

export interface ReportScore {
  dimension: string;
  score: number;
}

export interface ReportPriority {
  dimension: string;
  headline: string;
  nextAction: string;
}

export interface EmailReport {
  speechTitle: string;
  audience: string;
  goal: string;
  wordCount: number;
  scores: ReportScore[];
  scoreSummary: string;
  priorityImprovement: ReportPriority | null;
  sampleMode: boolean;
}

export interface ReportAnalysis {
  dimensions: readonly { id: string; name: string; score: number }[];
  priority: {
    dimensionId: string;
    headline: string;
    nextAction: string;
  };
}

export type WebhookConfig =
  | { state: 'ready'; url: string }
  | { state: 'missing' | 'invalid'; message: string };

export type ReportSendResult =
  | { ok: true; status: number; statusText: string }
  | {
      ok: false;
      kind: 'http' | 'network' | 'timeout';
      message: string;
    };

const SCORE_MIN = 0;
const SCORE_MAX = 10;
const REQUEST_TIMEOUT_MS = 15_000;

export function getWebhookConfig(): WebhookConfig {
  const rawUrl = (import.meta.env.VITE_MAKE_WEBHOOK_URL ?? '').trim();

  if (!rawUrl) {
    return {
      state: 'missing',
      message:
        'Email reports aren’t configured. Add VITE_MAKE_WEBHOOK_URL to .env.local (copy .env.example), then restart the dev server.',
    };
  }

  try {
    const url = new URL(rawUrl);

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Unsupported protocol');
    }

    return { state: 'ready', url: url.toString() };
  } catch {
    return {
      state: 'invalid',
      message:
        'The configured VITE_MAKE_WEBHOOK_URL isn’t a valid http(s) URL. Check .env.local and restart the dev server.',
    };
  }
}

export function buildReport(
  draft: SpeechDraft,
  analysis: ReportAnalysis,
  sampleMode: boolean,
): EmailReport | null {
  const wordCount = countWords(draft.speech);

  if (wordCount < MIN_SPEECH_WORDS) {
    return null;
  }

  const scores = analysis.dimensions
    .filter(
      (dimension) =>
        Number.isFinite(dimension.score) &&
        dimension.score >= SCORE_MIN &&
        dimension.score <= SCORE_MAX,
    )
    .map((dimension) => ({
      dimension: dimension.name,
      score: dimension.score,
    }));

  if (scores.length === 0) {
    return null;
  }

  const priorityDimension = analysis.dimensions.find(
    (dimension) => dimension.id === analysis.priority.dimensionId,
  );

  return {
    speechTitle: draft.title.trim() || 'Untitled speech',
    audience: getAudienceLabel(draft.audience),
    goal: getGoalLabel(draft.goal),
    wordCount,
    scores,
    scoreSummary: scores
      .map(({ dimension, score }) => `${dimension}: ${score}/10`)
      .join('\n'),
    priorityImprovement: priorityDimension
      ? {
          dimension: priorityDimension.name,
          headline: analysis.priority.headline,
          nextAction: analysis.priority.nextAction,
        }
      : null,
    sampleMode,
  };
}

export async function sendSampleReport(
  endpoint: string,
  report: EmailReport,
): Promise<ReportSendResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(report),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        kind: 'http',
        message: `The webhook rejected the report (HTTP ${response.status}${
          response.statusText ? ` ${response.statusText}` : ''
        }). Check the Make.com scenario and the webhook URL, then try again.`,
      };
    }

    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
    };
  } catch {
    if (controller.signal.aborted) {
      return {
        ok: false,
        kind: 'timeout',
        message:
          'The webhook didn’t respond within 15 seconds, so sending wasn’t confirmed. Try again.',
      };
    }

    return {
      ok: false,
      kind: 'network',
      message:
        'The browser couldn’t reach the webhook. This may be a network problem or a CORS restriction, so sending wasn’t confirmed. Check the Make.com webhook or use a server-side relay, then try again.',
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
