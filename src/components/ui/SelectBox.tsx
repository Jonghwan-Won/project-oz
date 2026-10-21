'use client';
import * as Select from '@radix-ui/react-select';
import { useContext } from 'react';
import { OverlayContainer } from './OverlayContext';
import s from './SelectBox.module.css';
export type SelectOption = { value: string; label: string; disabled?: boolean };
export function SelectBox({
  value,
  onValueChange,
  options,
  disabled,
  required,
  name,
  id,
  className = '',
  ...aria
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}) {
  const container = useContext(OverlayContainer);
  const encode = (value: string) => (value === '' ? '__oz_empty__' : value);
  return (
    <Select.Root
      value={encode(value)}
      onValueChange={(next) =>
        onValueChange(next === '__oz_empty__' ? '' : next)
      }
      disabled={disabled}
      required={required}
      name={name}
    >
      <Select.Trigger {...aria} id={id} className={s.trigger + ' ' + className}>
        <Select.Value />
        <Select.Icon aria-hidden="true">⌄</Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container ?? undefined}>
        <Select.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className={s.content}
        >
          <Select.ScrollUpButton className={s.scroll}>⌃</Select.ScrollUpButton>
          <Select.Viewport className={s.viewport}>
            {options.map((option) => (
              <Select.Item
                className={s.item}
                key={option.value}
                value={encode(option.value)}
                disabled={option.disabled}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={s.indicator}>
                  ✓
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          <Select.ScrollDownButton className={s.scroll}>
            ⌄
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
