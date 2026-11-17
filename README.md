# Spielstand

Web-App zum Aufschreiben der Punkte bei Kartenspielen – fürs Handy gemacht, funktioniert offline und lässt sich auf dem Homescreen installieren.

## Ablauf
1. **Neues Spiel** → Spiel auswählen (aktuell: Skyjo, Rage, Rommé)
2. **Spieler hinzufügen** (bekannte Namen werden vorgeschlagen, Reihenfolge änderbar)
3. **Pro Runde Punkte eintragen** – Tabelle, Summen und Platzierung werden automatisch berechnet

## Skyjo
- Das Spiel endet, sobald jemand am Ende einer Runde ≥ 100 Punkte hat (einstellbar); die niedrigste Summe gewinnt.
- **Verdopplung** (abschaltbar): Wer die Runde beendet hat und nicht allein die wenigsten Punkte hat, bekommt seine (positiven) Punkte doppelt.
- Negative Werte über die ±-Taste eingeben.
- Runden lassen sich nachträglich durch Antippen bearbeiten oder löschen.

## Rage
- 10 Runden, in Runde 1 gibt es 10 Karten, danach jeweils eine weniger (Rundenzahl einstellbar).
- Pro Runde je Person **Ansage**, **Stiche** und **Bonus** eintragen.
- Wertung: 1 Punkt pro Stich, **+10** bei genau getroffener Ansage, sonst **−5** (beides einstellbar). Unter „Bonus“ kommen die Punkte aus Bonus-Rage- (+5) und Mad-Rage-Karten (−5).
- Passt die Summe der Stiche nicht zur Kartenzahl, fragt die App nach. Die höchste Summe gewinnt.

## Rommé
- Wer zuerst alle Karten abgelegt hat, wird als **Raus** markiert und bekommt 0 Punkte.
- Alle anderen tragen den Wert ihrer Restkarten als Minuspunkte ein (Joker 20, Ass 11, Bube/Dame/König 10, sonst Augenzahl).
- **Hand-Rommé** (abschaltbar): Legt jemand alle Karten auf einmal ab, zählen die Restkarten der anderen doppelt.
- Das Spiel endet, sobald jemand ≥ 500 Minuspunkte hat (einstellbar); die niedrigste Summe gewinnt.

## Starten
Kein Build nötig – einfach statisch ausliefern, z. B.:

```sh
python3 -m http.server 8000
```

und `http://localhost:8000` öffnen. Für GitHub Pages reicht es, den Branch als Quelle einzustellen.

Daten werden lokal im Browser (localStorage) gespeichert.

## Weitere Spiele hinzufügen
Neue Spiele werden in `js/games.js` im Objekt `GAMES` registriert (Name, Spielerzahl, Einstellungen, Eingabefelder pro Runde `fields`, `scoreRound`, `isFinished`). Die Kommentare oben in der Datei beschreiben alle Optionen.
