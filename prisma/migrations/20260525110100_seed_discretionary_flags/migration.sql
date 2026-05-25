-- Seed default discretionary categories for workspaces upgraded from older schemas.
-- Skip workspaces that already have any discretionary category selected.
UPDATE "Category" c
SET "isDiscretionary" = true
WHERE c.name = 'Rozrywka'
AND NOT EXISTS (
  SELECT 1
  FROM "Category" existing
  WHERE existing."workspaceId" = c."workspaceId"
  AND existing."isDiscretionary" = true
);
