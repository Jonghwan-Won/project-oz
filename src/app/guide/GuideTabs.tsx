'use client';

import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import type { GuideMessages } from '@/i18n/guide-ko';
import { GuideExamples } from './GuideExamples';
import s from './guide.module.css';

const tabs = ['ui', 'feedback', 'loading', 'api', 'environment'] as const;

const colors = [
  '--accent',
  '--accent-blue',
  '--on-accent',
  '--accent-ink',
  '--bg',
  '--surface',
  '--ink',
  '--muted',
  '--secondary',
  '--line',
] as const;

export type GuideTabsMessages = Pick<
  GuideMessages,
  'guide' | 'examples' | 'components'
>;

export function GuideTabs({
  admin = false,
  messages,
}: {
  admin?: boolean;
  messages: GuideTabsMessages;
}) {
  const copy = messages.guide;
  const visibleTabs = tabs.filter(
    (id) => admin || !['api', 'environment'].includes(id),
  );
  const [active, setActive] = useState<(typeof tabs)[number]>('ui');
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % visibleTabs.length
        : event.key === 'ArrowLeft'
          ? (index + visibleTabs.length - 1) % visibleTabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? visibleTabs.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    setActive(visibleTabs[next]);
    document.getElementById(`tab-${visibleTabs[next]}`)?.focus();
  }
  const examples = (tab: 'ui' | 'feedback' | 'loading' | 'api') => (
    <GuideExamples
      tab={tab}
      messages={messages.examples}
      components={messages.components}
    />
  );
  return (
    <div className={`page ${s.guide}`}>
      <h1>
        {copy.title}
        <span className="accentDot" />
      </h1>
      <p>{copy.description}</p>
      <div className={s.tabs} role="tablist" aria-label={copy.tablist}>
        {visibleTabs.map((id, index) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            tabIndex={active === id ? 0 : -1}
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            onKeyDown={(event) => moveTab(event, index)}
            onClick={() => setActive(id)}
          >
            {copy.tabs[id]}
          </button>
        ))}
      </div>
      {visibleTabs.map((id) => (
        <section
          key={id}
          id={`panel-${id}`}
          role="tabpanel"
          aria-labelledby={`tab-${id}`}
          hidden={active !== id}
        >
          {id === 'ui' && (
            <>
              <section className={s.section}>
                <h2>{copy.colorsTitle}</h2>
                <p>{copy.colorsDescription}</p>
                <div className={s.colors}>
                  {colors.map((token) => (
                    <div className={s.swatch} key={token}>
                      <span
                        className={s.chip}
                        style={{ background: `var(${token})` }}
                      />
                      <div>
                        <code>{token}</code>
                        <p>{copy.colors[token]}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <pre className={s.code}>{copy.colorCode}</pre>
              </section>
              {examples('ui')}
            </>
          )}
          {id === 'feedback' && examples('feedback')}
          {id === 'loading' && examples('loading')}
          {id === 'api' && examples('api')}
          {id === 'environment' && (
            <>
              <section className={s.section}>
                <h2>{copy.environmentTitle}</h2>
                <p>{copy.environmentDescription}</p>
                <div className={s.tableWrap}>
                  <table>
                    <caption>{copy.environmentCaption}</caption>
                    <thead>
                      <tr>
                        {copy.environmentHeaders.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {copy.environmentRows.map(
                        ([check, behavior, skipped]) => (
                          <tr key={check}>
                            <th>{check}</th>
                            <td>{behavior}</td>
                            <td>{skipped}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
                <p>{copy.environmentAdminNote}</p>
                <Link className="textLink" href="/guide/environment">
                  {copy.environmentLink}
                </Link>
              </section>
            </>
          )}
        </section>
      ))}
    </div>
  );
}
