import React, { useEffect, useRef } from 'react';
import { IconClose } from './Icons.jsx';

export default function Modal({ title, subtitle, onClose, children, footer, wide }) {
  const boxRef = useRef(null);
  const restoreTo = useRef(null);

  useEffect(() => {
    restoreTo.current = document.activeElement;
    boxRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      // Contain tabbing inside the dialog.
      const focusables = boxRef.current?.querySelectorAll(
        'button:not(:disabled), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreTo.current?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`modal${wide ? ' modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={boxRef}
        tabIndex={-1}
      >
        <header className="modal-head">
          <h2 className="modal-title">
            {title}
            {subtitle && <small>{subtitle}</small>}
          </h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
