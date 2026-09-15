import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { exportSave, importSave } from '../game/save.js';

const FORMATS = [
  { id: 'short', label: 'Short' },
  { id: 'scientific', label: 'Scientific' },
  { id: 'raw', label: 'Full' },
];

export default function SettingsModal({
  state, settings, setSettings, onClose, onHardReset, onImport,
}) {
  const [saveText, setSaveText] = useState('');
  const [note, setNote] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const doExport = async () => {
    const str = exportSave(state);
    setSaveText(str);
    try {
      await navigator.clipboard.writeText(str);
      setNote({ tone: 'ok', text: 'Save string copied to your clipboard.' });
    } catch {
      setNote({ tone: null, text: 'Save string ready — select it and copy manually.' });
    }
  };

  const doImport = () => {
    try {
      const imported = importSave(saveText);
      onImport(imported);
      setNote({ tone: 'ok', text: 'Save loaded.' });
    } catch (err) {
      setNote({ tone: 'error', text: err.message });
    }
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <Row
        name="Number format"
        desc="How large numbers are written throughout the game."
      >
        <div className="segmented">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={settings.numberFormat === f.id}
              onClick={() => setSettings({ numberFormat: f.id })}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Row>

      <Toggle
        name="Reduce motion"
        desc="Stops the die animation, floating numbers and transitions. The game plays identically."
        checked={settings.reducedMotion}
        onChange={(v) => setSettings({ reducedMotion: v })}
      />

      <Toggle
        name="Click particles"
        desc="Floating +N numbers when you click the die."
        checked={settings.particles}
        onChange={(v) => setSettings({ particles: v })}
      />

      <Toggle
        name="Sound effects"
        desc="Clicks, purchases and Golden Chips."
        checked={settings.sound}
        onChange={(v) => setSettings({ sound: v })}
      />

      <Toggle
        name="Show output rate in tab title"
        desc="The tab shows your frame count. Turn this on to show frames per second instead."
        checked={settings.showFpsInTitle}
        onChange={(v) => setSettings({ showFpsInTitle: v })}
      />

      <Row
        name="Backup save"
        desc="Copy your save to move it between browsers, or paste one in to restore it."
      >
        <div style={{ display: 'flex', gap: 'var(--s2)' }}>
          <button type="button" className="btn" onClick={doExport}>Export</button>
          <button type="button" className="btn" onClick={doImport} disabled={!saveText.trim()}>
            Import
          </button>
        </div>
      </Row>

      <textarea
        className="save-string"
        value={saveText}
        onChange={(e) => { setSaveText(e.target.value); setNote(null); }}
        placeholder="Your save string appears here after you export, or paste one in to restore."
        spellCheck={false}
        aria-label="Save string"
      />
      {note && <p className="form-note" data-tone={note.tone}>{note.text}</p>}

      <Row
        name="Delete everything"
        desc="Wipes frames, hardware, upgrades, achievements and Driver Points. There is no undo and no backup."
      >
        {confirmingReset ? (
          <div style={{ display: 'flex', gap: 'var(--s2)' }}>
            <button type="button" className="btn" onClick={() => setConfirmingReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => { onHardReset(); onClose(); }}
            >
              Delete it
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--danger" onClick={() => setConfirmingReset(true)}>
            Reset game
          </button>
        )}
      </Row>
    </Modal>
  );
}

function Row({ name, desc, children }) {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <div className="setting-name">{name}</div>
        <div className="setting-desc">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ name, desc, checked, onChange }) {
  return (
    <Row name={name} desc={desc}>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={checked}
        aria-label={name}
        onClick={() => onChange(!checked)}
      />
    </Row>
  );
}
