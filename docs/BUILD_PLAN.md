# Light Within — Build Plan (MVP: Opening + Chapter 1)

Build in this order. Do not wait for approval between milestones (see `CLAUDE.md` §1).
After each milestone follow `CLAUDE.md` §2 (check, build, e2e, screenshots, commit, push, German report).

---

## M0 — Setup
- Vite + TypeScript strict + `@babylonjs/core` + Vitest + Playwright + ESLint + Prettier.
- npm scripts: `dev`, `build`, `preview`, `check` (tsc + eslint + vitest), `e2e` (playwright against preview).
- Folder structure from `TECH.md` §2 (empty modules with TODO where needed).
- Fonts copied from the reference repo into `public/fonts/`.
- `palette.ts` and `tuning.ts` filled from `DESIGN_SYSTEM.md` and the numbers in these docs.
- `content.ts` loads and validates `en.json`, `disturbances.json`, `fallback.json` (write all three
  files now from `CONTENT.md`).
- `vercel.json`, README, `docs/DECISIONS.md` (empty list), `REPORT.md`.
- Build stamp on a placeholder start screen.
- **Accept:** `npm run check`, `npm run build` pass; start screen shows title and commit hash.

## M1 — Walk
- Engine, outer scene, simple ground, sky gradient dome, haze.
- Player figure (adapted `PlayerVisual`) with chest light, walking animation.
- Walker (height, bounds, colliders), follow camera, keyboard + touch joystick.
- Perf system (DPR cap, hardware scaling, tiers, watchdog), debug overlay.
- **Accept:** walk freely on desktop and mobile profile; 60/30 fps; e2e `M1 walk`.
- Screenshots: `start`, `walk-desktop`, `walk-mobile`.

## M2 — The grey town
- Cardboard material, ink outlines, grey chunk with saturation + 8 zones.
- Procedural town from `ch1.json`: field, square, dry fountain, three lanes with buildings, terraces, gate.
- Trees, scatter, grey strollers (not yet copying).
- **Accept:** reads clearly as a rough grey cardboard town; `?color` shows restored colours;
  a test zone at the square grows over 3 s and is measurably brighter in greyscale; draw calls < 100.
- Screenshots: `town-grey`, `town-zone`, `town-mobile`.

## M3 — Breath, picker, disturbances, the world copies you
- BreathSystem + visuals + breath button + desktop hint + rhythm presets.
- Opening: blurred grey start, "Breathe.", first breath clears it, walk hint.
- Card picker (after start screen), saves picks.
- Disturbance types × 3 forms as procedural shapes, colours, sound loops, pulse, colliders blocking lanes.
- Push: grow + louder + darker around it (never breaks).
- Restlessness system → ambience, haze, pulse speed, strollers copy the pace.
- Reachability test: terraces unreachable while disturbances wait.
- **Accept:** e2e `M3 disturbances` (autopick → 3 correct types in the 3 lanes, push grows, restlessness
  rises on zig-zag and falls when still).
- Screenshots: `opening-blur`, `picker`, `disturbance-near`, `disturbance-pushed`.

## M4 — Choose and dive
- Near range: heartbeat, choice pair. *Stay outside* → form cycling after leaving and returning.
- *Go within* → one full breath → dive (camera into chest, gold fade) → inner scene.
- Inner scene: night background, first-person look, gaze drift. Return path (breath → fly out).
- Reduced-motion variant.
- **Accept:** e2e `M4 dive` (choose within, breathe, state `inner`, breathe back, state `outer`, 5 cycles
  without memory growth; stay outside → form index changes).
- Screenshots: `choice`, `dive-mid`, `inner-empty`.

## M5 — The inner world (fallback only)
- Paper-cut material, all 12 parts, `buildInner(spec)`.
- Soul → round 1 → round 2 → heart → one (3-step transformations) → seed card. All from `fallback.json`.
- Chips, own-words field (keyword fallback), body outline, seed card, Seed Book.
- **Accept:** e2e `M5 inner` runs every chip of round 1 once; each hard element transforms in 3 breaths
  and is still present; seed saved.
- Screenshots: one per hard element transformed (6), `heart`, `seed`.

## M6 — The full loop and chapter end
- Return: disturbance quieter, smaller, steps aside, collider shrinks, colour zone grows, chest light grows,
  fountain fills a step.
- After 3: fountain of light, gate unfolds, walking through → blend → chapter end card with seeds.
- Save/continue (checkpoint, states). Pause menu, settings (rhythm, sound, motion, forget everything).
- **Accept:** e2e `M6 loop` from start to chapter end with `?noai`; reload mid-chapter continues correctly.
- Screenshots: `after-1`, `after-3`, `gate-open`, `chapter-end`.

## M7 — AI reflection and safety
- `api/reflect.ts` (limits, no body logging), browser client with validation, timeout, fallback.
- Consent panel on first own words; settings toggle.
- Crisis check before sending; `{"crisis": true}` handling; help panel.
- Speech input where available.
- **Accept:** unit tests for validation and safety pass; e2e `M7 ai` with mocked responses (good, bad JSON,
  timeout, crisis) all end in a valid state; no request to another origin from the browser.
- Screenshots: `consent`, `ai-question`, `help-panel`.

## M8 — Echo and polish of sound
- Echo fragments (cutting, storage, display rules).
- Full sound design from `DESIGN_SYSTEM.md` §9, spatial loops, inner pads, chimes.
- **Accept:** e2e `M8 echo` (write words at disturbance 1, pass disturbance 2 → a fragment shows).
- Screenshots: `echo`.

## M9 — Mobile pass and release check
- Real-device profile tuning: tiers, particles, outline distances, text sizes, safe areas (notch).
- Accessibility pass: contrast test, keyboard-only run, focus order, reduced motion.
- `About the teaching` page.
- Full e2e `M9 full` on desktop and mobile profile.
- **Accept:** all budgets in `TECH.md` §9 met; zero console errors; final `REPORT.md` summary in German with
  a list for Alexander: what to test on his phone, what is open, what the next chapter needs.
- Screenshots: full set again in `screenshots/final/`.

---

## After the MVP (do not build now)
Chapter 2 *Garden of Seeds* (themes → seed trees), chapter 3 double exposure, chapter 4 shared field
(needs a realtime backend), chapter 5 *Home*, optional body controller (mic breath, camera pulse),
RAG over Dr. Rulin Xiu's transcripts for the AI questions, final hand-made art.
