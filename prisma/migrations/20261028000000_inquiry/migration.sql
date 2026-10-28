BEGIN;
INSERT INTO "CommonCodeGroup" ("key", "nameKo", "nameEn", "updatedAt") VALUES
  ('INQUIRY_TYPE', '문의 유형', 'Inquiry type', now()),
  ('INQUIRY_STATUS', '문의 상태', 'Inquiry status', now());
INSERT INTO "CommonCode" ("groupKey", "code", "nameKo", "nameEn", "position", "updatedAt") VALUES
  ('INQUIRY_TYPE', '0', '버그 제보', 'Bug report', 0, now()),
  ('INQUIRY_TYPE', '1', '문의하기', 'Inquiry', 1, now()),
  ('INQUIRY_STATUS', '0', '대기', 'Pending', 0, now()),
  ('INQUIRY_STATUS', '1', '접수', 'Received', 1, now()),
  ('INQUIRY_STATUS', '2', '수정중', 'In progress', 2, now());
CREATE TABLE "Inquiry" (
  "id" UUID PRIMARY KEY,
  "typeGroup" VARCHAR(60) NOT NULL DEFAULT 'INQUIRY_TYPE' CHECK ("typeGroup" = 'INQUIRY_TYPE'),
  "typeCode" VARCHAR(60) NOT NULL,
  "statusGroup" VARCHAR(60) NOT NULL DEFAULT 'INQUIRY_STATUS' CHECK ("statusGroup" = 'INQUIRY_STATUS'),
  "statusCode" VARCHAR(60) NOT NULL DEFAULT '0',
  "body" VARCHAR(4000) NOT NULL CHECK (length(btrim("body")) > 0),
  "createdById" UUID REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "updatedById" UUID REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  FOREIGN KEY ("typeGroup", "typeCode") REFERENCES "CommonCode"("groupKey", "code") ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY ("statusGroup", "statusCode") REFERENCES "CommonCode"("groupKey", "code") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Inquiry_statusGroup_statusCode_createdAt_idx" ON "Inquiry" ("statusGroup", "statusCode", "createdAt");
CREATE INDEX "Inquiry_typeGroup_typeCode_idx" ON "Inquiry" ("typeGroup", "typeCode");
COMMIT;
