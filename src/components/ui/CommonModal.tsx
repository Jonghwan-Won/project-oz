'use client';

import { useId, type ReactNode } from 'react';
import { Modal } from '@mantine/core';
import s from './CommonModal.module.css';

export function CommonModal({
  open,
  title,
  actions,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  actions: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Modal
      opened={open}
      onClose={onClose}
      centered
      size="xl"
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      aria-labelledby={id}
      classNames={{ content: s.modal, body: s.mantineBody }}
    >
      <div className={s.frame}>
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
