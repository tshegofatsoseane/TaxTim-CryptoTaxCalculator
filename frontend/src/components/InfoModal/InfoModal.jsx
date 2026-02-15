import React, { useEffect } from "react";
import styles from "./InfoModal.module.css";

export default function InfoModal({
  isOpen,
  onClose,
  title = "Info",
  children,
  primaryText = "Got it",
  onPrimary,
  showCloseButton = true,
  closeOnBackdrop = true,
  maxWidth = 560, // px
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrimary = () => {
    if (typeof onPrimary === "function") onPrimary();
    else onClose?.();
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => (closeOnBackdrop ? onClose?.() : null)}
    >
      <div
        className={styles.modal}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.top}>
          <div className={styles.title}>{title}</div>

          {showCloseButton ? (
            <button
              className={styles.close}
              type="button"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className={styles.body}>{children}</div>

        <div className={styles.footer}>
          <button type="button" className={styles.primary} onClick={handlePrimary}>
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}
