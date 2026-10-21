'use client';
import { SelectBox } from '@/components/ui/SelectBox';
import { TextArea } from '@/components/ui/TextArea';
import { Input } from '@/components/ui/Input';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import {
  createIdea,
  initialIdeas,
  initialBranches,
  mapLayout,
  reorderIdeas,
  type IdeaBranch,
} from './model';
import s from './ideas.module.css';

export function IdeaPlayground() {
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
  const [notice, setNotice] = useState(
    '숫자가 작을수록 먼저 보여요. 드래그하거나 순위를 입력해 정렬하세요.',
  );
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
      setNotice('우선순위를 변경했습니다. 화면에서만 유지됩니다.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : '순위를 확인해 주세요.',
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
      setNotice('내용을 수정했습니다. 화면에서만 유지됩니다.');
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : '내용을 확인해 주세요.',
      );
    }
  }
  function renderBranches(parentId: string | null): React.ReactNode {
    return children
      .filter((branch) => branch.parentId === parentId)
      .map((branch) => (
        <li key={branch.id} className={s.branch}>
          <div className={s.detailMeta}>
            <span>{branch.category}</span>
            <span>나 · 화면 예시</span>
          </div>
          <h4>{branch.title}</h4>
          <p>{branch.content}</p>
          <div className={s.actions}>
            <Button
              size="sm"
              onClick={() => {
                setReplyId(branch.id);
                setNotice(`“${branch.title}”에 답글을 작성합니다.`);
              }}
            >
              답글 달기
            </Button>
            <Button size="sm" onClick={() => edit(branch.id, branch.content)}>
              수정
            </Button>
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
          <span className="eyebrow">OZ · IDEA GARDEN</span>
          <h1>
            생각을 모으고,
            <br />
            다음 단계로
            <span className="accentDot" />
          </h1>
          <p>아이디어에서 설계, 구현 이슈까지. 하나의 흐름으로 이어보세요.</p>
        </div>
        <ButtonLink href="/guide">가이드로 돌아가기 ↗</ButtonLink>
      </div>
      <div className={s.prototype}>
        <span aria-hidden="true">◌</span>
        <span>
          <strong>개인 저장소 화면 초안</strong> · 로그인·DB 연결 전입니다.
          추가·수정·순서는 새로고침하면 초기화됩니다.
        </span>
      </div>
      <div className={s.workspace}>
        <aside className={s.compose}>
          <span className={s.kicker}>01 / CAPTURE</span>
          <h2>새 메인 아이디어</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                const next = createIdea(draft, category, crypto.randomUUID());
                setIdeas([...ideas, next]);
                openIdea(next.id);
                setDraft('');
                setNotice('메인 아이디어를 추가했습니다.');
              } catch (error) {
                setNotice(
                  error instanceof Error
                    ? error.message
                    : '내용을 확인해 주세요.',
                );
              }
            }}
          >
            <label htmlFor="idea-draft">아이디어 메모</label>
            <TextArea
              id="idea-draft"
              required
              maxLength={3000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                '첫 줄은 제목, 다음 줄부터 자유롭게\n어떤 가능성을 만들어볼까요?'
              }
            />
            <div className={s.inputHint}>
              <span>첫 줄을 제목으로 사용해요.</span>
              <span>{draft.length} / 3,000</span>
            </div>
            <label htmlFor="idea-category">어떤 생각인가요?</label>
            <SelectBox
              id="idea-category"
              value={category}
              onValueChange={setCategory}
              options={['미분류', '제품', '개발', '자동화'].map((value) => ({
                value,
                label: value,
              }))}
            />
            <Button type="submit" variant="primary">
              아이디어 담기 ↗
            </Button>
          </form>
          <p className={s.composeNote}>
            메인은 큰 주제입니다. 내용을 열어 댓글·설계·구현 이슈를
            덧붙여보세요.
          </p>
        </aside>
        <section className={s.board} aria-label="아이디어 보기">
          <div className={s.boardHeader}>
            <div>
              <span className={s.kicker}>02 / EXPLORE</span>
              <h2>
                {selected ? selected.title : '나의 메인 아이디어'}{' '}
                <span>{shown.length}</span>
              </h2>
            </div>
            <div className={s.viewSwitch} role="group" aria-label="보기 방식">
              {(['list', 'map'] as const).map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={view === mode ? 'primary' : 'ghost'}
                  aria-pressed={view === mode}
                  onClick={() => setView(mode)}
                >
                  {mode === 'list' ? '목록' : '마인드맵'}
                </Button>
              ))}
            </div>
          </div>
          {selected && (
            <div className={s.actions}>
              <Button size="sm" onClick={() => openIdea(null)}>
                ← 메인 아이디어 목록
              </Button>
              <span className={s.composeNote}>
                이 아이디어의 가지를 보고 있어요.
              </span>
            </div>
          )}
          {view === 'map' ? (
            <div
              className={s.mapViewport}
              tabIndex={0}
              role="region"
              aria-label="아이디어 마인드맵 — 좌우로 스크롤할 수 있습니다"
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
                  <strong>
                    {selected ? '선택한 아이디어' : '나의 아이디어'}
                  </strong>
                  <small>
                    {shown.length}개의 {selected ? '가지' : '메인 아이디어'}
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
                      {idea.category}
                      <span>
                        {selected ? '내용 수정 ↗' : `우선순위 ${index + 1}`}
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
                    aria-label={`${idea.title} 순서 드래그`}
                    onDragStart={(event) => {
                      setDragId(idea.id);
                      event.dataTransfer.setData('text/plain', idea.id);
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => setDragId(null)}
                  >
                    ⠿
                  </button>
                  <Input
                    key={`${idea.id}-${index}`}
                    className={s.priorityInput}
                    type="number"
                    min={1}
                    max={ideas.length}
                    defaultValue={index + 1}
                    aria-label={`${idea.title} 우선순위`}
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
                      {idea.category} · {idea.status}
                    </small>
                    <strong>{idea.title}</strong>
                    <span>
                      가지{' '}
                      {
                        branches.filter((branch) => branch.ideaId === idea.id)
                          .length
                      }
                      개 ↗
                    </span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className={s.composeNote}>
              아래에서 원문과 연결된 가지·답글을 확인하세요.
            </p>
          )}
          <p className={s.liveNotice} role="status">
            {notice}
          </p>
          {selected && (
            <section className={s.detail} aria-label="선택한 아이디어 상세">
              <div className={s.detailMeta}>
                <span>
                  {selected.category} / {selected.status}
                </span>
                <span>메인 아이디어 · 나</span>
              </div>
              <h3>{selected.title}</h3>
              <p>{selected.content}</p>
              <Button
                size="sm"
                onClick={() => edit(selected.id, selected.content)}
              >
                아이디어 수정
              </Button>
              <h3>
                연결된 가지 <small>{children.length}</small>
              </h3>
              {children.length ? (
                <ul className={s.branchList}>{renderBranches(null)}</ul>
              ) : (
                <p>아직 가지가 없어요. 첫 생각을 덧붙여보세요.</p>
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
                    setNotice('가지를 추가했습니다. 화면에서만 유지됩니다.');
                  } catch (error) {
                    setNotice(
                      error instanceof Error
                        ? error.message
                        : '내용을 확인해 주세요.',
                    );
                  }
                }}
              >
                <label htmlFor="branch-kind">덧붙일 내용 유형</label>
                <SelectBox
                  id="branch-kind"
                  value={branchKind}
                  onValueChange={setBranchKind}
                  options={['댓글', '설계', '구현 이슈', '연결 포스트'].map(
                    (value) => ({ value, label: value }),
                  )}
                />
                {replyId && (
                  <div className={s.replyTarget}>
                    답글 대상:{' '}
                    {children.find((branch) => branch.id === replyId)?.title}{' '}
                    <Button size="sm" onClick={() => setReplyId(null)}>
                      답글 취소
                    </Button>
                  </div>
                )}
                <label htmlFor="branch-content">
                  {replyId ? '답글 내용' : '새 가지 내용'}
                </label>
                <TextArea
                  id="branch-content"
                  value={branchDraft}
                  onChange={(event) => setBranchDraft(event.target.value)}
                  required
                  maxLength={3000}
                  placeholder="첫 줄은 제목, 다음 줄부터 상세 내용을 적어주세요."
                />
                <Button variant="primary" type="submit">
                  {replyId ? '답글 추가' : '가지 추가'}
                </Button>
              </form>
            </section>
          )}
          {editingId && (
            <section className={s.detail} aria-label="내용 수정">
              <h3>내용 수정</h3>
              <form
                className={s.branchForm}
                onSubmit={(event) => {
                  event.preventDefault();
                  saveEdit();
                }}
              >
                <label htmlFor="edit-content">수정할 내용</label>
                <TextArea
                  autoFocus
                  id="edit-content"
                  required
                  maxLength={3000}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                />
                <div className={s.actions}>
                  <Button variant="primary" type="submit">
                    수정 적용
                  </Button>
                  <Button onClick={() => setEditingId(null)}>수정 취소</Button>
                </div>
              </form>
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
