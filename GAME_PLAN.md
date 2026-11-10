# Game Plan v2: "Earthology" (working title; was Moon Field until Nov 11)

Nov 8, 2026. Builds on `Game Plan Field Notes (educational 2D adventure).md` (the v1 brief). Where v2 says nothing, v1 still applies (tech stack, learning tiers, fact-checking rules, art style, working rules). Where they disagree, v2 wins.

**What changed from v1, in one paragraph:** the trainee-scientist-with-a-missing-mentor story is replaced by an alien student doing a school assignment on a copy of Earth. Quests are gone; people start as strangers and open up as you discover things. The journal becomes the homework, and a teacher marks it. The game is still a top-down 2D pixel adventure where real geography and geology are the mechanic, and it still ships one small country first.

---

## 1. Vision

**Pitch:** You are an alien student. Your final assignment is to fully document planet EaRtH20934, a planet that happens to be identical to our Earth. You land in one small country, walk around, notice things, test rocks, read maps, and slowly stop being a stranger to the people who live there. When you think you understand the place, you submit your homework. Your teacher marks it, tells you what you missed, and sends you back out.

**Why it is not Stardew Valley:** there is no farm, no shop grind, no combat, no energy bar, no quest log. The core verb is **noticing**. You get better at the game by understanding the place, not by collecting resources. The emotional hook is being an outsider who earns their way in.

**Why it is not a phone RPG:** no currency, no timers, no gacha, nothing to buy. Everything is unlocked by discovery.

**Design pillars (updated)**

1. **Knowledge is the mechanic.** Progress comes from understanding real places and real science, and from showing that understanding to people and to the teacher.
2. **Strangers first.** Nobody hands you a quest. Trust is earned, and friends share what only locals know.
3. **The homework is honest.** You never know your exact score until you submit. Feedback is useful, specific, and a little funny.
4. **Playable without reading, deep if you read.** Kept from v1: two player types must both be able to finish (see v1 "Audience and learning level").
5. **Real and correct.** Real places, real science, real culture, every fact sourced and verified (v1 "Fact-checking").
6. **Small and finishable.** One country done well before a second one is started.

---

## 2. Premise and story

**Setup**

- You are a student at an off-world school. Your species is small, curious, gender-free, and bad at understanding humans. Think "little monster", not "grey alien". Your final-year assignment: *"Survey planet EaRtH20934 and submit a complete report."*
- Your ship (small, parked somewhere quiet, e.g. behind a hill outside the first town) is your home base: save point, sleep to pass the day, and the communicator you use to submit homework and talk to the teacher.
- **Two bodies.** Your true form (the little monster) is what you see in the ship, in the notebook, and in cutscenes. Outside, you wear a human disguise: at the start the player picks one of two human looks (one male, one female). Nobody in town ever finds out. The comedy comes from the gap between the two: you look normal and act slightly wrong.
- Your species' knowledge of Earth is zero, so you start with an empty notebook. This justifies the "learn it from scratch" structure and gives comedy: you misread human customs, your notebook sketches are an alien's view of ordinary things.

**The teacher**

- **Ms. Beatrice Lund** (placeholder human name, chosen at random; rename any time in `teacher.json`). The joke: the whole school adopted human names for this assignment, and she took hers very seriously. Dry, strict, secretly proud of you. Appears only on the communicator screen as a portrait with 3–4 expressions.
- Marks your homework, gives feedback, and gets grumpy if you spam submissions.
- Replaces v1's drone as the "hint system inside the story". Hints come as feedback on your work, not as a companion whispering in your ear.

**Story arc**

- Act 1 (first country): land, learn the basics, make a first friend (the retired geologist, or the bakery owner, whoever the player warms to first), pass the first assignment.
- Later countries: each is a new assignment with a new rubric. Friends from earlier countries can send a letter or a postcard that hints at the new place (cheap, warm, and spaced repetition for free).
- Finale (far future): the teacher reveals the real test was never geography. It was whether you could make a stranger into a friend. Keep this as an aspiration, not a v1 requirement.

**Tone:** warm, curious, gently funny. Low stakes. No dying, no fail state that deletes progress.

---

## 3. The country as a level

One country = one assignment = one region of the game. Version 1 ships **one country only**.

**Recommended first country: Iceland.** Reasons:

- Small population and small towns, so a handful of NPCs feels right, not empty.
- World-class geology that is visible on the surface: rift valley, volcanoes, glaciers, hot springs, basalt everywhere. v1 already designed the whole region in detail (v1 "Vertical slice: Fire and Ice"). That work is reused almost entirely.
- Visually distinct in pixel art: black rock, white ice, blue water, green moss.
- Culturally safe to portray with normal care, unlike some later candidates.

**What a country contains**

| Part | Example (Iceland) | Purpose |
| --- | --- | --- |
| 1 town | a fishing town, ~10 NPCs | people, friendship, culture facts |
| 3–5 places outside town | rift valley, lava field, glacier, hot spring, harbour cliffs | geology and geography, samples, map puzzles |
| 1 "quiet" spot | your ship | save, sleep, submit homework |
| 1 happening | tremors and cracks in the roads (from v1) | a natural thread through the places, without being a quest |
| Rubric | see section 6 | the hidden checklist the teacher marks against |

**The "happening" is not a quest.** The ground is shaking. Nobody asks you to fix it. But the town is talking about it, people are worried, and if you understand the geology you can tell them something useful. If you do, the town remembers it. That is how v1's case steps survive without a quest log: they are things you *can* do, discovered through conversation and exploring, and recorded as "leads" (section 5).

**Later countries** follow the v1 regions table (Japan, Himalayas, Australia's Red Centre, karst, the Victorian coast), one at a time, with the same cultural-care rules as v1 (especially for Uluru).

---

## 4. Core loop

```
walk around  →  notice something  →  scan / sample / test it  →  it appears in the notebook
      ↑                                                                   ↓
talk to people (new topics unlock from what you found)  ←  new places and leads open up
      ↓
submit homework  →  teacher marks it, points at the weakest part  →  back out
```

**Noticing.** Interesting things have a small sparkle or a subtle animation when you are near them. Walking up and pressing the action key "scans" them: a one-line notebook entry appears with a sketch. This is the main collection verb and it works for anything: a landform, a building, a sign, a fish drying on a rack, a dog.

**Samples and field tests.** Kept from v1 exactly: pick up rocks, run hand lens / streak / scratch / acid / magnet / water tests in a short mini-game, feed the results into the identification key. This is the science depth.

**Maps.** Kept from v1: paper map, compass, grid references, contours. The notebook's map fills in as you walk (fog of war on the paper map). Unexplored map area is itself a rubric item, so "did I go everywhere" is part of the grade.

**Talking.** See section 5.

**Submitting.** See section 6.

**Day cycle (light).** Sleeping in the ship advances a day counter. Some things only change day to day: a new line from an NPC, the boat back in harbour, a new weather day for the climate graph. Keep it simple: no clock, no hunger, no shops closing. NPC daily schedules are a v2 feature, not v1.

**No fail state.** Hazards (rising water, steam vents) push you back to safety, as in v1.

---

## 5. People: strangers first

This is the biggest change from v1 and the main source of fun that is not science.

### 5.1 Relationship levels

Every NPC has a level, stored per NPC in the save file.

| Level | Name | What they do with you |
| --- | --- | --- |
| 0 | Stranger | "Hello." "Nice weather." One or two polite lines. Nothing personal. **No tasks, no requests.** |
| 1 | Acquaintance | Knows your name. Small talk about the town. Will answer simple questions about things you have scanned nearby. |
| 2 | Friend | Tells you things only locals know (Tier 2 and 3 facts). Mentions places you have not found. Soft leads: "my uncle works at the quarry, he'd like you." |
| 3 | Close friend | A personal story. A gift (cosmetic, or a tool upgrade). The one secret spot. Can "vouch" for you with another NPC, raising them straight to Acquaintance. |

### 5.2 How trust grows (no quests)

Trust points come from things the player does anyway. Nobody says "do X for me". The player notices that people warm up.

- **Showing up.** First greeting of each in-game day gives a small amount. Daily visits matter, big one-off actions do not.
- **Being nice.** Dialogue choices. Rude options exist and cost a little, so choices mean something.
- **Shared discovery.** The strongest source. When you have scanned something in an NPC's world (their boat, the cliff behind their house, the old church), a new topic appears when you talk to them. Asking about it gives trust *and* a fact. This is the design link between exploring and friendship: **the more you understand the place, the more people open up.**
- **Remembering.** NPCs occasionally mention something (a name, a place, a dislike). Later, a dialogue option lets you bring it up. Getting it right gives trust; getting it wrong is a gentle joke, not a penalty.
- **Small unasked kindness.** Returning a dropped glove, holding a gate, buying a bun at the bakery. Found by exploring, never prompted.
- **Being useful during the happening.** If you correctly explain the tremors or help choose where the earth barrier goes (v1 case step 5), the whole town's trust rises a little.

### 5.3 Topic-based dialogue (how NPCs feel "smart" without AI)

Instead of a fixed script, each conversation builds a menu of topics from the player's current state:

- things the player has scanned nearby or recently
- facts in the notebook that relate to this NPC
- things the NPC said before (memory)
- the current level of the relationship
- the day counter and the current "happening" state

Each NPC's dialogue file is a set of small responses keyed to (topic, relationship level). Many NPCs share generic fallbacks ("I don't know much about rocks, ask Sigrún"), which points the player to the right person. A handful of hand-written reactions per NPC go a long way: the player experiences people who notice what they have been doing.

This is deterministic, free, runs on GitHub Pages, and keeps every fact under the verified-content rule.

### 5.4 Option: AI-driven small talk (decide after the playtest)

Your question was whether friends can be "smarter". Freeform conversation with a language model (the Claude API) is possible, but it changes the project:

- **Needs a server.** The API key can never be inside a web page, so you would run a tiny proxy server with the key. The game is then no longer a fully static GitHub Pages site.
- **Costs money per message**, forever, paid by you, including for strangers who open the link.
- **Facts.** A model can state wrong science or wrong facts about a real country with full confidence, which breaks pillar 5. It could only be allowed to talk about *small talk*, with every real fact still coming from the verified content files.
- **Control.** Players type anything; the model needs a strict character sheet, moderation, and a fallback when offline.

**Recommendation:** build the topic system (5.3) first and make it good. Design the dialogue data so an AI layer could later handle *only* the "chit-chat" slot of a conversation, with the NPC's character sheet, the relationship level, and the player's notebook as context. Try it as an experiment after the playtest (milestone M11), behind a settings toggle, default off. If the scripted version already feels alive, skip it.

### 5.5 NPC cast for Iceland (draft, ~10)

Fisherman, harbour master, bakery owner, a child who asks too many questions (never guesses the truth, but comes closest), a retired geologist (the main Tier 2 and 3 source, and the one person who could solve the happening but is too shy to tell the mayor), the mayor, a geothermal plant worker, a sheep farmer, a tourist who is wrong about everything (comic, and a low-stakes recall check for the player), a dog.

---

## 6. Homework and marking

### 6.1 The notebook is the homework

The notebook has fixed sections, which are also the marking sections:

| Section | What goes in it | Example items (Iceland) |
| --- | --- | --- |
| Land | landforms, scanned places, map coverage | rift valley, lava field, glacier, fjord, map 95% explored |
| Rocks | samples identified with the key | basalt, obsidian, pumice, gabbro |
| Earth | processes and hazards | divergent boundary, epicentre located, lava path predicted |
| Sky | weather and climate | climate graph read, aurora seen, a storm day recorded |
| People | culture, daily life, local knowledge, friendships | fish drying, Icelandic names, geothermal heating, 3 friends made |
| Sketches | the scan collection | everything scanned |

Each section shows a bar that fills, but **not** the list of what is missing. The player sees "Rocks: 3 found" but not "of 4".

### 6.2 Submitting

From the ship you send the notebook to the teacher. The teacher reads it (a short animated wait, a few seconds) and returns:

1. **A mark out of 100**, plus a grade band. The pass mark is 60 and is deliberately reachable by a plot-skipper. Every band gives something, so a weak submission still feels like progress:

   | Mark | Band | What you get |
   | --- | --- | --- |
   | 0–39 | Keep going | Feedback only, kindly worded. The teacher's first hint is extra generous. |
   | 40–59 | Encouragement | `reward*1` (placeholder; one warm line from the teacher). No unlock. |
   | 60–79 | Pass | Class passed. Next country unlocked. `reward*1`. |
   | 80–99 | Credit | `reward*1`. |
   | 100 | Perfect | The full marking sheet revealed. `reward*1`. |
2. **One line per section** ("Land: strong. Rocks: thin. People: who did you actually talk to?").
3. **One targeted hint** on the weakest section. Hints escalate on repeat submissions the way v1's hint ladder does: nudge → clue → answer.
   - 1st: "You have three igneous rocks. Iceland has more than three kinds of rock."
   - 2nd: "Big crystals mean slow cooling underground. Where would old underground rock be exposed?"
   - 3rd: "Check the cliffs north of the harbour."
4. **A stamp** on the notebook cover for the best grade reached.

**Passing unlocks the next country.** Reaching 100 is optional. The stamp on the cover always shows the best band reached, so a player can come back to an old country and improve it.

### 6.3 Anti-spam rule ("if you keep sending the same homework I will fail you")

- Resubmitting with **nothing new** since the last submission triggers escalating teacher lines (annoyed → very annoyed → threatens to fail you).
- On the third identical submission, the small punishment: **the teacher refuses to mark again until at least 3 new notebook entries exist.** The communicator shows "3 new things, then I'll read it." No mark is lost, no progress is deleted, and the rule is stated plainly so it feels fair.
- "New" means any scan, sample, fact, map area, or relationship level that was not in the previous submission.

### 6.4 Marking is data

The rubric is a JSON file per country. Each item has a weight, the section it belongs to, the condition that satisfies it, and the hint ladder. The marking code is generic. This keeps the design rule from v1: content changes never need code changes.

```json
{
  "id": "iceland.rocks.gabbro",
  "section": "rocks",
  "weight": 4,
  "satisfiedBy": { "sampleIdentified": "gabbro" },
  "hints": [
    "You have three igneous rocks. Iceland has more than three kinds.",
    "Big crystals mean slow cooling underground. Where is old underground rock exposed?",
    "Check the cliffs north of the harbour."
  ]
}
```

Other `satisfiedBy` shapes: `scanned`, `factLearned`, `mapCoverage` (percent), `relationshipAtLeast` (npc, level), `happeningStep` (id).

---

## 7. Learning design

Kept from v1 almost unchanged: Tier 1 / 2 / 3 facts, every Tier 1 fact needed by play, spaced repetition across countries, picture plus words in the notebook, and the fact-checking rules (sources, `verified` flag, release script).

Additions:

- **A new fact category, People and Places.** Culture and everyday life of the real country: food, language basics (a few words, correct pronunciation hints), housing, work, history in one line. Same sourcing rules as science. Written with respect; never jokes *about* the culture, only about the alien misunderstanding it.
- **The rubric is the learning check.** v1's optional "field exam" is replaced by the homework itself. The teacher's section feedback is the review.
- **Friends are the Tier 3 channel.** Deep or surprising facts come from people at Friend level or above, so the social loop and the learning loop are the same loop.

---

## 8. Tech

Unchanged from v1: Phaser + TypeScript + Vite, Tiled maps, content as JSON, localStorage saves, GitHub Pages via GitHub Actions, keyboard plus touch.

New systems (each its own folder under `src/systems/`):

- `relationships/` : trust points, levels, per-NPC memory flags
- `topics/` : builds the dialogue topic menu from player state
- `leads/` : soft "things I heard about" list (replaces the quest log)
- `rubric/` : loads the country rubric, scores a notebook snapshot, picks the hint, enforces the anti-spam rule
- `scan/` : the notice-and-scan interaction

New content files:

```
content/
  facts.json
  samples.json
  countries/iceland/
    country.json       places, happening steps, day events
    npcs.json          cast, character sheets, relationship thresholds
    dialogue.json      responses keyed by (npc, topic, level)
    scannables.json    everything that can be scanned, with sketch + one-liner
    rubric.json        marking items and hint ladders
    teacher.json       feedback lines, grumpy lines, grade bands
```

`check-content` (from v1) gains two rules: every rubric item must be satisfiable by something that exists in the content, and every Tier 1 fact must be reachable without any relationship above Acquaintance (so a plot-skipper can pass).

If AI small talk is ever added (5.4), it is a separate optional service and must never be required to play.

---

## 2b. Story additions (from the Nov 11 design notes)

**Opening (built).** The alien at home gets an acceptance letter from Nebula Hollow University on the space computer, sleeps, and the next day meets Professor Lund at the Earthology Department. The player types their name. She summons a ship, they warp to Earth, she says "we study the real thing", the camera pulls back to the planet and the title appears. In the ship cabin she sets the cover story and the player picks a disguise.

**Cover story (decided).** On Earth the professor and the student pose as a parent and a kid who just moved to the town. The ship is their house. Townspeople meet "the new family", which is a natural reason for strangers to warm up slowly and for the kid to be out asking questions. The professor marks homework at home, not from orbit.

**Classes and small tasks (decided in principle, details open).** The professor runs a schedule: "Day 3, 9 o'clock, class on rocks. Be on time." A class is a short scene at the ship that teaches one idea (Tier 1), then she sets a small task with a deadline in game days: "By day 5, bring me two different rocks." Tasks come only from the professor, never from townspeople, so the no-quests rule for the town still holds. Missing a deadline is soft: "Are you all right? One more chance, day 7." Missing the second time costs something small (a comment on the report card), never a fail. Open points: how many classes per country (suggest 4 to 5), whether classes block the homework (suggest no, they only add rubric items and hints), and what the schedule looks like in the notebook (suggest a Timetable tab).

**Course structure (decided Nov 11).** The game is *Earthology*, which is also the name of the student's major. **One country is one class.** A class is passed or failed. A submission is a *report*. Passing a class unlocks the next country.

**Failing and retaking (decided in principle Nov 11; the trigger below is the recommended default, to confirm).** A class can be failed. Recommended trigger: each class has a final deadline, for Iceland day 14. At the end of that day the professor takes the best report so far as the final mark. Below the pass mark is a fail. Failing is not the end: the student **retakes** the class, which means staying in the same country with everything already discovered kept on record. Only the undiscovered items remain. During a retake the professor holds **no classes**: it is discovery only, with the notebook and her report feedback as the only guides. A retake has no deadline. The report card remembers how many attempts a class took.

**Rewards (deferred Nov 11).** Every place where a reward is given shows the placeholder `reward*1` until the reward design is decided. Bands, stamps and unlocks stay as marks on the report; what they give the player is still open.

## 8b. Visual direction (decided Nov 10, extended Nov 11)

Reference style, in words so nothing is copied: **chibi 16-bit**. Characters about two heads tall with big expressive hair, one-pixel dark outlines on sprites and props, a saturated pastel palette, soft rounded tile edges, small drop shadows under characters, and a dialogue box with a large portrait beside the text. Iceland keeps its own palette inside that style: moss greens, black lava, glacial blue, black sand, ochre tundra, white ice.

Nov 11 additions: cinematic backgrounds get proper set dressing (bedroom, university hall, Icelandic night with aurora, ship cabin). Trees are small, about two character heights, varied (birch, rowan, willow bush) and sparse, because Iceland has few trees. Moss on lava is drawn as fine tufts so it never reads as tree tops. Earth is drawn with continents, ice caps, clouds, a night side and an atmosphere rim wherever it appears.

Build order for the look, each step cheap and reversible:

1. Characters in chibi proportions with outlines and a shadow (code-drawn, done first so the direction can be judged).
2. Props and boulders with outlines; tile edges softened where two ground types meet.
3. Dialogue box restyle: rounded panel, name tag, large portrait placeholder.
4. M9: replace the code-drawn placeholders with real pixel art (own, commissioned, or licensed packs) in the same style.

## 9. Milestones

Every milestone ends with a playable build and a commit, as in v1.

1. **M1 Setup.** ✅ done Nov 10. Vite + Phaser + TypeScript, repo, hello-world on GitHub Pages.
2. **M2 Walk.** ✅ done Nov 10. Player on a Tiled map, collisions, camera, keyboard and touch.
3. **M3 Notice and talk.** ✅ done Nov 10. Scan one object into the notebook. One NPC with Stranger and Acquaintance lines, a topic that unlocks after a scan, trust points, the day counter via sleeping in the ship.
4. **M4 Notebook and rocks.** ✅ done Nov 10. Notebook screen with sections and bars, sample testing mini-game with 3 rocks, identification key (v1 M4).
5. **M5 Homework.** ✅ done Nov 10. Rubric loader, submission screen, teacher feedback with hint ladder, grade bands, anti-spam rule, save and load. *This is the milestone that proves the new idea. Test it hard.*
6. **M6 Landing.** ✅ done Nov 10. Opening: ship lands, teacher explains the assignment on the communicator, the player picks a human disguise, the first walk into town. Map-skill basics folded in (v1 M6).
7. **M7 Iceland.** 🔧 in progress: day system (Nov 11), Iceland region map with harbour town and five famous places (Nov 11). Left: walkthrough test, dialogue for the places, playtest prep.
8. **M8 Playtest.** 3–5 friends from the link. Check: can a plot-skipper pass? Does anyone feel lost without a quest log? Is the teacher funny or annoying? Does anyone reach 100%?
9. **M9 Art and sound.** Replace placeholders for the opening and Iceland.
10. **M10 Country 2.** Japan, using the same process, plus a postcard from an Iceland friend.
11. **M11 (optional) AI small talk experiment.** Only if M8 says the scripted NPCs feel flat. Settings toggle, default off.

---

## 10. Decisions log

Decided in the Nov 8, 2026 planning conversation. These override the matching v1 open questions.

| v1 # | Question | Decision |
| --- | --- | --- |
| 3 | Repo | **Private** for now (Nov 9). Switch to public when ready for GitHub Pages; free Pages needs a public repo. Owner: github.com/wzzzz9. |
| 4 | Phones | **Desktop browser first.** Touch controls later, after Iceland is playable. |
| 7 | Protagonist | An alien student, **gender-free, little-monster look**. One fixed true form for v1. Outside the ship the player wears a human disguise and **picks one of two human looks (male or female)** at the start. |
| 9 | Companion | None. The teacher on the communicator takes the hint role. |
| 11 | Story premise | New premise D: alien homework on EaRtH20934. Replaces A (missing mentor). |
| 12 | Tone | Warm, curious, gently funny. |
| 13 | Real places | Real places, drawn stylised, on a planet that is "exactly our Earth". |
| 15 | Regions for v1 | **Iceland** only. |
| 16 | Field exams | Out. Replaced by homework marking. |
| 17 | Play time | Aspiration: a country should feel big, many hours. v1 target for Iceland: **2–3 hours** of content, built so it can grow (everything is data). See the note below. |
| 23 | Title | **Moon Field** (working title, Nov 9). |
| new | Quests | None. Relationship levels and leads instead. |
| new | Disguise | **Nobody ever finds out.** The child-and-dogs gag is dropped. |
| new | Teacher | Ms. Beatrice Lund, random human name, placeholder. |
| new | Progression and rewards | One country = one class, pass or fail. Pass mark 60 unlocks the next country. Bands at 40 / 60 / 80 / 100. Rewards are `reward*1` placeholders until designed. Fail → retake the class: progress kept, no classes, discovery only. See 2b and 6.2. |
| new | Anti-spam | 3 identical submissions → teacher waits for 3 new entries. No real fail. |

v1 questions 1, 2, 5, 6, 8, 10, 14, 18–22 keep their v1 recommended defaults unless you say otherwise.

**Note on play time.** "At least 20 hours, it's a country" is a fair instinct, but 20 hours of hand-made content is years of work for one person. The plan is to make Iceland about 2–3 hours in v1 with every system in place, then grow it: more scannables, more NPC topics, more places, more rubric items. Because content is JSON, adding hours later does not need new code. The playtest (M8) will show whether people want more of Iceland or a second country.

## 11. Open questions (new)

Each has a recommended answer so work never has to stop. A–E were answered on Nov 9 and moved into the decisions log.

| # | Question | Recommended | Decide before |
| --- | --- | --- | --- |
| F | How many NPCs in Iceland? | About 10, 4 of them with full Friend-level content | M7 |
| G | Rude dialogue options: in or out? | In, with small trust cost, never blocking | M7 |
| H | Day cycle: sleep-only counter, or NPC schedules? | Sleep-only counter for v1 | M7 |
| I | AI small talk? | Decide after M8 playtest. Default no | M11 |
| J | Final title? | *Moon Field* until something better appears | Release |
| K | Weekly time budget and a target date for playable Iceland? | Not yet given. Default: milestones sized to about one evening each | M1 |
| L | Alien customisation beyond the fixed form? | Colour choice only, after M9 | M9 |

---

## 12. Working rules

Copy v1's "Working rules for Claude Code" block into `CLAUDE.md` in the project folder, and add these lines:

```markdown
- GAME_PLAN.md (v2) is the source of truth. The v1 field notes are background.
- No quests. If a design needs an NPC to ask the player for something, redesign it as a lead or a shared discovery.
- Every fact about a real country's people or culture follows the same source-and-verify rule as science facts.
- The rubric, dialogue, NPC sheets and teacher lines are JSON in content/. Marking logic is generic and never knows about Iceland.
- A plot-skipper must be able to reach the pass mark without any relationship above Acquaintance. check-content enforces this.
```
