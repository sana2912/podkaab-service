// Standalone maintenance job for recomputing content quality signals.
import { prisma } from "@podkaap/db";

/**
 * Recomputes content scoring signals from analytics data.
 * Should run on a schedule (e.g., every 30 minutes).
 *
 * continueConversionScore = CONTINUE_CLICK events / IMPRESSION events (per content)
 * completionScore         = VIEW_COMPLETE events / VIEW_START events (per content)
 */
export async function recomputeContentScores(): Promise<void> {
  console.info("[job] recompute-content-scores started");

  const contents = await prisma.content.findMany({ select: { id: true } });

  for (const content of contents) {
    const [impressions, continueClicks, viewStarts, viewCompletes] = await Promise.all([
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "IMPRESSION" } }),
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "CONTINUE_CLICK" } }),
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "VIEW_START" } }),
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "VIEW_COMPLETE" } }),
    ]);

    const continueConversionScore = impressions > 0 ? continueClicks / impressions : 0;
    const completionScore = viewStarts > 0 ? viewCompletes / viewStarts : 0;

    await prisma.content.update({
      where: { id: content.id },
      data: { continueConversionScore, completionScore },
    });
  }

  console.info(`[job] recompute-content-scores updated ${contents.length} contents`);
}

// Run directly: bun run apps/api/src/jobs/recompute-hook-scores.ts
if (import.meta.main) {
  recomputeContentScores()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
