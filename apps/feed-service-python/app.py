"""Python gRPC feed service.

The API remains owner of PostgreSQL access. This service only receives candidate
lists and returns ranked/diversified results.
"""

from __future__ import annotations

import os
import sys
from concurrent import futures
from importlib import import_module
from pathlib import Path
from time import time

import grpc

from feed_engine import Candidate, select_feed

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent.parent
PROTO_PATH = REPO_ROOT / "proto" / "feed.proto"
GENERATED_DIR = BASE_DIR / "generated"


def ensure_generated_stubs() -> None:
    """Generate protobuf stubs at startup if they are missing."""

    GENERATED_DIR.mkdir(exist_ok=True)
    if str(GENERATED_DIR) not in sys.path:
        sys.path.insert(0, str(GENERATED_DIR))

    try:
        import_module("feed_pb2")
        import_module("feed_pb2_grpc")

        return
    except ImportError as exc:
        from grpc_tools import protoc

        result = protoc.main(
            [
                "grpc_tools.protoc",
                f"-I{PROTO_PATH.parent}",
                f"--python_out={GENERATED_DIR}",
                f"--grpc_python_out={GENERATED_DIR}",
                str(PROTO_PATH),
            ]
        )
        if result != 0:
            raise RuntimeError("Failed to generate gRPC stubs for feed.proto") from exc


ensure_generated_stubs()

feed_pb2 = import_module("feed_pb2")
feed_pb2_grpc = import_module("feed_pb2_grpc")


class FeedEngineService(feed_pb2_grpc.FeedEngineServicer):
    """gRPC implementation for feed ranking and diversity."""

    def RankFeed(self, request, _context):  # type: ignore[override]
        candidates = [
            Candidate(
                content_id=item.content_id,
                item_type=item.item_type,
                collection_id=item.collection_id,
                primary_emotion=item.primary_emotion,
                continue_conversion_score=item.continue_conversion_score,
                completion_score=item.completion_score,
                recency_score=item.recency_score,
                created_at_unix_ms=item.created_at_unix_ms,
                is_from_watching_collection=item.is_from_watching_collection,
                target_content_id=item.target_content_id,
            )
            for item in request.candidates
        ]

        selected = select_feed(
            candidates=candidates,
            emotion_preferences=dict(request.emotion_preferences),
            limit=request.limit,
            now_unix_ms=int(time() * 1000),
        )

        return feed_pb2.FeedResponse(
            items=[
                feed_pb2.RankedItem(
                    content_id=item.content_id,
                    score=item.score,
                    reasons=item.reasons,
                )
                for item in selected
            ]
        )


def serve() -> None:
    host = os.getenv("FEED_SERVICE_HOST", "0.0.0.0")
    port = os.getenv("FEED_SERVICE_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
    feed_pb2_grpc.add_FeedEngineServicer_to_server(FeedEngineService(), server)
    server.add_insecure_port(f"{host}:{port}")
    server.start()
    print(f"[feed-service] gRPC server listening on {host}:{port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
