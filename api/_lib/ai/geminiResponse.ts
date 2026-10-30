import {
  countWords,
  MAX_SPEECH_CHARS,
  MAX_TITLE_CHARS,
  MIN_SPEECH_WORDS,
} from '../domain';
import { AIProviderError } from './errors';
import type {
  AnalysisDimensionId,
  AnalysisDimensionResult,
  AnalysisScore,
  AnalysisStatus,
  DeliveryTipResult,
  PriorityImprovementResult,
  RevisionChangeResult,
  SentenceFeedbackResult,
  SpeechAnalysisResult,
  SpeechContext,
  SpeechRevisionResult,
  StrengthResult,
} from './types';

export const DIMENSION_IDS = [
  'opening-hook',
  'clarity',
  'structure',
  'audience-engagement',
  'conclusion',
] as const satisfies readonly AnalysisDimensionId[];

const DIMENSION_NAMES: Record<AnalysisDimensionId, string> = {
  'opening-hook': 'Opening hook',
  clarity: 'Clarity',
  structure: 'Structure',
  'audience-engagement': 'Audience engagement',
  conclusion: 'Conclusion',
};

const MAX_EXPLANATION_CHARS = 800;
const MAX_SUMMARY_CHARS = 600;
const MAX_QUOTE_CHARS = 600;
const MAX_TIP_CHARS = 500;
const MAX_PARAGRAPH_CHARS = 5_000;
const MIN_QUOTE_WORDS = 3;

function malformed(detail: string): AIProviderError {
  return new AIProviderError('malformed_response', detail);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDimensionId(value: unknown): value is AnalysisDimensionId {
  return (
    typeof value === 'string' &&
    (DIMENSION_IDS as readonly string[]).includes(value)
  );
}

function readArray(
  value: unknown,
  label: string,
  min: number,
  max: number,
): unknown[] {
  if (!Array.isArray(value)) {
    throw malformed(`${label} must be an array.`);
  }

  if (value.length < min || value.length > max) {
    throw malformed(`${label} must contain between ${min} and ${max} items.`);
  }

  return value;
}

function readText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw malformed(`${label} must be a string.`);
  }

  const text = value.trim();

  if (!text) {
    throw malformed(`${label} must not be empty.`);
  }

  if (text.length > maxLength) {
    throw malformed(`${label} must be ${maxLength} characters or fewer.`);
  }

  return text;
}

function readDimensionId(value: unknown, label: string): AnalysisDimensionId {
  if (!isDimensionId(value)) {
    throw malformed(`${label} must be one of the five analysis dimensions.`);
  }

  return value;
}

function readScore(value: unknown): AnalysisScore {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 10
  ) {
    throw malformed('Dimension score must be an integer from 0 to 10.');
  }

  return value as AnalysisScore;
}

function statusForScore(score: AnalysisScore): AnalysisStatus {
  if (score >= 8) {
    return 'Strong';
  }

  if (score >= 6) {
    return 'Developing';
  }

  return 'Focus';
}

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Feedback may only quote the draft, so a model paraphrase is dropped rather
// than presented to the speaker as their own words.
function isQuotedFrom(quote: string, source: string): boolean {
  if (countWords(quote) < MIN_QUOTE_WORDS) {
    return false;
  }

  return ` ${normalizeForMatch(source)} `.includes(
    ` ${normalizeForMatch(quote)} `,
  );
}

function readDimensions(value: unknown): AnalysisDimensionResult[] {
  const items = readArray(value, 'dimensions', DIMENSION_IDS.length, DIMENSION_IDS.length);
  const seen = new Set<AnalysisDimensionId>();

  return items.map((item, index) => {
    if (!isRecord(item)) {
      throw malformed(`dimensions[${index}] must be an object.`);
    }

    const id = readDimensionId(item.id, `dimensions[${index}].id`);

    if (seen.has(id)) {
      throw malformed(`dimensions[${index}].id repeats ${id}.`);
    }

    seen.add(id);

    const score = readScore(item.score);

    return {
      id,
      name: DIMENSION_NAMES[id],
      score,
      status: statusForScore(score),
      explanation: readText(
        item.explanation,
        `dimensions[${index}].explanation`,
        MAX_EXPLANATION_CHARS,
      ),
    };
  });
}

function readPriority(value: unknown): PriorityImprovementResult {
  if (!isRecord(value)) {
    throw malformed('priorityImprovement must be an object.');
  }

  return {
    dimensionId: readDimensionId(
      value.dimensionId,
      'priorityImprovement.dimensionId',
    ),
    headline: readText(
      value.headline,
      'priorityImprovement.headline',
      MAX_TITLE_CHARS,
    ),
    whyItMatters: readText(
      value.whyItMatters,
      'priorityImprovement.whyItMatters',
      MAX_SUMMARY_CHARS,
    ),
    nextAction: readText(
      value.nextAction,
      'priorityImprovement.nextAction',
      MAX_SUMMARY_CHARS,
    ),
  };
}

function readStrengths(value: unknown): StrengthResult[] {
  const items = readArray(value, 'strengths', 1, 5);

  return items.map((item, index) => {
    if (!isRecord(item)) {
      throw malformed(`strengths[${index}] must be an object.`);
    }

    return {
      id: `strength-${index + 1}`,
      dimensionId: readDimensionId(
        item.dimensionId,
        `strengths[${index}].dimensionId`,
      ),
      title: readText(item.title, `strengths[${index}].title`, MAX_TITLE_CHARS),
      explanation: readText(
        item.explanation,
        `strengths[${index}].explanation`,
        MAX_SUMMARY_CHARS,
      ),
    };
  });
}

function readSentenceFeedback(
  value: unknown,
  speech: string,
): SentenceFeedbackResult[] {
  const items = readArray(value, 'sentenceFeedback', 1, 8);
  const feedback: SentenceFeedbackResult[] = [];

  items.forEach((item, index) => {
    if (!isRecord(item)) {
      throw malformed(`sentenceFeedback[${index}] must be an object.`);
    }

    const exampleSentence = readText(
      item.exampleSentence,
      `sentenceFeedback[${index}].exampleSentence`,
      MAX_QUOTE_CHARS,
    );

    if (!isQuotedFrom(exampleSentence, speech)) {
      return;
    }

    feedback.push({
      id: `sentence-${feedback.length + 1}`,
      dimensionId: readDimensionId(
        item.dimensionId,
        `sentenceFeedback[${index}].dimensionId`,
      ),
      exampleSentence,
      issue: readText(
        item.issue,
        `sentenceFeedback[${index}].issue`,
        MAX_SUMMARY_CHARS,
      ),
      suggestedRevision: readText(
        item.suggestedRevision,
        `sentenceFeedback[${index}].suggestedRevision`,
        MAX_SUMMARY_CHARS,
      ),
    });
  });

  if (feedback.length === 0) {
    throw malformed('sentenceFeedback did not quote the speech.');
  }

  return feedback;
}

function readDeliveryTips(value: unknown): DeliveryTipResult[] {
  const items = readArray(value, 'deliveryTips', 1, 5);

  return items.map((item, index) => {
    if (!isRecord(item)) {
      throw malformed(`deliveryTips[${index}] must be an object.`);
    }

    return {
      id: `tip-${index + 1}`,
      title: readText(item.title, `deliveryTips[${index}].title`, MAX_TITLE_CHARS),
      description: readText(
        item.description,
        `deliveryTips[${index}].description`,
        MAX_TIP_CHARS,
      ),
    };
  });
}

export function parseAnalysisResult(
  payload: unknown,
  input: SpeechContext,
): SpeechAnalysisResult {
  if (!isRecord(payload)) {
    throw malformed('Analysis response must be an object.');
  }

  return {
    sampleMode: false,
    dimensions: readDimensions(payload.dimensions),
    priorityImprovement: readPriority(payload.priorityImprovement),
    strengths: readStrengths(payload.strengths),
    sentenceFeedback: readSentenceFeedback(payload.sentenceFeedback, input.speech),
    deliveryTips: readDeliveryTips(payload.deliveryTips),
  };
}

function readOptionalTitle(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const title = value.trim();

  if (!title || title.length > MAX_TITLE_CHARS) {
    return fallback;
  }

  return title;
}

function readChanges(
  value: unknown,
  speech: string,
): RevisionChangeResult[] {
  const items = readArray(value, 'changes', 1, 6);
  const changes: RevisionChangeResult[] = [];

  items.forEach((item, index) => {
    if (!isRecord(item)) {
      throw malformed(`changes[${index}] must be an object.`);
    }

    const originalExample = readText(
      item.originalExample,
      `changes[${index}].originalExample`,
      MAX_QUOTE_CHARS,
    );

    if (!isQuotedFrom(originalExample, speech)) {
      return;
    }

    changes.push({
      id: `change-${changes.length + 1}`,
      originalExample,
      improvedExample: readText(
        item.improvedExample,
        `changes[${index}].improvedExample`,
        MAX_QUOTE_CHARS,
      ),
      explanation: readText(
        item.explanation,
        `changes[${index}].explanation`,
        MAX_SUMMARY_CHARS,
      ),
    });
  });

  if (changes.length === 0) {
    throw malformed('changes did not quote the speech.');
  }

  return changes;
}

export function parseRevisionResult(
  payload: unknown,
  input: SpeechContext,
): SpeechRevisionResult {
  if (!isRecord(payload)) {
    throw malformed('Revision response must be an object.');
  }

  if (!isRecord(payload.improvedSpeech)) {
    throw malformed('improvedSpeech must be an object.');
  }

  const paragraphs = readArray(
    payload.improvedSpeech.paragraphs,
    'improvedSpeech.paragraphs',
    1,
    12,
  ).map((paragraph, index) =>
    readText(
      paragraph,
      `improvedSpeech.paragraphs[${index}]`,
      MAX_PARAGRAPH_CHARS,
    ),
  );

  const content = paragraphs.join('\n\n');

  if (content.length > MAX_SPEECH_CHARS) {
    throw malformed(
      `improvedSpeech must be ${MAX_SPEECH_CHARS} characters or fewer.`,
    );
  }

  if (countWords(content) < MIN_SPEECH_WORDS) {
    throw malformed(
      `improvedSpeech must be at least ${MIN_SPEECH_WORDS} words.`,
    );
  }

  return {
    sampleMode: false,
    improvedSpeech: {
      title: readOptionalTitle(payload.improvedSpeech.title, input.title),
      paragraphs,
    },
    changes: readChanges(payload.changes, input.speech),
  };
}

export function parseGeminiJsonText(text: string): unknown {
  let candidate = text.trim();

  if (!candidate) {
    throw malformed('Gemini returned an empty response.');
  }

  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(candidate);

  if (fenced) {
    candidate = fenced[1].trim();
  }

  if (!candidate) {
    throw malformed('Gemini returned an empty JSON block.');
  }

  try {
    return JSON.parse(candidate);
  } catch {
    throw malformed('Gemini returned text that is not valid JSON.');
  }
}
