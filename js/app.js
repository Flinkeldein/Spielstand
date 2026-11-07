import { GAMES, getGame, defaultSettings } from "./games.js";
import { load, save, uid } from "./store.js";

const state = load();
const app = document.getElementById("app");

// Entwurf für ein neues Spiel (nur im Speicher, bis gestartet wird)
let draft = null;

// ---------- Hilfsfunktionen ----------

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function persist() {
  save(state);
}

function findGame(id) {
  return state.games.find((g) => g.id === id);
}

function roundScores(game) {
  const def = getGame(game.type);
  return game.rounds.map((r) => def.scoreRound(r, game));
}

function totals(game) {
  const t = game.players.map(() => 0);
  for (const scores of roundScores(game)) scores.forEach((v, i) => (t[i] += v));
  return t;
}

// Platzierung: 1-basiert, Gleichstand teilt sich den Platz
function ranks(game) {
  const def = getGame(game.type);
  const t = totals(game);
  return t.map((v) => 1 + t.filter((o) => (def.lowestWins ? o < v : o > v)).length);
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function go(hash) {
  location.hash = hash;
}

function rememberPlayers(names) {
  const known = state.knownPlayers.filter((n) => !names.includes(n));
  state.knownPlayers = [...names, ...known].slice(0, 40);
}

function updateFinished(game) {
  const def = getGame(game.type);
  game.finished = game.rounds.length > 0 && def.isFinished(totals(game), game);
}

// ---------- Ansichten ----------

function header(title, back) {
  return `
    <header class="bar">
      ${back ? `<a class="icon-btn" href="${back}" aria-label="Zurück">‹</a>` : `<span class="icon-btn spacer"></span>`}
      <h1>${esc(title)}</h1>
      <span class="icon-btn spacer"></span>
    </header>`;
}

function viewHome() {
  const running = state.games.filter((g) => !g.finished).sort((a, b) => b.updatedAt - a.updatedAt);
  const done = state.games.filter((g) => g.finished).sort((a, b) => b.updatedAt - a.updatedAt);

  const card = (g) => {
    const def = getGame(g.type);
    const t = totals(g);
    const r = ranks(g);
    const leader = g.players.filter((_, i) => r[i] === 1);
    return `
      <a class="card game-card" href="#/game/${g.id}">
        <div class="game-card-head">
          <span class="emoji">${def.emoji}</span>
          <strong>${esc(def.name)}</strong>
          <span class="muted small">${formatDate(g.createdAt)}</span>
        </div>
        <div class="muted small">${g.players.map(esc).join(", ")}</div>
        <div class="small">
          ${g.rounds.length} ${g.rounds.length === 1 ? "Runde" : "Runden"}
          ${g.rounds.length ? ` · ${g.finished ? "🏆 Gewonnen" : "Vorne"}: <strong>${leader.map(esc).join(", ")}</strong> (${t[r.indexOf(1)]})` : ""}
        </div>
      </a>`;
  };

  app.innerHTML = `
    ${header("Spielstand")}
    <main>
      <button class="btn primary big" id="new">+ Neues Spiel</button>
      ${running.length ? `<h2>Laufende Spiele</h2>${running.map(card).join("")}` : ""}
      ${done.length ? `<h2>Beendete Spiele</h2>${done.map(card).join("")}` : ""}
      ${!state.games.length ? `<p class="empty">Noch keine Spiele. Leg los!</p>` : ""}
    </main>`;

  app.querySelector("#new").onclick = () => go("#/new");
}

function viewSelect() {
  app.innerHTML = `
    ${header("Spiel auswählen", "#/")}
    <main>
      ${Object.values(GAMES)
        .map(
          (d) => `
        <button class="card select-card" data-id="${d.id}">
          <span class="emoji big-emoji">${d.emoji}</span>
          <span>
            <strong>${esc(d.name)}</strong><br>
            <span class="muted small">${esc(d.description)}</span>
          </span>
        </button>`
        )
        .join("")}
      <p class="muted small center">Weitere Spiele folgen.</p>
    </main>`;

  app.querySelectorAll(".select-card").forEach((b) => {
    b.onclick = () => {
      const def = getGame(b.dataset.id);
      draft = { type: def.id, players: [], settings: defaultSettings(def) };
      go("#/setup");
    };
  });
}

function viewSetup() {
  if (!draft) return go("#/new");
  const def = getGame(draft.type);
  const suggestions = state.knownPlayers.filter((n) => !draft.players.includes(n));
  const canStart = draft.players.length >= def.minPlayers;

  app.innerHTML = `
    ${header(def.name + " – Spieler", "#/new")}
    <main>
      <form id="add" class="row">
        <input id="name" type="text" placeholder="Name eingeben" autocomplete="off" maxlength="20" enterkeyhint="done">
        <button class="btn primary" type="submit">Hinzufügen</button>
      </form>

      ${
        suggestions.length
          ? `<div class="chips">${suggestions
              .map((n) => `<button class="chip" data-name="${esc(n)}">+ ${esc(n)}</button>`)
              .join("")}</div>`
          : ""
      }

      <h2>Spieler (${draft.players.length}/${def.maxPlayers})</h2>
      ${
        draft.players.length
          ? `<ol class="player-list">${draft.players
              .map(
                (n, i) => `
            <li>
              <span class="pname">${esc(n)}</span>
              <button class="icon-btn small-btn" data-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="Nach oben">↑</button>
              <button class="icon-btn small-btn" data-down="${i}" ${i === draft.players.length - 1 ? "disabled" : ""} aria-label="Nach unten">↓</button>
              <button class="icon-btn small-btn danger" data-del="${i}" aria-label="Entfernen">✕</button>
            </li>`
              )
              .join("")}</ol>`
          : `<p class="empty">Mindestens ${def.minPlayers} Spieler hinzufügen.</p>`
      }

      <h2>Regeln</h2>
      <div class="card">
        ${def.settings
          .map((s) =>
            s.type === "boolean"
              ? `<label class="setting"><span>${esc(s.label)}${s.hint ? `<br><span class="muted small">${esc(s.hint)}</span>` : ""}</span>
                 <input type="checkbox" data-setting="${s.key}" ${draft.settings[s.key] ? "checked" : ""}></label>`
              : `<label class="setting"><span>${esc(s.label)}</span>
                 <input type="number" inputmode="numeric" class="num" data-setting="${s.key}" value="${draft.settings[s.key]}"></label>`
          )
          .join("")}
      </div>

      <button class="btn primary big" id="start" ${canStart ? "" : "disabled"}>Spiel starten</button>
    </main>`;

  const nameInput = app.querySelector("#name");
  const addName = (n) => {
    n = n.trim();
    if (!n) return;
    if (draft.players.length >= def.maxPlayers) return alert(`Maximal ${def.maxPlayers} Spieler.`);
    if (draft.players.some((p) => p.toLowerCase() === n.toLowerCase())) return alert("Diesen Namen gibt es schon.");
    draft.players.push(n);
    viewSetup();
    app.querySelector("#name").focus();
  };

  app.querySelector("#add").onsubmit = (e) => {
    e.preventDefault();
    addName(nameInput.value);
  };
  app.querySelectorAll("[data-name]").forEach((b) => (b.onclick = () => addName(b.dataset.name)));
  app.querySelectorAll("[data-del]").forEach(
    (b) => (b.onclick = () => (draft.players.splice(+b.dataset.del, 1), viewSetup()))
  );
  const move = (i, d) => {
    const p = draft.players;
    [p[i], p[i + d]] = [p[i + d], p[i]];
    viewSetup();
  };
  app.querySelectorAll("[data-up]").forEach((b) => (b.onclick = () => move(+b.dataset.up, -1)));
  app.querySelectorAll("[data-down]").forEach((b) => (b.onclick = () => move(+b.dataset.down, 1)));
  app.querySelectorAll("[data-setting]").forEach((inp) => {
    inp.onchange = () => {
      draft.settings[inp.dataset.setting] = inp.type === "checkbox" ? inp.checked : Number(inp.value) || 0;
    };
  });

  app.querySelector("#start").onclick = () => {
    const now = Date.now();
    const game = {
      id: uid(),
      type: draft.type,
      players: draft.players.slice(),
      settings: { ...draft.settings },
      rounds: [],
      finished: false,
      createdAt: now,
      updatedAt: now,
    };
    state.games.push(game);
    rememberPlayers(game.players);
    persist();
    draft = null;
    go(`#/game/${game.id}`);
  };
}

function viewGame(id) {
  const game = findGame(id);
  if (!game) return go("#/");
  const def = getGame(game.type);
  const t = totals(game);
  const r = ranks(game);
  const scores = roundScores(game);

  const winnerText = game.finished
    ? `🏆 ${game.players.filter((_, i) => r[i] === 1).map(esc).join(" & ")} ${
        game.players.filter((_, i) => r[i] === 1).length > 1 ? "gewinnen" : "gewinnt"
      }!`
    : "";

  app.innerHTML = `
    ${header(def.name, "#/")}
    <main class="wide">
      ${game.finished ? `<div class="banner">${winnerText}</div>` : ""}

      <div class="ranking">
        ${game.players
          .map((p, i) => ({ p, i }))
          .sort((a, b) => r[a.i] - r[b.i])
          .map(
            ({ p, i }) => `
          <div class="rank-item ${r[i] === 1 && game.rounds.length ? "lead" : ""}">
            <span class="place">${game.rounds.length ? r[i] + "." : ""}</span>
            <span class="pname">${esc(p)}</span>
            <span class="total">${t[i]}</span>
          </div>`
          )
          .join("")}
      </div>

      <div class="table-wrap">
        <table class="scores">
          <thead>
            <tr><th>#</th>${game.players.map((p) => `<th>${esc(p)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${
              game.rounds.length
                ? game.rounds
                    .map(
                      (round, ri) => `
              <tr data-round="${ri}" title="Runde bearbeiten">
                <td class="rn">${ri + 1}</td>
                ${scores[ri]
                  .map((v, pi) => {
                    const doubled = round.closer === pi && def.isDoubled && def.isDoubled(round, game);
                    return `<td class="${round.closer === pi ? "closer" : ""}">${v}${doubled ? '<sup title="verdoppelt">×2</sup>' : ""}</td>`;
                  })
                  .join("")}
              </tr>`
                    )
                    .join("")
                : `<tr><td colspan="${game.players.length + 1}" class="empty">Noch keine Runde eingetragen.</td></tr>`
            }
          </tbody>
          <tfoot>
            <tr><th>Σ</th>${t.map((v, i) => `<th class="${r[i] === 1 && game.rounds.length ? "lead" : ""}">${v}</th>`).join("")}</tr>
          </tfoot>
        </table>
      </div>
      ${game.rounds.length ? `<p class="muted small center">Runde antippen zum Bearbeiten${def.usesCloser ? " · ● = hat Runde beendet" : ""}</p>` : ""}

      <div class="actions">
        ${
          game.finished
            ? `<button class="btn" id="rematch">Neues Spiel, gleiche Spieler</button>`
            : `<button class="btn primary big" id="addRound">+ Runde ${game.rounds.length + 1} eintragen</button>`
        }
        <button class="btn danger-outline" id="delete">Spiel löschen</button>
      </div>
    </main>`;

  app.querySelectorAll("[data-round]").forEach((tr) => (tr.onclick = () => go(`#/game/${id}/round/${tr.dataset.round}`)));
  const add = app.querySelector("#addRound");
  if (add) add.onclick = () => go(`#/game/${id}/round/new`);
  const rematch = app.querySelector("#rematch");
  if (rematch)
    rematch.onclick = () => {
      draft = { type: game.type, players: game.players.slice(), settings: { ...game.settings } };
      go("#/setup");
    };
  app.querySelector("#delete").onclick = () => {
    if (!confirm("Dieses Spiel wirklich löschen?")) return;
    state.games = state.games.filter((g) => g.id !== id);
    persist();
    go("#/");
  };
}

function viewRound(id, which) {
  const game = findGame(id);
  if (!game) return go("#/");
  const def = getGame(game.type);
  const isNew = which === "new";
  const index = isNew ? game.rounds.length : Number(which);
  const existing = isNew ? null : game.rounds[index];
  if (!isNew && !existing) return go(`#/game/${id}`);

  const work = {
    raw: existing ? existing.raw.map(String) : game.players.map(() => ""),
    closer: existing ? existing.closer : null,
  };
  const before = totals(game);
  if (existing) {
    const s = def.scoreRound(existing, game);
    s.forEach((v, i) => (before[i] -= v));
  }

  app.innerHTML = `
    ${header(`Runde ${index + 1}`, `#/game/${id}`)}
    <main>
      <form id="roundForm">
        ${game.players
          .map(
            (p, i) => `
          <div class="entry">
            <label for="s${i}" class="pname">${esc(p)}<br><span class="muted small">bisher ${before[i]}</span></label>
            <button type="button" class="icon-btn sign" data-sign="${i}" aria-label="Vorzeichen wechseln">±</button>
            <input id="s${i}" data-i="${i}" class="num score" type="text" inputmode="numeric" pattern="-?[0-9]*"
                   autocomplete="off" placeholder="0" value="${esc(work.raw[i])}" enterkeyhint="next">
            ${
              def.usesCloser
                ? `<button type="button" class="closer-btn ${work.closer === i ? "on" : ""}" data-closer="${i}" title="Hat die Runde beendet">Beendet</button>`
                : ""
            }
          </div>`
          )
          .join("")}
        ${def.usesCloser ? `<p class="muted small">„Beendet“ = wer zuerst alle Karten aufgedeckt hat.</p>` : ""}
        <div id="preview" class="card preview"></div>
        <button class="btn primary big" type="submit">Speichern</button>
        ${!isNew ? `<button class="btn danger-outline" type="button" id="delRound">Runde löschen</button>` : ""}
      </form>
    </main>`;

  const inputs = [...app.querySelectorAll(".score")];
  const preview = app.querySelector("#preview");

  const parse = (v) => {
    const n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const refresh = () => {
    const round = { raw: work.raw.map(parse), closer: work.closer };
    const res = def.scoreRound(round, game);
    preview.innerHTML = game.players
      .map((p, i) => {
        const doubled = res[i] !== round.raw[i];
        return `<div class="pv"><span>${esc(p)}</span><span>${res[i]}${doubled ? " <em>(×2)</em>" : ""} → <strong>${before[i] + res[i]}</strong></span></div>`;
      })
      .join("");
  };

  inputs.forEach((inp, i) => {
    inp.oninput = () => {
      inp.value = inp.value.replace(/[^\d-]/g, "").replace(/(?!^)-/g, "");
      work.raw[i] = inp.value;
      refresh();
    };
    inp.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (inputs[i + 1]) inputs[i + 1].focus();
        else inp.blur();
      }
    };
  });
  app.querySelectorAll("[data-sign]").forEach((b) => {
    b.onclick = () => {
      const i = +b.dataset.sign;
      const inp = inputs[i];
      inp.value = inp.value.startsWith("-") ? inp.value.slice(1) : "-" + inp.value;
      work.raw[i] = inp.value;
      refresh();
      inp.focus();
    };
  });
  app.querySelectorAll("[data-closer]").forEach((b) => {
    b.onclick = () => {
      const i = +b.dataset.closer;
      work.closer = work.closer === i ? null : i;
      app.querySelectorAll("[data-closer]").forEach((x) => x.classList.toggle("on", +x.dataset.closer === work.closer));
      refresh();
    };
  });

  app.querySelector("#roundForm").onsubmit = (e) => {
    e.preventDefault();
    const raw = work.raw.map(parse);
    if (def.minRoundScore != null) {
      const bad = raw.findIndex((v) => v < def.minRoundScore || v > def.maxRoundScore);
      if (bad >= 0) {
        alert(`${game.players[bad]}: ${raw[bad]} ist bei ${def.name} nicht möglich (${def.minRoundScore} bis ${def.maxRoundScore}).`);
        return;
      }
    }
    if (work.raw.every((v) => v === "" || v === "-") && !confirm("Alle Felder sind leer. Trotzdem mit 0 Punkten speichern?")) return;
    if (def.usesCloser && work.closer == null && !confirm("Niemand als „Beendet“ markiert. Trotzdem speichern?")) return;

    const round = { raw, closer: work.closer };
    if (isNew) game.rounds.push(round);
    else game.rounds[index] = round;
    game.updatedAt = Date.now();
    updateFinished(game);
    persist();
    go(`#/game/${id}`);
  };

  const del = app.querySelector("#delRound");
  if (del)
    del.onclick = () => {
      if (!confirm(`Runde ${index + 1} löschen?`)) return;
      game.rounds.splice(index, 1);
      game.updatedAt = Date.now();
      updateFinished(game);
      persist();
      go(`#/game/${id}`);
    };

  refresh();
  if (isNew) inputs[0]?.focus();
}

// ---------- Router ----------

function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  window.scrollTo(0, 0);
  if (parts[0] === "new") return viewSelect();
  if (parts[0] === "setup") return viewSetup();
  if (parts[0] === "game" && parts[1] && parts[2] === "round") return viewRound(parts[1], parts[3] ?? "new");
  if (parts[0] === "game" && parts[1]) return viewGame(parts[1]);
  return viewHome();
}

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
