import { defaultState, AUTOSAVE_INTERVAL_MS } from './state.js';
import { reduce } from './reducer.js';
import { saveGame } from './save.js';

const LOGIC_STEP_MS = 50;
const UI_PUBLISH_MS = 100;
const MAX_CATCHUP_MS = 2000;

export class GameStore {
  constructor(initialState = defaultState(), settings = {}) {
    this.state = initialState;
    this.settings = settings;

    this.listeners = new Set();      // React subscribers (throttled)
    this.rawListeners = new Set();   // per-frame subscribers (no React)
    this.eventListeners = new Set(); // toasts, particles, sound

    this.running = false;
    this.rafId = null;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.lastPublish = 0;
    this.lastSave = 0;

    this._frame = this._frame.bind(this);
  }

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.state;

  subscribeRaw = (fn) => {
    this.rawListeners.add(fn);
    return () => this.rawListeners.delete(fn);
  };

  onEvent = (fn) => {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  };

  _emit(events) {
    if (!events.length) return;
    for (const fn of this.eventListeners) {
      for (const e of events) fn(e);
    }
  }

  _publish() {
    for (const fn of this.listeners) fn();
  }

  dispatch(action) {
    const events = [];
    const next = reduce(this.state, action, events);
    if (next !== this.state) {
      this.state = next;
      this._publish();
      this.lastPublish = performance.now();
    }
    this._emit(events);
    return next;
  }

  setSettings(settings) {
    this.settings = settings;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.lastPublish = this.lastFrameTime;
    this.lastSave = this.lastFrameTime;
    this.rafId = requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  _frame(timestamp) {
    if (!this.running) return;

    const elapsed = Math.min(timestamp - this.lastFrameTime, MAX_CATCHUP_MS);
    this.lastFrameTime = timestamp;
    this.accumulator += elapsed;

    // Fixed-step simulation.
    const events = [];
    let stepped = false;
    const wallNow = Date.now();
    while (this.accumulator >= LOGIC_STEP_MS) {
      this.accumulator -= LOGIC_STEP_MS;
      this.state = reduce(
        this.state,
        { type: 'tick', dt: LOGIC_STEP_MS / 1000, now: wallNow },
        events
      );
      stepped = true;
    }
    if (events.length) this._emit(events);

    // Full-rate feed for direct-DOM consumers.
    for (const fn of this.rawListeners) fn(this.state, timestamp);

    // Throttled React publish.
    if (stepped && timestamp - this.lastPublish >= UI_PUBLISH_MS) {
      this.lastPublish = timestamp;
      this._publish();
    }

    // Autosave.
    if (timestamp - this.lastSave >= AUTOSAVE_INTERVAL_MS) {
      this.lastSave = timestamp;
      saveGame(this.state, this.settings);
    }

    this.rafId = requestAnimationFrame(this._frame);
  }

  flushSave() {
    saveGame(this.state, this.settings);
  }
}
