BEGIN;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Lifecycle" AS ENUM ('IDEA', 'BUILDING', 'TESTING', 'RELEASED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TagKind" AS ENUM ('TECHNOLOGY', 'TOPIC');

-- CreateEnum
CREATE TYPE "AssetUsage" AS ENUM ('COVER', 'INLINE', 'ATTACHMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommonCodeGroup" (
    "key" VARCHAR(60) NOT NULL,
    "nameKo" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CommonCodeGroup_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "CommonCode" (
    "groupKey" VARCHAR(60) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "nameKo" VARCHAR(100) NOT NULL,
    "nameEn" VARCHAR(100) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CommonCode_pkey" PRIMARY KEY ("groupKey","code")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "originGroup" VARCHAR(60) NOT NULL DEFAULT 'PROJECT_ORIGIN',
    "originCode" VARCHAR(60) NOT NULL,
    "typeGroup" VARCHAR(60) NOT NULL DEFAULT 'PROJECT_TYPE',
    "typeCode" VARCHAR(60),
    "lifecycle" "Lifecycle",
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "placeholder" BOOLEAN NOT NULL DEFAULT false,
    "startedOn" DATE,
    "endedOn" DATE,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTranslation" (
    "projectId" UUID NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "body" JSONB NOT NULL,
    "bodySchemaVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("projectId","locale")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" UUID NOT NULL,
    "kind" "TagKind" NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTag" (
    "projectId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectTag_pkey" PRIMARY KEY ("projectId","tagId")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(127) NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAsset" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "usage" "AssetUsage" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "label" VARCHAR(255),

    CONSTRAINT "ProjectAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_visibility_position_id_idx" ON "Project"("visibility", "position", "id");

-- CreateIndex
CREATE INDEX "Project_originGroup_originCode_idx" ON "Project"("originGroup", "originCode");

-- CreateIndex
CREATE INDEX "Project_typeGroup_typeCode_idx" ON "Project"("typeGroup", "typeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_kind_slug_key" ON "Tag"("kind", "slug");

-- CreateIndex
CREATE INDEX "ProjectTag_tagId_idx" ON "ProjectTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_storageKey_key" ON "Asset"("storageKey");

-- CreateIndex
CREATE INDEX "ProjectAsset_assetId_idx" ON "ProjectAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAsset_projectId_assetId_usage_key" ON "ProjectAsset"("projectId", "assetId", "usage");

-- AddForeignKey
ALTER TABLE "CommonCode" ADD CONSTRAINT "CommonCode_groupKey_fkey" FOREIGN KEY ("groupKey") REFERENCES "CommonCodeGroup"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_originGroup_originCode_fkey" FOREIGN KEY ("originGroup", "originCode") REFERENCES "CommonCode"("groupKey", "code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_typeGroup_typeCode_fkey" FOREIGN KEY ("typeGroup", "typeCode") REFERENCES "CommonCode"("groupKey", "code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTag" ADD CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAsset" ADD CONSTRAINT "ProjectAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAsset" ADD CONSTRAINT "ProjectAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints not represented by Prisma's schema language.
ALTER TABLE "Project"
  ADD CONSTRAINT "Project_origin_group_check" CHECK ("originGroup" = 'PROJECT_ORIGIN'),
  ADD CONSTRAINT "Project_type_group_check" CHECK ("typeGroup" = 'PROJECT_TYPE'),
  ADD CONSTRAINT "Project_dates_check" CHECK ("endedOn" IS NULL OR "startedOn" IS NULL OR "endedOn" >= "startedOn"),
  ADD CONSTRAINT "Project_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "Project_position_check" CHECK ("position" >= 0),
  ADD CONSTRAINT "Project_slug_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "ProjectTranslation"
  ADD CONSTRAINT "ProjectTranslation_locale_check" CHECK ("locale" IN ('ko','en')),
  ADD CONSTRAINT "ProjectTranslation_title_check" CHECK (length(btrim("title")) > 0),
  ADD CONSTRAINT "ProjectTranslation_body_check" CHECK (jsonb_typeof("body") = 'object' AND "body" ? 'type' AND "body"->>'type' = 'doc' AND "body" ? 'content' AND jsonb_typeof("body"->'content') = 'array'),
  ADD CONSTRAINT "ProjectTranslation_schema_version_check" CHECK ("bodySchemaVersion" > 0);
ALTER TABLE "Asset"
  ADD CONSTRAINT "Asset_size_check" CHECK ("byteSize" >= 0),
  ADD CONSTRAINT "Asset_dimensions_check" CHECK (("width" IS NULL AND "height" IS NULL) OR ("width" IS NOT NULL AND "height" IS NOT NULL AND "width" > 0 AND "height" > 0)),
  ADD CONSTRAINT "Asset_storage_key_check" CHECK (length("storageKey") > 0 AND "storageKey" !~ '(^/|\\|(^|/)\.\.(/|$)|:)');
CREATE UNIQUE INDEX "ProjectAsset_one_cover" ON "ProjectAsset" ("projectId") WHERE "usage" = 'COVER';

COMMIT;
