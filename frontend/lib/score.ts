import api from './api';

export interface ScoreBreakdownItem {
  pillar: string;
  label: string;
  earned: number;
  max: number;
  done: boolean;
  hint: string | null;
}

export interface ScoreMeta {
  totalDocuments: number;
  memberCount: number;
  expiredCount: number;
  criticalCount: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
  topHint: string | null;
  topHintPoints: number;
  meta: ScoreMeta;
}

export const scoreApi = {
  get: () => api.get<ScoreResult>('/score'),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Colour band for the score number itself */
export const scoreColour = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
};

/** Background for the score ring */
export const scoreRingColour = (score: number): string => {
  if (score >= 80) return 'stroke-green-500';
  if (score >= 50) return 'stroke-amber-500';
  return 'stroke-red-500';
};

/** One-line label describing the readiness band */
export const scoreBand = (score: number): string => {
  if (score >= 80) return 'Well prepared';
  if (score >= 60) return 'Mostly ready';
  if (score >= 40) return 'Getting started';
  return 'Needs attention';
};
