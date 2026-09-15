import React, { useMemo } from 'react';
import Modal from './Modal.jsx';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '../game/achievements.js';
import { IconCheck, IconLock } from './Icons.jsx';

export default function AchievementsModal({ state, onClose }) {
  const earned = Object.keys(state.achievements).length;
  const total = ACHIEVEMENTS.length;

  const grouped = useMemo(
    () => ACHIEVEMENT_GROUPS.map((group) => ({
      group,
      items: ACHIEVEMENTS.filter((a) => a.group === group),
    })),
    []
  );

  return (
    <Modal
      title="Achievements"
      subtitle={`${earned} of ${total} earned`}
      onClose={onClose}
      wide
    >
      <div className="ach-progress-bar">
        <div className="ach-progress-fill" style={{ width: `${(earned / total) * 100}%` }} />
      </div>

      {grouped.map(({ group, items }) => {
        const got = items.filter((a) => state.achievements[a.key]).length;
        return (
          <section key={group}>
            <h3 className="ach-group-title">{group} — {got}/{items.length}</h3>
            <div className="ach-grid">
              {items.map((a) => {
                const isEarned = !!state.achievements[a.key];
                return (
                  <div className="ach-cell" data-earned={isEarned} key={a.key}>
                    <span className="ach-badge">
                      {isEarned ? <IconCheck /> : <IconLock width="13" height="13" />}
                    </span>
                    <span className="ach-text">
                      <span className="ach-name">{a.name}</span>
                      <span className="ach-desc">{isEarned ? a.desc : '???'}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </Modal>
  );
}
