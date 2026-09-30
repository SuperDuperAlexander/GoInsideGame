# Light Within — Concept: a living world (draft for Alexander)

Status: proposal, 2026-09-30. Nothing here is built yet except the breath change (part 1).

## 1. Breath: guided, never pressed (built)
- Like the Calm app "Breathe Bubble": a soft light bubble at the side grows ("Breathe in") and shrinks ("Breathe out").
  The player only follows it. No button, no key.
- Breath is used less: opening (1 breath), going within (1 breath), the "One" step (3 breaths). Coming back out
  needs no breath any more.
- Speed from settings (normal 4/4, slow 5/6, easy 3/3).

## 2. What similar games do
| Game | What changes | What we take |
|---|---|---|
| **Gris** | The world gets colour step by step as the girl heals. | Colour as the visible result of inner work (we have it). |
| **de Blob** | Grey city; touching people and houses gives them colour; grey citizens ("Graydians") turn happy again; the music grows with every coloured area. | People change mood, not only buildings. Music grows with the world. |
| **Okami** | Restoring a place makes trees bloom at once in a wave; animals and people react. | A "bloom wave" from the connected place across the town. |
| **Alba** | Small good acts (fix a fence, pick up rubbish) visibly change a small island; people talk about it. | Many small, local changes instead of one big switch. |
| **Spiritfarer** | Relationships and caring, no combat. | Tone: care, not victory. |
| **Sky / Journey** | Colour arc per area tells the emotion. | Each region has its own mood arc. |

## 3. The idea: the town has a **mood**, and every connection changes it *differently*
A new logic system `WorldMood` (pure logic, tested) holds a few values, 0..1:
- `warmth` (people: cold/aggressive → kind), `light` (sky, windows), `care` (houses: broken → repaired, flowers),
  `openness` (paths, gates, doors), `movement` (calm vs hectic crowd).

Each **theme** the player finds inside moves the values in its own direction. So the town after
"Rest + Belonging + Peace" looks and feels different from the town after "Freedom + Being seen + Joy":
- *Rest* → slower crowd, benches appear, lamps glow soft.
- *Belonging* → strangers walk together, greet each other, hands meet.
- *Being seen* → windows light up, people look up and wave.
- *Freedom* → doors and shutters open, birds, kites.
- *Safety* → broken walls repaired, fences mended.
- *Joy* / *Love* → flowers, music from windows, small hearts rise.
- *Peace* → storm clouds over the town clear, rain stops.
- *Trust* / *Enough* → market stalls share, a table with food for all.

**People (the grey figures) have states:** hurried → grumpy (small dark scribbles or lightning above them,
pushing each other) → neutral → kind (they greet, sit together) → warm (small hearts, they follow the light).
They also still copy the player's pace (rule 6).

**The change spreads:** after a connection a soft "bloom wave" runs from that lane over the town (Okami, de Blob).
Houses on the way straighten, get colour, windows glow; people it touches look up and change state.

**The music grows** with the mood: more voices in the ambience with every connection (de Blob).

**Nothing disappears** (rule 5): grumpy people become kind, they do not vanish; broken houses get repaired.

## 4. Every walk is different
- The 3 picked cards already change the town (disturbances, lanes).
- New: the found themes change *how* the town heals (section 3), so no two endings look the same.
- New (with AI): after each connection the AI chooses 2–4 small "world events" from a **fixed kit**
  (for example `benches`, `lanterns`, `people-greet`, `storm-clears`, `flowers`, `kites`, `shared-table`) based on the
  player's words and theme. Same safety as now: only kit ids, validated in the browser, full offline fallback
  (theme → events table). The AI never writes text into the world.
- Random seed per walk: where people stand, which houses change first.

## 5. Framework
- **Recommendation: keep Babylon.js.** It already runs everything (two worlds, glow, audio-free core, thin instances,
  good on phones). Switching to Three.js or PlayCanvas would cost the whole code base and not give the living world.
- What we add instead:
  - `WorldMood` system (pure TypeScript) + a small **event kit** (`WorldEvents`), data in `public/data/worldEvents.json`.
  - Crowd: thin-instanced figures with simple state machines (walk, greet, sit, follow) — Babylon thin instances keep draw calls low.
  - Optional later: **Yuka** (small open-source game AI library: steering, wandering, following) for nicer crowd movement.
  - The OpenRouter key (already in Vercel) chooses world events from the kit (section 4).

## 6. Plan (proposal)
1. `WorldMood` + event kit + offline tables, unit tests.
2. People states (grumpy → warm) with visual signs (scribbles/lightning → hearts), greeting and sitting.
3. Houses: repair / colour / window light per mood; bloom wave.
4. Growing music.
5. AI chooses events from the kit; browser validation; e2e with mocked answers.
6. Update GAME_DESIGN.md (breath, living world) after Alexander says yes.

Sources: Calm Help Center (Breathe Bubble), Wikipedia (de Blob, Gris), 80.lv (Sky environment design),
PC Gamer (Alba), engine comparisons 2026 (utsubo, cinevva).
