import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useGame, useGameState, useGameEvents, useRawFrame,
} from './hooks/GameProvider.jsx';
import { useSound } from './hooks/useSound.js';
import {
  framesPerSecond, clickValue, activeBuffs, prestigeGain,
} from './game/selectors.js';
import { ACHIEVEMENTS } from './game/achievements.js';
import { formatNumber, formatFrames } from './game/format.js';

import FrameCounter from './components/FrameCounter.jsx';
import GpuDie from './components/GpuDie.jsx';
import GoldenChip from './components/GoldenChip.jsx';
import BuffStrip from './components/BuffStrip.jsx';
import TelemetryRail from './components/TelemetryRail.jsx';
import Store from './components/Store.jsx';
import Toasts from './components/Toasts.jsx';
import AchievementsModal from './components/AchievementsModal.jsx';
import PrestigeModal from './components/PrestigeModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import StatsModal from './components/StatsModal.jsx';
import OfflineModal from './components/OfflineModal.jsx';
import {
  IconChart, IconTrophy, IconDriver, IconGear, IconMenu,
} from './components/Icons.jsx';

const APP_VERSION = '4.0.0';
let toastSeq = 0;

export default function App() {
  const {
    dispatch, settings, setSettings, offlineReport, dismissOffline,
    hardReset, replaceState,
  } = useGame();

  const state = useGameState();
  const play = useSound(settings.sound);

  const [modal, setModal] = useState(null);
  const [railOpen, setRailOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  // Keys that were purchased in the last few hundred ms, for the buy flash.
  const [recentBuys, setRecentBuys] = useState(() => new Set());

  const fmt = useCallback(
    (n) => formatNumber(n, settings.numberFormat),
    [settings.numberFormat]
  );

  const fps = framesPerSecond(state);
  const perClick = clickValue(state);
  const buffs = activeBuffs(state);
  const productionBuffed = buffs.some((b) => b.kind === 'production');
  const pendingPoints = prestigeGain(state);
  const achEarned = Object.keys(state.achievements).length;

  const pushToast = useCallback((toast) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 260);
    }, toast.duration ?? 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const flashBuy = useCallback((key) => {
    setRecentBuys((prev) => new Set(prev).add(key));
    setTimeout(() => {
      setRecentBuys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 450);
  }, []);

  useGameEvents((event) => {
    switch (event.type) {
      case 'click':
        play('click');
        break;

      case 'buy':
        if (event.kind === 'building') {
          play('buy');
          flashBuy(`b${event.index}`);
        } else {
          play('upgrade');
          flashBuy(event.upgrade.key);
        }
        break;

      case 'chip':
        play('chip');
        pushToast({
          kind: 'chip',
          tone: event.effect.rarity === 'legendary' ? 'violet'
            : event.effect.rarity === 'rare' ? 'rail' : 'amber',
          title: event.effect.label,
          body: event.gained !== undefined
            ? `+${fmt(event.gained)} frames`
            : `x${event.mult.toFixed(1)} for ${Math.round(event.duration)}s`,
        });
        break;

      case 'achievement':
        play('achievement');
        pushToast({
          kind: 'achievement',
          tone: 'mint',
          title: event.achievement.name,
          body: event.achievement.desc,
        });
        break;

      case 'prestige':
        play('prestige');
        pushToast({
          kind: 'prestige',
          tone: 'violet',
          title: 'Drivers updated',
          body: `+${event.gained} Driver Points. You now hold ${event.total}.`,
          duration: 6000,
        });
        break;

      default:
        break;
    }
  });

  useEffect(() => {
    document.body.classList.toggle('reduce-motion', settings.reducedMotion);
  }, [settings.reducedMotion]);

  const lastTitle = useRef('');
  useRawFrame((s) => {
    const readout = settings.showFpsInTitle
      ? `${formatNumber(framesPerSecond(s), settings.numberFormat)}/s`
      : formatFrames(s.frames, settings.numberFormat);
    const next = `${readout} — GPU Clicker`;
    if (next !== lastTitle.current) {
      lastTitle.current = next;
      document.title = next;
    }
  });

  const onDieClick = useCallback(({ x, y }) => {
    dispatch({ type: 'click', now: Date.now(), x, y });
  }, [dispatch]);

  const onChipCollect = useCallback((effect, point) => {
    dispatch({ type: 'collectChip', effectId: effect.id, now: Date.now(), ...point });
  }, [dispatch]);

  const onChipMiss = useCallback(() => {
    dispatch({ type: 'missChip' });
  }, [dispatch]);

  // Space and Enter click the die from anywhere that is not a control.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (modal) return;
      e.preventDefault();
      dispatch({ type: 'click', now: Date.now(), x: 0, y: 0 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, modal]);

  const closeModal = useCallback(() => setModal(null), []);

  const navItems = useMemo(() => [
    { id: 'stats', label: 'Stats', Icon: IconChart },
    { id: 'achievements', label: 'Achievements', Icon: IconTrophy, count: `${achEarned}/${ACHIEVEMENTS.length}` },
    { id: 'prestige', label: 'Drivers', Icon: IconDriver, tone: 'violet', dot: pendingPoints > 0 },
    { id: 'settings', label: 'Settings', Icon: IconGear },
  ], [achEarned, pendingPoints]);

  return (
    <div className="app">
      <header className="topbar">
        <button
          type="button"
          className="rail-toggle"
          onClick={() => setRailOpen((v) => !v)}
          aria-label="Toggle telemetry"
          aria-expanded={railOpen}
        >
          <IconMenu />
        </button>

        <div className="topbar-brand">
          GPU<em>Clicker</em>
        </div>

        <div className="topbar-spacer" />

        <nav className="topbar-nav">
          {navItems.map(({ id, label, Icon, count, tone, dot }) => (
            <button
              key={id}
              type="button"
              className="nav-btn"
              data-tone={tone}
              onClick={() => setModal(id)}
            >
              <Icon />
              <span>{label}</span>
              {count && <span className="nav-btn-count">{count}</span>}
              {dot && <span className="nav-btn-dot" aria-label="Driver Points available" />}
            </button>
          ))}
        </nav>
      </header>

      <div className="app-body">
        <TelemetryRail
          state={state}
          settings={settings}
          open={railOpen}
          onClose={() => setRailOpen(false)}
        />

        <main className="stage">
          <FrameCounter numberFormat={settings.numberFormat} />

          <GpuDie
            fps={fps}
            clickValue={perClick}
            buffed={productionBuffed}
            onClick={onDieClick}
            settings={settings}
            formatFn={fmt}
          />

          <BuffStrip buffs={buffs} />

          <GoldenChip
            state={state}
            onCollect={onChipCollect}
            onMiss={onChipMiss}
            reducedMotion={settings.reducedMotion}
          />
        </main>

        <Store
          state={state}
          settings={settings}
          setSettings={setSettings}
          dispatch={dispatch}
          recentBuys={recentBuys}
        />
      </div>

      <footer className="footer">
        <span>Not affiliated with NVIDIA Corporation</span>
        <span>|</span>
        <a href="https://bottledpepsi.github.io/" target="_blank" rel="noopener noreferrer">Homepage</a>
        <span>|</span>
        <a href="https://github.com/bottledpepsi/GPU-Clicker" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span>|</span>
        <span>v{APP_VERSION}</span>
      </footer>

      <Toasts toasts={toasts} onDismiss={dismissToast} />

      {offlineReport && (
        <OfflineModal
          report={offlineReport}
          onClose={dismissOffline}
          numberFormat={settings.numberFormat}
        />
      )}

      {modal === 'stats' && (
        <StatsModal state={state} onClose={closeModal} numberFormat={settings.numberFormat} />
      )}
      {modal === 'achievements' && (
        <AchievementsModal state={state} onClose={closeModal} />
      )}
      {modal === 'prestige' && (
        <PrestigeModal
          state={state}
          dispatch={dispatch}
          onClose={closeModal}
          numberFormat={settings.numberFormat}
        />
      )}
      {modal === 'settings' && (
        <SettingsModal
          state={state}
          settings={settings}
          setSettings={setSettings}
          onClose={closeModal}
          onHardReset={hardReset}
          onImport={replaceState}
        />
      )}
    </div>
  );
}
