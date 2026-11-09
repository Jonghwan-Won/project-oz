'use client';
import { CommonSelectBox } from '@/components/ui/CommonSelectBox';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonInput } from '@/components/ui/CommonInput';

import { useState } from 'react';
import { CommonButton, CommonButtonLink } from '@/components/ui/CommonButton';
import {
  createIdea,
  initialIdeas,
  initialBranches,
  mapLayout,
  reorderIdeas,
  type IdeaBranch,
} from './model';
import type { GuideMessages } from '@/i18n/guide-ko';
import s from './ideas.module.css';

// model.ts에 저장되는 값(키)을 locale 표시 문구로 바꾼다. 사용자가 입력한 값은 그대로 둔다.
const labelOf = (names: Record<string, string>, value: string) =>
  names[value] ?? value;

export function IdeaPlayground({
  messages: copy,
  backToLab,
}: {
  messages: GuideMessages['ideas'];
  backToLab: string;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [branches, setBranches] = useState(initialBranches);
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState('미분류');
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [branchDraft, setBranchDraft] = useState('');
  const [branchKind, setBranchKind] = useState('댓글');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'list'>('list');
  // null이면 현재 locale의 기본 안내를 표시한다.
  const [notice, setNotice] = useState<string | null>(null);
  const selected = ideas.find((idea) => idea.id === openedId);
  const children = branches.filter((branch) => branch.ideaId === openedId);
  const shown = selected
    ? children.filter((branch) => branch.parentId === null)
    : ideas;
  const layout = mapLayout(shown.length);

  function openIdea(id: string | null) {
    setOpenedId(id);
    setReplyId(null);
    setEditingId(null);
    setBranchDraft('');
  }
  function move(id: string, position: number) {
    try {
      setIdeas(reorderIdeas(ideas, id, position));
      setNotice(copy.notices.reordered);
    } catch {
      // reorderIdeas는 범위 오류와 대상 없음만 던진다.
      setNotice(
        ideas.some((idea) => idea.id === id)
          ? copy.notices.priorityRange.replace('{max}', String(ideas.length))
          : copy.notices.notFound,
      );
    }
  }
  function edit(id: string, content: string) {
    setEditingId(id);
    setEditContent(content);
  }
  function saveEdit() {
    try {
      const updated = createIdea(editContent, '', editingId ?? '');
      setIdeas(
        ideas.map((idea) =>
          idea.id === editingId
            ? { ...idea, title: updated.title, content: updated.content }
            : idea,
        ),
      );
      setBranches(
        branches.map((branch) =>
          branch.id === editingId
            ? { ...branch, title: updated.title, content: updated.content }
            : branch,
        ),
      );
      setEditingId(null);
      setNotice(copy.notices.edited);
    } catch {
      setNotice(copy.notices.length);
    }
  }
  function renderBranches(parentId: string | null): React.ReactNode {
    return children
      .filter((branch) => branch.parentId === parentId)
      .map((branch) => (
        <li key={branch.id} className={s.branch}>
          <div className={s.detailMeta}>
            <span>{labelOf(copy.branchKinds, branch.category)}</span>
            <span>{copy.branchOwner}</span>
          </div>
          <h4>{branch.title}</h4>
          <p>{branch.content}</p>
          <div className={s.actions}>
            <CommonButton
              size="sm"
              onClick={() => {
                setReplyId(branch.id);
                setNotice(
                  copy.notices.replying.replace('{title}', branch.title),
                );
              }}
            >
              {copy.reply}
            </CommonButton>
            <CommonButton
              size="sm"
              onClick={() => edit(branch.id, branch.content)}
            >
              {copy.edit}
            </CommonButton>
          </div>
          {children.some((child) => child.parentId === branch.id) && (
            <ul className={s.replies}>{renderBranches(branch.id)}</ul>
          )}
        </li>
      ));
  }

  return (
    <div className={`page ${s.page}`}>
      <div className={s.heading}>
        <div>
          <h1>
            {copy.titleLine1}
            <br />
            {copy.titleLine2}
            <span className="accentDot" />
          </h1>
          <p>{copy.subtitle}</p>
        </div>
        <CommonButtonLink href="/lab">{backToLab}</CommonButtonLink>
      </div>
      <div className={s.prototype}>
        <span aria-hidden="true">◌</span>
        <span>
          <strong>{copy.prototypeTitle}</strong> · {copy.prototypeNote}
        </span>
      </div>
      <div className={s.workspace}>
        <aside className={s.compose}>
          <span className={s.kicker}>01 / CAPTURE</span>
          <h2>{copy.composeTitle}</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const next = createIdea(draft, category, crypto.randomUUID());
                setIdeas([...ideas, next]);
                openIdea(next.id);
                setDraft('');
                setNotice(copy.notices.added);
              } catch {
                setNotice(copy.notices.length);
              }
            }}
          >
            <label htmlFor="idea-draft">{copy.draftLabel}</label>
            <CommonTextArea
              id="idea-draft"
              required
              maxLength={3000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={copy.draftPlaceholder}
            />
            <div className={s.inputHint}>
              <span>{copy.titleHint}</span>
              <span>
                {copy.counter.replace('{count}', String(draft.length))}
              </span>
            </div>
            <label htmlFor="idea-category">{copy.categoryLabel}</label>
            <CommonSelectBox
              id="idea-category"
              value={category}
              onValueChange={setCategory}
              options={Object.entries(copy.categories).map(
                ([value, label]) => ({ value, label }),
              )}
            />
            <CommonButton type="submit" variant="primary">
              {copy.submit}
            </CommonButton>
          </form>
          <p className={s.composeNote}>{copy.composeNote}</p>
        </aside>
        <section className={s.board} aria-label={copy.boardLabel}>
          <div className={s.boardHeader}>
            <div>
              <span className={s.kicker}>02 / EXPLORE</span>
              <h2>
                {selected ? selected.title : copy.myIdeas}{' '}
                <span>{shown.length}</span>
              </h2>
            </div>
            <div
              className={s.viewSwitch}
              role="group"
              aria-label={copy.viewMode}
            >
              {(['list', 'map'] as const).map((mode) => (
                <CommonButton
                  key={mode}
                  size="sm"
                  variant={view === mode ? 'primary' : 'ghost'}
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                >
                  {mode === 'list' ? copy.list : copy.map}
                </CommonButton>
              ))}
            </div>
          </div>
          {selected && (
            <div className={s.actions}>
              <CommonButton size="sm" onClick={() => openIdea(null)}>
                {copy.backToList}
              </CommonButton>
              <span className={s.composeNote}>{copy.viewingBranches}</span>
            </div>
          )}
          {view === 'map' ? (
            <div
              className={s.mapViewport}
              tabIndex={0}
              role="region"
              aria-label={copy.mapLabel}
            >
              <div className={s.map} style={{ height: layout.height }}>
                <svg
                  className={s.connections}
                  width="860"
                  height={layout.height}
                  aria-hidden="true"
                >
                  {layout.nodes.map((node, index) => {
                    const fromX = index % 2 === 0 ? 350 : 510;
                    const toX = index % 2 === 0 ? node.left + 280 : node.left;
                    return (
                      <path
                        key={shown[index].id}
                        d={`M ${fromX} ${layout.height / 2} C ${fromX} ${node.top + 50}, ${toX} ${layout.height / 2}, ${toX} ${node.top + 50}`}
                      />
                    );
                  })}
                </svg>
                <div
                  className={s.rootNode}
                  style={{ top: layout.height / 2 - 48 }}
                >
                  <span>OZ</span>
                  <strong>{selected ? copy.rootSelected : copy.rootAll}</strong>
                  <small>
                    {(selected
                      ? copy.rootBranchCount
                      : copy.rootIdeaCount
                    ).replace('{count}', String(shown.length))}
                  </small>
                </div>
                {shown.map((idea, index) => (
                  <button
                    type="button"
                    key={idea.id}
                    className={s.node}
                    style={{
                      left: layout.nodes[index].left,
                      top: layout.nodes[index].top,
                    }}
                    onClick={() =>
                      selected ? edit(idea.id, idea.content) : openIdea(idea.id)
                    }
                  >
                    <span className={s.nodeMeta}>
                      {labelOf(
                        selected ? copy.branchKinds : copy.categories,
                        idea.category,
                      )}
                      <span>
                        {selected
                          ? copy.editContent
                          : copy.priority.replace(
                              '{position}',
                              String(index + 1),
                            )}
                      </span>
                    </span>
                    <strong>{idea.title}</strong>
                  </button>
                ))}
              </div>
            </div>
          ) : !selected ? (
            <div className={s.priorityList}>
              {ideas.map((idea, index) => (
                <article
                  key={idea.id}
                  className={s.ideaRow}
                  onDragOver={(event) => {
                    event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id = event.dataTransfer.getData('text/plain');
                    if (dragId && id === dragId) move(id, index + 1);
                    setDragId(null);
                  }}
                >
                  <button
                    className={s.dragHandle}
                    draggable
                    aria-label={copy.dragLabel.replace('{title}', idea.title)}
                    onDragStart={(event) => {
                      setDragId(idea.id);
                      event.dataTransfer.setData('text/plain', idea.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDragId(null)}
                  >
                    ⠿
                  </button>
                  <CommonInput
                    key={`${idea.id}-${index}`}
                    className={s.priorityInput}
                    type="number"
                    min={1}
                    max={ideas.length}
                    defaultValue={index + 1}
                    aria-label={copy.priorityLabel.replace(
                      '{title}',
                      idea.title,
                    )}
                    onBlur={(event) => {
                      const value = Number(event.target.value);
                      if (value !== index + 1) move(idea.id, value);
                      event.target.value = String(index + 1);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                  />
                  <button
                    className={s.ideaOpen}
                    onClick={() => openIdea(idea.id)}
                  >
                    <small>
                      {labelOf(copy.categories, idea.category)} ·{' '}
                      {labelOf(copy.statuses, idea.status)}
                    </small>
                    <strong>{idea.title}</strong>
                    <span>
                      {copy.branchCount.replace(
                        '{count}',
                        String(
                          branches.filter((branch) => branch.ideaId === idea.id)
                            .length,
                        ),
                      )}
                    </span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className={s.composeNote}>{copy.belowNote}</p>
          )}
          <p className={s.liveNotice} role="status">
            {notice ?? copy.notices.initial}
          </p>
          {selected && (
            <section className={s.detail} aria-label={copy.detailLabel}>
              <div className={s.detailMeta}>
                <span>
                  {labelOf(copy.categories, selected.category)} /{' '}
                  {labelOf(copy.statuses, selected.status)}
                </span>
                <span>{copy.mainIdeaOwner}</span>
              </div>
              <h3>{selected.title}</h3>
              <p>{selected.content}</p>
              <CommonButton
                size="sm"
                onClick={() => edit(selected.id, selected.content)}
              >
                {copy.editIdea}
              </CommonButton>
              <h3>
                {copy.branchesTitle} <small>{children.length}</small>
              </h3>
              {children.length ? (
                <ul className={s.branchList}>{renderBranches(null)}</ul>
              ) : (
                <p>{copy.noBranches}</p>
              )}
              <form
                className={s.branchForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  try {
                    const branch: IdeaBranch = {
                      ...createIdea(
                        branchDraft,
                        branchKind,
                        crypto.randomUUID(),
                      ),
                      ideaId: selected.id,
                      parentId: replyId,
                    };
                    setBranches([...branches, branch]);
                    setBranchDraft('');
                    setReplyId(null);
                    setNotice(copy.notices.branchAdded);
                  } catch {
                    setNotice(copy.notices.length);
                  }
                }}
              >
                <label htmlFor="branch-kind">{copy.branchKindLabel}</label>
                <CommonSelectBox
                  id="branch-kind"
                  value={branchKind}
                  onValueChange={setBranchKind}
                  options={Object.entries(copy.branchKinds).map(
                    ([value, label]) => ({ value, label }),
                  )}
                />
                {replyId && (
                  <div className={s.replyTarget}>
                    {copy.replyTarget}{' '}
                    {children.find((branch) => branch.id === replyId)?.title}{' '}
                    <CommonButton size="sm" onClick={() => setReplyId(null)}>
                      {copy.cancelReply}
                    </CommonButton>
                  </div>
                )}
                <label htmlFor="branch-content">
                  {replyId ? copy.replyContent : copy.branchContent}
                </label>
                <CommonTextArea
                  id="branch-content"
                  value={branchDraft}
                  onChange={(event) => setBranchDraft(event.target.value)}
                  required
                  maxLength={3000}
                  placeholder={copy.branchPlaceholder}
                />
                <CommonButton variant="primary" type="submit">
                  {replyId ? copy.addReply : copy.addBranch}
                </CommonButton>
              </form>
            </section>
          )}
          {editingId && (
            <section className={s.detail} aria-label={copy.editSection}>
              <h3>{copy.editSection}</h3>
              <form
                className={s.branchForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  saveEdit();
                }}
              >
                <label htmlFor="edit-content">{copy.editLabel}</label>
                <CommonTextArea
                  autoFocus
                  id="edit-content"
                  required
                  maxLength={3000}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                />
                <div className={s.actions}>
                  <CommonButton variant="primary" type="submit">
                    {copy.applyEdit}
                  </CommonButton>
                  <CommonButton onClick={() => setEditingId(null)}>
                    {copy.cancelEdit}
                  </CommonButton>
                </div>
              </form>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
