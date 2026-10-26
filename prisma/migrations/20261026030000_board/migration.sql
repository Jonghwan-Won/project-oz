CREATE TABLE "Post" (
  "id" UUID PRIMARY KEY,
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "category" VARCHAR(40) NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "deletedAt" TIMESTAMPTZ(6),
  "version" INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX "Post_isVisible_createdAt_idx" ON "Post"("isVisible", "createdAt");
CREATE TABLE "PostTranslation" (
  "postId" UUID NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "locale" VARCHAR(2) NOT NULL CHECK ("locale" IN ('ko', 'en')),
  "title" VARCHAR(200) NOT NULL,
  "summary" TEXT NOT NULL DEFAULT '',
  "body" JSONB NOT NULL,
  "bodySchemaVersion" INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY ("postId", "locale")
);
CREATE TABLE "PostAsset" (
  "postId" UUID NOT NULL REFERENCES "Post"("id") ON DELETE CASCADE,
  "assetId" UUID NOT NULL REFERENCES "Asset"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("postId", "assetId")
);
CREATE INDEX "PostAsset_assetId_idx" ON "PostAsset"("assetId");
