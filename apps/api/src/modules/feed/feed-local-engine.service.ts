// Local in-process feed engine used by default and as a remote fallback.
import { applyDiversity } from "./feed-diversity.service";
import { rankCandidates } from "./feed-ranking.service";
import type {
  FeedDecisionEngine,
  FeedDecisionEngineInput,
  FeedSelection,
} from "./feed-engine.types";

// Mirrors the current TypeScript feed ranking pipeline.
export function createLocalFeedEngine(): FeedDecisionEngine {
  return {
    async select({
      candidates,
      emotionPreferences,
      limit,
    }: FeedDecisionEngineInput): Promise<FeedSelection[]> {
      const ranked = rankCandidates(candidates, emotionPreferences);
      const diverse = applyDiversity(ranked, limit);

      return diverse.map((item) => ({
        contentId: item.id,
        score: item.finalScore,
        reasons: [
          item.scores.watchingBoost > 0 ? "watching_collection" : "",
          item.itemType === "SHORT" ? "short_format" : "long_format",
          item.primaryEmotion ? `emotion:${item.primaryEmotion}` : "",
        ].filter(Boolean),
      }));
    },
  };
}
