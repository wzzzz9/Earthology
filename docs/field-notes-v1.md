# Game Plan: Field Notes (educational 2D adventure)

Nov 8, 2026 · @dz

## How to use this doc with Claude Code

This is the project's starting brief. Claude Code should go through the open questions with you first, then build one milestone at a time.

1. Export this doc as Markdown and save it in your project folder as `GAME_PLAN.md`.
2. Open that folder in VS Code and start Claude Code.
3. First prompt: *"Read GAME\_PLAN.md. Go through the Open questions section with me one at a time and recommend an answer for each. Record my answers in a Decisions log at the end of the file. Don't write game code yet."*
4. Copy the Working rules section (last section) into a file called `CLAUDE.md` in the same folder, so Claude Code follows those rules every session.
5. Once the decisions are done: *"Start Milestone M1."*
6. Keep `GAME_PLAN.md` as the single source of truth. When a decision changes, update it there first.

## Vision

**Pitch:** a top-down 2D pixel adventure where you travel real places as a trainee field scientist, and the science you learn is how you get through the world. Working title: *Field Notes* (placeholder).

**Learning target:** someone who plays carefully and reads the journal should know enough to pass high-school geology and physical geography. That means rocks and minerals, plate tectonics, landforms, natural hazards, map skills, and weather and climate. Chemistry appears lightly, only where it explains the Earth.

**Design pillars**

1. **Science is the mechanic.** You progress by using facts (test a rock, read a map, predict where lava will flow), not by answering quizzes.
2. **Playable without reading.** Every required idea is also shown through play, so players who skip the plot can still finish.
3. **Deep for those who want it.** Dialogue, the journal and optional field exams give careful players full high-school depth.
4. **Real and correct.** Real places and real science. Every fact has a source and is checked.
5. **Small and finishable.** One polished region beats six half-built ones.

## Audience and learning level

The main players are high-school students (about 13–18) and curious adults. Content targets high-school geology and geography, with chemistry kept light. Two kinds of player must both be able to finish.

|  | Plot-skipper | Plot-lover / studier |
| --- | --- | --- |
| How they play | Skips dialogue, follows markers, experiments | Reads everything, explores side areas |
| What they learn | Core ideas, through doing (Tier 1) | Full high-school depth (Tiers 1–3) |
| What the game gives them | Objective tracker, one-line dialogue summaries, hints, try-and-see puzzles | Rich NPC conversations, journal detail, field exams, 100% collection |

**Rules that make it work for both**

- The objective tracker always shows the next goal in one line.
- Every dialogue can be skipped. Skipping shows a one-line *field note* with the key fact.
- Any fact needed to progress appears in at least two forms: something you see or do, plus a journal entry.
- The journal records key facts automatically, even if the dialogue was skipped.
- Puzzles can be solved by experimenting with tools. Understanding the science just makes it faster.
- No dialogue box longer than 3 lines, and no forced reading longer than about 30 seconds.
- Hints escalate (nudge → clue → answer), so nobody stays stuck.

## Story

You're a new trainee at a field-science station. Your mentor has gone missing and left behind a field journal with pages torn out. Each region holds one mystery to solve and one missing page.

- **Protagonist:** a trainee field scientist. Fixed character or player-chosen name and look is an open question.
- **Mentor:** Dr. \[name TBD\], a well-known field geologist. Her journal pages are both the story thread and the game's "textbook".
- **Companion:** a small field drone that scans samples, gives hints and cracks jokes. It keeps the hint system inside the story.
- **Each region is one case:** a believable local problem, such as cracks opening in a town's roads, a tsunami warning, a lost walker, or a spring drying up. Solving it needs that region's science.
- **Payoff:** put together, the pages reveal the mentor's big idea: every region is part of the same rock cycle. The same material is melted, eroded, buried and pushed up again. In the finale you trace one grain of rock through every region you've visited.
- **Tone:** warm and curious, like Professor Layton crossed with Stardew Valley. Low stakes, with no combat and no dying.

**Alternative premises to discuss:** (B) you run a small survey company taking jobs around the world; (C) a time-travelling field kit takes you through Earth's history, which teaches geologic time and fossils.

## World and regions

The world is a home base plus six regions based on real places, each built around one big science theme, then a finale. Version 1 ships with only the tutorial and Region 1.

| # | Region (real place) | Main science | Case (draft) | Light chemistry |
| --- | --- | --- | --- | --- |
| 0 | Field Station (home base, tutorial) | Map skills: compass, scale, legend, grid references, latitude and longitude | Find the mentor's last camp from her notes | — |
| 1 | Fire and Ice (Iceland) | Divergent plate boundary, igneous rocks, volcano types, glaciers, geothermal energy | Cracks are opening in a fishing town's roads | Gases in magma; sulfur smell at hot springs |
| 2 | The Shaking Coast (Japan, Pacific Ring of Fire) | Subduction, earthquakes and seismic waves, tsunamis, steep volcanoes, hazard preparedness | A tsunami warning: get the village to high ground | — |
| 3 | Roof of the World (Himalayas) | Continental collision, fold mountains, metamorphic rocks, marine fossils high up, altitude and climate | Find a safe mountain pass with a contour map | Heat and pressure change minerals |
| 4 | Red Centre (Uluru–Kata Tjuta, Australia) | Sedimentary rocks, weathering and erosion, arid climate and landforms, groundwater | A walker is lost and water is scarce | Iron oxidising (rusting) makes the rock red |
| 5 | Hollow Hills (karst: Ha Long Bay, Vietnam, or Guilin, China) | Limestone, caves, stalactites, sinkholes, groundwater, sea-level change | A village spring is drying up | Weak acid in rainwater dissolves limestone |
| 6 | River to Sea (Twelve Apostles, Victoria, plus a river delta) | River erosion and deposition, meanders, deltas, coastal erosion (cave → arch → stack) | A coastal lookout is close to collapsing | — |
| 7 | Finale: Into the Earth | Earth's layers, mantle convection driving the plates, the full rock cycle | Trace one grain of rock through every region | — |

The order follows how the ideas build: plates first, then rocks, then surface processes. Weather and climate run through every region; each one has a climate graph to read before you pack your gear.

**Cultural care:** Uluru is sacred to the Anangu people. The game should show it respectfully: no climbing (the climb closed in 2019), and only cultural content that Anangu share publicly. Get advice before building that region.

## Core gameplay

The core loop: explore → collect samples → run field tests → journal entry → use the fact to solve the region's case → unlock the next area.

&#91;embedded content: core gameplay loop · 6 steps\]

The highlighted step is the payoff: the fact you got from a field test becomes the key to the case.

- **Explore:** top-down movement, talking to people, inspecting things. There's no combat. Hazards like rockfalls or rising water send you back to safety instead of killing you.
- **Collect and identify samples:** pick up rocks and minerals, then run real field tests in a short mini-game:
  - Hand lens: crystal size and texture (big crystals mean slow cooling underground; glassy means very fast cooling)
  - Streak plate: the colour of the rock's powder (haematite leaves a red-brown streak even when it looks black)
  - Scratch test: hardness checked against a fingernail, copper coin, steel nail and glass (the Mohs scale)
  - Acid drop: calcite fizzes, so limestone and marble react
  - Magnet: magnetite sticks
  - Water: pumice floats
- **Identification key:** test results feed a yes/no flowchart in the journal. Working through the key is the learning.
- **Field journal:** the in-game encyclopedia. It fills itself with samples, places, sketches and the mentor's pages. It's searchable and shows a completion %.
- **Maps and navigation:** a paper-style map with compass, scale and grid references, contour maps in the mountains, and latitude/longitude clues on the world map.
- **Instruments and data:** read a seismograph, locate an earthquake from three stations, read climate graphs and river gauges.
- **Cases:** one main case per region (3–5 steps), plus 2–3 side quests.
- **Light crafting (the optional chemistry):** a few real processes that upgrade your kit. Melt sand into a glass lens, heat limestone into lime for mortar, smelt iron ore with charcoal for a better rock hammer.
- **Field exams (optional):** a 5-question review at the end of each region for players who want to study. Rewards are cosmetic (badges, outfits) and never required to progress.

## Learning design

Every fact has a tier. Plot-skippers learn the core (Tier 1); careful players reach full high-school depth (Tiers 1–3).

| Tier | What it is | How the player gets it | Needed to finish? |
| --- | --- | --- | --- |
| 1 · Core | The big ideas, e.g. "magma that cools slowly makes big crystals" | Shown through play, plus a one-line field note | Yes |
| 2 · Syllabus | High-school detail, e.g. named rock types, types of plate boundary, the Mohs scale | Dialogue, journal entries, side quests | No, but field exams test it |
| 3 · Bonus | Deeper or surprising facts, e.g. marine fossils near the top of Mount Everest | Hidden spots, optional conversations | No |

**How the learning sticks**

- **Use it, don't just read it:** every Tier 1 fact is needed for at least one puzzle.
- **Bring it back later:** facts come back in later regions. For example, basalt from Iceland reappears on the Japanese coast and in the finale. That's spaced repetition without a quiz.
- **Picture plus words:** every journal entry has a sketch or diagram beside the text.
- **Low-stakes recall:** NPCs sometimes ask you a question in conversation. A wrong answer just gets a friendly explanation.

**Fact-checking (AI can get science details wrong)**

- All facts live in content files, each with a source link and a `verified` flag.
- Good sources: Geoscience Australia, USGS, British Geological Survey, Smithsonian Global Volcanism Program, a current high-school textbook.
- Nothing ships with `verified: false`. A script lists unverified facts before each release.
- Each fact can carry a tag for the syllabus point it covers. Which syllabus to use is an open question.

## Vertical slice: Fire and Ice (Iceland)

Region 1 is the first thing built in full. It's about 30–45 minutes of play and should prove the whole design works.

**Case: "The Splitting Ground."** Earthquakes are shaking a fishing town and cracks are opening in its roads. The mayor needs to know whether an eruption is coming, and where the lava will go.

Each step: what the player does → what they learn.

1. **Arrive at the harbour.** A climate graph on the noticeboard tells you to pack warm, waterproof gear. → *Reading climate graphs.*
2. **Walk the rift valley (based on Þingvellir).** Stand in the crack between the North American and Eurasian plates. The drone explains they move apart about 2 cm a year. → *Divergent plate boundaries.*
3. **Collect four rocks:** basalt (dark, tiny crystals), obsidian (natural glass), pumice (full of holes, floats) and gabbro (big crystals, from an old magma chamber exposed by erosion). Test them with the hand lens and water. → *Cooling rate and crystal size; how igneous rocks form.*
4. **Seismograph station.** Read the records from three stations and draw circles to find where the quakes start. → *Locating an earthquake's epicentre.*
5. **Predict the lava.** Basalt lava is runny and flows downhill along valleys. Use the contour map to choose where an earth barrier will steer the flow away from town (Iceland has really done this). → *Lava types, gentle shield volcanoes vs steep explosive ones, reading contours.*
6. **The fissure opens.** A short, safe set piece: lava fountains along the crack and the barrier holds. Case solved, and you find the mentor's first journal page.

**Side quests:** a glacier walk (U-shaped valleys, moraines, glacier outburst floods); a geothermal power plant (how hot rock heats homes); a hot spring (why it smells of rotten eggs: hydrogen sulfide gas).

**Optional field exam:** 5 questions on the above.

**Learning check:** after this region a careful player can name and identify four igneous rocks, explain why crystal size varies, describe a divergent boundary, locate an epicentre from three stations, and explain why lava follows valleys.

## Visual and audio style

The world is pixel art, dialogue uses anime-style portraits, and placeholder art stays in until the game is fun.

- **View:** top-down, like classic Pokémon or Stardew Valley.
- **Tiles:** 16×16 px is recommended because more matching assets exist; 32×32 is the alternative.
- **Internal resolution:** 480×270, scaled up in whole-number steps so pixels stay sharp on any screen.
- **Characters:** 4-direction walk cycles of 3–4 frames. The player, the companion and about 3 NPCs per region.
- **Dialogue portraits:** anime-style head-and-shoulders art with 3–4 expressions (neutral, happy, surprised, worried).
- **Colour per region:** Iceland in black basalt and icy blue; Japan in green and cherry pink; the Himalayas in white and slate; the Red Centre in ochre and red; karst in green and turquoise; the coast in sandstone and deep blue.
- **Fonts:** a pixel font for titles and UI, and a clean, readable font for journal text, since that's where the learning lives.
- **Journal look:** a field notebook, with paper texture, hand-drawn-style sketches and labelled diagrams.
- **Art sources, in order:** (1) free CC0 placeholders such as Kenney; (2) free or paid itch.io packs, checking each licence; (3) commissioned or self-drawn portraits later. Whether to use AI-generated art is an open question (licence and consistency).
- **Audio:** calm exploration music for each region, small UI sounds, and a satisfying fizz or clink for each test. Use free libraries with clear licences and keep a credits file.

## Tech stack and architecture

The stack is Phaser with TypeScript and Vite, maps drawn in Tiled, all game content in data files, and free hosting on GitHub Pages.

| Part | Choice | Why |
| --- | --- | --- |
| Engine | Phaser (latest stable version) | 2D, runs in any browser, everything is code, works well with Claude Code |
| Language | TypeScript | Catches mistakes early, and Claude Code writes it well |
| Build tool | Vite | Fast local dev server and simple builds |
| Maps | Tiled (free map editor), exported as JSON | Phaser loads Tiled maps directly |
| Content | JSON files in `content/` | Add or fix facts without touching code |
| Save | Browser localStorage, with autosave | No server needed |
| Hosting | GitHub Pages, deployed by GitHub Actions | Free, and every push to `main` redeploys |
| Controls | Keyboard plus touch (on-screen joystick) | Friends will open the link on phones (open question) |

**Scenes**

- **Boot / Preload:** loads assets and content
- **Title:** new game, continue, settings
- **World:** the current region map, with the player, NPCs and items
- **UI overlay (always on top):** objective tracker, hint button, quick inventory
- **Dialogue:** text box and portrait, with skip and field-note summary
- **Journal:** samples, places, mentor's pages, identification key, search
- **Map:** region map with compass, grid and contours
- **Mini-games:** sample testing, seismograph, field exam

**Systems** (each in its own folder): quests, inventory, journal, hints, save/load, input, audio, and the content loader and validator.

**Folder structure**

```
field-notes/
  GAME_PLAN.md            this document
  CLAUDE.md               working rules for Claude Code
  content/
    facts.json            every fact, with tier, source, verified flag
    samples.json          rocks and minerals, with test results
    regions/iceland.json  region info, case steps, side quests
    dialogue/iceland.json
    exams/iceland.json
  public/assets/          sprites, tiles, portraits, audio, maps (Tiled JSON)
  src/
    main.ts
    scenes/               Boot, Title, World, UI, Dialogue, Journal, Map, minigames/
    systems/              quests, inventory, journal, hints, save, input, audio
    content/              types, loader, validator
  scripts/
    check-content.ts      lists broken ids and unverified facts
```

## Content data model

Every fact, sample, quest step and line of dialogue is data with an id. Content can grow without code changes, and every fact traces back to a source.

**Fact**

```json
{
  "id": "igneous.cooling-rate",
  "tier": 1,
  "text": "Magma that cools slowly underground grows big crystals. Lava that cools fast at the surface has tiny crystals or none.",
  "fieldNote": "Slow cooling = big crystals.",
  "topics": ["igneous-rocks"],
  "curriculum": [],
  "source": "https://...",
  "verified": false
}
```

**Sample**

```json
{
  "id": "pumice",
  "name": "Pumice",
  "rockType": "igneous-extrusive",
  "region": "iceland",
  "tests": { "lens": "glassy-with-holes", "acid": false, "magnet": false, "floats": true },
  "facts": ["igneous.cooling-rate", "pumice.gas-bubbles"],
  "sprite": "samples/pumice.png"
}
```

**Quest step**

```json
{
  "id": "iceland.case.predict-lava",
  "title": "Predict the lava's path",
  "objective": "Choose where to build the barrier on the contour map",
  "requires": ["iceland.case.seismograph"],
  "teaches": ["lava.basaltic-runny", "map.contours"],
  "hints": ["Lava flows downhill.", "Follow the valley on the map.", "Build across the valley above the town."]
}
```

**Rule:** `check-content` fails if any id points to something that doesn't exist, or if a Tier 1 fact isn't used by at least one quest step.

## Milestones

Get a page online early, then build the first region step by step. Every milestone ends with a playable build and a git commit.

1. **M1 Setup:** Vite + Phaser + TypeScript project, a GitHub repo, and a "hello world" page live on GitHub Pages.
2. **M2 Walk around:** the player on a Tiled map with collisions, a following camera, keyboard and touch controls.
3. **M3 Talk and pick up:** one NPC conversation (with skip and field note), picking up a rock, an inventory.
4. **M4 Journal and testing:** the journal screen, the sample-testing mini-game with 3 rocks, the identification key.
5. **M5 Quests and hints:** the quest system, objective tracker, companion hints, save and load.
6. **M6 Tutorial:** the Field Station with its map-skill puzzles.
7. **M7 Region 1 slice:** the full Iceland region from the walkthrough, with placeholder art.
8. **M8 Playtest:** 3–5 friends play from the link. Fix whatever confuses them, and check that a plot-skipper can finish.
9. **M9 Art and sound:** replace the placeholders in the tutorial and Iceland.
10. **M10 Next regions:** one at a time, using the same process.

## Open questions to discuss

There are 23 decisions, listed in the order they're needed. Each has a recommended default, so the work never has to stop and wait. Record each answer in a Decisions log at the end of this file.

| # | Question | Options | Recommended | Decide before |
| --- | --- | --- | --- | --- |
| 1 | Who is the main audience? | High-school students / friends and adults / both | Both: aim at ages 13–18, keep it fun for adults | M1 |
| 2 | How much time per week, and a target date for a playable Region 1? | Your call | Set a weekly time budget and one target date | M1 |
| 3 | Public or private GitHub repo? | Public / private | Public (free GitHub accounts only get Pages for public repos) | M1 |
| 4 | Should it work on phones? | Desktop only / desktop and phone | Both, with touch controls | M2 |
| 5 | Tile size? | 16×16 / 32×32 | 16×16 | M2 |
| 6 | Languages? | English only / more later | English, with all text kept in content files so translation stays possible | M3 |
| 7 | Protagonist? | Fixed character / player picks name and look | Player picks a name and one of a few looks | M3 |
| 8 | How much chemistry? | None / light (explains the Earth, plus crafting) / a full topic | Light | M4 |
| 9 | Companion? | Drone / animal / spirit / none | Drone (fits the scanning and hint role) | M5 |
| 10 | Any danger or fail state? | None / soft (sent back to safety) / hard (game over) | Soft | M5 |
| 11 | Story premise? | A: missing mentor / B: survey company / C: time travel | A | M6 |
| 12 | Tone? | Cosy / adventurous / mystery | Cosy mystery | M6 |
| 13 | Real named places, or a fictional world inspired by them? | Real / fictional / mix | Real places, drawn in a stylised way | M6 |
| 14 | Which syllabus to tag facts against? | Australian Curriculum Years 7–10 / VCE Geography / IB or GCSE / none | General high-school level now; add a syllabus later | M7 |
| 15 | Which regions, in what order, and how many for version 1? | See World and regions | Tutorial plus Iceland for version 1 | M7 |
| 16 | Field exams? | In / out / separate study mode | In, optional, with cosmetic rewards | M7 |
| 17 | Target play time? | Per region and in total | 30–45 min per region; the full game follows from the region count | M7 |
| 18 | Who checks facts? | You / a teacher / friends who study geography | You, using the sources listed in Learning design | M7 |
| 19 | Anime portraits? | Yes / no | Yes, added in the art pass; placeholders until then | M9 |
| 20 | Where does the art come from? | Free packs / paid packs / AI-generated / commissioned / drawn yourself | Free CC0 placeholders now, decide the rest at M9 | M9 |
| 21 | Budget? | Free only / small budget for asset packs | Free only until after the playtest | M9 |
| 22 | How to handle Uluru and other culturally sensitive places? | Include respectfully, with advice / swap in a different desert | Decide before building Region 4 | Region 4 |
| 23 | Final title? | *Field Notes* / something else | Keep *Field Notes* as a placeholder | Release |

## Working rules for Claude Code

Copy this block into `CLAUDE.md` in the project folder so Claude Code follows it every session.

```markdown
# Working rules

- GAME_PLAN.md is the source of truth. Read it at the start of each session and update it when a decision changes.
- Work one milestone at a time. Keep each change small and playable. Commit after each working step with a clear message.
- Explain what you changed in plain words. I'm learning as we go.
- Ask before adding a new library, changing the folder structure, or starting a new milestone.
- Keep content (facts, dialogue, quests) as JSON in content/. Never hard-code facts in src/.
- Never add a science fact silently. New facts go in content/facts.json with "verified": false and a suggested source, and you tell me so I can check them.
- Text players see: short, plain, high-school reading level, at most 3 lines per dialogue box.
- Every required fact must be learnable through play, not only through dialogue.
- Before saying a step is done: run the content check and the build, then test in the browser.
- Use placeholder art until the art milestone. Keep a CREDITS file with every asset's source and licence.
```
