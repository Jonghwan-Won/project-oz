'use client';

import { Loader, Modal } from '@mantine/core';
import { useErrorLocale } from '@/i18n/use-error-locale';
import s from './CommonLoading.module.css';

export function CommonLoading({ open }: { open: boolean }) {
  const locale = useErrorLocale();
  const label = locale === 'en' ? 'Loading' : '로딩 중';
  return (
    <Modal
      opened={open}
      onClose={() => {}}
      centered
      fullScreen
      overlayProps={{ color: 'var(--bg)', backgroundOpacity: 0.35, blur: 2 }}
      styles={{ content: { background: 'transparent', boxShadow: 'none' } }}
      zIndex={1200}
      padding={0}
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      aria-label={label}
      classNames={{
        content: s.content,
        body: s.body,
      }}
    >
      <Loader size={48} color="violet" type="oval" aria-label={label} />
    </Modal>
  );
}
