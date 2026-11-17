// Spiel-Definitionen. Neue Spiele werden hier registriert.
//
// Jede Definition beschreibt:
//   id, name, emoji, description, minPlayers, maxPlayers
//   settings:       konfigurierbare Optionen mit Standardwerten
//   lowestWins:     true, wenn die niedrigste Punktzahl gewinnt
//   fields:         Eingaben pro Spieler und Runde, z. B. [{ key: "raw", label: "Punkte", signed: true, min, max }]
//                   Jedes Feld wird in der Runde als Array round[key] gespeichert (ein Wert pro Spieler).
//   usesCloser:     es gibt pro Runde eine Person, die die Runde beendet (closerLabel / closerHint für die Anzeige)
//   closerScoresZero: wer die Runde beendet, bekommt automatisch 0 Punkte (Eingabe wird ausgeblendet)
//   roundToggles:   Ja/Nein-Schalter pro Runde (round[key] = true/false); optional nur wenn when(game)
//   roundInfo(index, game)      -> Zusatzinfo zur Runde, z. B. „10 Karten“
//   scoreRound(round, game)     -> tatsächliche Punkte pro Spieler für diese Runde
//   cellNote(round, i, game)    -> kurzer HTML-Hinweis neben den Punkten (z. B. „×2“)
//   checkRound(round, game, index) -> { error } (Speichern verhindern) oder { warn } (nachfragen)
//   isFinished(totals, game)    -> true, wenn das Spiel vorbei ist

const num = (v) => Number(v) || 0;

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
    fields: [{ key: "raw", label: "Punkte", signed: true, min: -24, max: 144 }],
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
    closerLabel: "Beendet",
    closerHint: "„Beendet“ = wer zuerst alle Karten aufgedeckt hat.",

    scoreRound(round, game) {
      const raw = round.raw.map(num);
      const result = raw.slice();
      const c = round.closer;
      if (game.settings.doubleRule && c != null && c >= 0 && c < raw.length) {
        const mine = raw[c];
        const othersLowerOrEqual = raw.some((v, i) => i !== c && v <= mine);
        if (mine > 0 && othersLowerOrEqual) result[c] = mine * 2;
      }
      return result;
    },

    cellNote(round, i, game) {
      if (round.closer !== i) return "";
      const doubled = this.scoreRound(round, game)[i] !== num(round.raw[i]);
      return doubled ? '<sup title="verdoppelt">×2</sup>' : "";
    },

    isFinished(totals, game) {
      return totals.some((t) => t >= game.settings.endScore);
    },
  },

  rage: {
    id: "rage",
    name: "Rage",
    emoji: "🔥",
    description: "Stiche ansagen und genau treffen – nach 10 Runden gewinnt die höchste Summe.",
    minPlayers: 2,
    maxPlayers: 8,
    lowestWins: false,
    fields: [
      { key: "bid", label: "Ansage", min: 0, max: 20 },
      { key: "tricks", label: "Stiche", min: 0, max: 20 },
      { key: "extra", label: "Bonus", signed: true, min: -100, max: 100 },
    ],
    settings: [
      { key: "rounds", label: "Anzahl Runden (= Karten in Runde 1)", type: "number", default: 10 },
      { key: "hitBonus", label: "Bonus für richtige Ansage", type: "number", default: 10 },
      { key: "missPenalty", label: "Abzug für falsche Ansage", type: "number", default: 5 },
    ],
    tableHint: "klein: Ansage/Stiche",
    fieldsHint: "Pro Stich 1 Punkt. Unter „Bonus“ die Punkte aus Bonus-Rage (+5) und Mad-Rage-Karten (−5) eintragen.",

    cards(index, game) {
      return Math.max(0, game.settings.rounds - index);
    },

    roundInfo(index, game) {
      const n = this.cards(index, game);
      return n > 0 ? `${n} ${n === 1 ? "Karte" : "Karten"}` : "";
    },

    hit(round, i) {
      return num(round.bid[i]) === num(round.tricks[i]);
    },

    scoreRound(round, game) {
      return round.tricks.map((t, i) => {
        const tricks = num(t);
        const bidBonus = this.hit(round, i) ? num(game.settings.hitBonus) : -num(game.settings.missPenalty);
        return tricks + bidBonus + num(round.extra?.[i]);
      });
    },

    cellNote(round, i) {
      const ok = this.hit(round, i);
      return `<small class="note ${ok ? "ok" : "miss"}" title="Ansage/Stiche">${num(round.bid[i])}/${num(round.tricks[i])}</small>`;
    },

    checkRound(round, game, index) {
      const cards = this.cards(index, game);
      const sum = round.tricks.reduce((a, v) => a + num(v), 0);
      if (cards > 0 && sum !== cards) {
        return { warn: `Zusammen ${sum} Stiche, verteilt wurden aber ${cards} Karten pro Person. Trotzdem speichern?` };
      }
      return {};
    },

    isFinished(totals, game) {
      return game.rounds.length >= game.settings.rounds;
    },
  },

  romme: {
    id: "romme",
    name: "Rommé",
    emoji: "♦️",
    description: "Restkarten zählen als Minuspunkte – wer zuerst die Grenze erreicht, beendet das Spiel. Wenigste Punkte gewinnen.",
    minPlayers: 2,
    maxPlayers: 6,
    lowestWins: true,
    // Restkarten auf der Hand: Joker 20, Ass 11, Bilder 10, sonst Augenzahl (max. 14 Karten)
    fields: [{ key: "raw", label: "Minuspunkte", min: 0, max: 280 }],
    settings: [
      { key: "endScore", label: "Spielende ab Minuspunkten", type: "number", default: 500 },
      {
        key: "handDouble",
        label: "Hand-Rommé verdoppelt",
        hint: "Legt jemand alle Karten auf einmal ab, zählen die Restkarten der anderen doppelt.",
        type: "boolean",
        default: true,
      },
    ],
    fieldsHint: "Restkarten zählen: Joker 20, Ass 11, Bube/Dame/König 10, sonst Augenzahl.",
    usesCloser: true,
    closerScoresZero: true,
    closerLabel: "Raus",
    closerHint: "„Raus“ = wer zuerst alle Karten abgelegt hat (bekommt 0 Punkte).",
    roundToggles: [
      {
        key: "hand",
        label: "Hand-Rommé",
        hint: "Alle Karten auf einmal abgelegt – die anderen zahlen doppelt.",
        when: (game) => game.settings.handDouble,
      },
    ],

    factor(round, game) {
      return round.hand && game.settings.handDouble ? 2 : 1;
    },

    scoreRound(round, game) {
      const f = this.factor(round, game);
      return round.raw.map((v, i) => (i === round.closer ? 0 : num(v) * f));
    },

    cellNote(round, i, game) {
      return i !== round.closer && this.factor(round, game) === 2 && num(round.raw[i]) > 0
        ? '<sup title="Hand-Rommé: doppelt">×2</sup>'
        : "";
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
