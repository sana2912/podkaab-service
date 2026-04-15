-- CreateEnum
CREATE TYPE "Emotion" AS ENUM ('HAPPY', 'SAD', 'EXCITED', 'SHOCKED', 'CURIOUS', 'INSPIRED');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('COLLECTION', 'SHORT_CONTENT', 'FULL_CONTENT');

-- CreateEnum
CREATE TYPE "FeedEventType" AS ENUM ('IMPRESSION', 'VIEW_START', 'WATCH_PROGRESS', 'VIEW_COMPLETE', 'CONTINUE_CLICK', 'FULL_START', 'FULL_COMPLETE', 'SKIP', 'REACTION');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "CollectionFullMode" AS ENUM ('SINGLE', 'SERIES');

-- CreateEnum
CREATE TYPE "ContentRole" AS ENUM ('SHORT', 'FULL');

-- CreateEnum
CREATE TYPE "PlaybackKind" AS ENUM ('VIDEO', 'AUDIO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverUrl" TEXT,
    "fullMode" "CollectionFullMode" NOT NULL,
    "primaryEmotion" "Emotion",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "mediaId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "role" "ContentRole" NOT NULL,
    "playbackKind" "PlaybackKind" NOT NULL DEFAULT 'VIDEO',
    "order" INTEGER NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "durationSeconds" INTEGER,
    "primaryEmotion" "Emotion",
    "continueConversionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_warps" (
    "id" TEXT NOT NULL,
    "shortContentId" TEXT NOT NULL,
    "targetContentId" TEXT NOT NULL,
    "targetStartSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_warps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "progressSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" "TargetType" NOT NULL,
    "emotion" "Emotion" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "targetContentId" TEXT,
    "eventType" "FeedEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feed_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "processedUrl" TEXT,
    "thumbnailUrl" TEXT,
    "waveformUrl" TEXT,
    "status" "MediaStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_warps" ADD CONSTRAINT "content_warps_shortContentId_fkey" FOREIGN KEY ("shortContentId") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_warps" ADD CONSTRAINT "content_warps_targetContentId_fkey" FOREIGN KEY ("targetContentId") REFERENCES "contents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
