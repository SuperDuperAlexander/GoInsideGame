# Decisions

Decisions made by Alexander before the build (do not reopen):

- D1. New repo, built from scratch. Earlier repos are reference only.
- D2. Engine: Babylon.js, WebGL2, browser, mobile first. Hosting: Vercel.
- D3. No companion (no fairy, no guide). Reason: Dr. Rulin's teaching, the player listens inward.
- D4. Core: the Connection Loop (GAME_DESIGN §4) and the rules that teach (§3).
- D5. Look: two kinds of paper. Rough grey cardboard outside, fine gold-lit paper-cut inside.
- D6. Colour means resonance. Only disturbances have colour outside.
- D7. Player answers with tap chips plus optional own words (text or voice) to an AI; full offline fallback.
- D8. Systems in the MVP: world from your life (3 cards), returning forms, echo of your words, world copies you.
- D9. All in-game text in English. Reports to Alexander in German.
- D10. Everything visual and audible generated in code for the MVP.

Decisions made by Claude Code during the build start at D11.

- D11. The docs were in the repo root; moved them to `docs/` as `CLAUDE.md` and `TECH.md` §2 say. Reason: one place for docs.
- D12. `@playwright/test` pinned to 1.56.1, because the cloud machine has Chromium build 1194 pre-installed for that version. Reason: no browser download needed.
- D13. `@vercel/node` is not used (npm install failed with it). `api/reflect.ts` uses small own types for request/response. Reason: fewer dependencies.
- D14. CSS reads all colours from `palette.ts` through CSS variables set at boot (`ui/dom.ts applyTheme`). A few gradients use translucent versions of palette colours. Reason: keep "all colours in palette.ts" while CSS stays plain.
- D15. Own words in round 1: the longest matching keyword wins, short keywords (≤ 3 letters) must be whole words. Reason: "I don't want it" must mean *pushAway*, not *want*; "know" must not match "no".
- D16. Walkable area is a union of simple shapes (field, road, square, lanes, terraces, gate path) in `logic/walkmap.ts`, without Babylon. Buildings stand only where nobody can walk. Reason: pure logic, testable reachability.
- D17. Frame time is capped at 50 ms per frame (slow machines play in slow motion instead of jumping). Reason: walking and colliders stay stable.
- D18. Gaps between houses are closed with low cardboard walls (town) and hedges (field) along the edge of the walkable area. Reason: what looks walkable is walkable.
- D19. Added accessibility labels (`a11y.*` keys) to `en.json` for icon-only buttons (breath, push, pause, mic, body outline). Reason: screen readers need a name; CONTENT.md has no key for them.
- D20. The opening blur is a CSS filter on the canvas (blur + greyscale), not a backdrop filter. Reason: backdrop filters over WebGL are not reliable on all browsers.
- D21. In the choosing state the player can still walk; walking away closes the choice. Reason: *Stay outside* must always be easy, and running from it is allowed.
- D22. Sound starts on the first pointer or key press, even with `?autostart`. Reason: browsers block audio before a user gesture and would warn in the console.
- D23. After coming back out without connecting, the choice pair waits until the player has stepped away once. Reason: no nagging; the player leads.
- D24. `__lw.returnNow()` (debug/test only) jumps to the return step inside. Reason: the M4 dive test must work before and after the inner journey exists.
- D25. Paper-cut patterns are computed in world units (not uv), so the lace keeps one size on every sheet. The far backdrop is warm solid light, seen through every cut. Reason: "light shining through" instead of black holes.
- D26. Before the first answer the inner world is almost empty (floor, far light, motes, open space). The place forms from answer 1. Reason: GAME_DESIGN §4 step 7.
- D27. Fallback seeds use the player's own round-2 words when given (first sentence, ≤ 12 words), else "What I found here: {theme}." Reason: "prefilled from the player's own words or the theme".
- D28. Crack segments, canyon planks are merged into few meshes. Reason: inner draw calls < 40.
- D29. After the third connection the whole region slowly turns to colour (global saturation → 1 over 8 s) while the gate unfolds. Reason: GAME_DESIGN §9 "at the end of a chapter the region is in colour".
- D30. The chapter end card has one button, *Return to the walk* (`pause.resume` text), so the player can walk through the coloured town. Router: `chapterEnd → outer` allowed. Reason: no dead end; no new text needed.
- D31. Pause is allowed in outer, choosing and inner states (not during dive or return flights). Reason: flights are short and tied to the breath.
- D32. The AI is used only after the player said *Allow* (and never with `?noai`). Chip-only answers before consent use the offline tables. Reason: privacy first; player text is sent only with consent.
- D33. The browser also rejects AI questions without a single "?" and any AI text that matches the crisis list. Reason: the disturbance speaks only in questions; safety.
- D34. The API function keeps only known fields (type, form, step, history, chip, freeText) with size limits before sending to OpenRouter. Reason: small, predictable requests; 4 kB limit.
- D35. (Alexander, 2026-09-30) No pressing to breathe. A guided breath bubble (like Calm) leads the player; the breath follows it. Coming back out needs no breath. This replaces GAME_DESIGN §7 "Hold Space / hold the light".
- D36. World text in the inner world sits on a soft dark plate; outer world text on a soft light plate. Reason: white text was hard to read on light paper.
- D37. (Alexander, 2026-09-30) The answer chips must fit the question. Each disturbance type now has its own 6 answers to its soul question (`round1.byType`) and its own follow-up question per answer (`round2.byType`), all in `fallback.json`. Chip keys, places and hard elements stay as in CONTENT §5. The AI prompt got the rule "Every chip must be a direct, natural answer to your own question." Overrides CONTENT §5/§6 wording in play.
