'use client';
import { Popover } from '@mantine/core';
import { useState } from 'react';
import { CommonButton } from './CommonButton';
import s from './CommonRichText.module.css';

const colors = [
  '',
  '#000000',
  '#333333',
  '#666666',
  '#999999',
  '#cccccc',
  '#ffffff',
  '#ffcccc',
  '#ffe0b2',
  '#ffffcc',
  '#ccffcc',
  '#ccffff',
  '#ccccff',
  '#ffccff',
  '#ff9999',
  '#ffcc80',
  '#ffff99',
  '#99cc99',
  '#99cccc',
  '#9999cc',
  '#cc99cc',
  '#ff6666',
  '#ffb74d',
  '#ffff66',
  '#66cc66',
  '#66cccc',
  '#6666cc',
  '#cc66cc',
  '#ff3333',
  '#ff9800',
  '#ffff33',
  '#33cc33',
  '#33cccc',
  '#6633cc',
  '#993399',
  '#ff0000',
  '#ff6600',
  '#ffff00',
  '#00aa00',
  '#0088cc',
  '#3300cc',
  '#660066',
];

export const defaultColorPickerLabels = {
  noColor: '색상 없음',
  recent: '최근 사용한 색',
  custom: '다른 색',
  apply: '적용',
};
export type ColorPickerLabels = typeof defaultColorPickerLabels;

export function EditorColorPicker({
  label,
  value,
  onChange,
  inline = false,
  glyph,
  labels = defaultColorPickerLabels,
}: {
  inline?: boolean;
  /** 도구 막대 버튼에 표시할 짧은 기호. 없으면 기존 한국어 label로 판단한다. */
  glyph?: string;
  labels?: ColorPickerLabels;
  label: string;
  value?: string | null;
  onChange: (color: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [hex, setHex] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const apply = (color: string) => {
    onChange(color);
    if (color)
      setRecent((previous) =>
        [color, ...previous.filter((item) => item !== color)].slice(0, 7),
      );
    setOpened(false);
  };
  const swatch = (color: string, index: number) => (
    <button
      key={`${color}-${index}`}
      type="button"
      title={color || labels.noColor}
      aria-label={color || labels.noColor}
      aria-pressed={(value ?? '') === color}
      className={!color ? s.noColor : undefined}
      style={color ? { backgroundColor: color } : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => apply(color)}
    />
  );
  const panel = (
    <div
      className={s.colorPalette}
      aria-label={label}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          event.stopPropagation();
          if (/^#[0-9a-f]{6}$/i.test(hex)) apply(hex.toLowerCase());
        }
      }}
    >
      <div className={s.colorGrid}>{colors.map(swatch)}</div>
      {recent.length > 0 && (
        <>
          <small>{labels.recent}</small>
          <div className={s.colorGrid}>{recent.map(swatch)}</div>
        </>
      )}
      <div className={s.colorCustom}>
        <label>
          {labels.custom}{' '}
          <input
            data-editor-color-input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#000000'}
            onChange={(event) => {
              const color = event.currentTarget.value;
              setHex(color);
              if (/^#[0-9a-f]{6}$/i.test(color)) apply(color.toLowerCase());
            }}
          />
        </label>
        <label>
          HEX{' '}
          <input
            data-editor-color-input
            aria-label={`${label} HEX`}
            value={hex}
            placeholder="#000000"
            maxLength={7}
            onChange={(event) => setHex(event.currentTarget.value)}
          />
        </label>
        <CommonButton
          size="sm"
          disabled={!/^#[0-9a-f]{6}$/i.test(hex)}
          onClick={() => apply(hex.toLowerCase())}
        >
          {labels.apply}
        </CommonButton>
      </div>
    </div>
  );
  if (inline) return panel;
  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withinPortal={false}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <CommonButton
          size="sm"
          variant="ghost"
          title={label}
          aria-label={label}
          aria-expanded={opened}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            setHex(value ?? '');
            setOpened(!opened);
          }}
        >
          <span
            style={{ borderBottom: `3px solid ${value || 'currentColor'}` }}
          >
            {glyph ??
              (label === '글자 색상'
                ? 'A'
                : label === '글자 배경색'
                  ? '▣'
                  : label)}
          </span>
        </CommonButton>
      </Popover.Target>
      <Popover.Dropdown>{panel}</Popover.Dropdown>
    </Popover>
  );
}
