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
import type { ColorPickerLabels } from './EditorColorPicker';
import { maxUploadBytes } from '@/lib/files';
import { uploadFile } from '@/lib/upload-file';
import s from './CommonRichText.module.css';

const defaultColorPickerLabels: ColorPickerLabels = {
  noColor: '색상 없음',
  recent: '최근 사용한 색',
  custom: '다른 색',
  apply: '적용',
};

/**
 * 에디터 도구 문구. 관리자 화면은 기본 한국어를 쓰고, UI 가이드는 locale에 맞는
 * 문구를 넘긴다. 테스트가 이 파일만 변환해 실행하므로 기본값을 이 파일에 둔다.
 */
export const defaultRichTextEditorLabels = {
  loading: '에디터를 준비하고 있어요.',
  formatting: '{label} 서식',
  blockStyle: '문단 스타일',
  paragraph: '본문',
  heading2: '제목 2',
  heading3: '제목 3',
  fontFamily: '글꼴',
  fontFamilies: { '': '기본', system: '고딕', serif: '명조', mono: '고정폭' },
  fontSize: '글자 크기',
  fontSizePlaceholder: '크기',
  alignLeft: '왼쪽 정렬',
  alignCenter: '가운데 정렬',
  alignRight: '오른쪽 정렬',
  alignJustify: '양쪽 정렬',
  bold: '굵게',
  italic: '기울임',
  underline: '밑줄',
  strike: '취소선',
  bulletList: '글머리 목록',
  orderedList: '번호 목록',
  blockquote: '인용',
  quotation: '따옴표 인용',
  codeBlock: '코드 블록',
  horizontalRule: '구분선',
  textColor: '글자 색상',
  textBackground: '글자 배경색',
  outdent: '내어쓰기',
  indent: '들여쓰기',
  link: '링크',
  linkUrl: '링크 주소',
  linkInvalid: 'http://, https:// 또는 사이트 내부 경로를 입력해 주세요.',
  linkNoSelection: '링크를 적용할 텍스트를 먼저 선택해 주세요.',
  removeLink: '링크 제거',
  apply: '적용',
  confirm: '확인',
  cancel: '취소',
  undo: '되돌리기',
  redo: '다시 실행',
  insertTable: '표 삽입',
  tableSizePicker: '표 크기 선택',
  tableSize: '{columns}열 × {rows}행',
  insertTableSize: '{columns}열 {rows}행 표 삽입',
  insertImage: '이미지 삽입',
  uploadHint: 'PNG · JPEG · WebP / 최대 10MB · 커서 위치에 삽입',
  localImageHint: 'PNG · JPEG · WebP / 최대 10MB · 브라우저에서만 표시',
  pasteImageType: 'PNG·JPEG·WebP 이미지를 붙여넣어 주세요.',
  selectImageType: 'PNG·JPEG·WebP 이미지를 선택해 주세요.',
  imageTooLarge: '파일은 10MB 이하여야 합니다.',
  uploadFailed: '업로드에 실패했습니다.',
  expandTableTools: '표 도구 펼치기',
  collapseTableTools: '표 도구 접기',
  tableStyle: '표 스타일',
  backgroundColor: '배경색',
  borders: '테두리',
  borderColor: '테두리색',
  borderWidth: '테두리 두께',
  borderStyle: '테두리 종류',
  fitWidth: '폭 맞춤',
  rowsAndColumns: '행과 열 편집',
  addRowBefore: '위에 행 추가',
  addRowAfter: '아래에 행 추가',
  addColumnBefore: '왼쪽 열 추가',
  addColumnAfter: '오른쪽 열 추가',
  deleteRow: '행 삭제',
  deleteColumn: '열 삭제',
  deleteTable: '표 삭제',
  cellEditing: '셀 편집',
  cellAlign: '정렬',
  verticalAlign: '세로 정렬',
  cellSize: '셀 크기',
  mergeCells: '셀 병합',
  splitCell: '셀 나누기',
  cellProperties: '셀 속성',
  tableProperties: '표 속성',
  equalWidth: '열 너비 같게',
  equalHeight: '행 높이 같게',
  equalSize: '셀 크기 같게',
  borderStyles: {
    none: '없음',
    solid: '실선',
    dotted: '점선',
    dashed: '파선',
    double: '이중선',
  },
  alignTop: '위쪽 정렬',
  alignMiddle: '가운데 정렬',
  alignBottom: '아래쪽 정렬',
  borderPresets: {
    all: '모든 테두리',
    none: '테두리 없음',
    outer: '바깥 테두리',
    inner: '안쪽 테두리',
    top: '위 테두리',
    bottom: '아래 테두리',
    left: '왼쪽 테두리',
    right: '오른쪽 테두리',
    horizontal: '안쪽 가로 테두리',
    vertical: '안쪽 세로 테두리',
  },
  splitColumns: '열 개수',
  splitRows: '행 개수',
  splitColumnsLabel: '나눌 열 개수',
  splitRowsLabel: '나눌 행 개수',
  splitError:
    '행·열은 1~10으로 입력해 주세요. 표는 최대 10,000칸까지 나눌 수 있습니다.',
  back: '뒤로가기',
  toggleHeaderCell: '제목 셀 전환',
  defaultOption: '기본',
  cellBorderWidth: '셀 테두리 두께',
  cellBorderStyle: '셀 테두리 종류',
  cellVerticalAlign: '셀 세로 정렬',
  top: '위',
  middle: '가운데',
  bottom: '아래',
  horizontalAlign: '가로 정렬',
  left: '왼쪽',
  center: '가운데',
  right: '오른쪽',
  justify: '양쪽',
  cellPadding: '안쪽 여백',
  cellWrap: '줄바꿈',
  wrapAllowed: '허용',
  wrapDisabled: '금지',
  resetCellStyle: '셀 스타일 초기화',
  toggleHeaderRow: '제목 행 전환',
  toggleHeaderColumn: '제목 열 전환',
  tableWidth: '표 너비',
  auto: '자동',
  fixed: '고정',
  tableLayout: '표 레이아웃',
  tableAlign: '표 배치',
  draggedWidth: '{width} (드래그)',
  colorPicker: defaultColorPickerLabels,
};
export type RichTextEditorLabels = typeof defaultRichTextEditorLabels;

const optionLabel = (
  names: Record<string, string>,
  option: { value: string; label: string },
) => ({ ...option, label: names[option.value] ?? option.label });
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
/** 이미지 삽입 버튼 아이콘. 업로드(관리자)와 로컬 미리보기(UI 가이드) 모두 같은 모양을 쓴다. */
function ImageInsertIcon() {
  return (
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
  );
}

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
  labels = defaultRichTextEditorLabels,
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
  labels?: RichTextEditorLabels;
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
    editable: !disabled,
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
          setPasteMessage(labels.pasteImageType);
          return true;
        }
        if (file.size > maxUploadBytes) {
          setPasteMessage(labels.imageTooLarge);
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
                error instanceof Error ? error.message : labels.uploadFailed,
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
    editor?.setEditable(!disabled, false);
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
  if (!editor) return <p role="status">{labels.loading}</p>;
  const tools = [
    {
      key: 'bold',
      label: labels.bold,
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      key: 'italic',
      label: labels.italic,
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: 'underline',
      label: labels.underline,
      active: editor.isActive('underline'),
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      key: 'strike',
      label: labels.strike,
      active: editor.isActive('strike'),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      key: 'bulletList',
      label: labels.bulletList,
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: 'orderedList',
      label: labels.orderedList,
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: 'blockquote',
      label: labels.blockquote,
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
      key: 'quotation',
      label: labels.quotation,
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
      key: 'codeBlock',
      label: labels.codeBlock,
      active: editor.isActive('codeBlock'),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      key: 'horizontalRule',
      label: labels.horizontalRule,
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
    { value: 'left', label: labels.alignLeft },
    { value: 'center', label: labels.alignCenter },
    { value: 'right', label: labels.alignRight },
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
      <fieldset disabled={disabled} className={s.controls}>
        <div
          className={s.toolbar}
          role="group"
          aria-label={labels.formatting.replace('{label}', label)}
        >
          <div className={s.toolbarRow}>
            <CommonSelectBox
              className={s.blockStyle}
              data-editor-control
              aria-label={labels.blockStyle}
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
                { value: 'p', label: labels.paragraph },
                { value: '2', label: labels.heading2 },
                { value: '3', label: labels.heading3 },
              ]}
            />
            <CommonSelectBox
              className={s.blockStyle}
              data-editor-control
              aria-label={labels.fontFamily}
              value={textStyle.fontFamily ?? ''}
              onValueChange={(value) => updateTextStyle('fontFamily', value)}
              options={textStyleFontOptions.map((option) =>
                optionLabel(labels.fontFamilies, option),
              )}
            />
            <CommonSelectBox
              className={s.blockStyle}
              data-editor-control
              aria-label={labels.fontSize}
              value={textStyle.fontSize ?? ''}
              onValueChange={(value) => updateTextStyle('fontSize', value)}
              options={textStyleSizeOptions.map((option) =>
                optionLabel({ '': labels.fontSizePlaceholder }, option),
              )}
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
                key={tool.key}
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
                      bold: <b>B</b>,
                      italic: <i>I</i>,
                      underline: <u>U</u>,
                      strike: <s>S</s>,
                      heading: <b>H₂</b>,
                      bulletList: '• ≡',
                      orderedList: '1. ≡',
                      blockquote: '❝',
                      quotation: '“ ”',
                      codeBlock: '</>',
                      horizontalRule: '―',
                    }[tool.key]
                  }
                </span>
              </CommonButton>
            ))}
            <EditorColorPicker
              label={labels.textColor}
              glyph="A"
              labels={labels.colorPicker}
              value={textStyle.color}
              onChange={(color) => updateTextStyle('color', color)}
            />
            <EditorColorPicker
              label={labels.textBackground}
              glyph="▣"
              labels={labels.colorPicker}
              value={textStyle.backgroundColor}
              onChange={(color) => updateTextStyle('backgroundColor', color)}
            />
          </div>
          <div className={s.toolbarRow}>
            {tools.slice(4).map((tool) => (
              <CommonButton
                key={tool.key}
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
                      bold: <b>B</b>,
                      italic: <i>I</i>,
                      underline: <u>U</u>,
                      strike: <s>S</s>,
                      heading: <b>H₂</b>,
                      bulletList: '• ≡',
                      orderedList: '1. ≡',
                      blockquote: '❝',
                      quotation: '“ ”',
                      codeBlock: '</>',
                      horizontalRule: '―',
                    }[tool.key]
                  }
                </span>
              </CommonButton>
            ))}
            <CommonButton
              size="sm"
              variant="ghost"
              className={s.tool}
              title={labels.outdent}
              aria-label={labels.outdent}
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
              title={labels.indent}
              aria-label={labels.indent}
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
                title={labels.link}
                aria-label={labels.link}
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
                      setLinkError(labels.linkInvalid);
                      return;
                    }
                    if (
                      editor.state.selection.empty &&
                      !editor.isActive('link')
                    ) {
                      setLinkError(labels.linkNoSelection);
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
                    {labels.linkUrl}
                    <input
                      autoFocus
                      type="text"
                      value={linkUrl}
                      onChange={(event) =>
                        setLinkUrl(event.currentTarget.value)
                      }
                      placeholder="https://example.com"
                    />
                  </label>
                  {linkError && <p role="alert">{linkError}</p>}
                  <div>
                    <CommonButton type="submit" size="sm" variant="primary">
                      {labels.apply}
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
                      {labels.removeLink}
                    </CommonButton>
                    <CommonButton
                      size="sm"
                      onClick={() => {
                        setLinkOpen(false);
                        editor.commands.focus();
                      }}
                    >
                      {labels.cancel}
                    </CommonButton>
                  </div>
                </form>
              )}
            </div>
            <CommonButton
              size="sm"
              variant="ghost"
              className={s.tool}
              title={labels.undo}
              aria-label={labels.undo}
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <span className={s.glyph}>↶</span>
            </CommonButton>
            <CommonButton
              size="sm"
              variant="ghost"
              className={s.tool}
              title={labels.redo}
              aria-label={labels.redo}
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
                aria-label={labels.insertTable}
                aria-expanded={tablePickerOpen}
                title={labels.insertTable}
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
                  aria-label={labels.tableSizePicker}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      event.stopPropagation();
                      setTablePickerOpen(false);
                    }
                  }}
                >
                  <span aria-live="polite">
                    {labels.tableSize
                      .replace('{columns}', String(tableSize.columns))
                      .replace('{rows}', String(tableSize.rows))}
                  </span>
                  <div className={s.tableGrid}>
                    {Array.from({ length: 20 }, (_, row) =>
                      Array.from({ length: 10 }, (_, column) => {
                        const rows = row + 1;
                        const columns = column + 1;
                        const active =
                          rows <= tableSize.rows &&
                          columns <= tableSize.columns;
                        return (
                          <button
                            key={`${rows}-${columns}`}
                            type="button"
                            aria-label={labels.insertTableSize
                              .replace('{columns}', String(columns))
                              .replace('{rows}', String(rows))}
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
              label={labels.insertImage}
              onBusyChange={onUploadBusyChange}
              imagesOnly
              compact
              bare
              icon={<ImageInsertIcon />}
              onUploaded={(asset) => {
                if (!editor.isDestroyed)
                  editor
                    .chain()
                    .focus()
                    .setImage({ src: asset.url, alt: asset.name })
                    .run();
              }}
            />
            <small>{labels.uploadHint}</small>
          </div>
        )}
        {!uploadsEnabled && onLocalImage && (
          <div className={s.imageTools}>
            <CommonFilePicker
              label={labels.insertImage}
              compact
              icon={<ImageInsertIcon />}
              disabled={disabled}
              accept="image/png,image/jpeg,image/webp"
              onSelect={(file) => {
                if (
                  !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
                ) {
                  setPasteMessage(labels.selectImageType);
                  return;
                }
                if (file.size > maxUploadBytes) {
                  setPasteMessage(labels.imageTooLarge);
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
            <small>{labels.localImageHint}</small>
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
              title={
                tableToolsCollapsed
                  ? labels.expandTableTools
                  : labels.collapseTableTools
              }
              aria-label={
                tableToolsCollapsed
                  ? labels.expandTableTools
                  : labels.collapseTableTools
              }
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
            <div
              className={s.tableToolRow}
              role="group"
              aria-label={labels.tableStyle}
            >
              {[
                [labels.backgroundColor, 'backgroundColor'],
                [labels.borders, 'borders'],
                [labels.borderColor, 'borderColor'],
                [labels.borderWidth, 'borderWidth'],
                [labels.borderStyle, 'borderStyle'],
                [labels.fitWidth, 'fit'],
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
                  {['borders', 'borderWidth', 'borderStyle'].includes(
                    panel,
                  ) && <span className={s.toolChevron}>▾</span>}
                </CommonButton>
              ))}
            </div>
            <div
              className={s.tableToolRow}
              role="group"
              aria-label={labels.rowsAndColumns}
            >
              {[
                {
                  label: labels.addRowBefore,
                  icon: 'rowBefore',
                  run: () => editor.chain().focus().addRowBefore().run(),
                },
                {
                  label: labels.addRowAfter,
                  icon: 'rowAfter',
                  run: () => editor.chain().focus().addRowAfter().run(),
                },
                {
                  label: labels.addColumnBefore,
                  icon: 'columnBefore',
                  run: () => editor.chain().focus().addColumnBefore().run(),
                },
                {
                  label: labels.addColumnAfter,
                  icon: 'columnAfter',
                  run: () => editor.chain().focus().addColumnAfter().run(),
                },
                {
                  label: labels.deleteRow,
                  icon: 'rowDelete',
                  run: () => editor.chain().focus().deleteRow().run(),
                },
                {
                  label: labels.deleteColumn,
                  icon: 'columnDelete',
                  run: () => editor.chain().focus().deleteColumn().run(),
                },
                {
                  label: labels.deleteTable,
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
            <div
              className={s.tableToolRow}
              role="group"
              aria-label={labels.cellEditing}
            >
              <CommonButton
                size="sm"
                title={labels.cellAlign}
                aria-label={labels.cellAlign}
                onClick={() => setTablePanel('cellAlign')}
              >
                <TableToolIcon name="cellAlign" />
                <span className={s.toolChevron}>▾</span>
              </CommonButton>
              <CommonButton
                size="sm"
                title={labels.verticalAlign}
                aria-label={labels.verticalAlign}
                onClick={() => setTablePanel('verticalAlign')}
              >
                <TableToolIcon name="verticalAlign" />
                <span className={s.toolChevron}>▾</span>
              </CommonButton>
              {cellsSelected ? (
                <>
                  <CommonButton
                    size="sm"
                    title={labels.cellSize}
                    aria-label={labels.cellSize}
                    onClick={() => setTablePanel('size')}
                  >
                    <TableToolIcon name="size" />
                    <span className={s.toolChevron}>▾</span>
                  </CommonButton>
                  <CommonButton
                    size="sm"
                    title={labels.mergeCells}
                    aria-label={labels.mergeCells}
                    disabled={!editor.can().mergeCells()}
                    onClick={() => mergeTableCells(editor)}
                  >
                    <TableToolIcon name="merge" />
                  </CommonButton>
                </>
              ) : (
                <CommonButton
                  size="sm"
                  title={labels.splitCell}
                  aria-label={labels.splitCell}
                  onClick={() => setTablePanel('split')}
                >
                  <TableToolIcon name="split" />
                </CommonButton>
              )}
              <CommonButton
                size="sm"
                disabled
                title={labels.cellProperties}
                aria-label={labels.cellProperties}
                onClick={() => setTablePanel('cell')}
              >
                <TableToolIcon name="cell" />
              </CommonButton>
              <CommonButton
                size="sm"
                disabled
                title={labels.tableProperties}
                aria-label={labels.tableProperties}
                onClick={() => setTablePanel('table')}
              >
                <TableToolIcon name="table" />
              </CommonButton>
            </div>
            <div className={s.tableProperties} hidden={tablePanel !== 'size'}>
              {(
                [
                  ['width', labels.equalWidth],
                  ['height', labels.equalHeight],
                  ['both', labels.equalSize],
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
                      ['none', labels.borderStyles.none],
                      ['solid', labels.borderStyles.solid],
                      ['dotted', labels.borderStyles.dotted],
                      ['dashed', labels.borderStyles.dashed],
                      ['double', labels.borderStyles.double],
                    ]
                  : tablePanel === 'cellAlign'
                    ? [
                        ['left', labels.alignLeft],
                        ['center', labels.alignCenter],
                        ['right', labels.alignRight],
                        ['justify', labels.alignJustify],
                      ]
                    : tablePanel === 'verticalAlign'
                      ? [
                          ['top', labels.alignTop],
                          ['middle', labels.alignMiddle],
                          ['bottom', labels.alignBottom],
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
            <div
              className={s.tableProperties}
              hidden={tablePanel !== 'borders'}
            >
              <div className={s.borderPresets}>
                {[
                  ['all', labels.borderPresets.all],
                  ['none', labels.borderPresets.none],
                  ['outer', labels.borderPresets.outer],
                  ['inner', labels.borderPresets.inner],
                  ['top', labels.borderPresets.top],
                  ['bottom', labels.borderPresets.bottom],
                  ['left', labels.borderPresets.left],
                  ['right', labels.borderPresets.right],
                  ['horizontal', labels.borderPresets.horizontal],
                  ['vertical', labels.borderPresets.vertical],
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
                  {labels.splitColumns}
                  <input
                    aria-label={labels.splitColumnsLabel}
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
                  {labels.splitRows}
                  <input
                    aria-label={labels.splitRowsLabel}
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
                    } else setSplitError(labels.splitError);
                  }}
                >
                  {labels.confirm}
                </CommonButton>
                <CommonButton
                  size="sm"
                  onClick={() => {
                    setSplitError('');
                    setTablePanel('');
                  }}
                >
                  {labels.cancel}
                </CommonButton>
              </div>
            </div>
            {['backgroundColor', 'borderColor'].includes(tablePanel) && (
              <EditorColorPicker
                inline
                label={
                  tablePanel === 'backgroundColor'
                    ? labels.backgroundColor
                    : labels.borderColor
                }
                labels={labels.colorPicker}
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
                title={labels.back}
                aria-label={labels.back}
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
                {labels.toggleHeaderCell}
              </CommonButton>
              <div className={s.propertyFields}>
                <label>
                  {labels.borderWidth}{' '}
                  <select
                    aria-label={labels.cellBorderWidth}
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
                    <option value="">{labels.defaultOption}</option>
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
                  {labels.borderStyle}{' '}
                  <select
                    aria-label={labels.cellBorderStyle}
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
                    <option value="">{labels.defaultOption}</option>
                    <option value="solid">{labels.borderStyles.solid}</option>
                    <option value="dashed">{labels.borderStyles.dashed}</option>
                    <option value="dotted">{labels.borderStyles.dotted}</option>
                    <option value="double">{labels.borderStyles.double}</option>
                    <option value="none">{labels.borderStyles.none}</option>
                  </select>
                </label>
                <label>
                  {labels.cellVerticalAlign}{' '}
                  <select
                    aria-label={labels.cellVerticalAlign}
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
                    <option value="">{labels.defaultOption}</option>
                    <option value="top">{labels.top}</option>
                    <option value="middle">{labels.middle}</option>
                    <option value="bottom">{labels.bottom}</option>
                  </select>
                </label>
                {[
                  {
                    name: 'cellAlign',
                    label: labels.horizontalAlign,
                    options: [
                      ['left', labels.left],
                      ['center', labels.center],
                      ['right', labels.right],
                      ['justify', labels.justify],
                    ],
                  },
                  {
                    name: 'cellPadding',
                    label: labels.cellPadding,
                    options: ['0px', '4px', '8px', '12px', '16px', '24px'].map(
                      (value) => [value, value],
                    ),
                  },
                  {
                    name: 'cellWrap',
                    label: labels.cellWrap,
                    options: [
                      ['normal', labels.wrapAllowed],
                      ['nowrap', labels.wrapDisabled],
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
                      <option value="">{labels.defaultOption}</option>
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
                  {labels.resetCellStyle}
                </CommonButton>
              </div>
            </div>
            <div className={s.tableProperties} hidden={tablePanel !== 'table'}>
              <CommonButton
                size="sm"
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              >
                {labels.toggleHeaderRow}
              </CommonButton>
              <CommonButton
                size="sm"
                onClick={() =>
                  editor.chain().focus().toggleHeaderColumn().run()
                }
              >
                {labels.toggleHeaderColumn}
              </CommonButton>
              <div className={s.propertyFields}>
                {[
                  {
                    name: 'tableWidth',
                    label: labels.tableWidth,
                    options: [
                      ['auto', labels.auto],
                      ['50%', '50%'],
                      ['75%', '75%'],
                      ['100%', labels.fitWidth],
                    ],
                  },
                  {
                    name: 'tableLayout',
                    label: labels.tableLayout,
                    options: [
                      ['auto', labels.auto],
                      ['fixed', labels.fixed],
                    ],
                  },
                  {
                    name: 'tableAlign',
                    label: labels.tableAlign,
                    options: [
                      ['0 auto', labels.left],
                      ['auto', labels.center],
                      ['auto 0', labels.right],
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
                            {labels.draggedWidth.replace(
                              '{width}',
                              editor.getAttributes('table').tableWidth,
                            )}
                          </option>
                        )}
                      <option value="">{labels.defaultOption}</option>
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
      </fieldset>
      <EditorContent editor={editor} />
    </div>
  );
}
