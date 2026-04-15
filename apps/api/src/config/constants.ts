// Shared API constants for pagination, feed ranking, and auth behavior.
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const FEED_CANDIDATE_POOL_SIZE = 200;
export const FEED_PAGE_SIZE = 20;
export const FEED_MAX_CONSECUTIVE_SAME_SERIES = 2;
export const FEED_EXPLORATION_RATIO = 0.2; // 20% exploration items

export const JWT_EXPIRY = "7d";

export const SCORE_WEIGHTS = {
  continueConversion: 0.35,
  hookCompletion: 0.25,
  recency: 0.2,
  emotionMatch: 0.1,
  freshness: 0.1,
} as const;
