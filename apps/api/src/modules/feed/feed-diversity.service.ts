// Diversity pass for preventing the feed from clustering around one collection or format.
import { FEED_MAX_CONSECUTIVE_SAME_SERIES, FEED_EXPLORATION_RATIO } from "../../config/constants";
import type { RankedCandidate } from "./feed-ranking.service";

/**
 * Apply diversity rules to the ranked list:
 * 1. No more than N consecutive items from the same collection.
 * 2. Keep both short and long items represented when available.
 * 3. Inject exploration items at the configured ratio.
 */
export function applyDiversity(ranked: RankedCandidate[], limit: number): RankedCandidate[] {
  const explorationCount = Math.floor(limit * FEED_EXPLORATION_RATIO);
  const primaryCount = limit - explorationCount;

  const result: RankedCandidate[] = [];
  const consecutiveCollectionCount: Record<string, number> = {};
  const deferred: RankedCandidate[] = [];
  const formatCounts = { SHORT: 0, LONG: 0 };

  for (const candidate of ranked) {
    if (result.length >= primaryCount) {
      deferred.push(candidate);
      continue;
    }

    const collectionConsec = consecutiveCollectionCount[candidate.collectionId] ?? 0;

    if (collectionConsec >= FEED_MAX_CONSECUTIVE_SAME_SERIES) {
      deferred.push(candidate);
      continue;
    }

    if (result.length >= 2) {
      const missingFormat =
        formatCounts.SHORT === 0 ? "SHORT" : formatCounts.LONG === 0 ? "LONG" : null;
      if (missingFormat && candidate.itemType !== missingFormat) {
        deferred.push(candidate);
        continue;
      }
    }

    // Reset consecutive counter when collection changes
    const lastItem = result[result.length - 1];
    if (lastItem && lastItem.collectionId !== candidate.collectionId) {
      for (const key of Object.keys(consecutiveCollectionCount)) {
        if (key !== candidate.collectionId) consecutiveCollectionCount[key] = 0;
      }
    }

    consecutiveCollectionCount[candidate.collectionId] = collectionConsec + 1;
    formatCounts[candidate.itemType] += 1;
    result.push(candidate);
  }

  // Prefer deferred items that improve format balance first.
  const missingTypes = [
    ...(formatCounts.SHORT === 0 ? (["SHORT"] as const) : []),
    ...(formatCounts.LONG === 0 ? (["LONG"] as const) : []),
  ];

  const prioritizedDeferred = [
    ...deferred.filter((item) => missingTypes.includes(item.itemType)),
    ...deferred.filter((item) => !missingTypes.includes(item.itemType)),
  ];

  const explorationItems = prioritizedDeferred.slice(0, explorationCount);
  const final = [...result, ...explorationItems].slice(0, limit);

  return final;
}
