'use client';

import { useState } from 'react';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import type { Messages } from '@/i18n/ko';
import s from './help.module.css';

type HelpCopy = Pick<
  Messages['contact'],
  | 'bugTitle'
  | 'bugDescription'
  | 'bugModalTitle'
  | 'contactTitle'
  | 'contactDescription'
  | 'contactModalTitle'
  | 'messageLabel'
  | 'messagePlaceholder'
  | 'sendLabel'
  | 'closeLabel'
  | 'actionsLabel'
>;

export function HelpActions({ copy }: { copy: HelpCopy }) {
  const [openModal, setOpenModal] = useState<'bug' | 'contact' | null>(null);
  const close = () => setOpenModal(null);

  return (
    <>
      <section className={s.contactSection} aria-label={copy.actionsLabel}>
        <article id="bug" className={s.contactCard}>
          <span className={s.cardLabel}>01 / FEEDBACK</span>
          <h2>{copy.bugTitle}</h2>
          <p>{copy.bugDescription}</p>
          <CommonButton variant="neutral" onClick={() => setOpenModal('bug')}>
            {copy.bugModalTitle}
          </CommonButton>
        </article>
        <article id="contact" className={s.contactCard}>
          <span className={s.cardLabel}>02 / CONTACT</span>
          <h2>{copy.contactTitle}</h2>
          <p>{copy.contactDescription}</p>
          <CommonButton
            variant="primary"
            onClick={() => setOpenModal('contact')}
          >
            {copy.contactModalTitle}
          </CommonButton>
        </article>
      </section>
      <CommonModal
        open={openModal !== null}
        size="md"
        title={
          openModal === 'bug' ? copy.bugModalTitle : copy.contactModalTitle
        }
        onClose={close}
        actions={
          <>
            <CommonButton variant="primary">{copy.sendLabel}</CommonButton>
            <CommonButton onClick={close}>{copy.closeLabel}</CommonButton>
          </>
        }
      >
        <label className={s.messageField}>
          {copy.messageLabel}
          <CommonTextArea
            rows={8}
            maxLength={4000}
            placeholder={copy.messagePlaceholder}
          />
        </label>
      </CommonModal>
    </>
  );
}
