ALTER TABLE "Project" ADD COLUMN "isVisible" BOOLEAN NOT NULL DEFAULT false;
UPDATE "Project" SET "isVisible" = ("visibility" = 'PUBLIC');
DROP INDEX "Project_visibility_position_id_idx";
ALTER TABLE "Project" DROP CONSTRAINT "Project_position_check";
ALTER TABLE "Project" DROP COLUMN "position";
ALTER TABLE "Project" DROP COLUMN "visibility";
DROP TYPE "Visibility";
CREATE INDEX "Project_isVisible_idx" ON "Project"("isVisible");

INSERT INTO "CommonCodeGroup" ("key","nameKo","nameEn","updatedAt")
VALUES ('TECHNOLOGY','사용 기술','Technologies',now()) ON CONFLICT DO NOTHING;
INSERT INTO "CommonCode" ("groupKey","code","nameKo","nameEn","position","updatedAt") VALUES
  ('TECHNOLOGY','PRISMA','Prisma','Prisma',100,now()),
  ('TECHNOLOGY','MANTINE','Mantine','Mantine',101,now()),
  ('TECHNOLOGY','TIPTAP','Tiptap','Tiptap',102,now())
ON CONFLICT DO NOTHING;

INSERT INTO "Tag" (id,kind,slug,name) VALUES
  (gen_random_uuid(),'TECHNOLOGY','275976081ce1abf67779eb3c388b5e14531082e52137502e264776e1a6a11595','React'),
  (gen_random_uuid(),'TECHNOLOGY','0d857f8cf2d76abb44370f6a638a321562a47e92a35284ada91d8f25cacb986c','Next.js'),
  (gen_random_uuid(),'TECHNOLOGY','969545dde1584d88227517c6a0c969eb716015671cd6be053b3aaf14d85aa8c8','TypeScript'),
  (gen_random_uuid(),'TECHNOLOGY','a478b4566be5cb007a5d8ae532c7eeac2cd3be26ad639a65c1dd11b3bf95c51b','PostgreSQL'),
  (gen_random_uuid(),'TECHNOLOGY','99497c84358f2273772f341abe1afbd7005a475ebed857a9aecc02b7353263d8','Prisma'),
  (gen_random_uuid(),'TECHNOLOGY','279301a9e5e72ba396fa48de185aa904f2d6fddda4f192a34c4b133b9566dc9e','Mantine'),
  (gen_random_uuid(),'TECHNOLOGY','8055e5cdb06f654d0fbb7106976a4ca803a22fc5e1c5c3aa30bdbeec37068cb2','Tiptap')
ON CONFLICT (kind,slug) DO NOTHING;
INSERT INTO "ProjectTag" ("projectId","tagId",position)
SELECT p.id,t.id,desired.position
FROM "Project" p
CROSS JOIN (VALUES
  ('275976081ce1abf67779eb3c388b5e14531082e52137502e264776e1a6a11595',0),
  ('0d857f8cf2d76abb44370f6a638a321562a47e92a35284ada91d8f25cacb986c',1),
  ('969545dde1584d88227517c6a0c969eb716015671cd6be053b3aaf14d85aa8c8',2),
  ('a478b4566be5cb007a5d8ae532c7eeac2cd3be26ad639a65c1dd11b3bf95c51b',3),
  ('99497c84358f2273772f341abe1afbd7005a475ebed857a9aecc02b7353263d8',4),
  ('279301a9e5e72ba396fa48de185aa904f2d6fddda4f192a34c4b133b9566dc9e',5),
  ('8055e5cdb06f654d0fbb7106976a4ca803a22fc5e1c5c3aa30bdbeec37068cb2',6)
) AS desired(slug,position)
JOIN "Tag" t ON t.kind='TECHNOLOGY' AND t.slug=desired.slug
WHERE p.slug='project-oz'
ON CONFLICT DO NOTHING;
