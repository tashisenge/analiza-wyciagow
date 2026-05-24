-- AlterTable
ALTER TABLE "Category" ADD COLUMN "excludeFromOptimization" BOOLEAN NOT NULL DEFAULT false;

-- Mark fixed / mandatory categories for existing workspaces
UPDATE "Category"
SET "excludeFromOptimization" = true
WHERE name IN (
  'Transfer między kontami',
  'Mieszkanie',
  'KUP (firma)',
  'ZUS (firma)',
  'Podatki (firma)',
  'Przychód'
)
OR name ILIKE '%podatk%'
OR name ILIKE '%zus%'
OR name ILIKE '%skarbow%';
