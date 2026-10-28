'use client';

import { useState } from 'react';
import { CommonButton } from '@/components/ui/CommonButton';
import { CommonModal } from '@/components/ui/CommonModal';
import { CommonTextArea } from '@/components/ui/CommonTextArea';
import { CommonConfirm } from '@/components/ui/CommonConfirm';
import { CommonAlert } from '@/components/ui/CommonAlert';
import { CommonLoading } from '@/components/ui/CommonLoading';
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
  | 'messagePlaceholder'
  | 'sendLabel'
  | 'closeLabel'
  | 'actionsLabel'
  | 'messageLabel'
  | 'emptyMessage'
  | 'closeConfirm'
  | 'sendConfirm'
  | 'submitted'
  | 'submitError'
  | 'confirmLabel'
  | 'cancelLabel'
>;

export function HelpActions({ copy }: { copy: HelpCopy }) {
  const [modalType, setModalType] = useState<'bug' | 'contact'>('contact');
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [confirm, setConfirm] = useState<'close' | 'send' | null>(null);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<'empty' | 'success' | 'error' | null>(
    null,
  );
  const show = (type: 'bug' | 'contact') => {
    setModalType(type);
    setOpen(true);
  };
  const close = () => {
    if (body) setConfirm('close');
    else setOpen(false);
  };
  const submit = async () => {
    setConfirm(null);
    setSaving(true);
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: modalType === 'bug' ? '0' : '1', body }),
      });
      if (!response.ok) throw new Error();
      setBody('');
      setOpen(false);
      setAlert('success');
    } catch {
      setAlert('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <section className={s.contactSection} aria-label={copy.actionsLabel}>
        <article id="bug" className={s.contactCard}>
          <span className={s.cardLabel}>FEEDBACK</span>
          <h2>{copy.bugTitle}</h2>
          <p>{copy.bugDescription}</p>
          <CommonButton variant="neutral" onClick={() => show('bug')}>
            {copy.bugModalTitle}
          </CommonButton>
        </article>
        <article id="contact" className={s.contactCard}>
          <span className={s.cardLabel}>CONTACT</span>
          <h2>{copy.contactTitle}</h2>
          <p>{copy.contactDescription}</p>
          <CommonButton variant="primary" onClick={() => show('contact')}>
            {copy.contactModalTitle}
          </CommonButton>
        </article>
      </section>
      <CommonModal
        open={open}
        size="md"
        title={
          modalType === 'bug' ? copy.bugModalTitle : copy.contactModalTitle
        }
        onClose={close}
        actions={
          <>
            <CommonButton
              variant="primary"
              disabled={saving}
              onClick={() => {
                if (body.trim()) setConfirm('send');
                else setAlert('empty');
              }}
            >
              {copy.sendLabel}
            </CommonButton>
            <CommonButton onClick={close}>{copy.closeLabel}</CommonButton>
          </>
        }
      >
        <label className={s.messageField}>
          <CommonTextArea
            rows={8}
            maxLength={4000}
            aria-label={copy.messageLabel}
            value={body}
            onChange={(event) => setBody(event.currentTarget.value)}
            placeholder={copy.messagePlaceholder}
          />
        </label>
      </CommonModal>
      <CommonConfirm
        open={confirm !== null}
        content={confirm === 'send' ? copy.sendConfirm : copy.closeConfirm}
        confirmLabel={copy.confirmLabel}
        cancelLabel={copy.cancelLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'send') void submit();
          else {
            setConfirm(null);
            setBody('');
            setOpen(false);
          }
        }}
      />
      <CommonAlert
        open={alert !== null}
        content={
          alert === 'success'
            ? copy.submitted
            : alert === 'empty'
              ? copy.emptyMessage
              : copy.submitError
        }
        variant={alert === 'success' ? 'default' : 'error'}
        confirmLabel={copy.confirmLabel}
        onClose={() => setAlert(null)}
      />
      <CommonLoading open={saving} />
    </>
  );
}
