'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonInput } from '@/components/ui/CommonInput';
import { CommonGrid, type CommonGridColumn } from '@/components/ui/CommonGrid';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonSearchPanel } from '@/components/ui/CommonSearchPanel';
import type { CodeGroup, CodeItem } from '@/lib/common-codes';
import s from './admin.module.css';
import c from './codes.module.css';

type Form = {
  kind: 'group' | 'code';
  isNew: boolean;
  key: string;
  groupKey: string;
  nameKo: string;
  nameEn: string;
  description: string;
  position: number;
  isActive: boolean;
  revision: string;
};
const blank = (kind: 'group' | 'code', groupKey = ''): Form => ({
  kind,
  isNew: true,
  key: '',
  groupKey,
  nameKo: '',
  nameEn: '',
  description: '',
  position: 0,
  isActive: true,
  revision: '',
});

export function CodeManager({
  groups,
  codes,
}: {
  groups: CodeGroup[];
  codes: CodeItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(groups[0]?.key ?? '');
  const [groupKeyword, setGroupKeyword] = useState('');
  const [appliedGroupKeyword, setAppliedGroupKeyword] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const group = groups.find((g) => g.key === selected);
  const filtered = codes.filter((item) => item.groupKey === selected);
  const filteredGroups = groups.filter((g) =>
    `${g.key} ${g.nameKo} ${g.nameEn}`
      .toLowerCase()
      .includes(appliedGroupKeyword.trim().toLowerCase()),
  );
  const editGroup = (g: CodeGroup) =>
    setForm({ ...blank('group'), ...g, isNew: false });
  const editCode = (item: CodeItem) =>
    setForm({ ...blank('code'), ...item, key: item.code, isNew: false });
  async function save() {
    if (!form || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || '저장하지 못했습니다.');
        return;
      }
      if (form.kind === 'group') setSelected(form.key);
      setForm(null);
      router.refresh();
    } catch {
      setMessage('저장하지 못했습니다. 입력은 유지됩니다.');
    } finally {
      setBusy(false);
    }
  }
  const groupColumns: CommonGridColumn<CodeGroup>[] = [
    {
      key: 'key',
      header: '그룹 코드',
      render: (g) => (
        <button
          type="button"
          className={s.gridTitle}
          onClick={() => setSelected(g.key)}
          aria-pressed={selected === g.key}
        >
          {g.key}
        </button>
      ),
    },
    { key: 'name', header: '그룹명', render: (g) => g.nameKo },
    {
      key: 'active',
      header: '사용',
      render: (g) => (g.isActive ? 'Y' : 'N'),
      align: 'center',
    },
    {
      key: 'edit',
      header: '관리',
      render: (g) => (
        <CommonButton
          size="sm"
          onClick={() => {
            setMessage('');
            editGroup(g);
          }}
        >
          수정
        </CommonButton>
      ),
      align: 'center',
    },
  ];
  const codeColumns: CommonGridColumn<CodeItem>[] = [
    {
      key: 'code',
      header: '코드',
      render: (item) => (
        <button
          type="button"
          className={s.gridTitle}
          onClick={() => {
            setMessage('');
            editCode(item);
          }}
        >
          {item.code}
        </button>
      ),
    },
    { key: 'ko', header: '한글명', render: (item) => item.nameKo },
    { key: 'en', header: '영문명', render: (item) => item.nameEn },
    {
      key: 'position',
      header: '순서',
      render: (item) => item.position,
      align: 'center',
    },
    {
      key: 'active',
      header: '사용',
      render: (item) => (item.isActive ? 'Y' : 'N'),
      align: 'center',
    },
  ];
  return (
    <section className={c.workspace}>
      <CommonSearchPanel
        onSearch={() => setAppliedGroupKeyword(groupKeyword)}
        onReset={() => {
          setGroupKeyword('');
          setAppliedGroupKeyword('');
        }}
      >
        <label className={s.searchKeyword}>
          <span>그룹 검색어</span>
          <CommonInput
            type="search"
            aria-label="그룹 검색"
            placeholder="그룹 코드·한글명·영문명"
            value={groupKeyword}
            onChange={(e) => setGroupKeyword(e.target.value)}
          />
        </label>
      </CommonSearchPanel>
      <div className={s.listPanel}>
        <div className={s.heading}>
          <div>
            <h2>코드 그룹</h2>
            <p>그룹을 선택하면 상세 코드가 표시됩니다.</p>
          </div>
          <CommonButton
            variant="primary"
            onClick={() => {
              setMessage('');
              setForm(blank('group'));
            }}
          >
            그룹 등록
          </CommonButton>
        </div>
        <CommonGrid
          rows={filteredGroups}
          columns={groupColumns}
          getRowKey={(g) => g.key}
          caption="공통코드 그룹 목록"
          minWidth={520}
          wrapClassName={s.gridWrap}
          tableClassName={s.grid}
        />
      </div>
      <div className={s.listPanel}>
        <div className={s.heading}>
          <div>
            <h2>상세 코드 {group ? `· ${group.nameKo}` : ''}</h2>
            <p>총 {filtered.length}건 · 코드나 이름을 선택해 수정합니다.</p>
          </div>
          <CommonButton
            variant="primary"
            disabled={!group}
            onClick={() => {
              setMessage('');
              setForm(blank('code', selected));
            }}
          >
            코드 등록
          </CommonButton>
        </div>
        <CommonGrid
          rows={filtered}
          columns={codeColumns}
          getRowKey={(item) => item.code}
          caption="상세 코드 목록"
          minWidth={700}
          wrapClassName={s.gridWrap}
          tableClassName={s.grid}
        />
        <p className={c.note}>
          코드값은 등록 후 변경할 수 없습니다. 사용 중인 기술의 한글명은 변경할
          수 없습니다. 그룹 사용 여부는 관리용 표시이며 상세 코드의 사용 여부와
          별개입니다.
        </p>
      </div>
      <CommonModal
        open={!!form}
        title={`${form?.kind === 'group' ? '그룹' : '상세 코드'} ${form?.isNew ? '등록' : '수정'}`}
        size="md"
        onClose={() => {
          if (!busy) setForm(null);
        }}
        actions={
          <>
            <CommonButton disabled={busy} onClick={() => setForm(null)}>
              취소
            </CommonButton>
            <CommonButton variant="primary" disabled={busy} onClick={save}>
              저장
            </CommonButton>
          </>
        }
      >
        {form && (
          <div className={c.form}>
            {form.kind === 'code' && <p>그룹: {form.groupKey}</p>}
            <label>
              {form.kind === 'group' ? '그룹 코드' : '코드'}
              <CommonInput
                value={form.key}
                disabled={!form.isNew || busy}
                maxLength={60}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="영문, 숫자, - 또는 _"
              />
            </label>
            <label>
              한글명
              <CommonInput
                value={form.nameKo}
                disabled={busy}
                maxLength={100}
                onChange={(e) => setForm({ ...form, nameKo: e.target.value })}
              />
            </label>
            <label>
              영문명
              <CommonInput
                value={form.nameEn}
                disabled={busy}
                maxLength={100}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              />
            </label>
            {form.kind === 'group' ? (
              <label>
                설명
                <CommonInput
                  value={form.description}
                  disabled={busy}
                  maxLength={1000}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
            ) : (
              <label>
                정렬 순서
                <CommonInput
                  type="number"
                  min={0}
                  max={2147483647}
                  value={form.position}
                  disabled={busy}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      position:
                        e.target.value === '' ? -1 : Number(e.target.value),
                    })
                  }
                />
              </label>
            )}
            <label className={c.active}>
              <CommonInput
                type="checkbox"
                checked={form.isActive}
                disabled={busy}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
              />
              사용
            </label>
            {message && <p role="alert">{message}</p>}
          </div>
        )}
      </CommonModal>
    </section>
  );
}
