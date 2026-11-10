# Art spec: replacing the placeholder art

This is the brief for the art milestone (M9). It lists every sprite the game draws today, at the size and layout the code already expects, so finished art can replace the code-drawn placeholders one for one.

Sources: `GAME_PLAN.md` section 8b (visual direction) and `src/systems/placeholders.ts` (sizes, frames and colours). Where this document proposes something that is not in either source, it is marked **Proposed**.

## 1. Style in one paragraph

**Chibi 16-bit.** Characters are about two heads tall with big expressive hair. Sprites and props have a one-pixel dark outline. The palette is saturated pastel. Tile edges are soft and rounded where two ground types meet. Characters have a small drop shadow. Dialogue shows a large portrait beside the text.

Iceland keeps its own palette inside that style: moss greens, black lava, glacial blue, black sand, ochre tundra, white ice.

The style is described in words on purpose. Do not copy or trace sprites from any existing game.

## 2. Technical rules

| Rule | Value |
| --- | --- |
| Game resolution | 480x270, scaled up in whole-number steps |
| Tile size | 16x16 |
| Draw scale | 1:1. Never draw at 2x and shrink |
| Format | PNG with transparency |
| Edges | Hard pixels only. No anti-aliasing, no blur, no semi-transparent pixels except shadows |
| Light | From the upper left. Highlights top-left, shade bottom-right |
| Canvas | Keep each sprite at the exact size listed. The code positions and collides by these sizes |

Some sprites are shown enlarged in cutscenes (the aliens at 2x to 3x, the ship at 2x, rock sketches at 2x). They are scaled by the game, so they must still be drawn at 1:1 and read well both small and enlarged.

## 3. Palette

The palette is one shared set of 40 colours, defined in `src/art/palette.ts` and explained with swatches in [`docs/art/palette.md`](art/palette.md). Every sprite and tile in `placeholders.ts` uses those names and nothing else, so that page is the single source for hex codes. Do not copy hex codes from this spec; read them from the palette.

The short version:

- Bright and cheerful, pastel by lightness rather than greyness: saturated mid tones, no murky colours, no pure white or pure black. The warm white is `WHITE`; the darkest tone is `OUTLINE`.
- One outline colour, `OUTLINE`, on every sprite and prop. Shadows are the same colour at low opacity (`SHADOW`, `SHADOW_SOFT`).
- Two warm green families: grass (yellow side: `GRASS_DARK`, `GRASS`, `GRASS_LIGHT`) and moss (blue side: `MOSS_DARK`, `MOSS`, `MOSS_LIGHT`), sharing one highlight `LEAF_LIGHT`.
- One stone ramp for lava, basalt, metal and pebbles: `ROCK_DARK`, `ROCK`, `ROCK_LIGHT`, `STONE_PALE`, plus warm `GRAVEL` for paths.
- Water and ice: `WATER_DEEP`, `WATER`, `WATER_LIGHT`, `ICE`.
- Wood: `WOOD_DARK`, `WOOD`, `WOOD_LIGHT`. Skin: `SKIN`, `BLUSH`.
- Accents carry the saturated notes: `RED`, `ORANGE`, `YELLOW`, `LIGHT`, `BLUE`, `NAVY`, `TEAL`, `VIOLET`, `LILAC`, `PINK` and their dark partners.
- Colours that arrive from content JSON (sample colours, NPC coats) are snapped to the nearest palette colour by `snap()`.

New art is allowed new colours only by changing the palette first, with the reason written into `palette.md`.

## 4. Outline and shadow rules

**Outline**

- One pixel wide, colour `OUTLINE` (`#2a2630`, a warm near-black), around the outside of every character, alien, prop, tree and boulder.
- The outline sits **inside** the canvas. Do not grow the canvas to fit it.
- Interior lines (where an arm meets the body, hair meets the face) use the same colour, one pixel.
- Ground tiles have **no** outline. They must tile seamlessly.
- No coloured or lighter outlines, and no outline thicker than one pixel.

Several placeholders do not have an outline yet (ship, signpost, pickup rocks, sparkle). The finished versions should have one, except the sparkle, which is a light effect and stays without.

**Shadow**

- Characters and aliens: a flat dark strip under the feet, about 8 to 10 px wide and 2 px tall, centred. `OUTLINE` at 30% opacity (`SHADOW`).
- Trees: the same, 16 to 18 px wide and 2 to 3 px tall, `OUTLINE` at 22% opacity (`SHADOW_SOFT`).
- The shadow is part of the sprite and sits in the bottom rows of the canvas.
- Shadows are flat. No gradients, no blur.
- Boulders use a solid `OUTLINE` base instead of a transparent shadow.

**Shading**

- Three tones per material at most: base, one highlight, one shade.
- No dithering on characters. Light texture on ground tiles is fine.

## 5. Tiles

One tileset image, **272x16**, 17 tiles in a single row, no margin and no spacing. The tile order must not change, because the map file refers to tiles by position.

| # | Tile | What it is | Walkable |
| --- | --- | --- | --- |
| 1 | Tundra grass | Fresh green grass with a few three-blade tufts. The most common ground | Yes |
| 2 | Tundra variant | Same base colour as tile 1, different tufts and one soft lighter patch. Varies the texture without making a checkerboard | Yes |
| 3 | Gravel path | Grey-brown gravel with pebbles | Yes |
| 4 | Glacial water | Blue-turquoise deep water with ripples | No |
| 5 | Basalt boulder | Rounded dark boulder, lit from the upper left | No |
| 6 | Mossy boulder | Same boulder with a moss cap | No |
| 7 | Black sand | Near-black sand with grey grains | Yes |
| 8 | Void | Flat `VOID`. Fills space outside the map | Yes (unused in play) |
| 9 | Moss lava A | Dark lava rock with fine moss tufts | Yes |
| 10 | Moss lava B | Denser moss | Yes |
| 11 | Ice | White-blue ice or old snow | Yes |
| 12 | Shallow water | Lighter water for lake edges | Yes |
| 13 | Moss lava C | Third variant | Yes |
| 14 | Moss lava D | Fourth variant | Yes |
| 15 | Chasm | The rift floor: near-black with a cold navy seam and grey rock edges | Yes (the map keeps you out) |
| 16 | Hot pool | Milky pale turquoise with lighter ripples and white glints | Yes |
| 17 | Stepping stones | Tundra grass with two or three flat grey stones, for side paths | Yes |

Notes for the artist:

- **Seamless.** Every ground tile must tile with itself in both directions, and tiles 1 and 2 must share one base colour so a field of them reads as one meadow, not a grid. The same goes for the four moss lava tiles.
- **Moss is fine tufts.** Draw moss as many small tufts of 1 to 2 px so a field of it reads as a carpet, never as tree tops. The four variants exist so the field does not look like a grid.
- **Boulders (5, 6)** are drawn on a separate layer above the ground. The placeholder bakes tundra green behind them. **Proposed:** give the finished boulders a transparent background so they can sit on any ground.
- **Soft edges.** Section 8b asks for softened edges where two ground types meet. The placeholder set has no transition tiles. **Proposed:** a later second row of edge and corner tiles for grass/gravel, grass/lava, grass/sand and water/shore. This needs a map and code change, so it is not part of the one-for-one replacement.

## 6. Characters

### 6.1 Sheet layout

- Frame size **16x24**.
- One sheet per character: **128x24**, 8 frames in a row.
- 4 directions x 2 frames (idle, step).

Frame order, left to right:

| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| down idle | down step | up idle | up step | left idle | left step | right idle | right step |

- "Down" faces the camera. "Up" shows the back.
- Walking alternates idle and step at 6 frames per second.
- In the step frame the body and head drop 1 px and one leg lifts.
- Right may be a mirror of left, as long as the light still reads from the upper left.

### 6.2 Proportions

- About two heads tall. The head with hair fills roughly rows 1 to 12, the body rows 12 to 17, the legs rows 17 to 22, the shadow rows 22 to 23.
- Head is 10 px wide, centred. Body is 10 px wide with 2 px arms each side.
- Feet are centred at the bottom. The game collides on a 10x8 box at the bottom centre, so the feet must stay there in every frame.
- Eyes are 2x2 dark with a 1 px white highlight. Facing down shows two eyes and two cheek-blush pixels. Facing left or right shows one eye. Facing up shows none.
- Hair is big and readable. It is the main way to tell characters apart at this size.
- Every character wears a sweater with a cream yoke band at the collar (a nod to the Icelandic lopapeysa).

### 6.3 Characters needed now

| Character | Look |
| --- | --- |
| Player, disguise A | Orange coat, dark brown short hair, navy beanie with a cream band, dark legs |
| Player, disguise B | Blue coat, long brown hair to the shoulders, yellow knitted headband, no hat |
| Sigrún, retired geologist | Green coat, grey hair, no hat |

The planned Iceland cast (not built yet) is about ten: fisherman, harbour master, bakery owner, a curious child, the mayor, a geothermal plant worker, a sheep farmer, a tourist, and a dog. Each human uses the same 16x24 sheet. Give each one a distinct silhouette and coat colour. The dog will need its own size, to be decided when it is built.

### 6.4 The alien's true form (the student)

- **16x20**, single frame, facing the camera.
- A round teal body, wider in the middle.
- One wide off-white eye band across the face with two dark pupils, each with a pale blue glint.
- A small dark mouth.
- Two thin antennae with warm yellow lights at the tips.
- Two stubby feet. Darker teal on the lower body.
- Outline and shadow as for characters.
- Gender-free, friendly little-monster feel.
- Shown at 2x to 3x in the opening, so it must hold up enlarged.

### 6.5 The professor's true form (Professor Lund)

- **16x28**, single frame, facing the camera. Taller than the student.
- Same body family as the student, in violet, with a darker violet long coat over the lower third.
- The same eye band, with a dark line straight across it that reads as glasses. Warm yellow eye glints.
- A single pale-lilac bun on top of the head in place of antennae.
- Small mouth, two feet, outline and shadow as above.
- Should read as older, calm and a little stern next to the student.

The two aliens must look like the same species: same eye band, same feet, same outline weight.

## 7. Props

All props have the outline from section 4. Sizes are fixed.

| Prop | Size | Description |
| --- | --- | --- |
| Ship | 48x32 | A grey flying saucer: wide flat hull, a lighter upper band, a glacial-blue glass dome on top, four small warm lamps along the rim, two short dark landing feet. It is the family's house, the save point and where the player sleeps, so it should feel cosy, not menacing. Shown at 2x in the opening |
| Cairn | 16x16 | A stack of three basalt stones, widest at the bottom, with two small touches of moss and a dark base line |
| Signpost | 16x16 | A brown wooden post with a lighter board near the top and a suggestion of carved writing. No readable text |
| Birch | 40x72 | Thin cream trunk with dark bark marks, airy yellow-green canopy. Trunk base at bottom centre |
| Rowan | 40x72 | Brown trunk, rounder and darker green canopy, a few red berry clusters. Trunk base at bottom centre |
| Willow bush | 32x32 | Low rounded bush, soft grey-green, a short brown stem at the base |
| Pickup rock | 12x10 | A small rock on the ground with a highlight on top and a dark underside. Three versions: basalt (dark grey, dull), obsidian (black, glassy), pumice (pale grey, holes) |
| Sparkle | 7x7 | A 4-point star: a cross of pale yellow rays with a white 3x3 core. No outline. The game fades and pulses it |
| Rock sketch | 48x40 | A notebook drawing of a rock: an angular blob with an off-white outline. Patterns: speckle (small grey dots), shine (pale streaks with a white glint), holes (many small pits), plain. Shown at 2x in the lab |

Town and landmark props added with the Iceland map (all in `makeIcelandProps` and `makePlants`; sizes fixed, base at the bottom centre):

| Prop | Size | Description |
| --- | --- | --- |
| House (red, blue, yellow, green) | 48x40 | Corrugated-iron house: bright wall with vertical corrugation lines, white trim, navy roof, grey chimney, two lit windows, dark door |
| Church | 40x56 | White walls, red roof, small tower with a cross, two pale blue windows |
| Boat | 24x16 | Blue hull with a white rim and cabin, sits in the water |
| Fish racks | 32x24 | Brown wooden frame with cream fish hanging in two rows |
| Hot-water pipe | 64x10 | Grey pipe on brackets with a faint warm glow along the ground |
| Sheep pen | 48x40 | Ring of grey stone wall split like a pie, one white sheep inside |
| Basalt columns | 64x32 | Eight six-sided pillars of alternating dark and mid stone, pale tops |
| Glacier face | 96x28 | Wall of ice with a dusty grey top, pale blue foot and blue crevasses |
| Geyser | 16x10 mouth, 10x48 column, 10x8 steam | Pale stone mouth, translucent white column, soft steam puffs |
| Waterfall | 32x36, 2 frames | Falling water with light streaks and white foam at the foot |
| Fences | 16x12 (h), 8x20 (v) | Wooden rails and posts, one tile wide |
| Yard clutter | planter 16x14, barrel 12x14, lantern 8x20, woodpile 16x12, bench 20x10, well 20x24, mailbox 8x16, pier 16x16 | Small outlined props in the wood and stone families; lantern and mailbox carry the warm accents |
| Plants | lupine 14x16, cotton grass 12x14, shrub 16x12, tuft 10x8, flowers 12x10, stones 10x6 | Ground decoration without collision. Lupine is the one violet note in the landscape |

Tree rules from section 8b:

- Trees are small, about two character heights, and never taller.
- They are varied and sparse. Iceland has few trees.
- The player can walk behind the canopy, so the canopy must not have a ground shadow baked across its full width. Keep the shadow at the trunk base.

Earth, the cinematic backgrounds (bedroom, university hall, night sky with aurora, ship cabin) and the dialogue box frame are drawn by code today and are outside this spec. If Earth is ever drawn as a sprite, it needs continents, ice caps, clouds, a night side and an atmosphere rim.

## 8. Dialogue portraits

The game shows a flat colour block with the speaker's initial today, 40x48, inside a dialogue box that is at least 64 px tall.

**Proposed size: 48x48 per portrait.**

- It is three tiles square, so it fits the grid and fills the box with 8 px of margin above and below.
- It is large enough for a chibi face with readable expressions, and matches "a large portrait beside the text" in section 8b.
- It is 8 px wider than the current block, so the text will shift right by 8 px when portraits go in. That is a small code change for the art milestone.

**Proposed sheet: 192x48, four expressions in a row.**

| 0 | 1 | 2 | 3 |
| --- | --- | --- | --- |
| Neutral | Happy | Surprised | Troubled |

- Head and shoulders, facing three-quarters toward the text (to the right).
- Only eyes, brows and mouth change between expressions. Head shape, hair and shoulders stay on exactly the same pixels, so the face does not jump when the expression changes.
- Same outline colour, same light direction and same character colours as the walking sprite.
- "Troubled" covers worried, shy and grumpy. It is the professor's look when a report is weak.
- Transparent background. The game draws the panel behind it.

Portraits needed now: player disguise A, player disguise B, the student's true form, Professor Lund's true form, Sigrún.

## 9. Open questions

- **Professor Lund in disguise.** On Earth she poses as the player's parent, but there is no human sprite for her yet. She will need a 16x24 sheet and a portrait.
- **Transition tiles** for soft ground edges (section 5).
- **Portrait size.** 48x48 is proposed. 40x48 would drop into the current box with no layout change, at the cost of a narrower face.
- **Animation.** Two frames per direction is what the code plays. A third or fourth walk frame would need a code change.
- **File names and folders** for the finished art, and how each asset is credited in `CREDITS.md`.

## 10. Consistency checklist

Check every finished sprite against this list.

**Size and layout**

- [ ] Canvas is exactly the size in this spec.
- [ ] Drawn at 1:1, hard pixels, transparent background.
- [ ] Tileset is 272x16 with tiles in the order in section 5.
- [ ] Character sheets are 128x24 in the order down, up, left, right, each idle then step.
- [ ] Feet are at the bottom centre in every character frame.
- [ ] Tree trunks meet the ground at the bottom centre.

**Outline and shadow**

- [ ] Outline is one pixel, `OUTLINE`, on every sprite and prop.
- [ ] No outline on ground tiles or the sparkle.
- [ ] Shadows are flat, the right opacity, and at the base.
- [ ] No anti-aliasing and no stray semi-transparent pixels.

**Colour and light**

- [ ] Every colour is a name from `src/art/palette.ts`, or the palette has been changed first.
- [ ] At most three tones per material.
- [ ] Light comes from the upper left on every sprite, including mirrored ones.
- [ ] Iceland still reads as Iceland: moss green, black lava, glacial blue, black sand, ochre tundra, white ice.

**Style**

- [ ] Characters are about two heads tall with big hair.
- [ ] Each character can be told apart by silhouette alone.
- [ ] Both aliens look like one species.
- [ ] Moss reads as a carpet of tufts, not tree tops.
- [ ] Trees are no taller than two characters.
- [ ] Ground tiles repeat without a visible seam or grid.
- [ ] A portrait matches its walking sprite in hair, colours and clothes.
- [ ] Expressions change only eyes, brows and mouth.

**In the game**

- [ ] Viewed at 480x270 and at whole-number scales, not only in the editor.
- [ ] Characters stand out against tundra, lava, sand and ice.
- [ ] Aliens, ship and rock sketches still look right enlarged.
- [ ] Nothing is copied or traced from another game.
- [ ] The asset's source and licence are added to `CREDITS.md`.
