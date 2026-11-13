import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ title, onClose, children }) {
  // Blur + disable pointer events ONLY on the hero content while modal is open
  useEffect(() => {
    const hero = document.querySelector(".hero");

    if (hero) hero.classList.add("modal-blur-active");

    return () => {
      if (hero) hero.classList.remove("modal-blur-active");
    };
  }, []);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Render into body via portal so position:fixed always centers correctly
  return createPortal(
    <div className="modal-overlay" onMouseDown={handleBackdropClick}>
      <div className="modal-panel">
        <div className="modal-header">
          <h4>{title}</h4>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="fa fa-times"></i>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}