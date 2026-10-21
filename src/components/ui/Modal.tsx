'use client';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { OverlayContainer } from './OverlayContext';
import s from './Modal.module.css';
export function Modal({
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
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const id = useId();
  useEffect(() => {
    if (!open || !dialog) return;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-modal-title]')?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (trigger instanceof HTMLElement && trigger.isConnected)
        trigger.focus();
    };
  }, [open, dialog]);
  return (
    <dialog
      ref={setDialog}
      className={s.modal}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <OverlayContainer.Provider value={dialog}>
        <div className={s.frame}>
          <header className={s.header}>
            <h2 data-modal-title tabIndex={-1} id={id}>
              {title}
            </h2>
            <div className={s.actions}>{actions}</div>
          </header>
          <div className={s.body} data-modal-body>
            {children}
          </div>
        </div>
      </OverlayContainer.Provider>
    </dialog>
  );
}
