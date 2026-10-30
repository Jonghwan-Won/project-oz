#!/bin/sh
# Run on NAS: sudo sh /volume1/docker/project-oz/transfer/deploy-content.sh FULL_COMMIT_SHA
set -eu
umask 077
sha=${1:?Pass the successful image commit SHA}
case "$sha" in *[!0-9a-f]*|'') echo 'Expected a full commit SHA'; exit 1;; esac
[ "${#sha}" -eq 40 ] || { echo 'Expected a full commit SHA'; exit 1; }
base=/volume1/docker/project-oz
transfer=$(cd "$(dirname "$0")" && pwd)
case "$transfer" in "$base"/transfer/*) ;; *) echo "Run from a transfer subdirectory"; exit 1;; esac
image=ghcr.io/jonghwan-won/project-oz:$sha
migration=ghcr.io/jonghwan-won/project-oz-migrate:$sha
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup=$base/backups/content-import-$stamp
[ -f "$transfer/content.json" ] && [ -f "$transfer/content-transfer.mjs" ] || { echo 'Missing export bundle or import script'; exit 1; }
[ -d "$base/uploads-dev" ] && [ -d "$base/uploads" ] || { echo 'Missing storage roots'; exit 1; }
# This task imports into an empty content database; it never replaces existing posts/projects.
count=$(docker exec project-oz-db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d oz -Atc '\''SELECT (SELECT count(*) FROM "Project") + (SELECT count(*) FROM "Post");'\''')
[ "$count" = 0 ] || { echo 'Production has content. Stop and inspect before importing.'; exit 1; }
docker pull "$image"
docker pull "$migration"
mkdir -p "$backup"
chmod 700 "$backup" "$transfer"
chmod 600 "$transfer/content.json"
trap 'result=$?; if [ "$result" -ne 0 ]; then echo "Transfer stopped. Backup directory: $backup. Do not rerun blindly or start the old image against a migrated DB."; fi' 0
# Stop writes while backup, migration and import are in progress.
docker stop project-oz-web
# Avoid streaming custom archives through a terminal.
docker exec project-oz-db sh -c 'pg_dump -U "$POSTGRES_USER" -d oz -Fc -f /tmp/oz-before-content-import.dump && pg_restore -l /tmp/oz-before-content-import.dump >/dev/null'
docker cp project-oz-db:/tmp/oz-before-content-import.dump "$backup/oz.dump"
chmod 600 "$backup/oz.dump"
tar -C "$base" -czf "$backup/uploads.tar.gz" uploads
echo "Verified DB backup and storage backup: $backup"
docker run --rm --network project-oz --env-file "$base/.env.migrate" "$migration"
# Dry run validates constraints and remaps existing seeded Tag IDs, then rolls back.
docker run --rm --network project-oz --env-file "$base/.env.migrate" -v "$transfer/content-transfer.mjs:/app/content-transfer.mjs:ro" -v "$transfer/content.json:/transfer/content.json:ro" -v "$base/uploads-dev:/source:ro" -v "$base/uploads:/target" --entrypoint node "$migration" /app/content-transfer.mjs check /transfer/content.json
docker run --rm --network project-oz --env-file "$base/.env.migrate" -v "$transfer/content-transfer.mjs:/app/content-transfer.mjs:ro" -v "$transfer/content.json:/transfer/content.json:ro" -v "$base/uploads-dev:/source:ro" -v "$base/uploads:/target" --entrypoint node "$migration" /app/content-transfer.mjs apply /transfer/content.json
mkdir -p "$base/logs"
chown 1000:1000 "$base/logs"
chmod 750 "$base/logs"
docker rename project-oz-web "project-oz-web-pre-content-$stamp"
docker run -d --name project-oz-web --restart unless-stopped --network project-oz -p 127.0.0.1:13000:3000 --env-file "$base/.env.web" -e LOG_ROOT=/app/logs -v "$base/uploads:/app/storage" -v "$base/logs:/app/logs" --log-driver local --log-opt max-size=10m --log-opt max-file=3 "$image"
for route in /api/health /projects /board; do
  curl --fail --retry 10 --retry-all-errors --retry-delay 2 --connect-timeout 3 --max-time 10 "http://127.0.0.1:13000$route" >/dev/null
done
echo "Content import and web replacement completed. Backup: $backup"
