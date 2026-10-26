export const MIN_SPEECH_WORDS = 50;

export const AUDIENCE_OPTIONS = [
  { value: 'general', label: 'General audience' },
  { value: 'students', label: 'Students & peers' },
  { value: 'professionals', label: 'Professionals' },
  { value: 'judges', label: 'Judges & panel' },
] as const;

export const GOAL_OPTIONS = [
  { value: 'inform', label: 'Inform' },
  { value: 'persuade', label: 'Persuade' },
  { value: 'inspire', label: 'Inspire' },
  { value: 'entertain', label: 'Entertain' },
] as const;

export type SpeechAudience = (typeof AUDIENCE_OPTIONS)[number]['value'];
export type SpeechGoal = (typeof GOAL_OPTIONS)[number]['value'];

export interface SpeechDraft {
  title: string;
  speech: string;
  audience: SpeechAudience;
  goal: SpeechGoal;
}

export const SAMPLE_DRAFT = {
  title: 'The case for unfinished ideas',
  speech: [
    'Most of us are taught to polish our ideas until every edge is gone. We smooth the strange details, round off the difficult questions, and hope that what remains will feel safe. But safe is not the same as memorable.',
    'The speeches we return to are rarely the most perfect ones. They are the ones that show us a mind at work: a hesitation, a surprising image, a question left hanging in the air just long enough to matter.',
    'So before you cut the rough edges from your next draft, ask what they are protecting. Sometimes the unfinished thought is the one that lets the audience in.',
  ].join('\n\n'),
} as const;

export function createEmptyDraft(): SpeechDraft {
  return {
    title: '',
    speech: '',
    audience: 'general',
    goal: 'persuade',
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function getAudienceLabel(audience: SpeechAudience): string {
  return (
    AUDIENCE_OPTIONS.find((option) => option.value === audience)?.label ??
    audience
  );
}

export function getGoalLabel(goal: SpeechGoal): string {
  return GOAL_OPTIONS.find((option) => option.value === goal)?.label ?? goal;
}
