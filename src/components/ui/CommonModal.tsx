'use client';

import { useId, type ReactNode } from 'react';
import { Modal } from '@mantine/core';
import s from './CommonModal.module.css';

const modalSizes = { sm: 480, md: 720, lg: 960, xl: 1180 } as const;
type CommonModalSize = keyof typeof modalSizes | number;

export function CommonModal({
  open,
  title,
  actions,
  onClose,
  children,
  size = 'xl',
  fillHeight = false,
  closeOnEscape = true,
}: {
  open: boolean;
  title: string;
  actions: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: CommonModalSize;
  fillHeight?: boolean;
  closeOnEscape?: boolean;
}) {
  const id = useId();
  const modalSize = typeof size === 'number' ? size : modalSizes[size];
  return (
    <Modal
      opened={open}
      onClose={onClose}
      centered
      xOffset={16}
      yOffset={16}
      size={modalSize}
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={closeOnEscape}
      aria-labelledby={id}
      classNames={{
        content: `${s.modal} ${fillHeight ? s.fillHeight : ''}`,
        body: s.mantineBody,
      }}
    >
      <div className={`${s.frame} ${fillHeight ? s.fillHeightFrame : ''}`}>
        <header className={s.header}>
          <h2 data-autofocus id={id}>
            {title}
          </h2>
          <div className={s.actions}>{actions}</div>
        </header>
        <div className={s.body} data-modal-body>
          {children}
        </div>
      </div>
    </Modal>
  );
}
