"""Simple feed ranking engine for the Python gRPC feed service."""

from __future__ import annotations

import math
import os
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Iterable, List

SCORE_WEIGHTS = {
    "continue_conversion": 0.35,
    "completion": 0.25,
    "recency": 0.2,
    "emotion_match": 0.1,
    "freshness": 0.1,
}

FEED_MAX_CONSECUTIVE_SAME_COLLECTION = int(
    os.getenv("FEED_MAX_CONSECUTIVE_SAME_COLLECTION", "2")
)
FEED_EXPLORATION_RATIO = float(os.getenv("FEED_EXPLORATION_RATIO", "0.2"))


@dataclass
class Candidate:
    content_id: str
    item_type: str
    collection_id: str
    primary_emotion: str
    continue_conversion_score: float
    completion_score: float
    recency_score: float
    created_at_unix_ms: int
    is_from_watching_collection: bool
    target_content_id: str


@dataclass
class RankedItem:
    content_id: str
    item_type: str
    collection_id: str
    score: float
    reasons: List[str]


def _normalize(value: float, minimum: float, maximum: float) -> float:
    if maximum == minimum:
        return 0.0
    return (value - minimum) / (maximum - minimum)


def _freshness_score(created_at_unix_ms: int, now_unix_ms: int) -> float:
    age_ms = max(now_unix_ms - created_at_unix_ms, 0)
    age_days = age_ms / (1000 * 60 * 60 * 24)
    return math.exp(-age_days / 14)


def _filter_candidates(candidates: Iterable[Candidate]) -> List[Candidate]:
    """Filter malformed or duplicate candidates after the API query step."""

    seen = set()
    filtered: List[Candidate] = []
    for candidate in candidates:
        if not candidate.content_id or candidate.content_id in seen:
            continue
        if candidate.item_type == "SHORT" and not candidate.target_content_id:
            continue
        seen.add(candidate.content_id)
        filtered.append(candidate)
    return filtered


def _rank_candidates(
    candidates: List[Candidate], emotion_preferences: Dict[str, int], now_unix_ms: int
) -> List[RankedItem]:
    if not candidates:
        return []

    total_reactions = sum(emotion_preferences.values())
    conversion_values = [
        candidate.continue_conversion_score for candidate in candidates
    ]
    completion_values = [candidate.completion_score for candidate in candidates]
    min_conv, max_conv = min(conversion_values), max(conversion_values)
    min_comp, max_comp = min(completion_values), max(completion_values)

    ranked: List[RankedItem] = []
    for candidate in candidates:
        continue_conversion = _normalize(
            candidate.continue_conversion_score, min_conv, max_conv
        )
        completion = _normalize(candidate.completion_score, min_comp, max_comp)
        emotion_count = (
            emotion_preferences.get(candidate.primary_emotion, 0)
            if candidate.primary_emotion
            else 0
        )
        emotion_match = (
            (emotion_count / total_reactions) if total_reactions > 0 else 0.0
        )
        freshness = _freshness_score(candidate.created_at_unix_ms, now_unix_ms)
        watching_boost = 0.05 if candidate.is_from_watching_collection else 0.0
        format_boost = 0.03 if candidate.item_type == "SHORT" else 0.01

        score = (
            continue_conversion * SCORE_WEIGHTS["continue_conversion"]
            + completion * SCORE_WEIGHTS["completion"]
            + candidate.recency_score * SCORE_WEIGHTS["recency"]
            + emotion_match * SCORE_WEIGHTS["emotion_match"]
            + freshness * SCORE_WEIGHTS["freshness"]
            + watching_boost
            + format_boost
        )

        reasons: List[str] = []
        if candidate.primary_emotion:
            reasons.append(f"emotion:{candidate.primary_emotion}")
        if candidate.is_from_watching_collection:
            reasons.append("watching_collection")
        reasons.append(
            "short_format" if candidate.item_type == "SHORT" else "long_format"
        )

        ranked.append(
            RankedItem(
                content_id=candidate.content_id,
                item_type=candidate.item_type,
                collection_id=candidate.collection_id,
                score=score,
                reasons=reasons,
            )
        )

    return sorted(ranked, key=lambda item: item.score, reverse=True)


def _apply_diversity(ranked: List[RankedItem], limit: int) -> List[RankedItem]:
    exploration_count = int(limit * FEED_EXPLORATION_RATIO)
    primary_count = max(limit - exploration_count, 0)
    result: List[RankedItem] = []
    deferred: List[RankedItem] = []
    consecutive_collection_count: Dict[str, int] = defaultdict(int)
    format_counts = {"SHORT": 0, "LONG": 0}

    for candidate in ranked:
        if len(result) >= primary_count:
            deferred.append(candidate)
            continue

        if (
            consecutive_collection_count[candidate.collection_id]
            >= FEED_MAX_CONSECUTIVE_SAME_COLLECTION
        ):
            deferred.append(candidate)
            continue

        if len(result) >= 2:
            missing_format = (
                "SHORT"
                if format_counts["SHORT"] == 0
                else "LONG" if format_counts["LONG"] == 0 else None
            )
            if missing_format and candidate.item_type != missing_format:
                deferred.append(candidate)
                continue

        last_item = result[-1] if result else None
        if last_item and last_item.collection_id != candidate.collection_id:
            for key in list(consecutive_collection_count.keys()):
                if key != candidate.collection_id:
                    consecutive_collection_count[key] = 0

        consecutive_collection_count[candidate.collection_id] += 1
        format_counts[candidate.item_type] += 1
        result.append(candidate)

    missing_types: List[str] = []
    if format_counts["SHORT"] == 0:
        missing_types.append("SHORT")
    if format_counts["LONG"] == 0:
        missing_types.append("LONG")

    prioritized_deferred = [
        *[item for item in deferred if item.item_type in missing_types],
        *[item for item in deferred if item.item_type not in missing_types],
    ]

    return [*result, *prioritized_deferred[:exploration_count]][:limit]


def select_feed(
    candidates: List[Candidate],
    emotion_preferences: Dict[str, int],
    limit: int,
    now_unix_ms: int,
) -> List[RankedItem]:
    filtered = _filter_candidates(candidates)
    ranked = _rank_candidates(filtered, emotion_preferences, now_unix_ms)
    return _apply_diversity(ranked, limit)
