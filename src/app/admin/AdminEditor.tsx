'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import s from './admin.module.css';

type Entry = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  status: string;
  thumbnail: string;
};
const empty: Entry = {
  id: '',
  title: '',
  slug: '',
  summary: '',
  body: '',
  category: '',
  status: '비공개',
  thumbnail: '',
};

export function AdminEditor({
  section,
  initialEntries,
}: {
  section: 'projects' | 'board';
  initialEntries: Entry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [message, setMessage] = useState('');
  const isProject = section === 'projects';
  const label = isProject ? '프로젝트' : '게시글';

  return (
    <section>
      <div className={s.heading}>
        <div>
          <span className="eyebrow">{isProject ? 'PROJECTS' : 'BOARD'}</span>
          <h2>{isProject ? '프로젝트 관리' : '게시판 관리'}</h2>
          <p>{entries.length}개 · 화면 확인용 데이터</p>
        </div>
        <Button
          onClick={() => {
            setDraft({ ...empty });
            setMessage('');
          }}
        >
          {label} 등록
        </Button>
      </div>
      <p role="status" className={s.notice}>
        {message}
      </p>
      {draft && (
        <form
          className={s.panel}
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim() || !draft.category.trim()) {
              setMessage('제목과 분류를 입력해 주세요.');
              return;
            }
            if (
              entries.some(
                (entry) => entry.slug === draft.slug && entry.id !== draft.id,
              )
            ) {
              setMessage(
                '이미 사용 중인 주소입니다. 다른 주소를 입력해 주세요.',
              );
              return;
            }
            const saved = {
              ...draft,
              title: draft.title.trim(),
              category: draft.category.trim(),
              id: draft.id || crypto.randomUUID(),
            };
            setEntries(
              draft.id
                ? entries.map((entry) =>
                    entry.id === draft.id ? saved : entry,
                  )
                : [...entries, saved],
            );
            setDraft(null);
            setMessage(
              '현재 화면에 임시 반영했습니다. 실제 사이트와 DB에는 저장되지 않습니다.',
            );
          }}
        >
          <h3>
            {label} {draft.id ? '수정' : '등록'}
          </h3>
          <div className={s.fields}>
            <label>
              제목
              <input
                required
                maxLength={120}
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
              />
            </label>
            <label>
              주소(slug)
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                title="영문 소문자·숫자와 단어 사이 하이픈을 사용하세요."
                value={draft.slug}
                onChange={(event) =>
                  setDraft({ ...draft, slug: event.target.value })
                }
              />
            </label>
            <label>
              {isProject ? '작업 구분' : '게시판 카테고리'}
              <input
                required
                maxLength={40}
                value={draft.category}
                onChange={(event) =>
                  setDraft({ ...draft, category: event.target.value })
                }
              />
            </label>
            <label>
              공개 범위
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft({ ...draft, status: event.target.value })
                }
              >
                <option>비공개</option>
                <option>공개</option>
              </select>
            </label>
          </div>
          <label>
            {isProject ? '프로젝트 소개' : '게시글 요약'}
            <textarea
              rows={4}
              maxLength={2000}
              value={draft.summary}
              onChange={(event) =>
                setDraft({ ...draft, summary: event.target.value })
              }
            />
          </label>
          {!isProject && (
            <label>
              게시글 본문
              <textarea
                rows={8}
                maxLength={50000}
                value={draft.body}
                onChange={(event) =>
                  setDraft({ ...draft, body: event.target.value })
                }
              />
            </label>
          )}
          {isProject && (
            <label>
              썸네일 경로(선택)
              <input
                placeholder="/images/project-thumbnail.webp"
                pattern="/[^/].*"
                value={draft.thumbnail}
                onChange={(event) =>
                  setDraft({ ...draft, thumbnail: event.target.value })
                }
              />
              <small>
                public 폴더의 이미지 경로입니다. 비워두면 궤도 그래픽과 제목을
                사용합니다. 파일 업로드는 준비 중입니다.
              </small>
            </label>
          )}
          <div className={s.actions}>
            <Button type="submit">화면에 임시 반영</Button>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              취소
            </Button>
          </div>
        </form>
      )}
      <div className={s.list}>
        {entries.map((entry) => (
          <article className={s.row} key={entry.id}>
            <div>
              <h3>{entry.title}</h3>
              <p>
                {entry.category} · {entry.status}
              </p>
              <small>
                /{isProject ? 'work' : 'board'}/{entry.slug}
              </small>
            </div>
            <Button
              size="sm"
              aria-label={`${entry.title} 수정`}
              onClick={() => {
                setDraft({ ...entry });
                setMessage('');
              }}
            >
              수정
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
