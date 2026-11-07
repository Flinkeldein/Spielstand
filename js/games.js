// Spiel-Definitionen. Neue Spiele werden hier registriert.
//
// Jede Definition beschreibt:
//   id, name, description, minPlayers, maxPlayers
//   settings:       konfigurierbare Optionen mit Standardwerten
//   lowestWins:     true, wenn die niedrigste Punktzahl gewinnt
//   roundFields:    zusätzliche Eingaben pro Runde (z. B. wer beendet hat)
//   scoreRound(round, game)  -> tatsächliche Punkte pro Spieler für diese Runde
//   isFinished(totals, game) -> true, wenn das Spiel vorbei ist

export const GAMES = {
  skyjo: {
    id: "skyjo",
    name: "Skyjo",
    emoji: "🃏",
    description: "Wer zuerst 100 Punkte erreicht, beendet das Spiel – die niedrigste Summe gewinnt.",
    minPlayers: 2,
    maxPlayers: 8,
    lowestWins: true,
    // Pro Runde mögliche Werte: 12 Karten zwischen -2 und 12
    minRoundScore: -24,
    maxRoundScore: 144,
    settings: [
      { key: "endScore", label: "Spielende ab Punkten", type: "number", default: 100 },
      {
        key: "doubleRule",
        label: "Verdopplung",
        hint: "Wer die Runde beendet und nicht allein die wenigsten Punkte hat, bekommt seine Punkte doppelt (nur wenn positiv).",
        type: "boolean",
        default: true,
      },
    ],
    // Wer hat die Runde beendet (alle Karten zuerst aufgedeckt)?
    usesCloser: true,

    scoreRound(round, game) {
      const raw = round.raw.map((v) => Number(v) || 0);
      const result = raw.slice();
      const c = round.closer;
      if (game.settings.doubleRule && c != null && c >= 0 && c < raw.length) {
        const mine = raw[c];
        const othersLowerOrEqual = raw.some((v, i) => i !== c && v <= mine);
        if (mine > 0 && othersLowerOrEqual) result[c] = mine * 2;
      }
      return result;
    },

    // Doppelt gewertet? (für die Anzeige)
    isDoubled(round, game) {
      const c = round.closer;
      if (c == null || c < 0) return false;
      return this.scoreRound(round, game)[c] !== (Number(round.raw[c]) || 0);
    },

    isFinished(totals, game) {
      return totals.some((t) => t >= game.settings.endScore);
    },
  },
};

export function getGame(id) {
  return GAMES[id];
}

export function defaultSettings(def) {
  const s = {};
  for (const opt of def.settings) s[opt.key] = opt.default;
  return s;
}
