// Persistenz im localStorage des Geräts.

const KEY = "spielstand.v1";

function empty() {
  return { games: [], knownPlayers: [] };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    return { ...empty(), ...data };
  } catch {
    return empty();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Speicher voll oder blockiert – App läuft trotzdem weiter.
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
