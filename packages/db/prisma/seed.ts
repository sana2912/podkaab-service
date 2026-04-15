// Seed script for loading local/demo data into the canonical collection/content model.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Emotion } from "@prisma/client";

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Creates a small sample dataset for local development and manual testing.
async function main() {
  console.log("Seeding database...");

  const [alice, bob] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: { email: "alice@example.com", displayName: "Alice" },
    }),
    prisma.user.upsert({
      where: { email: "bob@example.com" },
      update: {},
      create: { email: "bob@example.com", displayName: "Bob" },
    }),
  ]);

  console.log(`Users: alice=${alice.id} bob=${bob.id}`);

  const techCollection = await prisma.collection.create({
    data: {
      title: "Tech Shorts",
      description: "Bite-sized tech explainers for curious minds.",
      coverUrl: "https://picsum.photos/seed/tech/640/360",
      fullMode: "SERIES",
      primaryEmotion: "CURIOUS",
    },
  });

  const startupCollection = await prisma.collection.create({
    data: {
      title: "Startup Stories",
      description: "Founders share their raw, unfiltered journeys.",
      coverUrl: "https://picsum.photos/seed/startup/640/360",
      fullMode: "SERIES",
      primaryEmotion: "INSPIRED",
    },
  });

  const creativeCollection = await prisma.collection.create({
    data: {
      title: "Creative Process",
      description: "Behind the scenes of how great things get made.",
      coverUrl: "https://picsum.photos/seed/creative/640/360",
      fullMode: "SERIES",
      primaryEmotion: "EXCITED",
    },
  });

  console.log(
    `Collections: tech=${techCollection.id} startup=${startupCollection.id} creative=${creativeCollection.id}`
  );

  const techFullContents = await Promise.all(
    [
      { title: "How DNS Works", order: 1, durationSeconds: 420 },
      { title: "Why React Re-renders", order: 2, durationSeconds: 540 },
      { title: "HTTP/3 Explained", order: 3, durationSeconds: 390 },
      { title: "The CAP Theorem", order: 4, durationSeconds: 480 },
    ].map((item) =>
      prisma.content.create({
        data: {
          collectionId: techCollection.id,
          title: item.title,
          role: "FULL",
          order: item.order,
          durationSeconds: item.durationSeconds,
          sourceUrl: `https://example.com/media/tech-full-${item.order}.mp4`,
          playbackKind: "VIDEO",
          primaryEmotion: "CURIOUS",
          continueConversionScore: Math.random() * 0.8 + 0.1,
          completionScore: Math.random() * 0.8 + 0.1,
          recencyScore: 1,
        },
      })
    )
  );

  const startupFullContents = await Promise.all(
    [
      { title: "Zero to $1M ARR", order: 1, durationSeconds: 720 },
      { title: "The Pivot That Saved Us", order: 2, durationSeconds: 660 },
      { title: "Hiring Your First 10", order: 3, durationSeconds: 600 },
    ].map((item) =>
      prisma.content.create({
        data: {
          collectionId: startupCollection.id,
          title: item.title,
          role: "FULL",
          order: item.order,
          durationSeconds: item.durationSeconds,
          sourceUrl: `https://example.com/media/startup-full-${item.order}.mp4`,
          playbackKind: "VIDEO",
          primaryEmotion: "INSPIRED",
          continueConversionScore: Math.random() * 0.8 + 0.1,
          completionScore: Math.random() * 0.8 + 0.1,
          recencyScore: 1,
        },
      })
    )
  );

  const creativeFullContents = await Promise.all(
    [
      { title: "Building a Brand from Scratch", order: 1, durationSeconds: 510 },
      { title: "The Design Sprint Method", order: 2, durationSeconds: 480 },
      { title: "From Sketch to Product", order: 3, durationSeconds: 450 },
      { title: "Finding Your Creative Voice", order: 4, durationSeconds: 540 },
      { title: "Collaboration Without Compromise", order: 5, durationSeconds: 570 },
    ].map((item) =>
      prisma.content.create({
        data: {
          collectionId: creativeCollection.id,
          title: item.title,
          role: "FULL",
          order: item.order,
          durationSeconds: item.durationSeconds,
          sourceUrl: `https://example.com/media/creative-full-${item.order}.mp4`,
          playbackKind: "VIDEO",
          primaryEmotion: "EXCITED",
          continueConversionScore: Math.random() * 0.8 + 0.1,
          completionScore: Math.random() * 0.8 + 0.1,
          recencyScore: 1,
        },
      })
    )
  );

  const emotions: Emotion[] = [
    Emotion.CURIOUS,
    Emotion.EXCITED,
    Emotion.INSPIRED,
    Emotion.SHOCKED,
    Emotion.HAPPY,
  ];

  const allFullContents = [...techFullContents, ...startupFullContents, ...creativeFullContents];

  const shortContents = await Promise.all(
    allFullContents.map((content, index) =>
      prisma.content.create({
        data: {
          collectionId: content.collectionId,
          title: `${content.title} — Hook`,
          role: "SHORT",
          order: index + 1,
          sourceUrl: `https://example.com/hooks/${content.id}-clip.mp4`,
          durationSeconds: 30,
          playbackKind: "VIDEO",
          primaryEmotion: emotions[index % emotions.length] ?? Emotion.EXCITED,
          continueConversionScore: Math.random() * 0.8 + 0.1,
          completionScore: Math.random() * 0.8 + 0.1,
          recencyScore: 1,
        },
      })
    )
  );

  await Promise.all(
    shortContents.map((short, index) =>
      prisma.contentWarp.create({
        data: {
          shortContentId: short.id,
          targetContentId: allFullContents[index]?.id ?? allFullContents[0]?.id ?? short.id,
          targetStartSeconds: 0,
        },
      })
    )
  );

  console.log(`Created ${allFullContents.length} full contents and ${shortContents.length} shorts`);

  const [techContent1, techContent2] = techFullContents as [
    (typeof techFullContents)[0],
    (typeof techFullContents)[0],
  ];
  const [startupContent1] = startupFullContents as [(typeof startupFullContents)[0]];

  await Promise.all([
    prisma.userProgress.create({
      data: {
        userId: alice.id,
        contentId: techContent1.id,
        progressSeconds: (techContent1.durationSeconds ?? 0) * 0.9,
        isComplete: false,
        lastWatchedAt: new Date(Date.now() - 1000 * 60 * 30),
      },
    }),
    prisma.userProgress.create({
      data: {
        userId: alice.id,
        contentId: techContent2.id,
        progressSeconds: 60,
        isComplete: false,
        lastWatchedAt: new Date(Date.now() - 1000 * 60 * 5),
      },
    }),
    prisma.userProgress.create({
      data: {
        userId: bob.id,
        contentId: startupContent1.id,
        progressSeconds: 360,
        isComplete: false,
        lastWatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    }),
  ]);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
