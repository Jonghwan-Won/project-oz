BEGIN;
CREATE TABLE "ProjectTranslation" (
    "projectId" UUID NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" JSONB NOT NULL,
    "bodySchemaVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("projectId","locale")
);
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectTranslation"
  ADD CONSTRAINT "ProjectTranslation_locale_check" CHECK ("locale" IN ('ko','en')),
  ADD CONSTRAINT "ProjectTranslation_title_check" CHECK (length(btrim("title")) > 0),
  ADD CONSTRAINT "ProjectTranslation_body_check" CHECK (jsonb_typeof("body") = 'object' AND "body" ? 'type' AND "body"->>'type' = 'doc' AND "body" ? 'content' AND jsonb_typeof("body"->'content') = 'array'),
  ADD CONSTRAINT "ProjectTranslation_schema_version_check" CHECK ("bodySchemaVersion" > 0);

INSERT INTO "ProjectTranslation" ("projectId",locale,title,summary,body,"bodySchemaVersion") SELECT id,'ko',title,summary,body,"bodySchemaVersion" FROM "Project";
ALTER TABLE "Project" DROP COLUMN title, DROP COLUMN summary, DROP COLUMN body, DROP COLUMN "bodySchemaVersion";
COMMIT;
