// Shared types for local and remote feed decision engines.
import type { FeedCandidate } from "./feed-candidate.service";

export interface FeedSelection {
  contentId: string;
  score: number;
  reasons?: string[];
}

export interface FeedDecisionEngineInput {
  candidates: FeedCandidate[];
  emotionPreferences: Record<string, number>;
  limit: number;
}

export interface FeedDecisionEngine {
  select(input: FeedDecisionEngineInput): Promise<FeedSelection[]>;
}
