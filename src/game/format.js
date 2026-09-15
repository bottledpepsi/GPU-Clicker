const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
  'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc',
  'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg',
  'Tg',
];

export const SCIENTIFIC_THRESHOLD = 1e33;

export function formatNumber(num, mode = 'short') {
  if (num === null || num === undefined) return '0';
  if (!Number.isFinite(num)) return '∞';
  if (num < 0) return '-' + formatNumber(-num, mode);
  if (num === 0) return '0';

  if (mode === 'raw') {
    return num < 1000
      ? trimFloat(num)
      : Math.floor(num).toLocaleString('en-US');
  }

  if (mode === 'scientific') return toScientific(num);

  // 'short'
  if (num < 1000) return trimFloat(num);
  if (num >= SCIENTIFIC_THRESHOLD) return toScientific(num);

  const tier = Math.floor(Math.log10(num) / 3);
  const suffix = SUFFIXES[tier];
  if (!suffix) return toScientific(num);

  const scaled = num / Math.pow(1000, tier);
  return significant(scaled) + suffix;
}

function trimFloat(n) {
  if (n >= 100) return String(Math.floor(n));
  if (n >= 10) return stripZeros(n.toFixed(1));
  if (n >= 1) return stripZeros(n.toFixed(2));
  return stripZeros(n.toFixed(3));
}

function significant(n) {
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1);
  return n.toFixed(2);
}

function stripZeros(s) {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

function toScientific(num) {
  const exp = Math.floor(Math.log10(num));
  const mantissa = num / Math.pow(10, exp);
  return `${mantissa.toFixed(2)}e${exp}`;
}

export function formatFrames(num, mode = 'short') {
  if (mode === 'short' && num < 1e6) return Math.floor(num).toLocaleString('en-US');
  return formatNumber(Math.floor(num), mode);
}

export function formatMultiplier(m) {
  if (!Number.isFinite(m)) return 'x∞';
  if (m < 10) return 'x' + m.toFixed(2);
  if (m < 1000) return 'x' + m.toFixed(1);
  return 'x' + formatNumber(m);
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
}

export function formatElapsed(seconds) {
  if (seconds < 90) return `${Math.round(seconds)} seconds`;
  if (seconds < 5400) return `${(seconds / 60).toFixed(0)} minutes`;
  if (seconds < 172800) return `${(seconds / 3600).toFixed(1)} hours`;
  return `${(seconds / 86400).toFixed(1)} days`;
}

export function formatTimeToAfford(deficit, rate) {
  if (deficit <= 0) return null;
  if (rate <= 0) return '—';
  return formatDuration(deficit / rate);
}
