# Spielstand

Web-App zum Aufschreiben der Punkte bei Kartenspielen – fürs Handy gemacht, funktioniert offline und lässt sich auf dem Homescreen installieren.

## Ablauf
1. **Neues Spiel** → Spiel auswählen (aktuell: Skyjo)
2. **Spieler hinzufügen** (bekannte Namen werden vorgeschlagen, Reihenfolge änderbar)
3. **Pro Runde Punkte eintragen** – Tabelle, Summen und Platzierung werden automatisch berechnet

## Skyjo
- Das Spiel endet, sobald jemand am Ende einer Runde ≥ 100 Punkte hat (einstellbar); die niedrigste Summe gewinnt.
- **Verdopplung** (abschaltbar): Wer die Runde beendet hat und nicht allein die wenigsten Punkte hat, bekommt seine (positiven) Punkte doppelt.
- Negative Werte über die ±-Taste eingeben.
- Runden lassen sich nachträglich durch Antippen bearbeiten oder löschen.

## Starten
Kein Build nötig – einfach statisch ausliefern, z. B.:

```sh
python3 -m http.server 8000
```

und `http://localhost:8000` öffnen. Für GitHub Pages reicht es, den Branch als Quelle einzustellen.

Daten werden lokal im Browser (localStorage) gespeichert.

## Weitere Spiele hinzufügen
Neue Spiele werden in `js/games.js` im Objekt `GAMES` registriert (Name, Spielerzahl, Einstellungen, `scoreRound`, `isFinished`).
