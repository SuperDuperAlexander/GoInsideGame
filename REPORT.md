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
