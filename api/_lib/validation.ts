import {
  countWords,
  isSpeechAudience,
  isSpeechGoal,
  MAX_SPEECH_CHARS,
  MAX_SPEECH_WORDS,
  MAX_TITLE_CHARS,
  MIN_SPEECH_WORDS,
  type SpeechAudience,
  type SpeechGoal,
} from './domain';

export interface ValidatedSpeechInput {
  speech: string;
  title: string;
  audience: SpeechAudience;
  goal: SpeechGoal;
  wordCount: number;
}

export type SpeechValidation =
  | { ok: true; value: ValidatedSpeechInput }
  | { ok: false; fields: Record<string, string> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateSpeechInput(body: unknown): SpeechValidation {
  if (!isRecord(body)) {
    return {
      ok: false,
      fields: { body: 'Request body must be a JSON object.' },
    };
  }

  const fields: Record<string, string> = {};
  let speech = '';
  let wordCount = 0;

  if (typeof body.speech !== 'string') {
    fields.speech = 'Speech text is required.';
  } else {
    speech = body.speech.trim();

    if (!speech) {
      fields.speech = 'Speech text is required.';
    } else if (speech.length > MAX_SPEECH_CHARS) {
      fields.speech = `Speech text must be ${MAX_SPEECH_CHARS.toLocaleString('en-US')} characters or fewer.`;
    } else {
      wordCount = countWords(speech);

      if (wordCount < MIN_SPEECH_WORDS) {
        fields.speech = `Speech text must be at least ${MIN_SPEECH_WORDS} words.`;
      } else if (wordCount > MAX_SPEECH_WORDS) {
        fields.speech = `Speech text must be ${MAX_SPEECH_WORDS.toLocaleString('en-US')} words or fewer.`;
      }
    }
  }

  const audience = isSpeechAudience(body.audience) ? body.audience : null;
  if (!audience) {
    fields.audience =
      'Audience must be one of: general, students, professionals, judges.';
  }

  const goal = isSpeechGoal(body.goal) ? body.goal : null;
  if (!goal) {
    fields.goal = 'Goal must be one of: inform, persuade, inspire, entertain.';
  }

  let title = 'Untitled speech';
  if (body.title !== undefined && body.title !== null) {
    if (typeof body.title !== 'string') {
      fields.title = 'Title must be a string.';
    } else {
      const trimmedTitle = body.title.trim();

      if (trimmedTitle.length > MAX_TITLE_CHARS) {
        fields.title = `Title must be ${MAX_TITLE_CHARS} characters or fewer.`;
      } else if (trimmedTitle) {
        title = trimmedTitle;
      }
    }
  }

  if (Object.keys(fields).length > 0 || !audience || !goal) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: { speech, title, audience, goal, wordCount },
  };
}
