-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('RECURRING', 'SUBSCRIPTION', 'ANOMALY', 'MERCHANT_SPIKE', 'BUDGET_OVERRUN');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IMPLEMENTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AccountContext" AS ENUM ('firma', 'dom', 'razem');

-- CreateTable
CREATE TABLE "OptimizationOpportunity" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'OPEN',
    "accountContext" "AccountContext" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMonthlySavings" DECIMAL(12,2),
    "counterparty" TEXT,
    "categoryId" TEXT,
    "evidenceTransactionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "followUpNote" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "savingsVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OptimizationOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryBudget" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "accountContext" "AccountContext" NOT NULL DEFAULT 'razem',
    "monthlyLimit" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "CategoryBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptimizationOpportunity_workspaceId_status_detectedAt_idx" ON "OptimizationOpportunity"("workspaceId", "status", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizationOpportunity_workspaceId_dedupeKey_key" ON "OptimizationOpportunity"("workspaceId", "dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryBudget_workspaceId_categoryId_accountContext_key" ON "CategoryBudget"("workspaceId", "categoryId", "accountContext");

-- AddForeignKey
ALTER TABLE "OptimizationOpportunity" ADD CONSTRAINT "OptimizationOpportunity_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationOpportunity" ADD CONSTRAINT "OptimizationOpportunity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryBudget" ADD CONSTRAINT "CategoryBudget_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
