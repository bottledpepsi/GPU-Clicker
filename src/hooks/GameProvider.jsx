import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState,
  useSyncExternalStore, useCallback,
} from 'react';
import { GameStore } from '../game/store.js';
import { defaultState, defaultSettings } from '../game/state.js';
import {
  loadGame, loadSettings, saveGame, clearSave, computeOfflineProgress,
} from '../game/save.js';

const GameContext = createContext(null);

function createStore() {
  const settings = loadSettings();
  const loaded = loadGame();
  const state = loaded?.state ?? defaultState();
  let offline = null;

  if (loaded) {
    offline = computeOfflineProgress(state, loaded.savedAt);
  }

  const store = new GameStore(state, settings);
  if (offline) {
    store.dispatch({
      type: 'offline',
      seconds: offline.elapsedS,
      earned: offline.earned,
    });
  }
  return { store, settings, offline, isNewGame: !loaded };
}

export function GameProvider({ children }) {
  const bootRef = useRef(null);
  if (bootRef.current === null) bootRef.current = createStore();
  const { store, isNewGame } = bootRef.current;

  const [settings, setSettingsState] = useState(bootRef.current.settings);
  const [offlineReport, setOfflineReport] = useState(bootRef.current.offline);

  // Keep the store's copy in sync — it needs settings at autosave time.
  useEffect(() => {
    store.setSettings(settings);
  }, [store, settings]);

  const setSettings = useCallback((patch) => {
    setSettingsState((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveGame(store.getSnapshot(), next);
      return next;
    });
  }, [store]);

  const resetSettings = useCallback(() => setSettings(defaultSettings()), [setSettings]);

  // Start the loop, and make sure we save on the way out.
  useEffect(() => {
    store.start();

    const flush = () => store.flushSave();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      flush();
      store.stop();
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [store]);

  const hardReset = useCallback(() => {
    clearSave();
    store.dispatch({ type: 'hardReset' });
    store.flushSave();
  }, [store]);

  const replaceState = useCallback((state) => {
    store.dispatch({ type: 'replaceState', state });
    store.flushSave();
  }, [store]);

  // A small console handle, carried over from the original game's debug
  // commands. Useful for testing late-game states without a 10-hour session.
  useEffect(() => {
    window.GPUC = {
      get state() { return store.getSnapshot(); },
      dispatch: (action) => store.dispatch(action),
      give: (amount) => store.dispatch({
        type: 'replaceState',
        state: {
          ...store.getSnapshot(),
          frames: store.getSnapshot().frames + amount,
          lifetimeFrames: store.getSnapshot().lifetimeFrames + amount,
          lifetimeFramesAllTime: store.getSnapshot().lifetimeFramesAllTime + amount,
        },
      }),
      reset: hardReset,
      help: () => console.table({
        'GPUC.state': 'current game state',
        'GPUC.give(n)': 'add n frames',
        'GPUC.dispatch(a)': 'dispatch a raw action',
        'GPUC.reset()': 'wipe the save',
      }),
    };
    return () => { delete window.GPUC; };
  }, [store, hardReset]);

  const value = useMemo(() => ({
    store,
    dispatch: store.dispatch.bind(store),
    settings,
    setSettings,
    resetSettings,
    offlineReport,
    dismissOffline: () => setOfflineReport(null),
    hardReset,
    replaceState,
    isNewGame,
  }), [store, settings, setSettings, resetSettings, offlineReport, hardReset, replaceState, isNewGame]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}

export function useGameState() {
  const { store } = useGame();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useGameSelector(selector) {
  const { store } = useGame();
  const cache = useRef({ state: null, result: undefined });

  const getSnapshot = useCallback(() => {
    const state = store.getSnapshot();
    if (state !== cache.current.state) {
      cache.current = { state, result: selector(state) };
    }
    return cache.current.result;
  }, [store, selector]);

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export function useRawFrame(callback) {
  const { store } = useGame();
  const ref = useRef(callback);
  ref.current = callback;

  useEffect(
    () => store.subscribeRaw((state, t) => ref.current(state, t)),
    [store]
  );
}

export function useGameEvents(handler) {
  const { store } = useGame();
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => store.onEvent((e) => ref.current(e)), [store]);
}
