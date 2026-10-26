'use client';
import { useEffect, useState } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import {
  parseRichText,
  richTextExtensions,
  textStyleFontOptions,
  textStyleSizeOptions,
} from '@/lib/rich-text';
import { CommonSelectBox } from './CommonSelectBox';
import { CommonFileUpload } from './CommonFileUpload';
import { CommonButton } from './CommonButton';
import s from './CommonRichText.module.css';
export function CommonRichTextEditor({
  id,
  label,
  value,
  onChange,
  contentClassName,
  disabled = false,
  onUploadBusyChange,
}: {
  id: string;
  label: string;
  value: JSONContent;
  onChange: (value: JSONContent, text: string) => void;
  contentClassName?: string;
  disabled?: boolean;
  onUploadBusyChange?: (busy: boolean) => void;
}) {
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableSize, setTableSize] = useState({ rows: 2, columns: 3 });
  const editor = useEditor({
    extensions: richTextExtensions,
    content: parseRichText(value) ?? undefined,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
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
      if (editor.isFocused) onChange(editor.getJSON(), editor.getText());
    },
  });
  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);
  useEffect(() => {
    const content = parseRichText(value);
    if (
      editor &&
      content &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(content)
    )
      editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, value]);
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
      active: editor.isActive('blockquote'),
      run: () => editor.chain().focus().toggleBlockquote().run(),
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
  const currentAlignment = editor.getAttributes(blockType).textAlign ?? 'left';
  const alignments = [
    { value: 'left', label: '왼쪽 정렬' },
    { value: 'center', label: '가운데 정렬' },
    { value: 'right', label: '오른쪽 정렬' },
  ] as const;
  const updateTextStyle = (
    attribute: 'fontFamily' | 'fontSize',
    value: string,
  ) => {
    const attrs = { ...textStyle, [attribute]: value || null };
    const chain = editor.chain().focus();
    if (!attrs.fontFamily && !attrs.fontSize)
      chain.unsetMark('textStyle').run();
    else chain.setMark('textStyle', attrs).run();
  };
  return (
    <div className={s.editor}>
      <div className={s.toolbar} role="group" aria-label={label + ' 서식'}>
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
            onClick={() =>
              editor
                .chain()
                .focus()
                .updateAttributes(blockType, { textAlign: alignment })
                .run()
            }
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
        {tools.map((tool) => (
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
                  제목: <b>H₂</b>,
                  '글머리 목록': '• ≡',
                  '번호 목록': '1. ≡',
                  인용: '❝',
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
                          setTablePickerOpen(false);
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
      {editor.isActive('table') && (
        <div className={s.tableTools}>
          <CommonButton
            size="sm"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            행 추가
          </CommonButton>
          <CommonButton
            size="sm"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            열 추가
          </CommonButton>
          <CommonButton
            size="sm"
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            행 삭제
          </CommonButton>
          <CommonButton
            size="sm"
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            열 삭제
          </CommonButton>
          <CommonButton
            size="sm"
            disabled={!editor.can().mergeCells()}
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            셀 병합
          </CommonButton>
          <CommonButton
            size="sm"
            disabled={!editor.can().splitCell()}
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            셀 나누기
          </CommonButton>
          <CommonButton
            size="sm"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            표 삭제
          </CommonButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
