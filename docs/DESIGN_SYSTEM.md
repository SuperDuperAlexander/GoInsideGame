# Light Within — Design System

Everything here is generated in code. No image, model or audio files in the MVP.
All values live in `src/config/palette.ts` and `src/config/tuning.ts` under the names used below.

---

## 1. The two worlds

| | **Outer world** | **Inner world** |
|---|---|---|
| Feeling | Rough, loud, heavy, archaic, busy | Fine, quiet, light, sacred, spacious |
| Material | Grey **cardboard**: thick, fibrous, torn edges | White **paper-cut**: thin, lace-like cut patterns |
| Line | Thick dark ink outlines (like a woodcut) | No outlines. Edges read through back light |
| Light | Flat, cool, overcast. Soft from the right | Warm gold light **shining through** the paper from behind |
| Colour | Almost none. Only disturbances glow in colour | Ivory, white, gold, amber, soft rose, deep night blue behind |
| Camera | Third person | First person |
| Sound | Murmur, wind, distant clatter, the disturbances' loops | Soft pads, breath, small chimes, silence |
| Movement | Walking | Looking. Things drift closer |

The contrast between the two is the most important visual idea of the game. Keep it strong.

---

## 2. Colour tokens

### 2.1 Outer world (cardboard greys)
```ts
outer: {
  card100: '#E9E6E0', // lightest paper grey, sky near horizon
  card200: '#D3CFC7',
  card300: '#B9B4AA', // main ground
  card400: '#9C968B',
  card500: '#7E786E', // buildings in shade
  card600: '#625D55',
  card700: '#47433D',
  ink:     '#2A2723', // outlines, handwriting
  haze:    '#CFCBC4', // distance haze
}
```

### 2.2 Disturbance colours (one per type, fully saturated, never used elsewhere outside)
```ts
disturb: {
  money:       '#E0413A', // red
  phone:       '#3A8DE0', // electric blue
  person:      '#E07A9C', // rose
  recognition: '#F2B632', // gold-yellow
  closedDoor:  '#6E5BD6', // violet
  crowd:       '#F07A2A', // orange
  house:       '#E8C54A', // warm gold
  conflict:    '#3FB39A', // cold teal
}
```

### 2.3 Inner world
```ts
inner: {
  night:   '#141526', // far background, behind the paper
  ivory:   '#F6F0E1', // paper
  white:   '#FFFDF7',
  gold:    '#F0C46A', // back light
  amber:   '#E8964A', // warm depth
  rose:    '#E9B3A6', // soft accent
  shadow:  '#5B5670', // cool shade on paper
}
```

### 2.4 Player and light
```ts
player: { paper: '#EDE8DC', paperShade: '#B7B0A2', heart: '#FFC867', heartCore: '#FFF3D1' }
light:  { beam: '#FFE3A3', bridge: '#FFD98A', zone: '#FFEBC2' }
```

### 2.5 UI
```ts
ui: {
  panel:     'rgba(246, 240, 225, 0.82)', // frosted ivory
  panelDark: 'rgba(20, 21, 38, 0.72)',    // inside the inner world
  text:      '#2A2723',
  textLight: '#FFFDF7',
  accent:    '#C9892F', // focus rings, active chip border
  muted:     '#7E786E',
}
```

Contrast: all UI text meets WCAG AA (Web Content Accessibility Guidelines) 4.5:1 on its panel.
Check in the browser tests.

---

## 3. The grey-to-colour system

- Every outer material shares one shader chunk with:
  - `uSaturation` global (start `0.08`, end of chapter `1.0`)
  - `uZones[8]` as `vec4(x, z, radius, strength)`
- Inside a zone the surface shows its "true" colour (a soft warm version of the cardboard: sandstone,
  sage, powder blue, ivory). Outside it stays grey.
- A restored area is also **8 % brighter**, so the change reads without colour vision.
- Zones grow over 3 s with ease-out. Edge softness 2 m, with a torn-paper noise on the edge.
- Disturbance materials set `ignoreGrey = true`: always full colour.
- `?color` forces saturation 1.

Restored colours (used inside zones, per surface type):
```ts
restored: { ground: '#C9B98F', stone: '#D9A583', wood: '#A77B58', roof: '#B8644B',
            plant: '#8FA66B', water: '#8FB7D6', sky: '#BFD6E6', wall: '#E7D9BE' }
```

---

## 4. Materials (shaders)

All custom GLSL declares `precision highp float;` in both stages. Unlit or simple toon. No PBR,
no real-time shadows.

### 4.1 `CardboardMaterial` (outer)
- Base: flat colour from the surface type, then desaturated by the grey system.
- **Fibres:** low-frequency noise (2–3 octaves) in world space, ±6 % brightness. Plus fine vertical
  streaks for cardboard layers on cut faces.
- **Toon light:** 2 steps. Light direction from the right `(0.62, 0.72, -0.3)`. Shade tint towards
  `card600` with a cool touch.
- **Torn edges:** meshes are built with slightly jagged silhouettes in `geometry.ts` (noise offset on
  outline vertices), not with alpha.
- **Ink outline:** inverted hull (back-face mesh scaled along normals by 0.025–0.05 m, colour `ink`)
  for buildings, props and the player. Width shrinks with distance. Skip on grass and small scatter.
- **Haze:** linear from 18 m to 150 m towards `haze`.

### 4.2 `PaperCutMaterial` (inner)
- Thin planes (double-sided).
- **Cut pattern:** alpha test from layered noise and radial patterns (lace, leaves, waves). Threshold
  animates slightly (±0.02) so the lace breathes.
- **Back light:** colour from `gold` → `amber` by depth; brightest at thin areas and cut edges
  (edge = distance to alpha threshold). Adds a rim glow.
- Front colour `ivory`, shade `shadow` on surfaces facing away from the light.
- Layers stack 3–6 deep with gaps; the back light shines through the holes.

### 4.3 `DisturbanceMaterial`
- Full disturbance colour, soft toon, ignores grey.
- **Pulse:** emissive 0.15 → 0.45, sine, speed from `restlessness` (0.4 Hz calm, 1.2 Hz restless).
- After connecting: emissive max 0.2, pulse 0.25 Hz, scale 0.8.

### 4.4 `LightMaterial`
- Additive emissive for beams, the chest light, the light bridge, the fountain water.
- Only these go into the `GlowLayer` include list.

---

## 5. Shapes

### Outer world
- Buildings: boxes with slightly leaning walls, pitched roofs, cut-out windows (dark), jagged roof
  edges. Heights 3–7 m. Stacked like cardboard flats.
- Ground: gently rolling, cobbles as a darker noise pattern in the square.
- Trees: trunk + 2–4 flat cardboard crowns crossing each other (like a paper model tree).
- Grey figures: simplified player figure, 85 % scale, no chest light, `card400`.

### Inner world parts (the kit)
| Part | Look |
|---|---|
| `fog` | Many layered lace planes, drifting slowly, dense ivory |
| `wall` | A tall stack of paper-cut layers, heavy pattern, little light passing |
| `water` | A flat mirror plane with ripple lines of light |
| `light` | A distant gold source, rays as soft cones |
| `wind` | Ribbons of paper streaming in one direction |
| `plants` | Paper-cut leaves and stems growing up from the floor |
| `cracks` | Dark jagged lines across the floor or a wall |
| `canyon` | The floor opens into a deep layered chasm |
| `door` | A cut-out door shape in a wall, closed or open |
| `openSpace` | Wide room, far horizon, few layers |
| `narrowSpace` | Close layers left and right, low ceiling |
| `particles` | Floating gold motes |

### Transformations (the "One" step, 3 breaths each)
| Hard element | Breath 1 | Breath 2 | Breath 3 (transformed) |
|---|---|---|---|
| `wall` | Light seeps through the pattern | A door shape is cut | The door opens, light pours through. The wall stays |
| `canyon` | A thread of light spans it | Planks of light form | A bridge of light. The canyon stays |
| `fog` | It thins at the centre | A light shows inside | Soft fog around a clear path to the light |
| `cracks` | Gold appears at one end | Gold runs through half | Every crack is filled with gold (like kintsugi) |
| `wind` | Ribbons slow down | They turn softer | A gentle breeze, plants sway. The wind stays |
| `water` | Waves get smaller | The surface calms | Still water, it mirrors the light |

---

## 6. Typography

Two self-hosted OFL fonts (in `public/fonts/`, copy from the reference repo):

| Use | Font | Size (mobile / desktop) |
|---|---|---|
| UI, chips, buttons, panels | **Work Sans** 400 / 700 | 17 / 18 px, line height 1.4 |
| World text: echoes, the soul question, seed sentences, "Breathe." | **Nothing You Could Do** (handwriting) | 26 / 32 px world-space equivalent |
| Titles (start screen, chapter cards) | Work Sans 700 | 34 / 44 px, letter spacing 0.02 em |

Rules: sentence case, no all caps, short lines (max 40 characters per line in world text).

---

## 7. UI components

All UI is plain HTML/CSS over the canvas. Quiet, minimal, frosted panels, rounded corners 18 px,
no hard borders, soft shadow `0 8px 30px rgba(42,39,35,0.18)`. Touch targets 48 px or more.
Visible focus ring `2px solid ui.accent`.

| Component | Where | Behaviour |
|---|---|---|
| **Start screen** | Boot | Title, one line, *Begin* button, small *Settings* and *About the teaching* links, build stamp (git hash) bottom right |
| **Card picker** | After start | 8 cards in a 2×4 grid (4×2 on desktop). Each: a simple drawn icon in its disturbance colour + label. Tap to select (lifts, gets colour border). Exactly 3. *Continue* appears at 3 |
| **Choice pair** | Near a disturbance | Two words, side by side, above the figure: *Stay outside* · *Go within*. Fade in 400 ms |
| **Breath button** (touch) | Bottom right | 84 px circle, chest-light gold ring. Fills while breathing in, empties while breathing out. The rhythm guide is a thin ring around it |
| **Breath hint** (desktop) | Bottom centre | "Hold Space · then Shift" shown only when a breath is asked for |
| **Push button** (touch) | Right, above breath | Hand icon, appears only within push range |
| **Chips** | Inner world, bottom | Pills, `ui.panelDark`, white text. Max 6 + "Your own words" pill that opens the text field |
| **Text field** | Inner world | One line, grows to 3 lines, max 200 characters, placeholder "In your own words…", a mic button if speech input is available |
| **Body outline** | Heart step | A simple standing outline in thin gold lines, 8 tap zones (head, throat, chest, belly, hands, legs, everywhere, not sure) |
| **Seed card** | End of inner journey | Handwritten sentence on a small paper card, editable, *Keep it* button |
| **Seed Book** | Pause menu, chapter end | Pages of paper cards with the player's seeds |
| **Help panel** | Crisis check | Calm, dark panel, help lines, *Return* button. No animation |
| **Settings** | Pause | Breath rhythm, sound volume, reduced motion, AI reflection on/off, *Forget everything* |
| **Debug overlay** | `?debug` / F3 | fps, draw calls, active meshes, restlessness, state, AI mode |

---

## 8. Motion

| Motion | Duration | Easing |
|---|---|---|
| UI fade in / out | 400 / 300 ms | ease-out / ease-in |
| Choice pair appear | 400 ms | ease-out |
| Dive (camera into chest) | tied to the in-breath (≥ 1.5 s), then 800 ms gold fade | ease-in-out (sine) |
| Return (camera out) | 1.6 s | ease-out (cubic) |
| Colour zone growth | 3 s | ease-out (quad) |
| Inner transformation step | 2 s | ease-in-out |
| Disturbance "steps aside" | 2.5 s | ease-in-out |
| Things drift closer (inner gaze) | 0.4 m/s max, starts after 1.5 s gaze | smooth damp |

Reduced motion (`prefers-reduced-motion` or setting): no camera flights (fades instead), no shaking,
slower colour, particles halved.

---

## 9. Sound (Web Audio, generated)

| Sound | How |
|---|---|
| Outer ambience | Filtered brown noise (murmur) + slow wind (band-passed noise, LFO) + rare wood clicks. Volume 0.35 → 0.6 with restlessness |
| Disturbance loops | One tonal loop per type (e.g. money: bright arpeggio of a slot machine; phone: soft buzz pattern; conflict: low rumble). Spatial (panner), audible from 25 m. After connecting: −12 dB, slower, lower-pass filtered |
| Heartbeat | Two low sine thumps, 60 bpm, fades in near a disturbance |
| Breath | Filtered noise swelling with the in-breath, softer on the out-breath |
| Inner pads | Two detuned sine/triangle pads in a calm major chord, slow filter movement |
| Chimes | Soft bell (sine + harmonics, long decay) on: soul question, heart end, each transformation step, seed kept |
| Gate / chapter end | Rising pad + chime cluster |

Every important sound also has a visual cue. Sound starts only after the first user interaction.

---

## 10. Voice and tone of all text

- Short. Second person. Present tense. Calm.
- Questions, not statements, whenever the game "speaks" as a disturbance.
- Never "you should", "you need", "try to", "good job", "well done".
- Never name the player's feeling. Offer it as a choice ("I'm afraid of it"), the player picks it.
- No spiritual jargon in play. The teaching words live on the "About the teaching" page.
