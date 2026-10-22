import type { UploadedAsset } from '@/lib/files';
export function CommonAssetLinks({ assets }: { assets: UploadedAsset[] }) {
  return (
    <ul>
      {assets.map((asset) => (
        <li key={asset.id}>
          <a
            className="textLink"
            href={asset.downloadUrl}
            download={asset.name}
          >
            {asset.name}
          </a>{' '}
          <small>({Math.ceil(asset.size / 1024)} KB)</small>
        </li>
      ))}
    </ul>
  );
}
