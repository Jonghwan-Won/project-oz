UPDATE "Project" AS p
SET "updatedAt" = now(), version = p.version + 1
WHERE p.slug = 'project-oz'
  AND EXISTS (
    SELECT 1
    FROM "ProjectTranslation" t
    WHERE t."projectId" = p.id
      AND (t.title LIKE '%ddoza%' OR t.summary LIKE '%ddoza%' OR t.body::text LIKE '%ddoza%')
  );

UPDATE "ProjectTranslation" t
SET title = replace(t.title, 'ddoza', 'ddozaa'),
    summary = replace(t.summary, 'ddoza', 'ddozaa'),
    body = replace(t.body::text, 'ddoza', 'ddozaa')::jsonb
FROM "Project" p
WHERE t."projectId" = p.id AND p.slug = 'project-oz'
  AND (t.title LIKE '%ddoza%' OR t.summary LIKE '%ddoza%' OR t.body::text LIKE '%ddoza%');

UPDATE "Post" AS p
SET "updatedAt" = now(), version = p.version + 1
WHERE p.slug IN ('hello-oz', 'project-oz-devlog-01')
  AND EXISTS (
    SELECT 1
    FROM "PostTranslation" t
    WHERE t."postId" = p.id
      AND (t.title LIKE '%ddoza%' OR t.summary LIKE '%ddoza%' OR t.body::text LIKE '%ddoza%')
  );

UPDATE "PostTranslation" t
SET title = replace(t.title, 'ddoza', 'ddozaa'),
    summary = replace(t.summary, 'ddoza', 'ddozaa'),
    body = replace(t.body::text, 'ddoza', 'ddozaa')::jsonb
FROM "Post" p
WHERE t."postId" = p.id AND p.slug IN ('hello-oz', 'project-oz-devlog-01')
  AND (t.title LIKE '%ddoza%' OR t.summary LIKE '%ddoza%' OR t.body::text LIKE '%ddoza%');
