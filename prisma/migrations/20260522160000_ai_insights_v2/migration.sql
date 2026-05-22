-- CreateEnum
CREATE TYPE "AiProviderPreference" AS ENUM ('auto', 'anthropic', 'openai');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "aiProviderPreference" "AiProviderPreference" NOT NULL DEFAULT 'auto';
ALTER TABLE "Workspace" ADD COLUMN "analysisExcludedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "context" "AccountContext" NOT NULL DEFAULT 'razem',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "contentMarkdown" TEXT NOT NULL,
    "summaryJson" JSONB,
    "excludedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transfersFiltered" INTEGER NOT NULL DEFAULT 0,
    "excludedTxCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiInsight_workspaceId_createdAt_idx" ON "AiInsight"("workspaceId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "AiInsight" ADD CONSTRAINT "AiInsight_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill history from last insight
INSERT INTO "AiInsight" (
    "id",
    "workspaceId",
    "context",
    "provider",
    "model",
    "contentMarkdown",
    "createdAt"
)
SELECT
    ('c' || substr(md5(random()::text || clock_timestamp()::text), 1, 24)),
    "id",
    'razem',
    'legacy',
    'unknown',
    "lastAiInsight",
    COALESCE("lastAiInsightAt", NOW())
FROM "Workspace"
WHERE "lastAiInsight" IS NOT NULL AND length(trim("lastAiInsight")) > 0;
