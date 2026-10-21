'use client';
import { Input } from '@/components/ui/Input';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import { richTextExtensions, parseRichText } from '@/lib/rich-text';
import { SelectBox } from './SelectBox';
import { FileUpload } from './FileUpload';
import { Button } from './Button';
import s from './RichText.module.css';
export function RichTextEditor({
  id,
  label,
  value,
  onChange,
  disabled = false,
  onUploadBusyChange,
}: {
  id: string;
  label: string;
  value: JSONContent;
  onChange: (value: JSONContent, text: string) => void;
  disabled?: boolean;
  onUploadBusyChange?: (busy: boolean) => void;
}) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
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
        class: s.editable,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON(), editor.getText()),
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
  ];
  return (
    <div className={s.editor}>
      <div className={s.toolbar} role="group" aria-label={label + ' 서식'}>
        <SelectBox
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
        {tools.map((tool) => (
          <Button
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
              }[tool.label]
            }
          </Button>
        ))}
        <Button
          size="sm"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          되돌리기
        </Button>
        <Button
          size="sm"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          다시 실행
        </Button>
      </div>
      <div className={s.imageTools}>
        <FileUpload
          label="이미지 삽입"
          onBusyChange={onUploadBusyChange}
          imagesOnly
          compact
          onUploaded={(asset) => {
            if (!editor.isDestroyed)
              editor
                .chain()
                .focus()
                .setImage({ src: asset.url, alt: asset.name })
                .run();
          }}
        />
        <Button
          size="sm"
          disabled={!editor.isActive('image')}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().deleteSelection().run()}
        >
          선택한 이미지 삭제
        </Button>
        {editor.isActive('image') && (
          <label>
            이미지 너비(px)
            <Input
              aria-label="이미지 너비"
              type="number"
              min={50}
              max={20000}
              value={editor.getAttributes('image').width ?? ''}
              onChange={(event) => {
                const width = Number(event.target.value);
                if (!Number.isFinite(width) || width < 50 || width > 20000)
                  return;
                const attrs = editor.getAttributes('image');
                const image = Array.from(
                  editor.view.dom.querySelectorAll('img'),
                ).find((image) => image.getAttribute('src') === attrs.src);
                const ratio =
                  attrs.width && attrs.height
                    ? attrs.height / attrs.width
                    : image?.naturalWidth
                      ? image.naturalHeight / image.naturalWidth
                      : null;
                if (!ratio) return;
                editor
                  .chain()
                  .updateAttributes('image', {
                    width,
                    height: Math.round(width * ratio),
                  })
                  .run();
              }}
            />
          </label>
        )}
        <small>
          네 모서리 드래그로 크기 조절 · PNG·JPEG·WebP · 최대 10MB · 커서 위치에
          삽입
        </small>
      </div>
      <div className={s.tableTools}>
        <label>
          행{' '}
          <Input
            aria-label="표 행 수"
            type="number"
            min={1}
            max={20}
            value={rows}
            onChange={(event) => setRows(Number(event.target.value))}
          />
        </label>
        <label>
          열{' '}
          <Input
            aria-label="표 열 수"
            type="number"
            min={1}
            max={10}
            value={columns}
            onChange={(event) => setColumns(Number(event.target.value))}
          />
        </label>
        <Button
          size="sm"
          disabled={
            !Number.isInteger(rows) ||
            rows < 1 ||
            rows > 20 ||
            !Number.isInteger(columns) ||
            columns < 1 ||
            columns > 10
          }
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols: columns, withHeaderRow: true })
              .run()
          }
        >
          표 삽입
        </Button>
        {editor.isActive('table') && (
          <>
            <Button
              size="sm"
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              행 추가
            </Button>
            <Button
              size="sm"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              열 추가
            </Button>
            <Button
              size="sm"
              onClick={() => editor.chain().focus().deleteRow().run()}
            >
              행 삭제
            </Button>
            <Button
              size="sm"
              onClick={() => editor.chain().focus().deleteColumn().run()}
            >
              열 삭제
            </Button>
            <Button
              size="sm"
              disabled={!editor.can().mergeCells()}
              onClick={() => editor.chain().focus().mergeCells().run()}
            >
              셀 병합
            </Button>
            <Button
              size="sm"
              disabled={!editor.can().splitCell()}
              onClick={() => editor.chain().focus().splitCell().run()}
            >
              셀 나누기
            </Button>
            <Button
              size="sm"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              표 삭제
            </Button>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
