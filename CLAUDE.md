# Working rules

- Four sessions share this repo; see docs/TEAM.md for who owns which files. Do not edit files owned by another session.
- GAME_PLAN.md (v2) is the source of truth. Read it at the start of each session and update it when a decision changes. docs/field-notes-v1.md is background; where they disagree, GAME_PLAN.md wins.
- Work one milestone at a time. Keep each change small and playable. Commit after each working step with a clear message.
- Explain what you changed in plain words. I'm learning as we go.
- Ask before adding a new library, changing the folder structure, or starting a new milestone.
- Keep content (facts, dialogue, NPC sheets, rubric, teacher lines) as JSON in content/. Never hard-code facts in src/.
- Never add a science fact silently. New facts go in content/facts.json with "verified": false and a suggested source, and you tell me so I can check them.
- Every fact about a real country's people or culture follows the same source-and-verify rule as science facts.
- No quests. If a design needs an NPC to ask the player for something, redesign it as a lead or a shared discovery.
- Marking logic is generic and never knows about Iceland. The rubric decides what counts.
- A plot-skipper must be able to reach the pass mark without any relationship above Acquaintance. check-content enforces this.
- Text players see: short, plain, high-school reading level, at most 3 lines per dialogue box.
- Every required fact must be learnable through play, not only through dialogue.
- Before saying a step is done: run the content check and the build, then test in the browser.
- Use placeholder art until the art milestone. Keep CREDITS.md updated with every asset's source and licence.

# Environment

- Node is installed via nvm in WSL. In a non-interactive shell run `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"` first.
- Stack: Vite + TypeScript + Phaser 4. Internal resolution 480x270, pixelArt on.
- `npm run dev` for the dev server, `npm run build` for a production build into dist/.
- Visual check: with the dev server running (`npm run dev`), `node scripts/shot.mjs out.png Enter:200 ArrowRight:1500` loads the game headless, presses keys, saves a screenshot and prints console errors. Use it before calling a step done.
- Map check: `npm run check:map` walks the generated Iceland map from the spawn and fails if any scannable, person, rock or the ship cannot be reached on foot. Run it after changing the map generator.

## Text and sound
- Pixel fonts only: `FONT.body` (Tiny5) at 8/16/24px, `FONT.retro` (Press Start 2P) at 8/16px, from `src/ui/font.ts`. Any other family or size blurs after zoom. Fonts load in Boot before any scene starts.
- Zoom is whole device pixels per game pixel (`bestZoom()` in main.ts accounts for display scaling).
- Sounds are synthesised in `src/systems/sfx.ts` (no audio files). Key `0` toggles sound. Dialogue types out; the headless harness sets `__debug.fastText` so tests see whole pages (`SHOT_SLOWTEXT=1` to keep the typewriter).
