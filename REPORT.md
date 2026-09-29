# Bericht an Alexander

## M0 — Einrichtung
**Was gemacht wurde**
- Projekt mit Vite, TypeScript (strict), Babylon.js, Vitest, Playwright, ESLint, Prettier.
- Farben (`palette.ts`), Zahlen (`tuning.ts`), alle Texte (`en.json`), Störungen, Ersatz-Tabellen, Kapitel-Plan.
- Reine Logik schon fertig und getestet: Atem, Unruhe, Störungs-Zustand, Speicher, Sicherheits-Prüfung, KI-Prüfung, Laufbereich.
- Startbildschirm mit Titel und Build-Nummer.

**Funktioniert es**
- `npm run check`: ja (45 Unit-Tests grün).
- `npm run build`: ja.
- Browser-Test `M0` auf Desktop und Handy: grün, keine Fehler in der Konsole.

**Was offen ist**
- Die 3D-Welt kommt ab M1.

**Neue Entscheidungen**: D11–D16.

## M1 — Gehen
**Was gemacht wurde**
- 3D-Welt mit Babylon.js: Boden (sanfter Hügel, Pflaster am Platz), Himmel, Dunst.
- Die Papier-Figur mit Kapuze, Umhang, Schal-Enden, Beinen und warmem Licht in der Brust. Gehen, Atmen hebt den Umhang.
- Gehen mit WASD/Pfeilen oder Joystick (Handy, linke Hälfte). Kamera folgt, Ziehen dreht sie, nach 1,2 s dreht sie zurück.
- Leistung: Pixel-Grenze, automatische Auflösung, Qualitätsstufen. Debug-Anzeige (`?debug`, F3).

**Funktioniert es**
- `npm run check` und `npm run build`: ja.
- Browser-Test `M1 walk` auf Desktop und Handy: grün, keine Fehler.
- Draw Calls: 16. fps im Test-Browser (Software-Grafik, ohne GPU): 6–30. Auf echten Geräten deutlich mehr.

**Was offen ist**
- Stadt kommt in M2.

**Neue Entscheidungen**: keine.

## M2 — Die graue Stadt
**Was gemacht wurde**
- Stadt aus grauem Karton, erzeugt aus `ch1.json`: Feld, Platz mit trockenem Brunnen, drei Gassen den Hügel hinauf, Terrassen, Tor-Pfeiler.
- Häuser mit schiefen Wänden, Dächern, dunklen Fenstern, Türen, dicken Tinten-Umrissen. Bäume aus gekreuzten Karton-Kronen, Steine und Büschel.
- Graue Spaziergänger auf dem Platz.
- Grau-zu-Farbe-System: 8 Farbzonen, wachsen in 3 s, 8 % heller. `?color` zeigt alle Farben.

**Funktioniert es**
- `npm run check`, `npm run build`: ja.
- Browser-Test `M2`: grün. Draw Calls: 31 (Desktop), 25 (Handy) — Ziel < 100.
- Test-Zone am Platz: Graustufen-Helligkeit steigt messbar (0,56 → 0,59 Desktop, 0,56 → 0,63 Handy).

**Was offen ist**
- Störungen, Atem, Auswahl der Karten kommen in M3.

**Neue Entscheidungen**: D17, D18.
