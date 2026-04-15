// Ranking logic for scoring normalized feed candidates.
import { SCORE_WEIGHTS } from "../../config/constants";
import type { FeedCandidate } from "./feed-candidate.service";

export interface RankedCandidate extends FeedCandidate {
  finalScore: number;
  scores: {
    continueConversion: number;
    completion: number;
    recency: number;
    emotionMatch: number;
    freshness: number;
    watchingBoost: number;
    formatBoost: number;
  };
}

// Normalizes a score into a 0-1 range within the current candidate batch.
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// Computes a freshness decay score from the candidate creation timestamp.
function freshnessScore(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  // Decay: 1.0 at 0 days → ~0.5 at 7 days → ~0.1 at 30 days
  return Math.exp(-ageDays / 14);
}

// Produces ranked feed candidates from normalized candidate inputs and user taste data.
export function rankCandidates(
  candidates: FeedCandidate[],
  emotionPreferences: Record<string, number>
): RankedCandidate[] {
  if (candidates.length === 0) return [];

  const totalReactions = Object.values(emotionPreferences).reduce((a, b) => a + b, 0);

  // Normalize conversion & completion scores across this batch
  const conversionValues = candidates.map((c) => c.continueConversionScore);
  const completionValues = candidates.map((c) => c.completionScore);
  const minConv = Math.min(...conversionValues);
  const maxConv = Math.max(...conversionValues);
  const minComp = Math.min(...completionValues);
  const maxComp = Math.max(...completionValues);

  return candidates
    .map((candidate) => {
      const continueConversion = normalize(candidate.continueConversionScore, minConv, maxConv);
      const completion = normalize(candidate.completionScore, minComp, maxComp);
      const recency = candidate.recencyScore;
      const emotionCount = candidate.primaryEmotion
        ? (emotionPreferences[candidate.primaryEmotion] ?? 0)
        : 0;
      const emotionMatch = totalReactions > 0 ? emotionCount / totalReactions : 0;
      const freshness = freshnessScore(candidate.createdAt);
      const watchingBoost = candidate.isFromWatchingCollection ? 0.05 : 0;
      const formatBoost = candidate.itemType === "SHORT" ? 0.03 : 0.01;

      const finalScore =
        continueConversion * SCORE_WEIGHTS.continueConversion +
        completion * SCORE_WEIGHTS.hookCompletion +
        recency * SCORE_WEIGHTS.recency +
        emotionMatch * SCORE_WEIGHTS.emotionMatch +
        freshness * SCORE_WEIGHTS.freshness +
        watchingBoost +
        formatBoost;

      return {
        ...candidate,
        finalScore,
        scores: {
          continueConversion,
          completion,
          recency,
          emotionMatch,
          freshness,
          watchingBoost,
          formatBoost,
        },
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}
