export const MIN_SPEECH_WORDS = 50;
export const MAX_SPEECH_WORDS = 5_000;
export const MAX_SPEECH_CHARS = 20_000;
export const MAX_TITLE_CHARS = 160;

// Keep these values aligned with the frontend contract in src/lib/speechDraft.ts.
export const AUDIENCES = [
  'general',
  'students',
  'professionals',
  'judges',
] as const;

export const GOALS = ['inform', 'persuade', 'inspire', 'entertain'] as const;

export type SpeechAudience = (typeof AUDIENCES)[number];
export type SpeechGoal = (typeof GOALS)[number];

export function isSpeechAudience(value: unknown): value is SpeechAudience {
  return (
    typeof value === 'string' &&
    (AUDIENCES as readonly string[]).includes(value)
  );
}

export function isSpeechGoal(value: unknown): value is SpeechGoal {
  return (
    typeof value === 'string' && (GOALS as readonly string[]).includes(value)
  );
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
