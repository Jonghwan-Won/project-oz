import type { GuideMessages } from '@/i18n/guide-ko';
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

export function NetworkDiagram({
  messages: copy,
}: {
  messages: GuideMessages['diagram'];
}) {
  const { nodes } = copy;
  return (
    <figure className={s.diagram}>
      <div className={s.mapLegend}>
        <span className={s.publicKey}>{copy.legendPublic}</span>
        <span className={s.privateKey}>{copy.legendPrivate}</span>
        <span>{copy.legendDatabase}</span>
      </div>
      <div
        className={s.mapScroll}
        tabIndex={0}
        role="region"
        aria-label={copy.region}
      >
        <svg
          viewBox="0 0 1160 650"
          className={s.networkMap}
          role="img"
          aria-labelledby="network-map-title network-map-description"
        >
          <title id="network-map-title">{copy.title}</title>
          <desc id="network-map-description">{copy.description}</desc>
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
            {copy.outsideZone}
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
            {copy.homeZone}
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
            {copy.publicHint}
          </text>
          <text x="260" y="405" className={s.privateLabel}>
            PRIVATE DEVELOPMENT
          </text>
          <text x="260" y="428" className={s.mapText}>
            {copy.privateHint}
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
            {copy.tunnel}
          </text>
          <path d="M 1021 290 V 322" className={s.plannedLine} />
          <text x="950" y="312" className={s.mapText}>
            {copy.databaseLink}
          </text>
          <Node
            x={44}
            y={190}
            title={nodes.visitor.title}
            lines={nodes.visitor.lines}
          />
          <Node
            x={488}
            y={190}
            title={nodes.entry.title}
            lines={nodes.entry.lines}
          />
          <Node
            x={724}
            y={190}
            title={nodes.internal.title}
            lines={nodes.internal.lines}
          />
          <Node
            x={934}
            y={190}
            title={nodes.web.title}
            lines={nodes.web.lines}
          />
          <g className={s.plannedNode}>
            <Node
              x={934}
              y={330}
              title={nodes.productionDatabase.title}
              lines={nodes.productionDatabase.lines}
            />
          </g>
          <Node
            x={44}
            y={460}
            title={nodes.devPc.title}
            lines={nodes.devPc.lines}
          />
          <Node
            x={724}
            y={460}
            title={nodes.nasSsh.title}
            lines={nodes.nasSsh.lines}
          />
          <Node
            x={934}
            y={460}
            title={nodes.devDatabase.title}
            lines={nodes.devDatabase.lines}
          />
          <text x="36" y="598" className={s.mapText}>
            {copy.devPcNote}
          </text>
          <text x="490" y="582" className={s.mapText}>
            {copy.databasePortNote}
          </text>
        </svg>
      </div>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  );
}
