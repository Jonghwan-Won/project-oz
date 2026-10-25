import type { UploadedAsset } from '@/lib/files';
import s from './CommonAssetLinks.module.css';
export function CommonAssetLinks({ assets }: { assets: UploadedAsset[] }) {
  return (
    <ul className={s.assets}>
      {assets.map((asset) => (
        <li key={asset.id}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="m7.5 10.7 4.9-4.9a2.4 2.4 0 0 1 3.4 3.4l-6.6 6.6a4 4 0 0 1-5.7-5.7l6.6-6.6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <a href={asset.downloadUrl} download={asset.name}>
            {asset.name}
          </a>
          <small>({Math.ceil(asset.size / 1024)} KB)</small>
        </li>
      ))}
    </ul>
  );
}
