import s from './environment.module.css';

function Node({
  x,
  y,
  title,
  lines,
}: {
  x: number;
  y: number;
  title: string;
  lines: string[];
}) {
  return (
    <g transform={`translate(${x} ${y})`} className={s.mapNode}>
      <rect width="174" height="100" rx="14" />
      <text x="16" y="30" className={s.mapTitle}>
        {title}
      </text>
      {lines.map((line, index) => (
        <text key={line} x="16" y={54 + index * 19} className={s.mapText}>
          {line}
        </text>
      ))}
    </g>
  );
}

export function NetworkDiagram() {
  return (
    <figure className={s.diagram}>
      <div className={s.mapLegend}>
        <span className={s.publicKey}>실선 · 공개 웹</span>
        <span className={s.privateKey}>실선 · 개발 전용</span>
        <span>점선 · 운영 DB 연동 예정</span>
      </div>
      <div
        className={s.mapScroll}
        tabIndex={0}
        role="region"
        aria-label="네트워크 구조도 - 작은 화면에서는 좌우로 스크롤"
      >
        <svg
          viewBox="0 0 1160 650"
          className={s.networkMap}
          role="img"
          aria-labelledby="network-map-title network-map-description"
        >
          <title id="network-map-title">
            OZ 공개 웹과 개발 DB의 네트워크 연결
          </title>
          <desc id="network-map-description">
            위쪽 공개 경로는 방문자에서 HTTPS 443, 집 공유기, DSM 프록시, OZ 웹
            컨테이너로 연결됩니다. 아래쪽 개발 경로는 외부 개발 PC에서
            Tailscale과 NAS SSH를 통해 개발 DB로 연결됩니다. 운영 DB는 웹과
            연결할 예정이며 현재 미연결입니다.
          </desc>
          <defs>
            <marker
              id="public-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-ink)" />
            </marker>
            <marker
              id="private-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className={s.privateFill} />
            </marker>
          </defs>
          <rect
            x="16"
            y="54"
            width="220"
            height="570"
            rx="22"
            className={s.mapZone}
          />
          <text x="36" y="90" className={s.zoneTitle}>
            집 밖 · 사용자 장치
          </text>
          <rect
            x="470"
            y="54"
            width="674"
            height="570"
            rx="22"
            className={s.mapZone}
          />
          <text x="490" y="90" className={s.zoneTitle}>
            집 내부 네트워크
          </text>
          <rect
            x="704"
            y="110"
            width="424"
            height="492"
            rx="18"
            className={s.mapNas}
          />
          <text x="724" y="140" className={s.zoneTitle}>
            SYNOLOGY NAS
          </text>
          <text x="260" y="140" className={s.publicLabel}>
            PUBLIC WEB
          </text>
          <text x="260" y="163" className={s.mapText}>
            누구나 도메인으로 접속
          </text>
          <text x="260" y="405" className={s.privateLabel}>
            PRIVATE DEVELOPMENT
          </text>
          <text x="260" y="428" className={s.mapText}>
            개발자만 NAS에 연결
          </text>
          <path
            d="M 218 240 H 488 M 662 240 H 724 M 898 240 H 934"
            className={s.publicLine}
            markerEnd="url(#public-arrow)"
          />
          <text x="288" y="224" className={s.publicLabel}>
            HTTPS · TCP 443 →
          </text>
          <text x="680" y="225" className={s.mapText}>
            443
          </text>
          <path
            d="M 218 510 H 724 M 898 510 H 934"
            className={s.privateLine}
            markerEnd="url(#private-arrow)"
          />
          <text x="274" y="488" className={s.privateLabel}>
            Tailscale → SSH 터널 →
          </text>
          <path d="M 1021 290 V 322" className={s.plannedLine} />
          <text x="950" y="312" className={s.mapText}>
            연동 예정
          </text>
          <Node
            x={44}
            y={190}
            title="방문자 · 휴대폰"
            lines={['사이트 도메인 HTTPS', 'Tailscale 불필요']}
          />
          <Node
            x={488}
            y={190}
            title="SK 공유기"
            lines={['외부 443 → NAS 443', '포트포워딩']}
          />
          <Node
            x={724}
            y={190}
            title="DSM 프록시"
            lines={['인증서 · HTTPS 처리', 'HTTP 127.0.0.1:13000']}
          />
          <Node
            x={934}
            y={190}
            title="OZ 웹 컨테이너"
            lines={['Next.js 화면 + API', '컨테이너 :3000']}
          />
          <g className={s.plannedNode}>
            <Node
              x={934}
              y={330}
              title="운영 DB · 미연결"
              lines={['PostgreSQL :5432', '운영 앱 전용 계정 사용']}
            />
          </g>
          <Node
            x={44}
            y={460}
            title="외부 개발 PC"
            lines={['로컬 Next.js :3000', 'DB 접속점 :15432']}
          />
          <Node
            x={724}
            y={460}
            title="NAS SSH 접속점"
            lines={['Tailscale로 도달', 'DB 터널 허용 대상 제한']}
          />
          <Node
            x={934}
            y={460}
            title="개발 DB"
            lines={['PostgreSQL :5432', '계정 oz_dev_app']}
          />
          <text x="36" y="598" className={s.mapText}>
            집 PC는 내부망 SSH 사용
          </text>
          <text x="490" y="582" className={s.mapText}>
            DB 포트 외부 공개 불필요
          </text>
        </svg>
      </div>
      <figcaption>
        위는 공개 웹, 아래는 개발 DB 경로입니다. 점선은 아직 구현하지 않은 운영
        웹 → 운영 DB 연결입니다. 작은 화면에서는 구조도를 좌우로 움직여 볼 수
        있습니다.
      </figcaption>
    </figure>
  );
}
