// Standalone maintenance job for pruning old analytics rows.
import { prisma } from "@podkaap/db";

const FEED_EVENT_RETENTION_DAYS = 90;

/**
 * Purges old analytics events beyond the retention window.
 * Run daily.
 */
export async function cleanup(): Promise<void> {
  console.info("[job] cleanup started");

  const cutoff = new Date(Date.now() - FEED_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const deleted = await prisma.feedEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.info(
    `[job] cleanup deleted ${deleted.count} feed events older than ${FEED_EVENT_RETENTION_DAYS} days`
  );
}

if (import.meta.main) {
  cleanup()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
