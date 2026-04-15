// Standalone maintenance job for refreshing content recency signals.
import { prisma } from "@podkaap/db";

/**
 * Updates the recencyScore for all contents based on age and recent activity.
 * Run on a schedule (e.g., hourly).
 */
export async function updateTrending(): Promise<void> {
  console.info("[job] update-trending started");

  const contents = await prisma.content.findMany({
    select: { id: true, createdAt: true },
  });

  const now = Date.now();

  for (const content of contents) {
    const ageMs = now - content.createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    // Simple time-decay recency score: max 1.0, decays to ~0.1 over 30 days
    const recencyScore = Math.exp(-ageDays / 20);

    await prisma.content.update({
      where: { id: content.id },
      data: { recencyScore },
    });
  }

  console.info(`[job] update-trending processed ${contents.length} contents`);
}

if (import.meta.main) {
  updateTrending()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
