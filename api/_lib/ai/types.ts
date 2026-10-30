import type { SpeechAudience, SpeechGoal } from '../domain';

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

export interface SpeechContext {
  speech: string;
  title: string;
  audience: SpeechAudience;
  goal: SpeechGoal;
  wordCount: number;
}

export type AnalysisInput = SpeechContext;
export type RevisionInput = SpeechContext;

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

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
}

export interface AIProvider {
  readonly id: string;
  analyzeSpeech(input: AnalysisInput): Promise<SpeechAnalysisResult>;
  reviseSpeech(input: RevisionInput): Promise<SpeechRevisionResult>;
}
