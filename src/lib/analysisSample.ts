export const SAMPLE_ANALYSIS_LABEL = 'Sample analysis — demonstration data';

export const SAMPLE_ANALYSIS_NOTE =
  'This dashboard uses a fixed demonstration fixture. It does not analyse your draft and none of the feedback below describes your speech.';

export type AnalysisScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type AnalysisStatus = 'Strong' | 'Developing' | 'Focus';

export type AnalysisDimensionId =
  | 'opening-hook'
  | 'clarity'
  | 'structure'
  | 'audience-engagement'
  | 'conclusion';

export interface AnalysisDimension {
  id: AnalysisDimensionId;
  name: string;
  score: AnalysisScore;
  status: AnalysisStatus;
  explanation: string;
}

export interface PriorityImprovement {
  dimensionId: AnalysisDimensionId;
  headline: string;
  whyItMatters: string;
  nextAction: string;
}

export interface StrengthExample {
  id: string;
  dimensionId: AnalysisDimensionId;
  title: string;
  explanation: string;
}

export interface SentenceFeedbackItem {
  id: string;
  dimensionId: AnalysisDimensionId;
  exampleSentence: string;
  issue: string;
  suggestedRevision: string;
}

export interface DeliveryTip {
  id: string;
  title: string;
  description: string;
}

export interface SampleAnalysis {
  dimensions: readonly AnalysisDimension[];
  priority: PriorityImprovement;
  strengths: readonly StrengthExample[];
  sentenceFeedback: readonly SentenceFeedbackItem[];
  deliveryTips: readonly DeliveryTip[];
}

export const sampleAnalysis: SampleAnalysis = {
  dimensions: [
    {
      id: 'opening-hook',
      name: 'Opening hook',
      score: 7,
      status: 'Developing',
      explanation:
        'The demonstration opening establishes its topic quickly, but the first line sets up context instead of giving the audience a reason to lean in.',
    },
    {
      id: 'clarity',
      name: 'Clarity',
      score: 8,
      status: 'Strong',
      explanation:
        'Sentences carry one idea at a time and the vocabulary stays plain, so the argument is easy to follow on a first listen.',
    },
    {
      id: 'structure',
      name: 'Structure',
      score: 5,
      status: 'Focus',
      explanation:
        'The sample moves between ideas before each has landed. The middle lacks a clear sequence, which makes the payoff harder to anticipate.',
    },
    {
      id: 'audience-engagement',
      name: 'Audience engagement',
      score: 7,
      status: 'Developing',
      explanation:
        'The fixture uses one vivid image well, then spends a long stretch explaining rather than inviting the audience into the idea.',
    },
    {
      id: 'conclusion',
      name: 'Conclusion',
      score: 8,
      status: 'Strong',
      explanation:
        'The ending returns to the opening idea and finishes on a concrete, repeatable line — a clean close for a spoken piece.',
    },
  ],
  priority: {
    dimensionId: 'structure',
    headline: 'Give the middle of the speech one visible path.',
    whyItMatters:
      'Listeners cannot rewind. When points arrive out of order, the audience spends attention working out where they are instead of following the case being made.',
    nextAction:
      'Write the three main beats as one sentence each, put them in the order that builds, then cut anything that does not serve one of those beats.',
  },
  strengths: [
    {
      id: 'strength-plain-language',
      dimensionId: 'clarity',
      title: 'Plain, speakable sentences',
      explanation:
        'The sample draft avoids stacked clauses, so a listener can hold each idea without needing to hear it twice.',
    },
    {
      id: 'strength-returning-image',
      dimensionId: 'audience-engagement',
      title: 'An image that returns',
      explanation:
        'One concrete picture reappears near the close, giving the talk a thread the audience can follow.',
    },
    {
      id: 'strength-clean-close',
      dimensionId: 'conclusion',
      title: 'A close that lands',
      explanation:
        'The final line echoes the opening and stops. Nothing trails off after the point has been made.',
    },
  ],
  sentenceFeedback: [
    {
      id: 'sentence-opening',
      dimensionId: 'opening-hook',
      exampleSentence:
        'Today I want to talk about something that affects everyone in this room.',
      issue: 'The first line announces the topic but withholds the tension that would earn attention.',
      suggestedRevision:
        'Every one of us has abandoned an idea the week before it would have worked.',
    },
    {
      id: 'sentence-structure',
      dimensionId: 'structure',
      exampleSentence:
        'There are several reasons for this, but before I get to them, let me add one more piece of context.',
      issue:
        'The transition promises a list, then delays it. On the ear, the audience loses the shape of the argument.',
      suggestedRevision:
        'There are three reasons. The first matters most, so I will start there.',
    },
    {
      id: 'sentence-engagement',
      dimensionId: 'audience-engagement',
      exampleSentence:
        'It is important to note that innovation requires persistence and a tolerance for uncertainty.',
      issue:
        'The sentence tells the audience how to feel instead of showing them the experience.',
      suggestedRevision:
        'Persistence looks like opening the same file on a Tuesday night, unsure whether it will ever be worth it.',
    },
  ],
  deliveryTips: [
    {
      id: 'tip-land-the-close',
      title: 'Slow the final line',
      description:
        'Give the closing sentence its own breath. A short pause before it signals the ending and helps the last words stay with the room.',
    },
    {
      id: 'tip-mark-the-beats',
      title: 'Mark your three beats',
      description:
        'Rehearse with a visible cue for each main point — a finger, a step, a change of tone. The physical marker keeps the sequence steady under pressure.',
    },
    {
      id: 'tip-rehearse-the-opening',
      title: 'Rehearse the first twenty seconds',
      description:
        'Practice the opening more than any other section. A steady start settles nerves and buys you attention for the argument that follows.',
    },
  ],
};
