// Shared Dragonfly/Redis connection management used by API and worker.
import Redis from "ioredis";

let _connection: Redis | null = null;

/**
 * Returns a singleton IORedis connection.
 * DragonflyDB is Redis-compatible — same client, same URL format.
 *
 * Set DRAGONFLY_URL (preferred) or REDIS_URL in your environment.
 * Default: redis://localhost:6379
 */
export function getRedisConnection(): Redis {
  if (_connection) return _connection;

  const url = process.env["DRAGONFLY_URL"] ?? process.env["REDIS_URL"] ?? "redis://localhost:6379";

  _connection = new Redis(url, {
    // Required by BullMQ — disables the default "null on empty queue" behaviour
    maxRetriesPerRequest: null,
    // DragonflyDB doesn't send the Redis READY event the same way
    enableReadyCheck: false,
    // Reconnect automatically on disconnect
    retryStrategy: (times) => Math.min(times * 200, 5_000),
  });

  _connection.on("error", (err: Error) => {
    console.error("[redis] Connection error:", err.message);
  });

  _connection.on("connect", () => {
    console.info("[redis] Connected to DragonflyDB / Redis");
  });

  return _connection;
}

// Closes the shared Redis connection during process shutdown.
export async function closeRedisConnection(): Promise<void> {
  if (!_connection) return;
  await _connection.quit();
  _connection = null;
}
