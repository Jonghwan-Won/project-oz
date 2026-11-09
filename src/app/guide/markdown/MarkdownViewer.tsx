'use client';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import {
  CommonFilePicker,
  type FilePickerLabels,
} from '@/components/ui/CommonFilePicker';

import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { GuideMessages } from '@/i18n/guide-ko';
import {
  decodeMarkdown,
  MarkdownFileError,
  validateMarkdownFile,
} from './file';
import s from './markdown.module.css';

export function MarkdownViewer({
  documents,
  messages: copy,
  filePickerLabels,
}: {
  documents: { name: string; content: string }[];
  messages: GuideMessages['markdown']['viewer'];
  filePickerLabels: FilePickerLabels;
}) {
  const [document, setDocument] = useState(documents[0]);
  const [selected, setSelected] = useState(documents[0]?.name ?? '');
  const [error, setError] = useState<
    keyof GuideMessages['markdown']['viewer']['errors'] | ''
  >('');
  const [pending, setPending] = useState(false);

  return (
    <section className={s.viewer} aria-label={copy.region}>
      <div className={s.controls}>
        <label>
          {copy.documentLabel}
          <CommonSelectBox
            aria-label={copy.documentLabel}
            value={selected}
            disabled={pending}
            onValueChange={(value) => {
              const next = documents.find((item) => item.name === value);
              if (next) {
                setDocument(next);
                setSelected(next.name);
                setError('');
              }
            }}
            options={[
              { value: '', label: copy.localFile, disabled: true },
              ...documents.map((item) => ({
                value: item.name,
                label: item.name,
              })),
            ]}
          />
        </label>
        <CommonFilePicker
          label={copy.openFile}
          accept=".md,.markdown"
          disabled={pending}
          aria-describedby="markdown-file-help"
          labels={filePickerLabels}
          onSelect={async (file) => {
            setError('');
            try {
              validateMarkdownFile(file);
              setPending(true);
              const content = decodeMarkdown(await file.arrayBuffer());
              setDocument({ name: file.name, content });
              setSelected('');
            } catch (cause) {
              setError(
                cause instanceof TypeError
                  ? 'encoding'
                  : cause instanceof MarkdownFileError
                    ? cause.code
                    : 'unknown',
              );
            } finally {
              setPending(false);
            }
          }}
        />
      </div>
      <p id="markdown-file-help" className={s.help}>
        {copy.help}
      </p>
      {error && (
        <p role="alert" className={s.error}>
          {copy.errors[error]}
        </p>
      )}
      <p role="status" className={s.filename}>
        {pending ? copy.reading : document?.name}
      </p>
      <article
        className={s.markdown}
        aria-label={copy.content}
        aria-busy={pending}
      >
        {document?.content ? (
          <Markdown
            skipHtml
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt }) => (
                <span className={s.help}>
                  {copy.image.replace('{alt}', alt || copy.imageNoAlt)}
                </span>
              ),
              a: ({ href, children }) => {
                if (!href) return <span>{children}</span>;
                const relative =
                  href && !/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(href);
                const linked =
                  relative && selected
                    ? documents.find(
                        (item) =>
                          item.name ===
                          new URL(
                            href,
                            `https://guide.invalid/${selected}`,
                          ).pathname.slice(1),
                      )
                    : undefined;
                if (linked)
                  return (
                    <a
                      href="/lab/markdown"
                      onClick={(event) => {
                        event.preventDefault();
                        setDocument(linked);
                        setSelected(linked.name);
                        setError('');
                      }}
                    >
                      {children}
                    </a>
                  );
                if (relative)
                  return <span title={copy.relativeLink}>{children}</span>;
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              },
              table: ({ children }) => (
                <div className={s.table}>
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {document.content}
          </Markdown>
        ) : (
          <p>{copy.empty}</p>
        )}
      </article>
    </section>
  );
}
