-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isDiscretionary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DiscretionaryBudget" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "accountContext" "AccountContext" NOT NULL DEFAULT 'dom',
    "monthlyLimit" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "DiscretionaryBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscretionaryBudget_workspaceId_accountContext_key" ON "DiscretionaryBudget"("workspaceId", "accountContext");

-- AddForeignKey
ALTER TABLE "DiscretionaryBudget" ADD CONSTRAINT "DiscretionaryBudget_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
