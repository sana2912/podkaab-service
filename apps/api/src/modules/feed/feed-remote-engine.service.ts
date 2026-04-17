// gRPC client for the external Python feed decision service.
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { resolve } from "node:path";
import { appConfig } from "../../config/app-config";
import type { FeedCandidate } from "./feed-candidate.service";
import type {
  FeedDecisionEngine,
  FeedDecisionEngineInput,
  FeedSelection,
} from "./feed-engine.types";

type FeedGrpcCandidate = {
  content_id: string;
  item_type: "SHORT" | "LONG";
  collection_id: string;
  primary_emotion: string;
  continue_conversion_score: number;
  completion_score: number;
  recency_score: number;
  created_at_unix_ms: number;
  is_from_watching_collection: boolean;
  target_content_id: string;
};

type FeedGrpcRequest = {
  candidates: FeedGrpcCandidate[];
  emotion_preferences: Record<string, number>;
  limit: number;
};

type FeedGrpcResponse = {
  items?: Array<{
    content_id?: string;
    score?: number;
    reasons?: string[];
  }>;
};

type FeedEngineClient = grpc.Client & {
  RankFeed(
    request: FeedGrpcRequest,
    callback: (error: grpc.ServiceError | null, response: FeedGrpcResponse) => void
  ): void;
};

type FeedEngineClientConstructor = new (
  address: string,
  credentials: grpc.ChannelCredentials
) => FeedEngineClient;

let cachedClient: FeedEngineClient | null = null;

// Converts normalized API candidates into the protobuf request shape.
function toGrpcCandidate(candidate: FeedCandidate): FeedGrpcCandidate {
  return {
    content_id: candidate.id,
    item_type: candidate.itemType,
    collection_id: candidate.collectionId,
    primary_emotion: candidate.primaryEmotion ?? "",
    continue_conversion_score: candidate.continueConversionScore,
    completion_score: candidate.completionScore,
    recency_score: candidate.recencyScore,
    created_at_unix_ms: candidate.createdAt.getTime(),
    is_from_watching_collection: candidate.isFromWatchingCollection,
    target_content_id: candidate.targetContentId ?? "",
  };
}

// Lazily constructs the shared gRPC client for the Python feed service.
function getClient(): FeedEngineClient {
  if (cachedClient) return cachedClient;

  const protoPath = resolve(import.meta.dir, "../../../../../proto/feed.proto");
  const packageDefinition = protoLoader.loadSync(protoPath, {
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const FeedEngine = getFeedEngineConstructor(grpc.loadPackageDefinition(packageDefinition));
  cachedClient = new FeedEngine(appConfig.feedService.url, grpc.credentials.createInsecure());

  return cachedClient;
}

function getFeedEngineConstructor(loaded: grpc.GrpcObject): FeedEngineClientConstructor {
  const podkaap = loaded.podkaap;
  if (!isGrpcObject(podkaap)) {
    throw new Error("Invalid feed proto: missing podkaap package");
  }

  const feed = podkaap.feed;
  if (!isGrpcObject(feed)) {
    throw new Error("Invalid feed proto: missing podkaap.feed package");
  }

  const v1 = feed.v1;
  if (!isGrpcObject(v1) || !("FeedEngine" in v1)) {
    throw new Error("Invalid feed proto: missing podkaap.feed.v1.FeedEngine service");
  }

  return v1.FeedEngine as unknown as FeedEngineClientConstructor;
}

function isGrpcObject(
  value: grpc.GrpcObject | grpc.ServiceClientConstructor | grpc.ProtobufTypeDefinition | undefined
): value is grpc.GrpcObject {
  return typeof value === "object" && value !== null;
}

// Builds a decision engine that delegates ranking and diversity to Python.
export function createRemoteFeedEngine(): FeedDecisionEngine {
  return {
    async select({
      candidates,
      emotionPreferences,
      limit,
    }: FeedDecisionEngineInput): Promise<FeedSelection[]> {
      const request: FeedGrpcRequest = {
        candidates: candidates.map(toGrpcCandidate),
        emotion_preferences: emotionPreferences,
        limit,
      };

      const deadline = Date.now() + appConfig.feedService.timeoutMs;

      return await new Promise<FeedSelection[]>((resolvePromise, rejectPromise) => {
        const client = getClient();

        client.waitForReady(deadline, (readyError) => {
          if (readyError) {
            rejectPromise(readyError);
            return;
          }

          client.RankFeed(request, (error, response) => {
            if (error) {
              rejectPromise(error);
              return;
            }

            const items =
              response.items?.flatMap((item) =>
                item.content_id
                  ? [
                      {
                        contentId: item.content_id,
                        score: item.score ?? 0,
                        reasons: item.reasons ?? [],
                      },
                    ]
                  : []
              ) ?? [];

            resolvePromise(items);
          });
        });
      });
    },
  };
}
