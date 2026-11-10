# How we work: four sessions, one repo

The owner (wzzzz9) directs. Four Claude sessions do the work. Each owns certain files;
nobody edits files owned by someone else. Work goes to `main` only through pull requests,
which the **Main** session reviews and merges.

| Session | Owns | Delivers |
| --- | --- | --- |
| **Main** (the VS Code session) | `src/scenes/**`, `src/systems/**` except `placeholders.ts`, `scripts/**`, `GAME_PLAN.md`, `CLAUDE.md`, `README.md`, merges | Working game code, milestone builds, headless tests, integration of the other three |
| **Art** | `src/systems/placeholders.ts`, `src/art/**`, `docs/ART_SPEC.md`, `docs/art/**`, `public/assets/**` | The palette, the look of every sprite and tile, set-dressing rules, portraits. Receives reference images from the owner. |
| **Research** | `content/facts.json` (verification only: `source`, `verified`, minimal text fixes), `docs/research/**` | Verified facts with sources; answers to research questions from the other sessions |
| **Design** | `docs/design/**`, `content/countries/*/{dialogue,npcs,scannables,classes,rubric,teacher,intro}.json` | What the player does: classes, tasks, dialogue, rubric items, town life. Proposals as docs, content as JSON. |

Shared rules for everyone: read `CLAUDE.md` and `GAME_PLAN.md` first. Run `npm ci && npm run check`
before opening a PR (content) and `npm run build` if you touched `src/`. Never add a fact without
`"verified": false` and a source. No quests from townspeople. Lines under 60 characters, 3 per page.

## Asking each other for things

Cloud sessions cannot talk to each other directly. Use GitHub Issues as the channel:

- **Research request:** open an issue titled `research: <question>`, label `research`. The Research
  session answers in the issue with sources, and updates `content/facts.json` if a fact changes.
- **Art request:** issue titled `art: <what>`, label `art`. The Art session answers with a PR or a
  note in the issue.
- **Design question:** issue titled `design: <question>`, label `design`.
- **For Main:** anything that needs code. Issue titled `code: <what>`, label `code`. Main picks it up.

Put the issue number in the PR description when a PR answers an issue. Close the issue when merged.

## Decisions

The owner decides. Main writes decisions into `GAME_PLAN.md`. Design and Art propose, in
`docs/design/` and `docs/art/`; a proposal is not a decision until it is in the plan.

## Current priorities (Nov 11)

1. Art: a coherent palette. The game's colours were chosen one sprite at a time and do not sit
   together. Define one limited palette for Iceland (ground, water, rock, plants, buildings,
   characters, UI), export it from `src/art/palette.ts`, and re-colour `placeholders.ts` to use
   only those names. Reference style: chibi 16-bit, pastel, soft; the owner will send images.
2. Design: Sigrún's topics about the five famous places; then a proposal for what the classes
   teach and ask in Iceland (4 classes exist, see `content/countries/iceland/classes.json`).
3. Research: verify the unverified facts (see `npm run check` output), starting with the Iceland
   life facts and the five place facts.
4. Main: full headless playthrough of Iceland; then playtest preparation.
