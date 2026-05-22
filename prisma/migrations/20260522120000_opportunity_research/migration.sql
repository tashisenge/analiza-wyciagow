-- CreateTable
CREATE TABLE "OpportunityResearch" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "searchQuery" TEXT NOT NULL,
    "summaryMarkdown" TEXT NOT NULL,
    "alternatives" JSONB NOT NULL,
    "sources" JSONB NOT NULL,
    "researchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityResearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityResearch_opportunityId_key" ON "OpportunityResearch"("opportunityId");

-- CreateIndex
CREATE INDEX "OpportunityResearch_workspaceId_researchedAt_idx" ON "OpportunityResearch"("workspaceId", "researchedAt");

-- AddForeignKey
ALTER TABLE "OpportunityResearch" ADD CONSTRAINT "OpportunityResearch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityResearch" ADD CONSTRAINT "OpportunityResearch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "OptimizationOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
