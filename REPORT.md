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

## M3 — Atem, Kartenwahl, Störungen, die Welt spiegelt dich
**Was gemacht wurde**
- Atem-System mit Knopf (Handy: Licht-Knopf halten, loslassen) und Hinweis am Desktop ("Hold Space · then Shift"). Rhythmus normal / langsam / leicht.
- Kartenwahl: 8 Karten mit gezeichneten Symbolen in ihrer Farbe, genau 3, Reihenfolge wird gezeigt.
- Erwachen: Bild unscharf und grau, "Breathe.", der erste volle Atemzug macht es klar, die Figur steht auf, Geh-Hinweis.
- Alle 8 Störungen × 3 Formen als Formen aus Code, in voller Farbe, pulsierend, mit eigenem Klang-Loop (räumlich). Sie blockieren die Gassen.
- Schieben (E / Hand-Knopf): wird größer, lauter, die Welt rundherum dunkler. Nie kaputt.
- Unruhe: schnelles Zick-Zack macht Welt lauter und dunstiger, Störungen pulsieren schneller, graue Figuren eilen.
- Herzschlag in der Nähe einer Störung. Wahl-Paar *Stay outside* · *Go within* erscheint (Tauchen folgt in M4).

**Funktioniert es**
- `npm run check`, `npm run build`: ja.
- Browser-Test `M3 disturbances` auf Desktop und Handy: grün. 3 richtige Typen in 3 Gassen, Terrassen nicht erreichbar, Schieben wächst, Unruhe steigt (0 → 0,42 / 0,64) und fällt (→ 0,11 / 0,03).
- Draw Calls: 21–37.

**Was offen ist**
- Tauchen in die innere Welt kommt in M4.

**Neue Entscheidungen**: D19–D22.

## M4 — Wählen und Eintauchen
**Was gemacht wurde**
- Nahe einer Störung: Herzschlag, dann zwei ruhige Worte: *Stay outside* · *Go within*.
- *Stay outside*: erlaubt. Weggehen und zurückkommen → die Störung zeigt ihre nächste Form (z. B. Spielautomat → Lotto-Bude).
- *Go within*: ein voller Atemzug. Beim Einatmen fährt die Kamera in die Brust der Figur, dann ein warmes Gold, dann die innere Welt (Nacht-Blau, Ich-Perspektive, Umschauen durch Ziehen). Was man 1,5 s ansieht, kommt langsam näher.
- Rückweg: "Breathe to return." → Kamera fliegt zurück hinter die Figur.
- Weniger Bewegung (Einstellung / System): keine Kamerafahrt, nur Überblendung.

**Funktioniert es**
- `npm run check`, `npm run build`: ja.
- Browser-Test `M4 dive`: 5 Runden hinein und hinaus, keine Speicher-Zunahme (Meshes, Materialien, Heap gleich). `M4 stay outside`: Form wechselt. Desktop und Handy grün.

**Was offen ist**
- Die innere Reise selbst (Seele, Herz, Eins, Samen) kommt in M5.

**Neue Entscheidungen**: D23, D24.

## M5 — Die innere Welt (nur Ersatz-Tabellen)
**Was gemacht wurde**
- Papierschnitt-Material: feine Spitze, Blätter, Wellen. Goldenes Licht scheint von hinten durch die Schnitte.
- Alle 12 Teile: Nebel, Wand, Wasser, Licht, Wind, Pflanzen, Risse, Schlucht, Tür, weiter Raum, enger Raum, Lichtpunkte.
- Die Reise: Seele ("What did you come to teach me?") → Frage der Störung → Antwort (Chips oder eigene Worte) → der Ort entsteht → zweite Frage → Thema → Herz (Augen zu, 10 s, dann Stelle am Körper antippen, ein warmes Licht bleibt) → Eins (3 Atemzüge, das harte Element verwandelt sich Schritt für Schritt, verschwindet nie) → Samen-Karte (editierbar, "Keep it") → gespeichert.
- Wand bekommt eine Tür, Schlucht eine Lichtbrücke, Nebel einen Weg, Risse füllen sich mit Gold, Wind wird sanft, Wasser wird still.

**Funktioniert es**
- `npm run check`, `npm run build`: ja.
- Browser-Test `M5 inner`: alle 6 Chips der Runde 1 einmal durchgespielt (Desktop), 1 Runde am Handy. Jedes harte Element verwandelt sich in 3 Atemzügen und ist noch da. Samen gespeichert.
- Draw Calls innen: 25–38 (Ziel < 40).

**Was offen ist**
- Aussehen der inneren Welt ist ein erster Stand (prozedural). Feinschliff möglich.

**Neue Entscheidungen**: D25–D28.
