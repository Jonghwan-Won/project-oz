'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@mantine/core';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonRichTextEditor } from '@/components/ui/CommonRichTextEditor';
import { CommonRichTextView } from '@/components/ui/CommonRichTextView';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { blankPost, parsePostForm, type PostForm } from '@/lib/post-form';
import { categories } from '@/content/site';
import s from './admin.module.css';

export function PostEditor({ initialPost }: { initialPost?: PostForm }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialPost ?? blankPost);
  const [dirty, setDirty] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState<'save' | 'leave' | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const busy = saving || uploads > 0;
  const change = (patch: Partial<PostForm>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, ...patch }));
  };
  const copy = (patch: Partial<PostForm['translations']['ko']>) => {
    setDirty(true);
    setDraft((current) => ({
      ...current,
      translations: {
        ...current.translations,
        ko: { ...current.translations.ko, ...patch },
      },
    }));
  };
  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const link = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>('a[href]')
          : null;
      if (target) {
        const url = new URL(target.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname + url.search + url.hash ===
          window.location.pathname +
            window.location.search +
            window.location.hash
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        setPendingHref(url.pathname + url.search + url.hash);
        setConfirm('leave');
      }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', link, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      document.removeEventListener('click', link, true);
    };
  }, [dirty]);
  async function save() {
    setConfirm(null);
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsePostForm(draft)),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.message || '저장하지 못했습니다.');
      setDirty(false);
      router.push('/admin/board');
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : '저장하지 못했습니다.',
      );
    } finally {
      setSaving(false);
    }
  }
  const content = draft.translations.ko;
  return (
    <section>
      <form
        className={`${s.panel} ${s.projectForm} ${s.postForm}`}
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          try {
            parsePostForm(draft);
            setConfirm('save');
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : '입력을 확인해 주세요.',
            );
          }
        }}
      >
        <div className={s.heading}>
          <h2>게시글 {draft.id ? '수정' : '등록'}</h2>
          <div className={s.actions}>
            <CommonButton
              disabled={busy}
              aria-pressed={preview}
              onClick={() => setPreview(!preview)}
            >
              {preview ? '편집' : '미리보기'}
            </CommonButton>
            <CommonButton type="submit" variant="primary" disabled={busy}>
              {saving ? '저장 중…' : uploads ? '이미지 업로드 중…' : '저장'}
            </CommonButton>
            <CommonButton
              disabled={busy}
              onClick={() =>
                dirty ? setConfirm('leave') : router.push('/admin/board')
              }
            >
              목록으로
            </CommonButton>
          </div>
        </div>
        {message && (
          <p role="alert" className={s.notice}>
            {message}
          </p>
        )}
        {preview ? (
          <article>
            <h2>{content.title}</h2>
            <p>
              {draft.category} · {draft.isVisible ? '노출' : '미노출'}
            </p>
            <p>{content.summary}</p>
            <CommonRichTextView value={content.body} />
          </article>
        ) : (
          <>
            <div className={s.fields}>
              <label>
                카테고리
                <CommonSelectBox
                  aria-label="게시글 카테고리"
                  value={draft.category}
                  disabled={busy}
                  onValueChange={(category) => change({ category })}
                  options={categories
                    .slice(1)
                    .map((value) => ({ value, label: value }))}
                />
              </label>
              <div className={s.visibilityToggle}>
                <span>노출 여부</span>
                <Switch
                  aria-label="게시글 노출 여부"
                  className={s.visibilitySwitch}
                  checked={draft.isVisible}
                  disabled={busy}
                  onChange={(event) =>
                    change({ isVisible: event.currentTarget.checked })
                  }
                />
              </div>
            </div>
            <label>
              제목
              <CommonInput
                required
                maxLength={200}
                value={content.title}
                disabled={busy}
                onChange={(e) => copy({ title: e.target.value })}
              />
            </label>
            <label>
              요약
              <CommonTextArea
                rows={3}
                maxLength={4000}
                value={content.summary}
                disabled={busy}
                onChange={(e) => copy({ summary: e.target.value })}
              />
            </label>
            <div>
              <label htmlFor="post-body">본문</label>
              <CommonRichTextEditor
                id="post-body"
                label="게시글 본문"
                value={content.body}
                disabled={saving}
                onChange={(body) => copy({ body })}
                onUploadBusyChange={(value) =>
                  setUploads((count) => Math.max(0, count + (value ? 1 : -1)))
                }
              />
            </div>
          </>
        )}
      </form>
      <CommonConfirm
        open={confirm !== null}
        title={confirm === 'save' ? '게시글 저장' : '페이지 이동'}
        content={
          confirm === 'save'
            ? '게시글을 저장할까요?'
            : '저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?'
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() =>
          confirm === 'save'
            ? save()
            : router.push(pendingHref || '/admin/board')
        }
      />
    </section>
  );
}
