# Light Within — Technical Architecture

---

## 1. Stack

| Part | Choice | Why |
|---|---|---|
| Engine | **Babylon.js** `@babylonjs/core` (latest 9.x), ES module deep imports | Stable WebGL2 on phones, built-in glow, particles, thin instances, scenes, audio-free core. Known from earlier prototypes |
| Language | TypeScript 5.9, `strict: true` | Safety for autonomous work |
| Build | Vite (latest) | Fast, simple static output |
| Unit tests | Vitest | Pure logic without a graphics device |
| Browser tests | Playwright (`@playwright/test`) | Scenarios, screenshots, mobile profile |
| Lint / format | ESLint + Prettier | Consistent code |
| Hosting | Vercel (static `dist/` + one serverless function) | Already used by Alexander |
| AI | OpenRouter, model `meta-llama/llama-3.3-70b-instruct:nitro` | Alexander already uses this key and model |

No other runtime dependencies. Any new dependency needs a line in `DECISIONS.md`.

Render path: **WebGL2** by default. Do not use WebGPU in the MVP.

---

## 2. Project structure

```
/
  CLAUDE.md
  README.md                 how to run, test, deploy (German + English commands)
  REPORT.md                 milestone reports (German)
  docs/                     GAME_DESIGN, DESIGN_SYSTEM, TECH, CONTENT, BUILD_PLAN, DECISIONS
  api/
    reflect.ts              Vercel serverless function (the only server code)
  public/
    fonts/                  WorkSans-*.ttf, NothingYouCouldDo-Regular.ttf (+ OFL texts)
    data/
      content/en.json       all player-facing text (see CONTENT.md §1–7)
      disturbances.json     8 types × 3 forms, colours, sound ids
      fallback.json         the offline reflection tables (CONTENT.md §7)
      chapters/ch1.json     region layout: start, lanes, spots, gate, figures
  src/
    main.ts                 boot: engine, router, debug hooks (window.__lw)
    config/
      palette.ts            all colours (DESIGN_SYSTEM §2)
      tuning.ts             all numbers
    core/
      events.ts             typed event bus
      input.ts              keyboard, pointer, touch, gamepad-free
      router.ts             game state machine (§4)
      save.ts               localStorage wrapper (try/catch, versioned)
      perf.ts               quality tiers, hardware scaling, fps watchdog
      audio.ts              Web Audio synth + spatial sources
      flags.ts              URL debug switches
      content.ts            loads + validates en.json, disturbances.json, fallback.json
    logic/                  NO Babylon imports here
      breath.ts             BreathSystem
      restlessness.ts       RestlessnessSystem
      disturbanceState.ts   state machine per disturbance
      themeMemory.ts        saved themes, seeds, echo fragments
      reflect.ts            request building, response validation, fallback lookup
      safety.ts             crisis check
      sceneSpec.ts          SceneSpec type + validation
    render/
      engine.ts             engine creation, DPR cap, resize
      materials/
        cardboard.ts
        papercut.ts
        disturbance.ts
        light.ts
        greyChunk.ts        shared grey-to-colour GLSL + uniforms
      outline.ts            inverted-hull ink outlines
      geometry.ts           procedural meshes (jagged boxes, roofs, trees, figures)
    outer/
      OuterWorld.ts         builds the region from chapters/ch1.json
      Town.ts               buildings, square, fountain, lanes, gate
      Figures.ts            grey strollers copying the player
      Disturbance.ts        mesh, sound, forms, push reaction, step aside
      ColorZones.ts         zone list → greyChunk uniforms
      FollowCamera.ts
      Walker.ts             movement, height, colliders
    inner/
      InnerWorld.ts         second Scene, first-person camera, gaze drift
      parts/                one file per kit part (fog.ts, wall.ts, …)
      transform.ts          the 3-step transformations
      BodyOutline.ts        heart step UI (HTML/SVG)
    player/
      PlayerVisual.ts       procedural figure + chest light
      BreathVisuals.ts
    flow/
      Opening.ts            awakening sequence
      Connection.ts         orchestrates one Connection Loop
      Dive.ts               camera flight + scene switch
      ChapterEnd.ts
    ui/
      styles.css
      StartScreen.ts, CardPicker.ts, ChoicePair.ts, BreathButton.ts, Joystick.ts,
      PushButton.ts, Chips.ts, TextField.ts, SeedCard.ts, SeedBook.ts,
      HelpPanel.ts, Settings.ts, ConsentPanel.ts, DebugOverlay.ts
  tests/
    unit/                   Vitest
    e2e/                    Playwright
```

---

## 3. Engine and scenes

- One `Engine` (`antialias` on desktop, off on touch; `stencil: false`; `powerPreference: 'high-performance'`).
- **Two scenes:** `outerScene` and `innerScene`. The render loop renders only the active one.
  While inside, the outer scene is not updated and not rendered (it stays in memory, frozen).
- Build the inner scene once at first use; afterwards rebuild only its parts from a `SceneSpec`.
- Device pixel ratio cap 1.5 on touch, 2 on desktop. Hardware scaling adapts every 2.5 s:
  below 38 fps render fewer pixels, above 56 fps more (see reference `Performance.ts`).
- Quality tiers `low | medium | high` (particles, grass count, outline on/off for small props, glow size).
  Start tier from a 1 s frame-time test. Watchdog only steps **down**.
- `scene.skipPointerMovePicking = true`. Freeze static meshes and materials. Thin instances for repeats.

---

## 4. Game state machine (`core/router.ts`)

```
boot → start → picker → opening → outer
outer ⇄ choosing              (near a disturbance)
choosing → diving → inner     (Go within + one breath)
inner: soul → answer → (answer2) → heart → one → seed
seed → returning → outer
outer → chapterEnd            (all connected + walked through the gate)
any → paused → back
any (inner) → help            (crisis match) → outer
```

Every state change emits `state:changed` on the event bus. Tests read `window.__lw.state()`.

---

## 5. Core systems (pure logic, unit-tested)

### 5.1 `BreathSystem`
- States `idle | inhale | exhale`, `level` 0–1, `rhythmScore` 0–1, `guidePhase` 0–1.
- Input: `inhaleHeld`, `exhaleHeld`, `touchMode` (in touch mode, release starts the out-breath automatically
  and it runs until empty).
- Emits `breath:finished { inSeconds, outSeconds, rhythmScore }` when an in-breath of ≥ 1 s was followed
  by an out-breath that reached level ≤ 0.05.
- Presets from `tuning.breath.presets`.

### 5.2 `RestlessnessSystem`
- Input per frame: movement vector, dt.
- `restlessness = smooth( 0.6 * speedRatio + 0.4 * directionChangeRate , τ = 3 s )`, clamped 0–1.
- Direction change rate: angle change per second above 90°/s counts; normalise with `tuning.restless.turnMax`.
- Standing still decays it faster (τ = 1.5 s).

### 5.3 `DisturbanceState`
- States: `waiting → near → choosing → within → connected`, plus `formIndex` 0–2 and `pushes`.
- `stayOutside()` sets a flag; when the player leaves `tuning.disturb.leaveRange` and comes back,
  `formIndex = (formIndex + 1) % 3`.
- `push()`: `pushes++`, grow factor `1 + 0.15 * pushes` (max 1.6).
- `connect(theme)`: state `connected`, stores theme.

### 5.4 `ThemeMemory`
- Saves: picks, per-disturbance theme, seeds (text), echo fragments (max 20, 3–6 words each,
  cut from the player's free text at sentence or comma boundaries), AI consent.
- Storage key `light-within.v1`. Versioned. Corrupt data → start fresh, never crash.
- `forgetEverything()` clears the key.

### 5.5 `reflect.ts`
- `buildRequest(context)`, `validateResponse(json) → ReflectResult | null`, `fallback(context) → ReflectResult`.
- Validation: `question` string ≤ 140 chars; `chips` 2–6 strings ≤ 28 chars; `parts` only from the kit;
  `hardElement` only from `wall | canyon | fog | cracks | wind | water`; `lightLevel` clamped 0–1;
  `theme` only from the theme list in `CONTENT.md` §6 (unknown → `"something else"`).
- Timeout 6 s → fallback. Any error → fallback. The player never sees an error.

### 5.6 `safety.ts`
- `isCrisis(text): boolean`. Lowercase, strip accents, match the phrase list in `CONTENT.md` §9
  (English and German). Runs before anything is sent or stored.

### 5.7 `SceneSpec`
```ts
type Part = 'fog'|'wall'|'water'|'light'|'wind'|'plants'|'cracks'|'canyon'|'door'|'openSpace'|'narrowSpace'|'particles';
type Hard = 'wall'|'canyon'|'fog'|'cracks'|'wind'|'water';
interface SceneSpec {
  place: 'tight'|'dark'|'storm'|'restless'|'high'|'misty';
  parts: Part[];          // 2–6
  hardElement: Hard;
  lightLevel: number;     // 0–1
}
```

---

## 6. The outer region (`chapters/ch1.json`)

```json
{
  "version": 1,
  "id": "ch1",
  "titleKey": "ch1.title",
  "seed": "grey-town-1",
  "start": { "x": 0, "z": -40, "heading": 0 },
  "square": { "x": 0, "z": -8, "radius": 11 },
  "fountain": { "x": 0, "z": -8 },
  "lanes": [
    { "id": "west",   "points": [[-6,-2],[-14,8],[-16,18]], "spot": [-12, 6] },
    { "id": "centre", "points": [[0,3],[0,12],[0,22]],      "spot": [0, 10] },
    { "id": "east",   "points": [[6,-2],[14,8],[16,18]],    "spot": [12, 6] }
  ],
  "gate": { "x": 0, "z": 30 },
  "figures": 6,
  "bounds": { "radiusX": 30, "radiusZ": 48 }
}
```

- Picks 1, 2, 3 go to lanes west, centre, east.
- Each lane is ~3 m wide between buildings; the disturbance collider (radius 1.6 m) fully blocks it.
  A reachability test (flood fill, like the reference `reach()`) proves the terraces are unreachable
  before connecting.
- After connecting, the disturbance moves 1.5 m to the lane side; its collider shrinks to 0.8 m.
- Layout numbers are a starting point. Adjust freely for good walking and camera views; keep the
  structure (field → square → 3 lanes → gate). Log changes in `DECISIONS.md`.

---

## 7. AI endpoint (`api/reflect.ts`)

- Vercel Node serverless function. `POST /api/reflect`. Reads `process.env.OPENROUTER_API_KEY`.
- **Never log request bodies.** Log only status codes and duration.
- Rate limit per IP: 30 requests / 10 min (in-memory is fine for the MVP).
- Body size limit 4 kB. Reject anything else with 400.
- Calls `https://openrouter.ai/api/v1/chat/completions` with the system prompt from `CONTENT.md` §8,
  `temperature: 0.6`, `max_tokens: 300`, `response_format: { type: "json_object" }` (if the model ignores
  it, strip code fences and parse).
- Headers to OpenRouter: `HTTP-Referer` = the site URL, `X-Title: Light Within`.
- Returns the model JSON unchanged. Validation happens in the browser (`reflect.ts`).

Request from the browser:
```json
{
  "type": "money",
  "form": "slot machine",
  "step": "place" ,
  "history": [{ "q": "What pulls you to me?", "a": "I want to win" }],
  "chip": "I want it",
  "freeText": "I want to win, then I can relax"
}
```
`step` is `"place"` (first answer → where the inner world is) or `"theme"` (second answer → hidden wish).

Response:
```json
{
  "question": "What would winning give you?",
  "chips": ["Rest", "Safety", "Freedom", "Being seen"],
  "theme": null,
  "sceneSpec": { "place": "tight", "parts": ["narrowSpace", "wall", "light"], "hardElement": "wall", "lightLevel": 0.3 },
  "seed": null
}
```
On `step: "theme"` the response has `theme` set, `question` null, and `seed` = one short sentence
built from the player's own words (≤ 12 words).

Dev mode: `npm run dev` has no serverless runtime. `reflect.ts` detects a 404 and uses the fallback.
`?noai` always uses the fallback. The debug overlay shows `AI: live | fallback | off`.

Speech input: use `webkitSpeechRecognition` / `SpeechRecognition` when present; hide the mic button
otherwise. No server speech service in the MVP.

---

## 8. Saving and privacy

- Only `localStorage`, key `light-within.v1`, wrapped in try/catch (private mode can throw).
- Saved: picks, disturbance states and forms, themes, seeds, echo fragments, settings, consent, chapter progress,
  last checkpoint (position rounded to 0.5 m).
- Never saved: raw full answers (only the cut fragments and the final seed).
- Settings → *Forget everything* clears it and reloads.

---

## 9. Performance budget

| Item | Budget |
|---|---|
| Initial download (gzip, JS + fonts + JSON) | ≤ 3 MB |
| First playable on 4G | ≤ 10 s |
| Draw calls outer / inner | < 100 / < 40 |
| Active meshes outer | < 400 (thin instances count as one) |
| fps | 60 desktop, 30+ mid-range Android |
| Memory | no growth after 5 dive/return cycles (dispose inner parts on rebuild) |

---

## 10. Tests

### Unit (Vitest), `npm run check`
breath (finished-breath rules, presets, touch release), restlessness (still → 0, zig-zag → high),
disturbanceState (push growth cap, form cycling, connect), themeMemory (fragment cutting, max 20, corrupt data),
reflect (validation accepts good, rejects bad parts/themes/lengths, fallback always valid for every
type × chip), safety (matches every list phrase, no false match on "kill time", "die Sonne"), sceneSpec.

### Browser (Playwright), `npm run e2e`
- Profiles: desktop 1280×720; mobile 412×915, DPR 2.6, touch.
- Base URL flags: `?autostart&autopick&autobreathe&noai&debug`.
- Scenarios (tag by milestone): `M1 walk`, `M2 grey`, `M3 disturbances`, `M4 dive`, `M5 inner`,
  `M6 loop`, `M7 ai` (mocked `/api/reflect` via route interception), `M8 echo`, `M9 full` (start to chapter end).
- Every scenario: zero console errors, no request to another origin, screenshots.
- `window.__lw` exposes: `state()`, `stats()`, `teleport(x,z,h)`, `choose('within'|'outside')`,
  `answer(chipIndex | text)`, `heart(zone)`, `breathe()` (one full breath), `push()`.

---

## 11. Deploy

- `vercel.json`: build `npm run build`, output `dist`, functions in `api/`.
- Environment variable in Vercel: `OPENROUTER_API_KEY`.
- The start screen shows the git commit hash (`import.meta.env.VITE_COMMIT`, set in `vite.config.ts`
  from `git rev-parse --short HEAD` or `VERCEL_GIT_COMMIT_SHA`).
- README explains: `npm install`, `npm run dev`, `npm run check`, `npm run e2e`, `npm run build`,
  Vercel import in 5 steps.
