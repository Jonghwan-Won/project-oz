'use client';
import { SelectBox } from '@/components/ui/SelectBox';
import { FilePicker } from '@/components/ui/FilePicker';

import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { decodeMarkdown, validateMarkdownFile } from './file';
import s from './markdown.module.css';

export function MarkdownViewer({
  documents,
}: {
  documents: { name: string; content: string }[];
}) {
  const [document, setDocument] = useState(documents[0]);
  const [selected, setSelected] = useState(documents[0]?.name ?? '');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  return (
    <section className={s.viewer} aria-label="Markdown 문서 뷰어">
      <div className={s.controls}>
        <label>
          프로젝트 문서
          <SelectBox
            aria-label="프로젝트 문서"
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
              { value: '', label: '내 PC에서 연 파일', disabled: true },
              ...documents.map((item) => ({
                value: item.name,
                label: item.name,
              })),
            ]}
          />
        </label>
        <FilePicker
          label="내 PC에서 파일 열기"
          accept=".md,.markdown"
          disabled={pending}
          aria-describedby="markdown-file-help"
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
                  ? 'UTF-8 텍스트 파일을 선택해 주세요.'
                  : cause instanceof Error
                    ? cause.message
                    : '파일을 읽지 못했습니다. 다시 선택해 주세요.',
              );
            } finally {
              setPending(false);
            }
          }}
        />
      </div>
      <p id="markdown-file-help" className={s.help}>
        UTF-8 · 최대 1 MiB. 선택한 파일은 브라우저에서만 읽으며 서버에
        업로드하거나 저장하지 않습니다. HTML은 실행하지 않으며 이미지는 자동으로
        불러오지 않습니다.
      </p>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      <p role="status" className={s.filename}>
        {pending ? '파일을 읽고 있습니다…' : document?.name}
      </p>
      <article
        className={s.markdown}
        aria-label="문서 내용"
        aria-busy={pending}
      >
        {document?.content ? (
          <Markdown
            skipHtml
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ alt }) => (
                <span className={s.help}>[이미지: {alt || '설명 없음'}]</span>
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
                      href="/guide/markdown"
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
                  return (
                    <span title="이 상대 경로는 선택 목록에서 열거나 별도로 파일을 선택해 주세요.">
                      {children}
                    </span>
                  );
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
          <p>빈 문서입니다.</p>
        )}
      </article>
    </section>
  );
}
