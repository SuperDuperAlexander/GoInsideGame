# CLAUDE.md — Light Within

You build **Light Within**, a calm browser game in **Babylon.js** about Dr. Rulin Xiu's teaching:
*what you meet outside came to teach you; you grow by connecting with it, not by rejecting it.*

Read this file fully before every task. Then read the files in `docs/` in this order:

1. `docs/GAME_DESIGN.md` — what the game is and why. The heart of the project.
2. `docs/DESIGN_SYSTEM.md` — how it looks, sounds, moves and reads.
3. `docs/TECH.md` — how it is built.
4. `docs/CONTENT.md` — every player-facing text, the AI prompt and the fallback tables.
5. `docs/BUILD_PLAN.md` — the milestones, in order, with acceptance checks.

If two files conflict: `GAME_DESIGN.md` wins on meaning, `TECH.md` wins on code, `CONTENT.md` wins on text.
Log every conflict and how you solved it in `docs/DECISIONS.md`.

---

## 1. Work autonomously

Alexander (the owner) is not a developer and **will not answer questions during the build**.
Everything he decided is written in these docs. Your job is to build the whole plan without him.

- Work through `docs/BUILD_PLAN.md` milestone by milestone, in order. Do not wait for approval between milestones.
- When something is unclear: pick the option that best serves `GAME_DESIGN.md` section 1 (the core idea),
  write the decision into `docs/DECISIONS.md` (D1, D2, …) with one line of reason, and continue.
- Stop only for a **hard blocker**: something you cannot solve after 3 honest attempts and that blocks
  every later milestone. Then write it at the top of `REPORT.md` and stop.
- A missing `OPENROUTER_API_KEY` is **not** a blocker. The game runs on the fallback tables. Note it and continue.
- Never invent spiritual teachings. Use only what `GAME_DESIGN.md` section 2 and `CONTENT.md` say.
- Never change the core rules in `GAME_DESIGN.md` section 3 ("the rules that teach").

## 2. After every milestone

1. `npm run check` (typecheck, lint, unit tests) passes.
2. `npm run build` passes.
3. Start the preview and run the milestone's browser scenario (`npm run e2e -- --grep <milestone>`).
   Read the console. Zero errors, zero warnings from our code.
4. Save the screenshots the milestone asks for into `screenshots/<milestone>/`.
5. Commit with a clear message: `M3: disturbances, onboarding, restlessness`. Push.
6. Append a short report to `REPORT.md` **in German**, simple sentences:
   - Was gemacht wurde
   - Funktioniert es (test results, fps on mobile profile, draw calls)
   - Was offen ist
   - Welche Entscheidungen neu in `DECISIONS.md` stehen

## 3. Hard rules (never break)

- **No companion.** No fairy, no guide, no narrator, no helper character. The only voices are the player
  and the player's own disturbances.
- **Nothing the player connects with is destroyed or disappears.** It becomes quieter, smaller, calmer.
- **No enemies, no death, no score, no timer, no "game over".**
- **The game never advises, diagnoses, judges, or names a feeling for the player.** The player names it.
- **No healing or medical claims.** Everything is personal reflection. Breathing is never called healing.
- Dr. Rulin Xiu is named only in the credits and the "About the teaching" page, always in third person.
- **All in-game text is English** and lives in `public/data/content/en.json`. No text in code.
- **Privacy:** player text never goes to our logs or a database. It lives in the browser (`localStorage`)
  and is sent only to `/api/reflect` when the player has said yes to AI reflection.
- **The browser only talks to its own origin.** No CDNs, no analytics, no outside fonts.
  Only the server function `api/reflect.ts` talks to the AI provider.
- Never commit secrets. The key lives only in the Vercel environment variable `OPENROUTER_API_KEY`.

## 4. Code rules (short, details in `docs/TECH.md`)

- TypeScript strict. Vite. `@babylonjs/core` as ES modules (deep imports for tree shaking). No React.
- All tunable numbers in `src/config/tuning.ts`. All colours in `src/config/palette.ts`.
- Systems talk through the typed event bus `src/core/events.ts`.
- Logic systems (breath, restlessness, disturbance state, theme memory, reflect validation, safety)
  import nothing from Babylon, so they run in plain Vitest.
- Everything visual and audible is **generated in code**. No model, image or audio files in the MVP.
- Mobile first. Test with the mobile profile in every milestone.

## 5. Reference code (read-only)

The previous prototype has good pieces you may copy and adapt (never import across repos):

```
git clone --depth 1 https://github.com/SuperDuperAlexander/ManifestationGameOnlyCode /tmp/ref
```

Worth reading: `src/player/PlayerVisual.ts` + `ScarfTail.ts` (procedural figure), `src/player/BreathSystem.ts`,
`src/valley/FollowCamera.ts`, `src/core/Performance.ts`, `src/ui/Joystick.ts`, `src/ui/BreathButton.ts`,
`src/valley/valleyShader.ts` (toon light, haze, mood). Adapt them to the rules here. Do **not** copy the
fairy, the fog blockades or the paper-card system.

## 6. Debug switches

`?debug` overlay (also F3) · `?autostart` skip start screen · `?autopick` pick the first 3 cards ·
`?autobreathe` calm automatic breathing · `?noai` force fallback · `?chapter=<id>` · `?color` full colour ·
`?touch` force touch controls · `?reducedmotion` · `?safe` no post-processing.
