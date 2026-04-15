// Worker-side analytics maintenance jobs executed from the analytics queue.
import { getPrisma } from "../services/prisma.service";

const FEED_EVENT_RETENTION_DAYS = 90;

export async function recomputeContentScores(): Promise<void> {
  // Recomputes content conversion/completion signals from feed event history.
  const prisma = getPrisma();
  console.info("[job] recompute-content-scores started");

  const contents = await prisma.content.findMany({ select: { id: true } });

  for (const content of contents) {
    const [impressions, continueClicks, viewStarts, viewCompletes] = await Promise.all([
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "IMPRESSION" } }),
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "CONTINUE_CLICK" } }),
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "VIEW_START" } }),
      prisma.feedEvent.count({ where: { contentId: content.id, eventType: "VIEW_COMPLETE" } }),
    ]);

    await prisma.content.update({
      where: { id: content.id },
      data: {
        continueConversionScore: impressions > 0 ? continueClicks / impressions : 0,
        completionScore: viewStarts > 0 ? viewCompletes / viewStarts : 0,
      },
    });
  }

  console.info(`[job] recompute-content-scores updated ${contents.length} contents`);
}

export async function updateTrending(): Promise<void> {
  // Refreshes content recency scores using a simple exponential decay model.
  const prisma = getPrisma();
  console.info("[job] update-trending started");

  const contents = await prisma.content.findMany({ select: { id: true, createdAt: true } });
  const now = Date.now();

  for (const content of contents) {
    const ageDays = (now - content.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    await prisma.content.update({
      where: { id: content.id },
      data: { recencyScore: Math.exp(-ageDays / 20) },
    });
  }

  console.info(`[job] update-trending processed ${contents.length} contents`);
}

export async function cleanup(): Promise<void> {
  // Deletes old feed events that fall outside the retention window.
  const prisma = getPrisma();
  console.info("[job] cleanup started");

  const cutoff = new Date(Date.now() - FEED_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await prisma.feedEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });

  console.info(`[job] cleanup deleted ${deleted.count} feed events`);
}
