import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Toast({ type = "success", message, onClose }) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return createPortal(
    <div className={`toast-notification ${isSuccess ? "toast-success" : "toast-error"}`} role="alert">
      <div className="toast-icon">
        <i className={`fa ${isSuccess ? "fa-check-circle" : "fa-exclamation-circle"}`}></i>
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <i className="fa fa-times"></i>
      </button>
    </div>,
    document.body
  );
}