BEGIN;
ALTER TABLE "Project"
  ADD COLUMN "title" VARCHAR(200),
  ADD COLUMN "summary" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "body" JSONB,
  ADD COLUMN "bodySchemaVersion" INTEGER NOT NULL DEFAULT 1;

-- Prefer the original Korean content; preserve an English-only project as written.
UPDATE "Project" p
SET "title" = t."title", "summary" = t."summary", "body" = t."body", "bodySchemaVersion" = t."bodySchemaVersion"
FROM (
  SELECT DISTINCT ON ("projectId") "projectId", "title", "summary", "body", "bodySchemaVersion"
  FROM "ProjectTranslation"
  ORDER BY "projectId", CASE WHEN "locale" = 'ko' THEN 0 ELSE 1 END
) t
WHERE p."id" = t."projectId";

-- Missing content aborts the migration instead of silently inventing a title.
ALTER TABLE "Project"
  ALTER COLUMN "title" SET NOT NULL,
  ALTER COLUMN "body" SET NOT NULL,
  ADD CONSTRAINT "Project_title_check" CHECK (length(btrim("title")) > 0),
  ADD CONSTRAINT "Project_body_check" CHECK (jsonb_typeof("body") = 'object' AND "body" ? 'type' AND "body"->>'type' = 'doc' AND "body" ? 'content' AND jsonb_typeof("body"->'content') = 'array'),
  ADD CONSTRAINT "Project_body_schema_version_check" CHECK ("bodySchemaVersion" > 0);
DROP TABLE "ProjectTranslation";
COMMIT;
