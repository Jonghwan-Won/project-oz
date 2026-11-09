/**
 * 포트폴리오 화면의 이력서·포트폴리오 PDF.
 * 콘텐츠에 연결되지 않은 파일은 공개되지 않으므로, 서버 환경 변수에 지정한
 * Asset ID만 쓴다. 브라우저가 임의의 파일 ID를 고를 수 없다.
 * DB·인증 모듈을 가져오지 않아 서비스 테스트에서 그대로 불러 쓸 수 있다.
 */
const portfolioFileEnv = {
  resume: 'PORTFOLIO_RESUME_ASSET_ID',
  portfolio: 'PORTFOLIO_DOCUMENT_ASSET_ID',
} as const;
export type PortfolioFileKind = keyof typeof portfolioFileEnv;

const assetIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function portfolioFileId(kind: string) {
  if (!Object.prototype.hasOwnProperty.call(portfolioFileEnv, kind))
    return null;
  const id = process.env[portfolioFileEnv[kind as PortfolioFileKind]]?.trim();
  return id && assetIdPattern.test(id) ? id.toLowerCase() : null;
}

/**
 * [이력서 ID, 포트폴리오 ID]. 지정되지 않은 값은 빈 문자열이다.
 * 콘텐츠에 연결되지 않아도 사이트에서 쓰이는 파일이므로 미사용 집계와 삭제 대상에서 뺀다.
 */
export function portfolioAssetIds(): [string, string] {
  return [portfolioFileId('resume') ?? '', portfolioFileId('portfolio') ?? ''];
}

/**
 * SQL 조건: `alias` Asset이 프로젝트·게시글에 연결됐거나 포트폴리오 PDF로 지정됐다.
 * `idsParam`에는 portfolioAssetIds() 값을 담은 text[] 파라미터 번호를 넣는다.
 */
export function assetInUseSql(alias: string, idsParam: string) {
  return `(EXISTS (SELECT 1 FROM "ProjectAsset" WHERE "assetId"=${alias}.id) OR EXISTS (SELECT 1 FROM "PostAsset" WHERE "assetId"=${alias}.id) OR ${alias}.id::text = ANY(${idsParam}::text[]))`;
}
