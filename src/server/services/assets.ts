import { logError, logEvent } from '@/server/logging';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, realpath, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '@/server/db';
import { fileFormat, maxUploadBytes } from '@/lib/files';
import { getAdminSession } from '@/server/auth';
import { hasSameOrigin } from '@/server/request-origin';

class FileError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const failure = (error: unknown) =>
  Response.json(
    {
      message:
        error instanceof FileError
          ? error.message
          : '파일 처리에 실패했습니다. 저장소 연결을 확인해 주세요.',
    },
    {
      status: error instanceof FileError ? error.status : 503,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
const inside = (root: string, target: string) => {
  const relative = path.relative(root, target);
  return (
    relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
  );
};
async function storageRoot() {
  if (!process.env.STORAGE_ROOT)
    throw new FileError(503, '파일 저장소가 설정되지 않았습니다.');
  return realpath(process.env.STORAGE_ROOT);
}
let lastUpload = 0;
export async function uploadAsset(request: Request) {
  try {
    if (!(await getAdminSession(request.headers)))
      throw new FileError(403, '관리자 로그인 후 업로드할 수 있습니다.');
    if (!hasSameOrigin(request))
      throw new FileError(403, '허용되지 않은 요청입니다.');
    if (Date.now() - lastUpload < 1000)
      throw new FileError(429, '잠시 후 다시 업로드해 주세요.');
    lastUpload = Date.now();
    const reader = request.body?.getReader();
    if (!reader) throw new FileError(400, '파일을 선택해 주세요.');
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxUploadBytes + 65536) {
        await reader.cancel();
        throw new FileError(413, '파일은 10MB 이하여야 합니다.');
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const form = await new Response(bytes, {
      headers: { 'Content-Type': request.headers.get('content-type') ?? '' },
    }).formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size)
      throw new FileError(400, '파일을 선택해 주세요.');
    if (file.size > maxUploadBytes)
      throw new FileError(413, '파일은 10MB 이하여야 합니다.');
    const data = new Uint8Array(await file.arrayBuffer());
    const format = fileFormat(data, file.name, file.type);
    if (!format)
      throw new FileError(
        415,
        'PNG·JPEG·WebP 이미지 또는 PDF만 업로드할 수 있습니다.',
      );
    const name =
      file.name
        .split(/[\\/]/)
        .at(-1)
        ?.replace(/[\x00-\x1f\x7f]/g, '')
        .slice(0, 255) || 'attachment';
    const id = randomUUID();
    const now = new Date();
    const storageKey =
      now.getUTCFullYear() +
      '/' +
      String(now.getUTCMonth() + 1).padStart(2, '0') +
      '/' +
      id +
      '.' +
      format.extension;
    const root = await storageRoot();
    const directory = path.join(root, path.dirname(storageKey));
    await mkdir(directory, { recursive: true });
    const actualDirectory = await realpath(directory);
    if (!inside(root, actualDirectory))
      throw new FileError(400, '잘못된 저장 경로입니다.');
    const target = path.join(actualDirectory, path.basename(storageKey));
    await writeFile(target, data, { flag: 'wx' });
    try {
      await pool.query(
        'INSERT INTO "Asset" (id,"storageKey","originalName","mimeType","byteSize") VALUES ($1,$2,$3,$4,$5)',
        [id, storageKey, name, format.mimeType, file.size],
      );
    } catch (error) {
      logError('assets', error);
      await unlink(target);
      throw error;
    }
    logEvent('info', 'admin.changed', {
      operation: 'asset.upload',
      targetId: id,
      success: true,
    });
    return Response.json(
      {
        id,
        name,
        size: file.size,
        mimeType: format.mimeType,
        url: '/api/assets/' + id,
        downloadUrl: '/api/assets/' + id + '?download=1',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    logError('assets', error);
    return failure(error);
  }
}
const assetIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StoredAsset = {
  storageKey: string;
  originalName: string;
  mimeType: string;
};

/** 저장소 경로를 검증한 뒤 파일을 응답으로 내보낸다. */
async function sendAsset(asset: StoredAsset, download: boolean) {
  if (
    !/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(png|jpg|webp|pdf)$/.test(asset.storageKey)
  )
    throw new FileError(404, '파일을 찾을 수 없습니다.');
  const root = await storageRoot();
  const target = await realpath(path.join(root, asset.storageKey));
  if (!inside(root, target))
    throw new FileError(404, '파일을 찾을 수 없습니다.');
  const data = await readFile(target);
  return new Response(data, {
    headers: {
      'Content-Type': asset.mimeType,
      'Content-Length': String(data.length),
      'Content-Disposition':
        (download ? 'attachment' : 'inline') +
        '; filename="attachment"; filename*=UTF-8\'\'' +
        encodeURIComponent(asset.originalName).replace(
          /['()*]/g,
          (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase(),
        ),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'private, no-store',
    },
  });
}

/**
 * 포트폴리오 페이지의 이력서·포트폴리오 PDF.
 * 콘텐츠에 연결되지 않은 파일은 공개되지 않으므로, 서버 환경 변수에 지정한
 * Asset ID만 이 경로로 내려준다. 브라우저가 임의의 파일 ID를 고를 수 없다.
 */
const portfolioFileEnv = {
  resume: 'PORTFOLIO_RESUME_ASSET_ID',
  portfolio: 'PORTFOLIO_DOCUMENT_ASSET_ID',
} as const;
export type PortfolioFileKind = keyof typeof portfolioFileEnv;

function portfolioFileId(kind: string) {
  if (!Object.prototype.hasOwnProperty.call(portfolioFileEnv, kind))
    return null;
  const id = process.env[portfolioFileEnv[kind as PortfolioFileKind]]?.trim();
  return id && assetIdPattern.test(id) ? id : null;
}

/** 화면에서 버튼을 켤지 정하기 위한 등록 여부. 파일 ID 자체는 내보내지 않는다. */
export function portfolioFileStatus(): Record<PortfolioFileKind, boolean> {
  return {
    resume: portfolioFileId('resume') !== null,
    portfolio: portfolioFileId('portfolio') !== null,
  };
}

export async function readPortfolioFile(kind: string) {
  try {
    const id = portfolioFileId(kind);
    if (!id) throw new FileError(404, '등록된 파일이 없습니다.');
    const asset = (
      await pool.query<StoredAsset>(
        'SELECT "storageKey","originalName","mimeType" FROM "Asset" WHERE id=$1',
        [id],
      )
    ).rows[0];
    if (!asset || asset.mimeType !== 'application/pdf')
      throw new FileError(404, '등록된 파일이 없습니다.');
    return await sendAsset(asset, true);
  } catch (error) {
    logError('assets', error);
    return failure(error);
  }
}

export async function readAsset(request: Request, id: string) {
  try {
    if (!assetIdPattern.test(id))
      throw new FileError(404, '파일을 찾을 수 없습니다.');
    const result = await pool.query<StoredAsset>(
      `SELECT a."storageKey",a."originalName",a."mimeType" FROM "Asset" a WHERE a.id=$1 AND ($2 OR EXISTS(SELECT 1 FROM "ProjectAsset" pa JOIN "Project" p ON p.id=pa."projectId" WHERE pa."assetId"=a.id AND p."isVisible"=true AND p."deletedAt" IS NULL) OR EXISTS(SELECT 1 FROM "PostAsset" pa JOIN "Post" p ON p.id=pa."postId" WHERE pa."assetId"=a.id AND p."isVisible"=true AND p."deletedAt" IS NULL))`,
      [id, !!(await getAdminSession(request.headers))],
    );
    const asset = result.rows[0];
    if (!asset) throw new FileError(404, '파일을 찾을 수 없습니다.');
    const download =
      new URL(request.url).searchParams.get('download') === '1' ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(asset.mimeType);
    return await sendAsset(asset, download);
  } catch (error) {
    logError('assets', error);
    return failure(error);
  }
}
