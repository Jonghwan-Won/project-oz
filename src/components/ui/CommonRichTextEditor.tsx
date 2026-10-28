'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import {
  parseRichText,
  richTextExtensions,
  textStyleFontOptions,
  textStyleSizeOptions,
  isSafeLink,
} from '@/lib/rich-text';
import { CellSelection } from '@tiptap/pm/tables';
import {
  tableSelectionBounds,
  leaveInsertedTable,
  equalizeTableCells,
  mergeTableCells,
  splitTableCell,
  setTableBorders,
  setTableBorderStyle,
} from '@/lib/editor-table';
import { TableToolIcon } from './TableToolIcon';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { EditorColorPicker } from './EditorColorPicker';
import { CommonSelectBox } from './CommonSelectBox';
import { CommonFileUpload } from './CommonFileUpload';
import { CommonFilePicker } from './CommonFilePicker';
import { CommonButton } from './CommonButton';
import { CommonLoading } from './CommonLoading';
import { maxUploadBytes } from '@/lib/files';
import { uploadFile } from '@/lib/upload-file';
import s from './CommonRichText.module.css';
const tableMenuOptions: BubbleMenuProps['options'] = {
  strategy: 'fixed',
  placement: 'bottom',
  offset: 12,
  flip: false,
  shift: { padding: 12 },
};
const showTableTools: NonNullable<BubbleMenuProps['shouldShow']> = ({
  editor,
  view,
}) =>
  !view.dom.hasAttribute('data-cell-dragging') &&
  editor.isEditable &&
  editor.isActive('table') &&
  (view.hasFocus() || !!document.activeElement?.closest('[data-table-tools]'));
export function CommonRichTextEditor({
  id,
  label,
  value,
  onChange,
  contentClassName,
  disabled = false,
  uploadsEnabled = true,
  localImages,
  onLocalImage,
  onUploadBusyChange,
}: {
  id: string;
  label: string;
  value: JSONContent;
  onChange: (value: JSONContent, text: string) => void;
  contentClassName?: string;
  disabled?: boolean;
  uploadsEnabled?: boolean;
  localImages?: ReadonlySet<string>;
  onLocalImage?: (file: File) => string;
  onUploadBusyChange?: (busy: boolean) => void;
}) {
  const [tablePanel, setTablePanel] = useState('');
  const [splitSize, setSplitSize] = useState({ columns: 2, rows: 1 });
  const [splitError, setSplitError] = useState('');
  const [tableToolsCollapsed, setTableToolsCollapsed] = useState(false);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableSize, setTableSize] = useState({ rows: 2, columns: 3 });
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteMessage, setPasteMessage] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const lastEmitted = useRef<JSONContent | null>(null);
  const pasteController = useRef<AbortController | null>(null);
  useEffect(() => () => pasteController.current?.abort(), []);
  const editor = useEditor({
    extensions: richTextExtensions,
    content: parseRichText(value, localImages) ?? undefined,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      handleDOMEvents: {
        pointerdown: (view, event) => {
          if (
            !(event.target instanceof Element) ||
            !event.target.closest('td,th')
          )
            return false;
          view.dom.setAttribute('data-cell-dragging', 'true');
          view.dispatch(view.state.tr.setMeta('table-tools', 'hide'));
          const finish = () => {
            view.dom.removeAttribute('data-cell-dragging');
            // BubbleMenu positions before showing; update again once visible.
            requestAnimationFrame(() => {
              if (view.isDestroyed) return;
              const active = view.hasFocus() && editor?.isActive('table');
              view.dispatch(
                view.state.tr.setMeta('table-tools', active ? 'show' : 'hide'),
              );
              if (active)
                view.dispatch(
                  view.state.tr.setMeta('table-tools', 'updatePosition'),
                );
            });
            window.removeEventListener('pointerup', finish);
            window.removeEventListener('pointercancel', finish);
          };
          window.addEventListener('pointerup', finish);
          window.addEventListener('pointercancel', finish);
          return false;
        },
      },
      handlePaste: (view, event) => {
        const item = Array.from(event.clipboardData?.items ?? []).find(
          (entry) => entry.kind === 'file' && entry.type.startsWith('image/'),
        );
        if (!item) return false;
        event.preventDefault();
        if (
          (!uploadsEnabled && !onLocalImage) ||
          disabled ||
          pasteController.current
        )
          return true;
        const file = item.getAsFile();
        const extension =
          file?.type === 'image/png'
            ? 'png'
            : file?.type === 'image/jpeg'
              ? 'jpg'
              : file?.type === 'image/webp'
                ? 'webp'
                : null;
        if (!file || !extension) {
          setPasteMessage('PNG·JPEG·WebP 이미지를 붙여넣어 주세요.');
          return true;
        }
        if (file.size > maxUploadBytes) {
          setPasteMessage('파일은 10MB 이하여야 합니다.');
          return true;
        }
        if (!uploadsEnabled && onLocalImage) {
          setPasteMessage('');
          const node = view.state.schema.nodes.image.create({
            src: onLocalImage(file),
            alt: file.name,
          });
          view.dispatch(view.state.tr.replaceSelectionWith(node));
          return true;
        }
        const controller = new AbortController();
        pasteController.current = controller;
        setPasteMessage('');
        setPasteBusy(true);
        onUploadBusyChange?.(true);
        const image = new File([file], `clipboard.${extension}`, {
          type: file.type,
        });
        void uploadFile(image, controller.signal)
          .then((asset) => {
            if (!controller.signal.aborted && !view.isDestroyed) {
              const node = view.state.schema.nodes.image.create({
                src: asset.url,
                alt: asset.name,
              });
              view.dispatch(view.state.tr.replaceSelectionWith(node));
            }
          })
          .catch((error: unknown) => {
            if (!controller.signal.aborted)
              setPasteMessage(
                error instanceof Error
                  ? error.message
                  : '업로드에 실패했습니다.',
              );
          })
          .finally(() => {
            pasteController.current = null;
            setPasteBusy(false);
            onUploadBusyChange?.(false);
          });
        return true;
      },
      attributes: {
        id,
        role: 'textbox',
        'aria-label': label,
        'aria-multiline': 'true',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: [s.editable, contentClassName].filter(Boolean).join(' '),
      },
    },
    onUpdate: ({ editor }) => {
      const document = editor.getJSON();
      lastEmitted.current = document;
      onChange(document, editor.getText());
    },
    onSelectionUpdate: () => setTablePanel(''),
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    if (editor)
      editor.view.dispatch(
        editor.state.tr.setMeta('table-tools', 'updatePosition'),
      );
  }, [editor, tablePanel, tableToolsCollapsed]);
  useEffect(() => {
    // Parent echoes must not reset selection after Tiptap appends a trailing paragraph.
    if (value === lastEmitted.current) return;
    const content = parseRichText(value, localImages);
    if (
      editor &&
      content &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(content)
    )
      editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, value, localImages]);
  const tableAnchor = useCallback(() => {
    if (!editor) return null;
    const bounds = tableSelectionBounds(editor);
    if (!bounds) return null;
    return {
      getBoundingClientRect: () => tableSelectionBounds(editor) ?? bounds,
    };
  }, [editor]);
  const tableMenuContainer = useCallback(
    () =>
      editor?.view.dom.closest<HTMLElement>('[role="dialog"]') ?? document.body,
    [editor],
  );
  if (!editor) return <p role="status">에디터를 준비하고 있어요.</p>;
  const tools = [
    {
      label: '굵게',
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: '기울임',
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: '밑줄',
      active: editor.isActive('underline'),
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: '취소선',
      active: editor.isActive('strike'),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: '글머리 목록',
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: '번호 목록',
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: '인용',
      active:
        editor.isActive('blockquote') &&
        !editor.isActive('blockquote', { quoteStyle: 'quotation' }),
      run: () => {
        if (editor.isActive('blockquote', { quoteStyle: 'quotation' }))
          editor
            .chain()
            .focus()
            .updateAttributes('blockquote', { quoteStyle: null })
            .run();
        else editor.chain().focus().toggleBlockquote().run();
      },
    },
    {
      label: '따옴표 인용',
      active: editor.isActive('blockquote', { quoteStyle: 'quotation' }),
      run: () => {
        if (editor.isActive('blockquote', { quoteStyle: 'quotation' }))
          editor.chain().focus().toggleBlockquote().run();
        else if (editor.isActive('blockquote'))
          editor
            .chain()
            .focus()
            .updateAttributes('blockquote', { quoteStyle: 'quotation' })
            .run();
        else
          editor
            .chain()
            .focus()
            .toggleBlockquote()
            .updateAttributes('blockquote', { quoteStyle: 'quotation' })
            .run();
      },
    },
    {
      label: '코드 블록',
      active: editor.isActive('codeBlock'),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: '구분선',
      active: false,
      run: () => editor.chain().focus().setHorizontalRule().run(),
    },
  ];
  const textStyle = editor.getAttributes('textStyle');
  const blockType = editor.isActive('image')
    ? 'image'
    : editor.isActive('heading')
      ? 'heading'
      : 'paragraph';
  const quoteActive = editor.isActive('blockquote', {
    quoteStyle: 'quotation',
  });
  const currentAlignment =
    (quoteActive ? editor.getAttributes('blockquote').textAlign : null) ??
    editor.getAttributes(blockType).textAlign ??
    'left';
  const alignments = [
    { value: 'left', label: '왼쪽 정렬' },
    { value: 'center', label: '가운데 정렬' },
    { value: 'right', label: '오른쪽 정렬' },
  ] as const;
  const updateTextStyle = (
    attribute: 'fontFamily' | 'fontSize' | 'color' | 'backgroundColor',
    value: string,
  ) => {
    const attrs = { ...textStyle, [attribute]: value || null };
    const chain = editor.chain().focus();
    if (
      !attrs.fontFamily &&
      !attrs.fontSize &&
      !attrs.color &&
      !attrs.backgroundColor
    )
      chain.unsetMark('textStyle').run();
    else chain.setMark('textStyle', attrs).run();
  };
  const cellsSelected =
    editor.state.selection instanceof CellSelection &&
    editor.state.selection.ranges.length > 1;
  const cellAttributes = editor.getAttributes(
    editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell',
  );
  return (
    <div className={s.editor}>
      <div className={s.toolbar} role="group" aria-label={label + ' 서식'}>
        <div className={s.toolbarRow}>
          <CommonSelectBox
            className={s.blockStyle}
            aria-label="문단 스타일"
            value={
              editor.isActive('heading', { level: 2 })
                ? '2'
                : editor.isActive('heading', { level: 3 })
                  ? '3'
                  : 'p'
            }
            onValueChange={(value) => {
              if (value === 'p') editor.chain().focus().setParagraph().run();
              else
                editor
                  .chain()
                  .focus()
                  .setHeading({ level: value === '2' ? 2 : 3 })
                  .run();
            }}
            options={[
              { value: 'p', label: '본문' },
              { value: '2', label: '제목 2' },
              { value: '3', label: '제목 3' },
            ]}
          />
          <CommonSelectBox
            className={s.blockStyle}
            aria-label="글꼴"
            value={textStyle.fontFamily ?? ''}
            onValueChange={(value) => updateTextStyle('fontFamily', value)}
            options={textStyleFontOptions}
          />
          <CommonSelectBox
            className={s.blockStyle}
            aria-label="글자 크기"
            value={textStyle.fontSize ?? ''}
            onValueChange={(value) => updateTextStyle('fontSize', value)}
            options={textStyleSizeOptions}
          />
          {alignments.map(({ value: alignment, label: alignmentLabel }) => (
            <CommonButton
              key={alignment}
              size="sm"
              variant="ghost"
              className={s.tool}
              title={alignmentLabel}
              aria-label={alignmentLabel}
              aria-pressed={currentAlignment === alignment}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const chain = editor
                  .chain()
                  .focus()
                  .updateAttributes(blockType, { textAlign: alignment });
                if (quoteActive)
                  chain.updateAttributes('blockquote', {
                    textAlign: alignment,
                  });
                chain.run();
              }}
            >
              <svg
                viewBox="0 0 20 20"
                width="18"
                height="18"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              >
                {alignment === 'left' ? (
                  <path d="M3 4h14M3 8h10M3 12h14M3 16h10" />
                ) : alignment === 'center' ? (
                  <path d="M3 4h14M5 8h10M3 12h14M5 16h10" />
                ) : (
                  <path d="M3 4h14M7 8h10M3 12h14M7 16h10" />
                )}
              </svg>
            </CommonButton>
          ))}
          {tools.slice(0, 4).map((tool) => (
            <CommonButton
              key={tool.label}
              size="sm"
              variant="ghost"
              className={s.tool}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={tool.active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.run}
            >
              <span className={s.glyph}>
                {
                  {
                    굵게: <b>B</b>,
                    기울임: <i>I</i>,
                    밑줄: <u>U</u>,
                    취소선: <s>S</s>,
                    제목: <b>H₂</b>,
                    '글머리 목록': '• ≡',
                    '번호 목록': '1. ≡',
                    인용: '❝',
                    '따옴표 인용': '“ ”',
                    '코드 블록': '</>',
                    구분선: '―',
                  }[tool.label]
                }
              </span>
            </CommonButton>
          ))}
          <EditorColorPicker
            label="글자 색상"
            value={textStyle.color}
            onChange={(color) => updateTextStyle('color', color)}
          />
          <EditorColorPicker
            label="글자 배경색"
            value={textStyle.backgroundColor}
            onChange={(color) => updateTextStyle('backgroundColor', color)}
          />
        </div>
        <div className={s.toolbarRow}>
          {tools.slice(4).map((tool) => (
            <CommonButton
              key={tool.label}
              size="sm"
              variant="ghost"
              className={s.tool}
              title={tool.label}
              aria-label={tool.label}
              aria-pressed={tool.active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.run}
            >
              <span className={s.glyph}>
                {
                  {
                    굵게: <b>B</b>,
                    기울임: <i>I</i>,
                    밑줄: <u>U</u>,
                    취소선: <s>S</s>,
                    제목: <b>H₂</b>,
                    '글머리 목록': '• ≡',
                    '번호 목록': '1. ≡',
                    인용: '❝',
                    '따옴표 인용': '“ ”',
                    '코드 블록': '</>',
                    구분선: '―',
                  }[tool.label]
                }
              </span>
            </CommonButton>
          ))}
          <CommonButton
            size="sm"
            variant="ghost"
            className={s.tool}
            title="내어쓰기"
            aria-label="내어쓰기"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (editor.isActive('listItem'))
                editor.chain().focus().liftListItem('listItem').run();
              else
                editor
                  .chain()
                  .focus()
                  .updateAttributes(blockType, {
                    indent: Math.max(
                      0,
                      (editor.getAttributes(blockType).indent ?? 0) - 1,
                    ),
                  })
                  .run();
            }}
          >
            ⇤
          </CommonButton>
          <CommonButton
            size="sm"
            variant="ghost"
            className={s.tool}
            title="들여쓰기"
            aria-label="들여쓰기"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (editor.isActive('listItem'))
                editor.chain().focus().sinkListItem('listItem').run();
              else
                editor
                  .chain()
                  .focus()
                  .updateAttributes(blockType, {
                    indent: Math.min(
                      6,
                      (editor.getAttributes(blockType).indent ?? 0) + 1,
                    ),
                  })
                  .run();
            }}
          >
            ⇥
          </CommonButton>
          <div className={s.tablePickerWrap}>
            <CommonButton
              size="sm"
              variant="ghost"
              className={s.tool}
              title="링크"
              aria-label="링크"
              aria-expanded={linkOpen}
              aria-pressed={editor.isActive('link')}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setLinkUrl(editor.getAttributes('link').href ?? '');
                setLinkError('');
                setLinkOpen(!linkOpen);
              }}
            >
              ↗
            </CommonButton>
            {linkOpen && (
              <form
                className={s.linkPicker}
                onSubmit={(event) => {
                  event.preventDefault();
                  const href = linkUrl.trim();
                  if (!isSafeLink(href)) {
                    setLinkError(
                      'http://, https:// 또는 사이트 내부 경로를 입력해 주세요.',
                    );
                    return;
                  }
                  if (
                    editor.state.selection.empty &&
                    !editor.isActive('link')
                  ) {
                    setLinkError('링크를 적용할 텍스트를 먼저 선택해 주세요.');
                    return;
                  }
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange('link')
                    .setLink({ href })
                    .run();
                  setLinkOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    setLinkOpen(false);
                    editor.commands.focus();
                  }
                }}
              >
                <label>
                  링크 주소
                  <input
                    autoFocus
                    type="text"
                    value={linkUrl}
                    onChange={(event) => setLinkUrl(event.currentTarget.value)}
                    placeholder="https://example.com"
                  />
                </label>
                {linkError && <p role="alert">{linkError}</p>}
                <div>
                  <CommonButton type="submit" size="sm" variant="primary">
                    적용
                  </CommonButton>
                  <CommonButton
                    size="sm"
                    onClick={() => {
                      editor
                        .chain()
                        .focus()
                        .extendMarkRange('link')
                        .unsetLink()
                        .run();
                      setLinkOpen(false);
                    }}
                  >
                    링크 제거
                  </CommonButton>
                  <CommonButton
                    size="sm"
                    onClick={() => {
                      setLinkOpen(false);
                      editor.commands.focus();
                    }}
                  >
                    취소
                  </CommonButton>
                </div>
              </form>
            )}
          </div>
          <CommonButton
            size="sm"
            variant="ghost"
            className={s.tool}
            title="되돌리기"
            aria-label="되돌리기"
            disabled={!editor.can().undo()}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <span className={s.glyph}>↶</span>
          </CommonButton>
          <CommonButton
            size="sm"
            variant="ghost"
            className={s.tool}
            title="다시 실행"
            aria-label="다시 실행"
            disabled={!editor.can().redo()}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <span className={s.glyph}>↷</span>
          </CommonButton>
          <div className={s.tablePickerWrap}>
            <CommonButton
              size="sm"
              variant="ghost"
              className={s.tool}
              aria-label="표 삽입"
              aria-expanded={tablePickerOpen}
              title="표 삽입"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setTablePickerOpen(!tablePickerOpen)}
            >
              <svg
                viewBox="0 0 20 20"
                width="18"
                height="18"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="16" height="14" rx="1" />
                <path d="M2 8h16M7 3v14m6-14v14" />
              </svg>
            </CommonButton>
            {tablePickerOpen && (
              <div
                className={s.tablePicker}
                role="group"
                aria-label="표 크기 선택"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    setTablePickerOpen(false);
                  }
                }}
              >
                <span aria-live="polite">
                  {tableSize.columns}열 × {tableSize.rows}행
                </span>
                <div className={s.tableGrid}>
                  {Array.from({ length: 20 }, (_, row) =>
                    Array.from({ length: 10 }, (_, column) => {
                      const rows = row + 1;
                      const columns = column + 1;
                      const active =
                        rows <= tableSize.rows && columns <= tableSize.columns;
                      return (
                        <button
                          key={`${rows}-${columns}`}
                          type="button"
                          aria-label={`${columns}열 ${rows}행 표 삽입`}
                          className={active ? s.tableCellActive : undefined}
                          onMouseEnter={() => setTableSize({ rows, columns })}
                          onFocus={() => setTableSize({ rows, columns })}
                          onClick={() => {
                            editor
                              .chain()
                              .focus()
                              .insertTable({
                                rows,
                                cols: columns,
                                withHeaderRow: false,
                              })
                              .run();
                            leaveInsertedTable(editor);
                            setTablePickerOpen(false);
                            requestAnimationFrame(() => {
                              if (!editor.isDestroyed) editor.view.focus();
                            });
                          }}
                        />
                      );
                    }),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {uploadsEnabled && (
        <div className={s.imageTools}>
          <CommonFileUpload
            label="이미지 삽입"
            onBusyChange={onUploadBusyChange}
            imagesOnly
            compact
            bare
            icon={
              <svg
                viewBox="0 0 20 20"
                width="18"
                height="18"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="16" height="14" rx="2" />
                <circle cx="7" cy="8" r="1.5" />
                <path d="m3 15 5-4 3 2 3-4 3 6" />
              </svg>
            }
            onUploaded={(asset) => {
              if (!editor.isDestroyed)
                editor
                  .chain()
                  .focus()
                  .setImage({ src: asset.url, alt: asset.name })
                  .run();
            }}
          />
          <small>PNG · JPEG · WebP / 최대 10MB · 커서 위치에 삽입</small>
        </div>
      )}
      {!uploadsEnabled && onLocalImage && (
        <div className={s.imageTools}>
          <CommonFilePicker
            label="이미지 삽입"
            compact
            disabled={disabled}
            accept="image/png,image/jpeg,image/webp"
            onSelect={(file) => {
              if (
                !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
              ) {
                setPasteMessage('PNG·JPEG·WebP 이미지를 선택해 주세요.');
                return;
              }
              if (file.size > maxUploadBytes) {
                setPasteMessage('파일은 10MB 이하여야 합니다.');
                return;
              }
              setPasteMessage('');
              editor
                .chain()
                .focus()
                .setImage({ src: onLocalImage(file), alt: file.name })
                .run();
            }}
          />
          <small>PNG · JPEG · WebP / 최대 10MB · 브라우저에서만 표시</small>
        </div>
      )}
      {pasteMessage && <p role="alert">{pasteMessage}</p>}
      <CommonLoading open={pasteBusy} />
      <BubbleMenu
        appendTo={tableMenuContainer}
        editor={editor}
        shouldShow={showTableTools}
        options={tableMenuOptions}
        getReferencedVirtualElement={tableAnchor}
        updateDelay={0}
        pluginKey="table-tools"
        style={{ zIndex: 310 }}
      >
        <div
          className={`${s.tableTools} ${tableToolsCollapsed ? s.tableToolsCollapsed : ''}`}
          data-table-tools
          data-panel={tablePanel}
          onMouseDown={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest('button')
            )
              event.preventDefault();
          }}
        >
          <CommonButton
            onClick={() => setTableToolsCollapsed(!tableToolsCollapsed)}
            className={s.tableToolsToggle}
            title={tableToolsCollapsed ? '표 도구 펼치기' : '표 도구 접기'}
            aria-label={tableToolsCollapsed ? '표 도구 펼치기' : '표 도구 접기'}
            aria-expanded={!tableToolsCollapsed}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                d={tableToolsCollapsed ? 'm4 6 4 4 4-4' : 'm4 10 4-4 4 4'}
              />
            </svg>
          </CommonButton>
          <div className={s.tableToolRow} role="group" aria-label="표 스타일">
            {[
              ['배경색', 'backgroundColor'],
              ['테두리', 'borders'],
              ['테두리색', 'borderColor'],
              ['테두리 두께', 'borderWidth'],
              ['테두리 종류', 'borderStyle'],
              ['폭 맞춤', 'fit'],
            ].map(([label, panel]) => (
              <CommonButton
                key={panel}
                size="sm"
                title={label}
                aria-label={label}
                onClick={() =>
                  panel === 'fit'
                    ? editor
                        .chain()
                        .focus()
                        .updateAttributes('table', { tableWidth: '100%' })
                        .run()
                    : setTablePanel(panel)
                }
              >
                <TableToolIcon name={panel} />
                {['borders', 'borderWidth', 'borderStyle'].includes(panel) && (
                  <span className={s.toolChevron}>▾</span>
                )}
              </CommonButton>
            ))}
          </div>
          <div
            className={s.tableToolRow}
            role="group"
            aria-label="행과 열 편집"
          >
            {[
              {
                label: '위에 행 추가',
                icon: 'rowBefore',
                run: () => editor.chain().focus().addRowBefore().run(),
              },
              {
                label: '아래에 행 추가',
                icon: 'rowAfter',
                run: () => editor.chain().focus().addRowAfter().run(),
              },
              {
                label: '왼쪽 열 추가',
                icon: 'columnBefore',
                run: () => editor.chain().focus().addColumnBefore().run(),
              },
              {
                label: '오른쪽 열 추가',
                icon: 'columnAfter',
                run: () => editor.chain().focus().addColumnAfter().run(),
              },
              {
                label: '행 삭제',
                icon: 'rowDelete',
                run: () => editor.chain().focus().deleteRow().run(),
              },
              {
                label: '열 삭제',
                icon: 'columnDelete',
                run: () => editor.chain().focus().deleteColumn().run(),
              },
              {
                label: '표 삭제',
                icon: 'delete',
                run: () => editor.chain().focus().deleteTable().run(),
              },
            ].map(({ label, icon, run }) => (
              <CommonButton
                key={icon}
                size="sm"
                title={label}
                aria-label={label}
                onClick={run}
              >
                <TableToolIcon name={icon} />
              </CommonButton>
            ))}
          </div>
          <div className={s.tableToolRow} role="group" aria-label="셀 편집">
            <CommonButton
              size="sm"
              title="정렬"
              aria-label="정렬"
              onClick={() => setTablePanel('cellAlign')}
            >
              <TableToolIcon name="cellAlign" />
              <span className={s.toolChevron}>▾</span>
            </CommonButton>
            <CommonButton
              size="sm"
              title="세로 정렬"
              aria-label="세로 정렬"
              onClick={() => setTablePanel('verticalAlign')}
            >
              <TableToolIcon name="verticalAlign" />
              <span className={s.toolChevron}>▾</span>
            </CommonButton>
            {cellsSelected ? (
              <>
                <CommonButton
                  size="sm"
                  title="셀 크기"
                  aria-label="셀 크기"
                  onClick={() => setTablePanel('size')}
                >
                  <TableToolIcon name="size" />
                  <span className={s.toolChevron}>▾</span>
                </CommonButton>
                <CommonButton
                  size="sm"
                  title="셀 병합"
                  aria-label="셀 병합"
                  disabled={!editor.can().mergeCells()}
                  onClick={() => mergeTableCells(editor)}
                >
                  <TableToolIcon name="merge" />
                </CommonButton>
              </>
            ) : (
              <CommonButton
                size="sm"
                title="셀 나누기"
                aria-label="셀 나누기"
                onClick={() => setTablePanel('split')}
              >
                <TableToolIcon name="split" />
              </CommonButton>
            )}
            <CommonButton
              size="sm"
              disabled
              title="셀 속성"
              aria-label="셀 속성"
              onClick={() => setTablePanel('cell')}
            >
              <TableToolIcon name="cell" />
            </CommonButton>
            <CommonButton
              size="sm"
              disabled
              title="표 속성"
              aria-label="표 속성"
              onClick={() => setTablePanel('table')}
            >
              <TableToolIcon name="table" />
            </CommonButton>
          </div>
          <div className={s.tableProperties} hidden={tablePanel !== 'size'}>
            {(
              [
                ['width', '열 너비 같게'],
                ['height', '행 높이 같게'],
                ['both', '셀 크기 같게'],
              ] as const
            ).map(([axis, label]) => (
              <CommonButton
                key={axis}
                size="sm"
                onClick={() => {
                  equalizeTableCells(editor, axis);
                  setTablePanel('');
                }}
              >
                {label}
              </CommonButton>
            ))}
          </div>
          <div
            className={s.tableProperties}
            hidden={
              ![
                'borderWidth',
                'borderStyle',
                'cellAlign',
                'verticalAlign',
              ].includes(tablePanel)
            }
          >
            {(tablePanel === 'borderWidth'
              ? Array.from({ length: 10 }, (_, i) => [
                  String(i + 1),
                  String(i + 1) + 'px',
                ])
              : tablePanel === 'borderStyle'
                ? [
                    ['none', '없음'],
                    ['solid', '실선'],
                    ['dotted', '점선'],
                    ['dashed', '파선'],
                    ['double', '이중선'],
                  ]
                : tablePanel === 'cellAlign'
                  ? [
                      ['left', '왼쪽 정렬'],
                      ['center', '가운데 정렬'],
                      ['right', '오른쪽 정렬'],
                      ['justify', '양쪽 정렬'],
                    ]
                  : tablePanel === 'verticalAlign'
                    ? [
                        ['top', '위쪽 정렬'],
                        ['middle', '가운데 정렬'],
                        ['bottom', '아래쪽 정렬'],
                      ]
                    : []
            ).map(([value, label]) => (
              <CommonButton
                key={value}
                size="sm"
                onClick={() => {
                  if (tablePanel === 'borderStyle')
                    setTableBorderStyle(editor, value);
                  else
                    editor
                      .chain()
                      .focus()
                      .setCellAttribute(
                        tablePanel,
                        tablePanel === 'borderWidth' ? Number(value) : value,
                      )
                      .run();
                  setTablePanel('');
                }}
              >
                {label}
              </CommonButton>
            ))}
          </div>
          <div className={s.tableProperties} hidden={tablePanel !== 'borders'}>
            <div className={s.borderPresets}>
              {[
                ['all', '모든 테두리'],
                ['none', '테두리 없음'],
                ['outer', '바깥 테두리'],
                ['inner', '안쪽 테두리'],
                ['top', '위 테두리'],
                ['bottom', '아래 테두리'],
                ['left', '왼쪽 테두리'],
                ['right', '오른쪽 테두리'],
                ['horizontal', '안쪽 가로 테두리'],
                ['vertical', '안쪽 세로 테두리'],
              ].map(([mode, label]) => (
                <CommonButton
                  key={mode}
                  size="sm"
                  title={label}
                  aria-label={label}
                  onClick={() => {
                    setTableBorders(editor, mode);
                    setTablePanel('');
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 2h16v16H2z M2 10h16 M10 2v16"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="1 2"
                      opacity=".35"
                    />
                    <path
                      d={
                        (
                          {
                            all: 'M2 2h16v16H2z M2 10h16 M10 2v16',
                            none: '',
                            outer: 'M2 2h16v16H2z',
                            inner: 'M2 10h16 M10 2v16',
                            top: 'M2 2h16',
                            bottom: 'M2 18h16',
                            left: 'M2 2v16',
                            right: 'M18 2v16',
                            horizontal: 'M2 10h16',
                            vertical: 'M10 2v16',
                          } as Record<string, string>
                        )[mode]
                      }
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </CommonButton>
              ))}
            </div>
          </div>
          <div className={s.tableProperties} hidden={tablePanel !== 'split'}>
            <div className={s.propertyFields}>
              <label>
                열 개수
                <input
                  aria-label="나눌 열 개수"
                  type="number"
                  min="1"
                  max="10"
                  value={splitSize.columns}
                  onChange={(event) =>
                    setSplitSize({
                      ...splitSize,
                      columns: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                행 개수
                <input
                  aria-label="나눌 행 개수"
                  type="number"
                  min="1"
                  max="10"
                  value={splitSize.rows}
                  onChange={(event) =>
                    setSplitSize({
                      ...splitSize,
                      rows: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
            {splitError && <p role="alert">{splitError}</p>}
            <div className={s.tablePanelActions}>
              <CommonButton
                size="sm"
                onClick={() => {
                  if (
                    splitTableCell(editor, splitSize.columns, splitSize.rows)
                  ) {
                    setSplitError('');
                    setTablePanel('');
                  } else
                    setSplitError(
                      '행·열은 1~10으로 입력해 주세요. 표는 최대 10,000칸까지 나눌 수 있습니다.',
                    );
                }}
              >
                확인
              </CommonButton>
              <CommonButton
                size="sm"
                onClick={() => {
                  setSplitError('');
                  setTablePanel('');
                }}
              >
                취소
              </CommonButton>
            </div>
          </div>
          {['backgroundColor', 'borderColor'].includes(tablePanel) && (
            <EditorColorPicker
              inline
              label={tablePanel === 'backgroundColor' ? '배경색' : '테두리색'}
              value={cellAttributes[tablePanel]}
              onChange={(color) =>
                editor
                  .chain()
                  .focus()
                  .setCellAttribute(tablePanel, color || null)
                  .run()
              }
            />
          )}
          {tablePanel && (
            <CommonButton
              className={s.panelBack}
              size="sm"
              title="뒤로가기"
              aria-label="뒤로가기"
              onClick={() => setTablePanel('')}
            >
              ←
            </CommonButton>
          )}
          <div className={s.tableProperties} hidden={tablePanel !== 'cell'}>
            <CommonButton
              size="sm"
              onClick={() => editor.chain().focus().toggleHeaderCell().run()}
            >
              제목 셀 전환
            </CommonButton>
            <div className={s.propertyFields}>
              <label>
                테두리 두께{' '}
                <select
                  aria-label="셀 테두리 두께"
                  value={
                    editor.getAttributes('tableCell').borderWidth ??
                    editor.getAttributes('tableHeader').borderWidth ??
                    ''
                  }
                  onChange={(event) =>
                    editor
                      .chain()
                      .focus()
                      .setCellAttribute(
                        'borderWidth',
                        event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : null,
                      )
                      .run()
                  }
                >
                  <option value="">기본</option>
                  <option value="1">1px</option>
                  <option value="2">2px</option>
                  <option value="3">3px</option>
                  {[4, 5, 6, 7, 8, 9, 10].map((width) => (
                    <option key={width} value={width}>
                      {width}px
                    </option>
                  ))}
                </select>
              </label>
              <label>
                테두리 종류{' '}
                <select
                  aria-label="셀 테두리 종류"
                  value={
                    editor.getAttributes('tableCell').borderStyle ??
                    editor.getAttributes('tableHeader').borderStyle ??
                    ''
                  }
                  onChange={(event) =>
                    setTableBorderStyle(
                      editor,
                      event.currentTarget.value || null,
                    )
                  }
                >
                  <option value="">기본</option>
                  <option value="solid">실선</option>
                  <option value="dashed">파선</option>
                  <option value="dotted">점선</option>
                  <option value="double">이중선</option>
                  <option value="none">없음</option>
                </select>
              </label>
              <label>
                셀 세로 정렬{' '}
                <select
                  aria-label="셀 세로 정렬"
                  value={
                    editor.getAttributes('tableCell').verticalAlign ??
                    editor.getAttributes('tableHeader').verticalAlign ??
                    ''
                  }
                  onChange={(event) =>
                    editor
                      .chain()
                      .focus()
                      .setCellAttribute(
                        'verticalAlign',
                        event.currentTarget.value || null,
                      )
                      .run()
                  }
                >
                  <option value="">기본</option>
                  <option value="top">위</option>
                  <option value="middle">가운데</option>
                  <option value="bottom">아래</option>
                </select>
              </label>
              {[
                {
                  name: 'cellAlign',
                  label: '가로 정렬',
                  options: [
                    ['left', '왼쪽'],
                    ['center', '가운데'],
                    ['right', '오른쪽'],
                    ['justify', '양쪽'],
                  ],
                },
                {
                  name: 'cellPadding',
                  label: '안쪽 여백',
                  options: ['0px', '4px', '8px', '12px', '16px', '24px'].map(
                    (value) => [value, value],
                  ),
                },
                {
                  name: 'cellWrap',
                  label: '줄바꿈',
                  options: [
                    ['normal', '허용'],
                    ['nowrap', '금지'],
                  ],
                },
              ].map(({ name, label: propertyLabel, options }) => (
                <label key={name}>
                  {propertyLabel}
                  <select
                    aria-label={propertyLabel}
                    value={cellAttributes[name] ?? ''}
                    onChange={(event) =>
                      editor
                        .chain()
                        .focus()
                        .setCellAttribute(
                          name,
                          event.currentTarget.value || null,
                        )
                        .run()
                    }
                  >
                    <option value="">기본</option>
                    {options.map(([value, title]) => (
                      <option key={value} value={value}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              <CommonButton
                size="sm"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .setCellAttribute('backgroundColor', null)
                    .setCellAttribute('borderColor', null)
                    .setCellAttribute('borderWidth', null)
                    .setCellAttribute('borderStyle', null)
                    .setCellAttribute('cellBorderTop', null)
                    .setCellAttribute('cellBorderRight', null)
                    .setCellAttribute('cellBorderBottom', null)
                    .setCellAttribute('cellBorderLeft', null)
                    .setCellAttribute('verticalAlign', null)
                    .setCellAttribute('cellAlign', null)
                    .setCellAttribute('cellPadding', null)
                    .setCellAttribute('cellWrap', null)
                    .run()
                }
              >
                셀 스타일 초기화
              </CommonButton>
            </div>
          </div>
          <div className={s.tableProperties} hidden={tablePanel !== 'table'}>
            <CommonButton
              size="sm"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            >
              제목 행 전환
            </CommonButton>
            <CommonButton
              size="sm"
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
            >
              제목 열 전환
            </CommonButton>
            <div className={s.propertyFields}>
              {[
                {
                  name: 'tableWidth',
                  label: '표 너비',
                  options: [
                    ['auto', '자동'],
                    ['50%', '50%'],
                    ['75%', '75%'],
                    ['100%', '폭 맞춤'],
                  ],
                },
                {
                  name: 'tableLayout',
                  label: '표 레이아웃',
                  options: [
                    ['auto', '자동'],
                    ['fixed', '고정'],
                  ],
                },
                {
                  name: 'tableAlign',
                  label: '표 배치',
                  options: [
                    ['0 auto', '왼쪽'],
                    ['auto', '가운데'],
                    ['auto 0', '오른쪽'],
                  ],
                },
              ].map(({ name, label: propertyLabel, options }) => (
                <label key={name}>
                  {propertyLabel}
                  <select
                    aria-label={propertyLabel}
                    value={editor.getAttributes('table')[name] ?? ''}
                    onChange={(event) =>
                      editor
                        .chain()
                        .focus()
                        .updateAttributes('table', {
                          [name]: event.currentTarget.value || null,
                        })
                        .run()
                    }
                  >
                    {name === 'tableWidth' &&
                      /^\d+px$/.test(
                        editor.getAttributes('table').tableWidth ?? '',
                      ) && (
                        <option
                          value={editor.getAttributes('table').tableWidth}
                        >
                          {editor.getAttributes('table').tableWidth} (드래그)
                        </option>
                      )}
                    <option value="">기본</option>
                    {options.map(([value, title]) => (
                      <option key={value} value={value}>
                        {title}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
        </div>
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
