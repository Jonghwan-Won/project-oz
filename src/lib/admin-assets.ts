export type AssetUsage = {
  /** portfolio: 환경 변수로 지정된 이력서·포트폴리오 PDF */
  type: 'project' | 'post' | 'portfolio';
  id: string;
  title: string;
  usage: string;
  deleted: boolean;
};
export type AdminAsset = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  usages: AssetUsage[];
};
export const emptyAssetSearch = { keyword: '', filter: 'all', sort: 'new' };
export const assetIdsValid = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= 100 &&
  value.every(
    (id) =>
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      ),
  ) &&
  new Set(value.map((id) => id.toLowerCase())).size === value.length;
export function formatAssetSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}
