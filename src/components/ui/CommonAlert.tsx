'use client';

import { useId } from 'react';
import { Modal } from '@mantine/core';
import { CommonButton } from './CommonButton';
import s from './CommonAlert.module.css';

export const defaultAlertLabels = { alert: '알림', errorAlert: '오류 알림' };
export type AlertLabels = typeof defaultAlertLabels;

export function CommonAlert({
  open,
  onClose,
  content,
  confirmLabel = '확인',
  variant = 'default',
  width = 360,
  labels = defaultAlertLabels,
}: {
  open: boolean;
  onClose: () => void;
  content: string;
  confirmLabel?: string;
  variant?: 'default' | 'error';
  width?: number;
  labels?: AlertLabels;
}) {
  const id = useId();
  return (
    <Modal
      opened={open}
      onClose={onClose}
      centered
      size={`${width}px`}
      zIndex={1000}
      transitionProps={{ duration: 0 }}
      padding={0}
      withCloseButton={false}
      closeOnClickOutside={false}
      role="alertdialog"
      aria-label={variant === 'error' ? labels.errorAlert : labels.alert}
      aria-describedby={`${id}-content`}
      classNames={{
        content: `${s.alert} ${variant === 'error' ? s.error : ''}`,
        body: s.content,
      }}
    >
      <p id={`${id}-content`} className={s.message}>
        {content}
      </p>
      <div className={s.actions}>
        <CommonButton variant="primary" onClick={onClose}>
          {confirmLabel}
        </CommonButton>
      </div>
    </Modal>
  );
}
