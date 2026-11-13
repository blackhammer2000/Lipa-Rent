import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  danger,
  onConfirm,
  onCancel,
}) {
  // Lock scroll + focus while open
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-box">
        <div className={`confirm-icon ${danger ? "confirm-icon-danger" : ""}`}>
          <i
            className={`fa ${danger ? "fa-exclamation-triangle" : "fa-question-circle"}`}
          ></i>
        </div>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-outline-secondary confirm-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn confirm-ok ${danger ? "btn-danger" : "btn-success"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
