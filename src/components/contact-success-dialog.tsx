"use client";

import { useEffect, useId, useRef } from "react";
import { Check, Icon } from "./icons";
import styles from "./contact-success-dialog.module.css";

export function ContactSuccessDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dialogRef.current?.close();
      }}
    >
      <button
        type="button"
        className={`icon-button ${styles.close}`}
        aria-label="Затвори потвърждението"
        onClick={() => dialogRef.current?.close()}
      >
        <Icon name="close" />
      </button>
      <span className={styles.successIcon} aria-hidden="true">
        <Check />
      </span>
      <h2 id={titleId}>Съобщението е изпратено!</h2>
      <p id={descriptionId}>
        Благодарим Ви, че се свързахте с нас. Получихме Вашето съобщение.
      </p>
      <button
        type="button"
        className={`button ${styles.button}`}
        autoFocus
        onClick={() => dialogRef.current?.close()}
      >
        Затвори
      </button>
    </dialog>
  );
}
