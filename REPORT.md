# Bericht an Alexander

## Zusammenfassung (M0–M9 fertig)
- Das ganze MVP ist gebaut: Start → 3 Karten → Erwachen → graue Stadt → 3 Störungen → innere Reise → Samen → farbige Stadt → Tor → Kapitel-Ende.
- Alle Tests grün: 54 Unit-Tests, Browser-Tests M0–M9 auf Desktop und Handy-Profil. Keine Fehler in der Konsole, keine Anfragen an fremde Adressen.
- Kein harter Blocker. Kein `OPENROUTER_API_KEY` hier – das Spiel läuft komplett mit den Ersatz-Tabellen.

### Was du am Handy testen solltest
1. Auf Vercel importieren (siehe README), Schlüssel `OPENROUTER_API_KEY` eintragen.
2. Handy: Läuft es flüssig (Ziel 30+ fps)? Mit `?debug` siehst du fps oben links.
3. Atem-Knopf: halten, loslassen – fühlt es sich ruhig an?
4. Klang anhören (Kopfhörer): Stadt, Störungen, Herzschlag, Glocken.
5. Eigene Worte + "Allow": Kommen gute Fragen von der KI?
6. Einmal neu laden mitten im Kapitel → "Continue your walk".

### Was offen ist
- Das Aussehen ist ein erster prozeduraler Stand (keine Kunst-Dateien). Besonders die innere Welt kann schöner werden.
- fps im Test-Browser (Software-Grafik ohne GPU): 6–26. Echte Messung am Handy fehlt noch.
- Die KI wurde nur mit nachgestellten Antworten getestet.

### Was Kapitel 2 braucht
- Die gespeicherten Themen (`themes` im Speicher) als Samen-Bäume im Garten.
- Neues Layout `public/data/chapters/ch2.json`, Tor-Übergang von Kapitel 1.
- Pflücken / Ast schneiden → wächst nach (Regel "Run from it: it returns").

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

## M6 — Die ganze Schleife und Kapitel-Ende
**Was gemacht wurde**
- Nach der Rückkehr: Störung leiser, kleiner, tritt 1,5 m zur Seite, Hindernis schrumpft, Farbzone wächst, Brustlicht wird größer, Brunnen füllt sich mit Licht.
- Nach 3 Verbindungen: Lichtbrunnen, das Tor faltet sich in warmes Licht auf, die ganze Stadt wird langsam farbig. Durch das Tor gehen → Licht-Übergang → Karte "Chapter complete" mit den 3 Samen.
- Speichern und Weiterspielen ("Continue your walk"): Position, Zustände, Farben, Brunnen, Tor.
- Pause (Esc / Pause-Knopf): Weiter, Samenbuch, Einstellungen (Atem-Rhythmus, Lautstärke, weniger Bewegung, KI an/aus, "Forget everything" mit Nachfrage). Start-Bildschirm: Einstellungen und "About the teaching".

**Funktioniert es**
- `npm run check`, `npm run build`: ja.
- Browser-Test `M6 loop` (Start bis Kapitel-Ende mit `?noai`, dazwischen Neuladen und Weiterspielen) auf Desktop und Handy grün. `M6 pause and settings` grün.

**Was offen ist**
- KI und Sicherheit folgen in M7.

**Neue Entscheidungen**: D29–D31.

## M7 — KI-Spiegelung und Sicherheit
**Was gemacht wurde**
- Server-Funktion `api/reflect.ts`: nur POST, max. 4 kB, 30 Anfragen / 10 min pro IP, schreibt nie den Text ins Log (nur Status und Dauer). Ruft OpenRouter mit dem System-Prompt aus CONTENT.md.
- Browser: prüft jede KI-Antwort streng (Frage, Chips, Teile, Thema, Länge). 6 s Zeitlimit. Jeder Fehler → Ersatz-Tabellen. Der Spieler sieht nie einen Fehler.
- Einwilligung: beim ersten Mal "eigene Worte" kommt einmal die Frage (Allow / Keep it offline). In den Einstellungen änderbar.
- Krisen-Prüfung im Browser vor dem Senden (Englisch + Deutsch). Treffer → nichts wird gesendet oder gespeichert, ruhiges Hilfe-Fenster mit Telefonnummern, "Return" → zurück nach außen. Auch `{"crisis": true}` von der KI führt dorthin.
- Spracheingabe (Mikrofon-Knopf), wenn der Browser sie kann.

**Funktioniert es**
- Unit-Tests für Prüfung, Sicherheit und Server-Funktion: grün (54 Tests).
- Browser-Test `M7 ai` mit nachgestellten Antworten: gut, kaputtes JSON, Zeitüberschreitung, Krise (KI), Krise (lokal) → alle enden in einem gültigen Zustand. Keine Anfrage an fremde Adressen.

**Was offen ist**
- Echter Test mit dem Schlüssel `OPENROUTER_API_KEY` auf Vercel (hier nicht vorhanden – kein Blocker, das Spiel läuft offline).

**Neue Entscheidungen**: D32–D34.

## M8 — Echo und Klang
**Was gemacht wurde**
- Echo: Bruchstücke (3–6 Wörter) aus den eigenen Worten werden lokal gespeichert (max. 20). Geht man an einer noch nicht verbundenen Störung vorbei (6 m), schwebt ein Bruchstück als Handschrift darüber: "i never… have enough". Höchstens alle 20 s. Vorher nichts.
- Klang (alles im Code erzeugt): Stadt-Murmeln, Wind, seltenes Holzklicken; eigener Loop pro Störung (räumlich, nach Verbindung −12 dB, langsamer, gedämpft); Herzschlag; Atem-Rauschen; innere Klangflächen; Glocken bei Seele, Herz, jedem Verwandlungs-Schritt, Samen; Tor-Klang.

**Funktioniert es**
- Browser-Test `M8 echo` auf Desktop und Handy grün (Worte bei Störung 1 → Bruchstück bei Störung 2).

**Was offen ist**
- Klang nur im Test-Browser geprüft (ohne Lautsprecher). Bitte am Handy anhören.

**Neue Entscheidungen**: keine.

## M9 — Handy-Durchgang und Abschluss
**Was gemacht wurde**
- Handy: Pixel-Grenze, Qualitätsstufen, halbierte Partikel bei "weniger Bewegung", Safe-Areas (Notch), große Tipp-Flächen (≥ 48 px).
- Barrierefreiheit: Kontrast-Test (WCAG AA 4.5:1) als Unit-Test, alles per Tastatur bedienbar, sichtbarer Fokus-Ring, Namen für Symbol-Knöpfe.
- Seite "About the teaching" (vom Start-Bildschirm).

**Funktioniert es**
- Browser-Test `M9 full` (Start bis Kapitel-Ende) auf Desktop und Handy grün. `M9 keyboard only` grün.
- Budgets: Download ca. 0,7 MB gzip (Ziel ≤ 3 MB). Draw Calls außen 24–54 (< 100), innen 25–38 (< 40). Aktive Meshes außen ≤ 41 (< 400). Kein Speicher-Zuwachs nach 5 Tauch-Runden.
- Bilder: `screenshots/final/`.

**Neue Entscheidungen**: keine.

## Nachtrag 30.09. — Geführter Atem, lesbare Schrift, Konzept "lebendige Welt"
**Was gemacht wurde**
- Kein Drücken mehr zum Atmen. Eine Licht-Blase an der Seite (wie "Breathe Bubble" in der App Calm) wächst bei "Breathe in" und schrumpft bei "Breathe out". Man folgt ihr nur.
- Weniger Atem: Anfang (1), Hineingehen (1), "Eins" (3). Hinausgehen geht jetzt ohne Atem.
- Weiße Schrift in der inneren Welt steht auf einer weichen dunklen Fläche, dunkle Schrift außen auf einer hellen Fläche.
- Recherche + Vorschlag: `docs/WORLD_CONCEPT.md` (lebendige Welt, Stimmung der Stadt, Menschen werden freundlicher, Welt-Ereignisse per KI aus einem festen Baukasten).

**Funktioniert es**
- `npm run check`: ja. Browser-Tests M3, M4, M5, M6, M8, M9-Tastatur: grün.

**Neue Entscheidungen**: D35, D36.

## Nachtrag 30.09. — Antworten passen zur Frage
**Was gemacht wurde**
- Jede Störung hat jetzt eigene 6 Antworten auf ihre Seelen-Frage. Beispiel "Whose eyes do you want on you?" → "My parents'", "Anyone's, so I'm not forgotten", "Those who overlooked me", "Everyone's", "No one's. I'd rather hide", "Maybe my own".
- Auch die zweite Frage passt jetzt zur gewählten Antwort (z. B. "What would their eyes give you?").
- Die KI hat eine neue Regel: jeder Chip muss direkt auf ihre Frage antworten.
- Alle Texte stehen in `fallback.json` und in `docs/CONTENT.md` (Abschnitte 5a, 6a) zum Nachlesen.

**Funktioniert es**
- `npm run check` (55 Tests, neu: jede Antwort gehört zu genau einer Art) und Browser-Tests M5, M7: grün.

**Neue Entscheidungen**: D37.

## Nachtrag 30.09. — Die lebendige Welt (Option A, Babylon.js)
**Was gemacht wurde**
- Die Stadt hat eine Stimmung: Wärme, Licht, Pflege, Sturm. Jede Verbindung verändert die ganze Stadt, nicht nur die Störung.
- Am Anfang: Sturm über der Stadt mit Blitzen, dunkle Fenster, mürrische Menschen (kleiner Blitz über dem Kopf, rempeln, hetzen).
- Nach jeder Verbindung: eine warme Welle läuft von der Gasse über die Stadt. Wo sie vorbeikommt, wachsen neue Dinge aus dem Boden.
- Das gefundene Thema bestimmt WAS kommt (jeder Durchgang ist anders): z. B. Rest → Bänke, Laternen, Licht in den Fenstern; Freedom → Drachen, Vögel, Girlanden; Belonging → gemeinsamer Tisch, Menschen grüßen sich; Peace → Sturm zieht ab, Blumen, Vögel.
- Menschen verändern sich einzeln: mürrisch → neutral → freundlich (bleiben stehen, grüßen einander) → warm (kleine Herzen, drehen sich zum Spieler). Wenn es warm ist, kommen mehr Menschen heraus.
- Die ganze Stadt bekommt mit jeder Verbindung mehr Farbe. Die Musik der Stadt wächst.
- Um die verbundene Störung wächst ein kleiner Garten.
- Die KI (mit Schlüssel) darf 2–3 Welt-Ereignisse aus dem festen Baukasten wählen, passend zu den Worten des Spielers.

**Funktioniert es**
- Neue Unit-Tests `worldMood` und neuer Browser-Test `M10 living world` (Desktop + Handy) grün: Sturm geht, Menschen werden warm, 7 Ereignisse, Neuladen bringt alles zurück. Draw Calls 81–92 (< 100).
- Bilder: `screenshots/M10/`.

**Neue Entscheidungen**: D38.
