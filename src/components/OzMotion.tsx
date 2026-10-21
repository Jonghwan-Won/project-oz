'use client';
import type { Messages } from '@/i18n/ko';
import { useState } from 'react';
import s from './OzMotion.module.css';
export function OzMotion({ labels }: { labels: Messages['motion'] }) {
  const [paused, setPaused] = useState(false);
  return (
    <button
      type="button"
      className={s.stage}
      data-paused={paused}
      onClick={() => setPaused(!paused)}
      aria-label={paused ? labels.playLabel : labels.pauseLabel}
      aria-pressed={paused}
    >
      <svg
        className={s.canvas}
        viewBox="0 0 560 565"
        role="img"
        aria-labelledby="oz-motion-title"
      >
        <title id="oz-motion-title">{labels.title}</title>
        <defs>
          <linearGradient id="oz-line" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--ink)" stopOpacity=".8" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity=".9" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="var(--ink)" strokeWidth="1.5">
          <circle cx="140" cy="126" r="89" opacity=".65" />
          <g className={s.orbits}>
            <ellipse
              cx="140"
              cy="126"
              rx="89"
              ry="31"
              transform="rotate(-38 140 126)"
            />
            <ellipse
              cx="140"
              cy="126"
              rx="89"
              ry="31"
              transform="rotate(41 140 126)"
            />
            <ellipse
              cx="140"
              cy="126"
              rx="35"
              ry="89"
              transform="rotate(14 140 126)"
            />
          </g>
        </g>
        <g className={s.satellite}>
          <circle cx="226" cy="126" r="5" fill="var(--accent)" />
          <circle
            cx="226"
            cy="126"
            r="11"
            fill="none"
            stroke="var(--accent-ink)"
            opacity=".25"
          />
        </g>
        <text x="49" y="27" className={s.label}>
          01 / POSSIBILITY
        </text>
        <g
          transform="translate(54 260)"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.3"
        >
          <rect width="177" height="268" stroke="var(--accent-ink)" />
          {Array.from({ length: 10 }, (_, i) => {
            const inset = i * 7.5;
            return (
              <rect
                key={i}
                x={inset}
                y={inset * 1.3}
                width={177 - inset * 2}
                height={268 - inset * 2.6}
                opacity={1 - i * 0.075}
              />
            );
          })}
          <path
            d="M0 0 88.5 134 177 0M0 268 88.5 134 177 268M88.5 0v268M0 134h177"
            opacity=".25"
          />
          <rect
            className={s.portal}
            x="64"
            y="97"
            width="49"
            height="74"
            stroke="var(--accent-ink)"
            strokeWidth="2"
          />
        </g>
        <text x="54" y="550" className={s.label}>
          02 / A WAY INTO OZ
        </text>
        <g transform="translate(280 45)">
          <rect
            width="229"
            height="250"
            fill="none"
            stroke="var(--motion-line)"
            strokeWidth="1.3"
          />
          <path
            d="M0 83h229M0 166h229M76 0v250M152 0v250"
            stroke="var(--line)"
            strokeWidth="1"
            opacity=".6"
          />
          <path
            className={s.route}
            d="M20 218 64 180 52 117 115 82 157 138 205 45"
            fill="none"
            stroke="var(--accent-ink)"
            strokeWidth="2.3"
          />
          {[
            [20, 218],
            [64, 180],
            [52, 117],
            [115, 82],
            [157, 138],
            [205, 45],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                className={s.node}
                style={{ animationDelay: `${i * 0.5}s` }}
                cx={x}
                cy={y}
                r="5"
                fill="var(--motion-bg)"
                stroke="var(--accent-ink)"
              />
              <text x={x + 9} y={y - 8} className={s.micro}>
                {['IDEA', 'EXPLORE', 'BUILD', 'CONNECT', 'TEST', 'RELEASE'][i]}
              </text>
            </g>
          ))}
          <text x="8" y="17" className={s.micro}>
            IDEAS BECOME REAL.
          </text>
        </g>
        <g
          className={s.shoe}
          transform="translate(274 355)"
          stroke="url(#oz-line)"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path
            d="M22 18C39 13 40 48 68 72C95 93 139 94 174 88L215 105Q229 112 229 120L165 128Q116 134 85 110L53 78L43 137H29L30 63Q15 42 22 18Z"
            fill="var(--motion-glass)"
          />
          <path
            d="M23 21Q33 44 43 57Q80 101 130 106L215 109M30 63L53 78M29 137H43M53 78Q91 119 141 122L229 120"
            fill="none"
          />
          <path
            d="M30 27L43 57L29 65M43 57L68 72L53 78M68 72L85 110L107 91M107 91L141 122L151 93M151 93L175 127L174 88M174 88L200 124L215 105M53 78L43 137L37 91M68 72L141 122M107 91L175 127"
            fill="none"
            opacity=".55"
          />
          <path
            d="M29 137H43L53 78M53 78Q91 119 141 122L229 120"
            fill="none"
            stroke="var(--accent-ink)"
            strokeWidth="2.5"
          />
        </g>
        <text x="284" y="534" className={s.label}>
          03 / TOOLS FOR THE JOURNEY
        </text>
        <path d="M280 324h229" stroke="var(--line)" strokeWidth="1.2" />
        <text x="285" y="344" className={s.micro}>
          IMAGINE. DEVELOP. REPEAT.
        </text>
      </svg>
    </button>
  );
}
