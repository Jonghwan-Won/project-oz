import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';
if (existsSync('.env.local')) loadEnvFile('.env.local');
const url=process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (url && !['postgres:','postgresql:'].includes(new URL(url).protocol)) throw new Error('PostgreSQL connection URL required');
export default defineConfig({schema:'prisma/schema.prisma',migrations:{path:'prisma/migrations'},datasource:{url}});
