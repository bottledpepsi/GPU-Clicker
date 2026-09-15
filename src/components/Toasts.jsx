import React from 'react';
import { IconTrophy, IconSpark, IconDriver } from './Icons.jsx';

const ICONS = {
  achievement: IconTrophy,
  chip: IconSpark,
  prestige: IconDriver,
};

export default function Toasts({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind] ?? IconSpark;
        return (
          <div
            key={toast.id}
            className={`toast${toast.leaving ? ' is-leaving' : ''}`}
            data-tone={toast.tone}
            onClick={() => onDismiss(toast.id)}
          >
            <span className="toast-icon"><Icon /></span>
            <span>
              <span className="toast-title">{toast.title}</span>
              {toast.body && <span className="toast-body">{toast.body}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}
