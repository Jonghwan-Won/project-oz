'use client';

import { useState } from 'react';
import type { Messages } from '@/i18n/ko';
import s from './IdeaVisual.module.css';

export function IdeaVisual({
  labels,
  still = false,
}: {
  labels: Messages['ideaVisual'];
  still?: boolean;
}) {
  const [paused, setPaused] = useState(false);
  const artwork = (
    <>
      <div className={s.steps} aria-hidden="true">
        {labels.steps.map((label, index) => (
          <span key={label}>
            <small>0{index + 1}</small>
            {label}
          </span>
        ))}
      </div>
      <svg
        className={s.canvas}
        viewBox="0 0 560 460"
        role="img"
        aria-label={labels.description}
      >
        <g fill="none" stroke="currentColor" className={s.grid}>
          <path d="M32 80H528M32 160H528M32 240H528M32 320H528M32 400H528M80 32V428M160 32V428M240 32V428M320 32V428M400 32V428M480 32V428" />
        </g>
        <circle className={s.halo} cx="104" cy="140" r="58" />
        <circle className={s.ring} cx="104" cy="140" r="37" />
        <path className={s.threadBase} d="M104 140C208 140 156 256 286 256" />
        <path
          className={s.thread}
          d="M104 140C208 140 156 256 286 256"
          pathLength="1"
        />
        <g className={s.connections}>
          <path d="M104 140L64 78M104 140L160 96M104 140L65 210" />
          <circle cx="64" cy="78" r="5" />
          <circle cx="160" cy="96" r="5" />
          <circle cx="65" cy="210" r="5" />
        </g>
        <circle className={s.seed} cx="104" cy="140" r="10" />
        <circle className={s.spark} cx="104" cy="140" r="5" />
        <g className={s.result}>
          <rect
            className={s.window}
            x="252"
            y="180"
            width="260"
            height="196"
            rx="18"
          />
          <path className={s.windowLine} d="M252 219H512" />
          <g className={s.controls}>
            <circle cx="274" cy="200" r="3" />
            <circle cx="287" cy="200" r="3" />
            <circle cx="300" cy="200" r="3" />
          </g>
          <rect
            className={s.block}
            x="276"
            y="244"
            width="68"
            height="80"
            rx="10"
          />
          <path className={s.check} d="m294 283 11 11 22-25" />
          <path
            className={s.copy}
            d="M365 252H466M365 268H437M365 298H480M365 314H454"
          />
          <rect
            className={s.chip}
            x="276"
            y="341"
            width="57"
            height="10"
            rx="5"
          />
          <rect
            className={s.chip}
            x="343"
            y="341"
            width="39"
            height="10"
            rx="5"
          />
        </g>
        <g className={s.kept}>
          <path className={s.threadBase} d="M252 341C202 341 225 390 177 390" />
          <rect
            className={s.note}
            x="87"
            y="354"
            width="90"
            height="72"
            rx="12"
          />
          <path
            className={s.noteLines}
            d="M106 376H155M106 389H144M106 402H132"
          />
          <circle className={s.end} cx="201" cy="390" r="4" />
        </g>
      </svg>
    </>
  );
  if (still) return <div className={`${s.scene} ${s.still}`}>{artwork}</div>;
  return (
    <button
      type="button"
      className={s.scene}
      data-paused={paused}
      aria-pressed={paused}
      aria-label={paused ? labels.play : labels.pause}
      onClick={() => setPaused(!paused)}
    >
      {artwork}
    </button>
  );
}
