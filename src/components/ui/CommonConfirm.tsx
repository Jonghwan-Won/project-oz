'use client';

import { useId } from 'react';
import { Modal } from '@mantine/core';
import { CommonButton } from './CommonButton';
import s from './CommonAlert.module.css';

export function CommonConfirm({
  open,
  title = '확인',
  content,
  onConfirm,
  onCancel,
  confirmLabel = '확인',
  cancelLabel = '취소',
}: {
  open: boolean;
  title?: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  const id = useId();
  return (
    <Modal
      opened={open}
      onClose={onCancel}
      centered
      size="360px"
      zIndex={900}
      transitionProps={{ duration: 0 }}
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      role="alertdialog"
      aria-label={title}
      aria-describedby={`${id}-content`}
      classNames={{ content: s.alert, body: s.content }}
    >
      <p id={`${id}-content`} className={s.message}>
        {content}
      </p>
      <div className={`${s.actions} ${s.confirmActions}`}>
        <CommonButton variant="neutral" onClick={onConfirm}>
          {confirmLabel}
        </CommonButton>
        <CommonButton variant="neutral" onClick={onCancel}>
          {cancelLabel}
        </CommonButton>
      </div>
    </Modal>
  );
}
