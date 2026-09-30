# Light Within — Game Design

Version 1.0 · Owner: Alexander Maessen · Source teaching: Dr. Rulin Xiu (Tao Science)

---

## 1. The core idea

> **What you meet outside is your own life, showing itself to you. It came to teach you.
> You cannot win by grabbing it, fighting it or running from it. You grow by connecting with it.**

Light Within is a calm third-person browser game for phone and desktop.
The player walks through a rough, grey outer world. Some things in it glow in colour: the things
that *resonate* with the player. The player can step **into their own figure**, into a fine,
light-filled inner world, and meet what the outer thing touches inside them. When they come back,
the outer thing is still there, but quieter. The world around it has gained colour.

The game does not tell the player what to feel or what to learn. It asks, listens, and shows the
player's own answers as a world.

**What a player should say after 20 minutes:**
"I noticed something about myself that I did not expect. And it felt beautiful."

**What the game is not:** not a meditation app, not therapy, not a quiz about spirituality,
not a puzzle game with a spiritual skin.

---

## 2. The teaching behind every mechanic

These are the only teachings the game uses. Do not add others.

| Teaching (Dr. Rulin Xiu) | What it says | Where it lives in the game |
|---|---|---|
| **Becoming one with yourself** (podcast #008) | Challenges come to teach and uplift us. Resistance creates blockages. Chasing joy also creates blockages. Become one with the challenge: its **soul** (ask what it came to teach), its **heart** (feel it in the body, do not push it away), then bring soul, heart, mind and body together. | The whole Connection Loop. The three inner steps **Soul → Heart → One**. The rule that pushing makes things stronger. "Nice" things are disturbances too. |
| **Seeds of deception** (#014) | Beliefs are seeds planted long ago. Cutting the fruit or branch does not help; the tree grows back. Look at the seed, and plant a new one. | Unconnected disturbances come back in a new form. At the end of each inner journey the player keeps a **seed** (one sentence in their own words). Chapter 2 is built on seeds. |
| **Law of yin and yang** (#011, #012) | Everything has two elements: opposite, relative, inseparable, co-created. Their interaction creates new things. | Every outer pull has a hidden other half inside (the **theme**). Chapter 3: the double-exposure mechanic. |
| **Oneness, E = c·A²** | More people in one field: the amplitude adds up, the energy grows by squares. | Chapter 4: the shared field of other players' lights. |
| **You determine your own life** (#015) | We are the producer, director and actor of our own life. | The player picks their own disturbances at the start. The game has no guide: the player leads. |

Framing rule: every teaching is **experienced as personal reflection**, never presented as fact about
health, money or destiny. The game never promises results.

---

## 3. The rules that teach (never change these)

1. **Grab it or push it: it grows.** Pushing a disturbance (E / hand button) makes it bigger, louder,
   and darkens the world around it. It never breaks.
2. **Run from it: it returns.** Choosing *Stay outside* is always allowed. When the player comes back,
   the disturbance has changed form (slot machine → lottery booth → pile of coins). The theme stays.
3. **Connect with it: it changes.** Only going within changes a disturbance. It stays in the world,
   but quieter, smaller, calmer, and it steps aside from the path.
4. **Colour means resonance, not good or bad.** The outer world is grey. What resonates with the player
   glows in colour: a golden house as much as a storm cloud.
5. **Nothing disappears.** Not outside (the disturbance stays) and not inside (the canyon gets a bridge,
   the wall gets a door, the cracks fill with gold; none of them vanish).
6. **The world copies the player.** Nervous, fast movement makes the outer world louder and foggier.
   Calm movement makes it quieter. Grey figures in the world copy the player's pace.
7. **Only the player's words.** Disturbances speak back only with fragments of what the player wrote.
   There is no other voice.

---

## 4. The Connection Loop

```
OUTER WORLD → NOTICE → REACT → CHOOSE → DIVE → SOUL → HEART → ONE → SEED → RETURN → THE WORLD HAS CHANGED
```

| # | Phase | What the player does | What the game does |
|---|---|---|---|
| 1 | **Outer world** | Walks (third person). | Grey cardboard world. Distant colour glows. |
| 2 | **Notice** | Sees a coloured thing, walks towards it (or not). | No quest marker. Its sound grows as the player comes closer. |
| 3 | **React** | Comes close. May push it. | Outer sound fades, a heartbeat fades in. The world darkens a little near it. Push → it grows, the world goes darker. |
| 4 | **Choose** | Taps *Stay outside* or *Go within*. | Two quiet words appear. Nothing else. |
| 5 | **Dive** | One full breath (in, then out). | During the in-breath the camera moves into the figure's chest, fades through warm gold, and opens the inner world in first person. No loading screen. |
| 6 | **Soul** | Taps the floating words *"What did you come to teach me?"* | The disturbance answers with **one question** (from `CONTENT.md` or the AI). |
| 7 | **Answer** | Taps a chip, or writes / speaks own words. Up to 2 rounds. | The inner world forms from the answer: first the **place** (tight, dark, stormy, restless…), then the **theme** (the hidden wish). |
| 8 | **Heart** | Closes the eyes for 10 seconds. Then taps where it was felt on a body outline. | Screen dims, sound only, soft chime at the end. A warm light appears on the tapped spot of the outline and stays for the rest of the scene. |
| 9 | **One** | Looks at the hard element (wall, canyon, fog, cracks, wind, water) and breathes. | Each finished breath changes it one step. After 3 breaths it is transformed. It never vanishes. |
| 10 | **Seed** | Reads and edits one sentence: *"My seed: …"* | Prefilled from the player's own words or the theme. Saved locally in the Seed Book. |
| 11 | **Return** | One full breath. | Camera flies back out behind the figure. |
| 12 | **Changed world** | Sees the result. | The disturbance: half the glow, quieter, smaller, 1.5 m to the side. A colour zone grows around it over 3 s. The player's chest light grows a little. |

Duration target: one loop = 3 to 5 minutes.

---

## 5. The seven signature systems

### 5.1 The world is built from your life (MVP)
After the start screen the player picks **3 of 8 cards**: *money, phone, a person, recognition,
a closed door, a crowd, a beautiful house, conflict*. These three become the three disturbances of
chapter 1, in the order picked. Nobody else's game has the same town.

### 5.2 Unfinished things return in a new form (MVP, simple version)
Each disturbance type has 3 forms (see `CONTENT.md` §3). *Stay outside* + walking away → next time the
player comes near, it shows the next form. After connecting, the found **theme** is saved in the
Theme Memory. Chapter 2 builds its disturbances from these themes.

### 5.3 Your words echo (MVP)
Short fragments of the player's free text (3 to 6 words) are kept locally (max 20). When the player
passes an unconnected disturbance, it shows one fragment as handwritten floating text:
*"never… enough"*. Before the player has written anything, it shows nothing.

### 5.4 The world copies you (MVP)
A `restlessness` value (0 to 1) is measured from input speed and sudden direction changes, smoothed
over about 3 s. High: more ambience volume, denser haze, disturbances pulse faster, figures hurry.
Low: quieter, clearer, figures stroll. No text explains this. The player discovers it.

### 5.5 The body as controller (later, optional)
Microphone breath detection and a finger-on-camera pulse (PPG, photoplethysmography: pulse read from
tiny colour changes of the skin), both processed only on the device. Always behind a clear permission
screen. "Hold to breathe" stays the default forever.

### 5.6 Double exposure (chapter 3)
Every outer thing has an inverse inner twin (tower outside, well inside). The player slides the inner
image over the outer silhouette until they fit. Where they fit, the two paper styles melt into one image.

### 5.7 The shared field (chapter 4)
Seeds planted by other players appear as small anonymous lights. When two players breathe in the same
rhythm near the same light, it grows much stronger than either could make it alone (E = c·A²).
No names, no chat, no profiles.

---

## 6. The player

- A small figure made of **pale paper** with a hood and a short cloak. Neutral, so every player can be it.
- A **warm gold light in the chest**: the light within. It is tiny at the start and grows with every
  connection. It is the only coloured thing on the player.
- Breathing in makes the chest light brighter and the cloak rise a little. Breathing out lets a soft
  wave of light leave the chest.
- The figure is procedural (built from primitives in code), with walking animation, cloak swing,
  scarf tails. Adapt `PlayerVisual` from the reference repo.

---

## 7. Controls

| | Desktop | Touch |
|---|---|---|
| Walk | WASD / arrows | Joystick appears under the thumb, left half |
| Look (outside) | Drag with mouse | Drag on the right half |
| Look (inside) | Drag with mouse | Drag anywhere |
| Breathe in | Hold **Space** | Hold the round light button (bottom right) |
| Breathe out | Hold **Shift** | Let go of the button (the out-breath runs by itself) |
| Push | **E** | Hand button (appears only near a disturbance) |
| Choose / tap | Click or Enter | Tap |
| Pause / settings | Esc | Pause button (top right) |

Breath rhythm presets (settings): **normal** 4 s in / 4 s out, **slow** 5 / 6, **easy** 3 / 3.
A breath counts as finished when the in-breath lasted at least 1 s and an out-breath followed.
A poor rhythm is never punished.

Camera outside: third-person follow camera, drag to turn, re-centres behind the player after 1.2 s.
Camera inside: first person, look only. What the view rests on for 1.5 s drifts slowly closer.

---

## 8. World and chapters

The world is **one small cardboard land**. Each chapter is one compact, closed region. The player
walks freely inside a region. Between regions: a paper gate and a 2 to 3 s light blend.

### Opening: *Awakening* (first 90 seconds, part of chapter 1)
The player wakes lying in a grey field outside a small town. The screen is blurred and grey.
One handwritten word floats: **Breathe.** The breath button (or the Space/Shift hint) pulses gently.
The first full breath clears the blur. That is the whole tutorial: no guide, no text walls.
The walking hint (joystick / WASD icons) fades in after the first breath and fades out after 5 s of walking.

### Chapter 1 — *The Grey Town* (MVP) · teaching: becoming one
- Layout: a small cardboard town on a gentle hill. The field (start) → the town square with a dry
  fountain → **three lanes** leading up the hill → the **town gate** at the top.
- The three picked disturbances stand in the three lanes and block them (one each). Each lane leads
  to a small terrace. All three terraces connect to the gate path; the gate opens only after all three
  are connected.
- Grey figures stroll through the square (they copy the player, §5.4).
- The dry fountain fills with light a little more after each connection. After the third, water of
  light flows and the gate unfolds from paper into warm light.
- End of chapter: walking through the gate → light blend → *Seed Book* page showing the three seeds →
  "Chapter complete".

### Chapter 2 — *The Garden of Seeds* (later) · teaching: seeds
The player's saved themes appear as trees grown from seeds. The fruit hangs heavy and bright.
Picking the fruit (grabbing) makes more grow. Cutting a branch: it grows back. Inside each tree the
player finds the seed (the belief) and may plant a new one. The garden changes with every new seed.

### Chapter 3 — *The Two Rivers* (later) · teaching: yin and yang
Every disturbance has an inner twin. The double-exposure mechanic (§5.6).

### Chapter 4 — *The Shared Field* (later) · teaching: oneness
Lights of other players (§5.7). Breathing together.

### Chapter 5 — *Home* (later) · the end
The last disturbance is the player's own figure, standing in front of them. The player connects with
it. The camera does not come back out. Inner and outer paper styles merge. The final seed is one real
heart dream, written by the player, kept only on their device.

---

## 9. Progress without numbers

No points, no XP (experience points), no levels as numbers. Progress is visible in the world:

- Colour zones grow where the player connected. At the end of a chapter the region is in colour.
- The player's chest light grows.
- Inner elements start to appear outside: gold in the cardboard cracks, tiny paper-cut plants.
- The Seed Book fills with the player's own sentences.
- In the last chapter the two styles merge; there is no border any more.

---

## 10. The AI in the game

- The AI has **no name, no face, no voice of its own**. It never appears as a character.
- It speaks only *as the disturbance*, and only in questions.
- It never advises, explains, interprets, diagnoses, praises or judges. It never names the feeling
  for the player.
- It reuses the player's own words.
- It chooses inner-world parts from a fixed kit and returns data, not images.
- It is optional. Everything works with the fallback tables. The first time the player writes own
  words, the game asks once: *"Your words can shape your inner world with the help of an AI. They are
  not stored. Allow?"* — Yes / No, changeable in settings.
- Full contract and prompt: `docs/TECH.md` §7 and `docs/CONTENT.md` §8.

---

## 11. Safety and care

- A crisis check runs in the browser before any text is sent (word list in `CONTENT.md` §9). On a match
  the game pauses, sends nothing, and shows a calm help panel with help-line numbers and a *Return*
  button.
- Players can delete all their data in settings with one button ("Forget everything").
- Content stays soft: disturbances look melancholic or tempting, never horror, never violent.
- The game is for adults and teens 16+. No age gate in the MVP; the tone keeps it safe for everyone.

---

## 12. Success criteria for the MVP

Test with about 10 people. Ask two questions:
1. Did it feel good to play?
2. Did you notice something about yourself?

Target: 8 of 10 say yes to both. Technical: 30+ fps on a mid-range Android phone, first playable
within 10 s on 4G, zero console errors.
