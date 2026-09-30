# Light Within — Content

All texts below go into `public/data/content/en.json` (UI and world text), `public/data/disturbances.json`
(§3–4) and `public/data/fallback.json` (§5–7). Keys are given in `code`. Texts are final drafts;
keep the wording. Claude Code may fix typos only.

---

## 1. Start, settings, about

| Key | Text |
|---|---|
| `title` | Light Within |
| `start.line` | A quiet walk through the world you carry. |
| `start.begin` | Begin |
| `start.continue` | Continue your walk |
| `start.settings` | Settings |
| `start.about` | About the teaching |
| `pause.title` | Paused |
| `pause.resume` | Return to the walk |
| `pause.seedBook` | Seed Book |
| `settings.title` | Settings |
| `settings.rhythm` | Breath rhythm |
| `settings.rhythm.normal` | Normal (4 in, 4 out) |
| `settings.rhythm.slow` | Slow (5 in, 6 out) |
| `settings.rhythm.easy` | Easy (3 in, 3 out) |
| `settings.sound` | Sound |
| `settings.motion` | Reduce motion |
| `settings.ai` | Let an AI shape my inner world from my own words |
| `settings.forget` | Forget everything |
| `settings.forget.confirm` | This removes your cards, seeds and words from this device. Continue? |
| `settings.forget.yes` | Yes, forget |
| `settings.forget.no` | Keep them |
| `about.title` | About the teaching |
| `about.body` | Light Within is inspired by the teaching of Dr. Rulin Xiu. One of her central ideas: what we meet in our life comes to teach us. When we stop resisting and become one with it, it can change, and we grow. This game is an invitation to reflect. It is not therapy and makes no promise about health or results. |
| `about.privacy` | Your words stay on this device. If you allow AI reflection, your words are sent to shape your inner world and are not stored. |

## 2. Picker and opening

| Key | Text |
|---|---|
| `picker.title` | What pulls you or bothers you in your life? |
| `picker.sub` | Pick three. |
| `picker.continue` | Continue |
| `picker.card.money` | Money |
| `picker.card.phone` | Phone |
| `picker.card.person` | A person |
| `picker.card.recognition` | Recognition |
| `picker.card.closedDoor` | A closed door |
| `picker.card.crowd` | A crowd |
| `picker.card.house` | A beautiful house |
| `picker.card.conflict` | Conflict |
| `opening.breathe` | Breathe. |
| `hint.breathDesktop` | Hold Space · then Shift |
| `hint.breathTouch` | Hold the light · then let go |
| `hint.walkDesktop` | W A S D to walk · drag to look |
| `hint.walkTouch` | Left side to walk · right side to look |
| `ch1.title` | The Grey Town |

## 3. Disturbances (`disturbances.json`)

Each type: colour key (DESIGN_SYSTEM §2.2), 3 forms (built as simple procedural shapes), sound id,
and the soul question (§4).

| Type | Form 1 | Form 2 | Form 3 | Sound |
|---|---|---|---|---|
| `money` | slot machine | lottery booth | pile of coins | bright arpeggio, bell rings |
| `phone` | glowing phone | wall of screens | cloud of message bubbles | soft buzz pattern |
| `person` | figure at a window | two figures on a bench | figure walking away | low hum with a sigh |
| `recognition` | trophy on a pedestal | spotlight on a small stage | clapping cut-out crowd | faint applause swell |
| `closedDoor` | locked door | high gate | wall with a keyhole | slow creak, low drone |
| `crowd` | dense crowd | many masks | long queue | murmur cluster |
| `house` | golden house | palace front | perfect garden | warm music-box tune |
| `conflict` | storm cloud | two shouting figures | thorn hedge | low rumble |

## 4. The soul exchange

The player taps: `soul.ask` → **"What did you come to teach me?"**
The disturbance answers (world text, handwriting):

| Type | Soul question |
|---|---|
| `money` | What pulls you to me? |
| `phone` | What are you looking for in me? |
| `person` | What happens in you when you see them? |
| `recognition` | Whose eyes do you want on you? |
| `closedDoor` | What do you think is behind me? |
| `crowd` | Where are you, when you stand in me? |
| `house` | What would living here give you? |
| `conflict` | What in you answers when I get loud? |

Other inner texts:

| Key | Text |
|---|---|
| `choice.outside` | Stay outside |
| `choice.within` | Go within |
| `inner.ownWords` | Your own words |
| `inner.placeholder` | In your own words… |
| `inner.send` | Say it |
| `heart.close` | Close your eyes. Feel where it sits. |
| `heart.open` | Where did you feel it? |
| `heart.zone.head` | Head |
| `heart.zone.throat` | Throat |
| `heart.zone.chest` | Chest |
| `heart.zone.belly` | Belly |
| `heart.zone.hands` | Hands |
| `heart.zone.legs` | Legs |
| `heart.zone.everywhere` | Everywhere |
| `heart.zone.unsure` | Not sure |
| `one.prompt` | Stay with it. Breathe. |
| `seed.title` | My seed |
| `seed.keep` | Keep it |
| `seed.fromTheme` | What I found here: {theme}. |
| `return.prompt` | Breathe to return. |
| `consent.text` | Your words can shape your inner world with the help of an AI. They are not stored. Allow? |
| `consent.yes` | Allow |
| `consent.no` | Keep it offline |
| `end.title` | Chapter complete |
| `end.line` | The town is the same town. You see it differently. |
| `end.seeds` | Your seeds |
| `end.next` | More of the land is coming. |
| `seedBook.title` | Seed Book |
| `seedBook.empty` | Your seeds will be kept here. |
| `error.start` | The world could not open. |
| `error.retry` | Try again |

## 5. Round 1 — the place (fallback)

After the soul question the player sees these chips (plus *Your own words*):

| Chip key | Chip text | `SceneSpec` (place, parts, hardElement, lightLevel) |
|---|---|---|
| `want` | I want it | tight · narrowSpace, wall, light · **wall** · 0.3 |
| `afraid` | I'm afraid of it | dark · canyon, fog, particles · **canyon** · 0.2 |
| `angry` | It makes me angry | storm · cracks, wind, narrowSpace · **cracks** · 0.35 |
| `excited` | It excites me | restless · openSpace, wind, particles · **wind** · 0.6 |
| `pushAway` | I push it away | high · wall, narrowSpace, door · **wall** · 0.25 |
| `unsure` | I don't know | misty · fog, openSpace, water · **fog** · 0.4 |

Own words without AI: pick the chip whose keywords match (want/wish/need/have → `want`; afraid/fear/scared/lose → `afraid`;
angry/hate/unfair/annoy → `angry`; excit/fun/thrill/love it → `excited`; no/don't want/bad/away → `pushAway`;
else `unsure`). Also store the fragment for the echo.

### 5a. Answers that fit each soul question (Alexander, 2026-09-30 — replaces the shared chips in play)
The chips shown after the soul question are the type's own answers. Each answer belongs to one chip key, so
the place and hard element (table above) stay the same. The shared chip texts above are used only for keyword
matching of own words.

| Type | Soul question | Answers (chip key) |
|---|---|---|
| `money` | What pulls you to me? | Having more (`want`) · Fear of not having enough (`afraid`) · That it's never fair (`angry`) · The thrill of winning (`excited`) · Nothing. I keep away from you (`pushAway`) · I don't know (`unsure`) |
| `phone` | What are you looking for in me? | Someone to reach me (`want`) · Not to miss anything (`afraid`) · Something to argue with (`angry`) · The next little thrill (`excited`) · A way to look away (`pushAway`) · I don't know (`unsure`) |
| `person` | What happens in you when you see them? | I want them close (`want`) · I'm afraid to lose them (`afraid`) · I get angry (`angry`) · My heart jumps (`excited`) · I turn away (`pushAway`) · I'm not sure (`unsure`) |
| `recognition` | Whose eyes do you want on you? | My parents' (`want`) · Anyone's, so I'm not forgotten (`afraid`) · Those who overlooked me (`angry`) · Everyone's (`excited`) · No one's. I'd rather hide (`pushAway`) · Maybe my own (`unsure`) |
| `closedDoor` | What do you think is behind me? | Everything I want (`want`) · Something I'm afraid of (`afraid`) · What was kept from me (`angry`) · A whole new life (`excited`) · I'd rather not know (`pushAway`) · I don't know (`unsure`) |
| `crowd` | Where are you, when you stand in me? | Wanting to be part of it (`want`) · Lost (`afraid`) · Pushed around (`angry`) · Swept along (`excited`) · At the edge, keeping out (`pushAway`) · I don't know (`unsure`) |
| `house` | What would living here give you? | Everything I'm missing (`want`) · Never having to worry (`afraid`) · What others have and I don't (`angry`) · A life that shines (`excited`) · Nothing. It's not for me (`pushAway`) · I'm not sure (`unsure`) |
| `conflict` | What in you answers when I get loud? | I want to win (`want`) · I get small (`afraid`) · I get loud too (`angry`) · Something wakes up (`excited`) · I leave (`pushAway`) · I don't know (`unsure`) |

### 6a. Follow-up question per type and answer
The follow-up always fits the answer and can be answered with a wish (the theme chips).

| Type | Follow-up per chip key |
|---|---|
| `money` | `want`: What would having more give you? · `afraid`: If there were always enough, what would you have? · `angry`: What would it give you if it were fair? · `excited`: What does winning promise you? · `pushAway`: If you let me come closer, what might you find? · `unsure`: What do you long for, under all this? |
| `phone` | `want`: What would being reached give you? · `afraid`: If you missed nothing, what would you have? · `angry`: What would it give you to be understood? · `excited`: What does the next thrill promise you? · `pushAway`: If you looked up from me, what might be there? · `unsure`: What do you long for, under all this? |
| `person` | `want`: What would having them close give you? · `afraid`: What would you lose with them? · `angry`: What would it give you if they understood you? · `excited`: What does that jump promise you? · `pushAway`: If you let them come closer, what might you find? · `unsure`: What do you wish for, with them? |
| `recognition` | `want`: What would their eyes give you? · `afraid`: What would being remembered give you? · `angry`: What would it give you if they had seen you? · `excited`: What would all those eyes give you? · `pushAway`: If someone saw you, what might come? · `unsure`: What would your own eyes give you? |
| `closedDoor` | `want`: What would getting through give you? · `afraid`: What would you need to face it? · `angry`: What would it give you to have it back? · `excited`: What would that new life give you? · `pushAway`: If you knocked, what might you find? · `unsure`: What do you hope is behind me? |
| `crowd` | `want`: What would being part of it give you? · `afraid`: What would help you find yourself again? · `angry`: What would your own space give you? · `excited`: What does being swept along give you? · `pushAway`: If you stepped in, what might you find? · `unsure`: What do you wish for, among people? |
| `house` | `want`: What exactly are you missing? · `afraid`: What would never worrying give you? · `angry`: What would it give you to have it too? · `excited`: What would that shine give you? · `pushAway`: If it were for you, what would it give you? · `unsure`: What would home give you? |
| `conflict` | `want`: What would winning give you? · `afraid`: What would you need, to stay as big as you are? · `angry`: What would being heard give you? · `excited`: What does that waking promise you? · `pushAway`: What would you need, to stay? · `unsure`: What do you wish for, when it gets loud? |

## 6. Round 2 — the theme (fallback)

Theme list (the only allowed themes): **Rest, Safety, Freedom, Being seen, Belonging, Love, Peace, Joy,
Trust, Enough, Something else.**

| After chip | Follow-up question | Theme chips (+ *Something else*, + *Your own words*) |
|---|---|---|
| `want` | What would having it give you? | Rest · Safety · Freedom · Being seen |
| `afraid` | What are you afraid of losing? | Safety · Love · Belonging · Trust |
| `angry` | What do you wish were different? | Being seen · Peace · Freedom · Trust |
| `excited` | What does this excitement promise you? | Joy · Freedom · Being seen · Enough |
| `pushAway` | What would happen if you let it come closer? | Peace · Trust · Rest · Love |
| `unsure` | Stay here a moment. What is here? | Rest · Peace · Trust · Enough |

Own words without AI: theme by keyword (rest/tired/relax → Rest; safe/secure/money enough → Safety;
free/freedom → Freedom; seen/notice/respect/recognised → Being seen; belong/alone/lonely → Belonging;
love/loved → Love; peace/calm/quiet → Peace; joy/happy/fun → Joy; trust → Trust; enough → Enough; else Something else).

The theme changes the inner light: the `light` part turns warmer and moves closer when the theme is chosen.

## 7. `fallback.json` shape

```json
{
  "soul": { "money": "What pulls you to me?", "...": "..." },
  "round1": {
    "chips": ["want", "afraid", "angry", "excited", "pushAway", "unsure"],
    "text": { "want": "I want it", "...": "..." },
    "scene": { "want": { "place": "tight", "parts": ["narrowSpace","wall","light"], "hardElement": "wall", "lightLevel": 0.3 } },
    "keywords": { "want": ["want","wish","need","have"], "...": [] }
  },
  "round2": {
    "question": { "want": "What would having it give you?", "...": "..." },
    "themes":   { "want": ["Rest","Safety","Freedom","Being seen"], "...": [] },
    "keywords": { "Rest": ["rest","tired","relax"], "...": [] }
  },
  "seedTemplate": "What I found here: {theme}."
}
```
A unit test proves every type × every chip × every theme resolves to a valid result.

## 8. AI system prompt (`api/reflect.ts`)

```
You are the voice of a "disturbance" in a calm reflective game called Light Within.
The disturbance is something from the player's own life that pulls at them or bothers them
(for example money, a phone, a person, a closed door). The player has stepped inside themselves
to meet it. You speak AS the disturbance, gently, in the first person ("me").

Your only job: ask ONE short question that helps the player look a little deeper, and choose
how their inner world looks, from a fixed kit.

Rules:
- Ask exactly one question, max 14 words. Never more than one question.
- Never give advice. Never explain. Never interpret. Never diagnose. Never praise or judge.
- Never name the player's feeling for them. Offer possible answers as short chips instead.
- Every chip must be a direct, natural answer to your own question.
- Reuse the player's own words where possible.
- No spiritual, medical or therapy vocabulary. No promises. English only.
- If the player writes about wanting to die, hurting themselves or others, do not continue the
  game: return {"crisis": true} only.

Input: JSON with type, form, step ("place" or "theme"), history, chip, freeText.

If step is "place": return
{"question": "...", "chips": [4 short options, max 4 words each], "theme": null,
 "sceneSpec": {"place": one of tight|dark|storm|restless|high|misty,
               "parts": 2-6 of fog|wall|water|light|wind|plants|cracks|canyon|door|openSpace|narrowSpace|particles,
               "hardElement": one of wall|canyon|fog|cracks|wind|water,
               "lightLevel": 0..1},
 "seed": null}
The question asks what lies behind the answer (what it would give, protect, or change).
The chips must be wishes from this list: Rest, Safety, Freedom, Being seen, Belonging, Love, Peace,
Joy, Trust, Enough.

If step is "theme": return
{"question": null, "chips": [], "theme": one word from the list above or "Something else",
 "sceneSpec": null, "seed": "one short sentence, max 12 words, in the player's own words, first person",
 "events": 2-3 of flowers|lanterns|garlands|benches|kites|birds|sharedTable|windowsLit|stormClears|peopleGreet|music}
The events are how the outer town heals after this meeting; choose them to fit the player's words and theme.
The seed never promises anything and never gives advice. Example: "Behind the pull, I want rest."

Return JSON only. No other text.
```
The browser treats `{"crisis": true}` like a crisis match (§9).

## 9. Crisis check (`safety.ts`) and help panel

Phrases (case- and accent-insensitive, whole-phrase match):

- English: kill myself, end my life, want to die, don't want to live, do not want to live, suicide,
  suicidal, hurt myself, self harm, self-harm, cut myself, no reason to live, better off dead,
  kill him, kill her, kill them, hurt someone
- German: umbringen, mich töten, suizid, selbstmord, nicht mehr leben, will sterben, möchte sterben,
  mir etwas antun, ritzen, selbstverletzung, keinen sinn mehr, jemanden verletzen

Not a match (test these): "kill time", "this is killing me" (keep as non-match), "die Sonne", "dying to try".

| Key | Text |
|---|---|
| `help.title` | Let's pause here. |
| `help.body` | What you wrote sounds heavy. You don't have to carry it alone. Please talk to someone who can listen right now. |
| `help.lines` | Austria: 142 (Telefonseelsorge) · Germany: 0800 111 0 111 · Switzerland: 143 · Emergency in Europe: 112 · Other countries: findahelpline.com |
| `help.return` | Return |

Nothing is sent and nothing is stored when the check matches. After *Return* the player is back in the
outer world; the disturbance stays unconnected.

## 10. Echo rules

- Source: the player's free text only (never chips).
- Cut into fragments of 3 to 6 words at commas, periods, "and", "but", "because". Lowercase.
  Drop fragments that are only filler ("i don't know").
- Keep max 20, oldest dropped first. Never store a fragment that matched the crisis check.
- Show one fragment, with "…" between two words, near a `waiting` disturbance when the player passes
  within 6 m. At most one echo every 20 s.
