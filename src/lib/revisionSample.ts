export const SAMPLE_REVISION_LABEL = 'Sample revision — demonstration data';

export const SAMPLE_REVISION_NOTE =
  'The improved example and the three change notes are fixed demonstration content. They are not a live AI rewrite and do not respond to the wording of your draft.';

export const IMPROVED_EXAMPLE_NOTE =
  'A fixed sample speech, shown beside your draft for illustration only. It is not a rewrite of your words.';

export interface RevisionChange {
  id: string;
  originalExample: string;
  improvedExample: string;
  explanation: string;
}

export interface ImprovedSpeechExample {
  title: string;
  paragraphs: readonly string[];
}

export interface SampleRevision {
  improvedSpeech: ImprovedSpeechExample;
  changes: readonly RevisionChange[];
}

export const sampleRevision: SampleRevision = {
  improvedSpeech: {
    title: 'The room remembers the pause',
    paragraphs: [
      'Every room has a moment when the argument is won, and it is rarely the loudest one. It is the pause after a difficult question. The breath before a trusted answer. The second where a speaker stops performing and starts paying attention.',
      'We rehearse our sentences, but we forget to rehearse our silence. A pause lets an idea land. It gives the audience time to feel the weight of what was just said, and it gives the speaker time to notice the room.',
      'So in your next important conversation, do not rush to fill the quiet. Let one question stay unanswered for a breath longer. The pause is not empty space in the speech; it is where the speech becomes a conversation.',
    ],
  },
  changes: [
    {
      id: 'change-opening',
      originalExample:
        'Today I would like to talk to you about an important topic.',
      improvedExample:
        'Every room has a moment when the argument is won, and it is rarely the loudest one.',
      explanation:
        'A specific claim creates curiosity before the first fact arrives. The generic introduction asks the audience to wait for a reason to listen.',
    },
    {
      id: 'change-middle',
      originalExample:
        'There are many different reasons why pauses matter, and it is important to consider all of them.',
      improvedExample:
        'A pause lets an idea land. It gives the audience time to feel the weight of what was just said, and it gives the speaker time to notice the room.',
      explanation:
        'Concrete effects are easier to follow than a promise to cover several reasons. The shorter version also gives the speaker somewhere natural to breathe.',
    },
    {
      id: 'change-close',
      originalExample:
        'In conclusion, that is why I think we should all try to use more pauses in our speeches.',
      improvedExample:
        'The pause is not empty space in the speech; it is where the speech becomes a conversation.',
      explanation:
        'The revised close replaces a polite summary with a single reframe the audience can carry out of the room.',
    },
  ],
};
