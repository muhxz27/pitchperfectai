export interface PreviewScore {
  label: string;
  score: number;
}

export interface PreviewAnalysis {
  speechTitle: string;
  context: string;
  scores: PreviewScore[];
  priority: {
    title: string;
    description: string;
  };
  feedback: {
    before: string;
    highlight: string;
    after: string;
    note: string;
  };
}

export const previewAnalysis: PreviewAnalysis = {
  speechTitle: 'The case for unfinished ideas',
  context: 'Sample speech · Persuade · General audience',
  scores: [
    { label: 'Opening hook', score: 8.4 },
    { label: 'Clarity', score: 7.6 },
    { label: 'Structure', score: 6.9 },
    { label: 'Audience engagement', score: 8.1 },
    { label: 'Conclusion', score: 7.8 },
  ],
  priority: {
    title: 'Lead with the question your audience already has.',
    description:
      'The opening introduces the topic before it earns attention. Begin with the tension, then let the context follow.',
  },
  feedback: {
    before: 'We polish ideas ',
    highlight: 'until every edge is gone',
    after: '.',
    note: 'A strong candidate for the opening. Let the context follow it.',
  },
};
