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

All hex codes below are taken from `placeholders.ts`. Start from these. New colours are allowed when a sprite needs them, but add them to this table so the set stays small.

### 3.1 Shared

| Hex | Use |
| --- | --- |
| `#1a1c20` | **Outline colour** for every sprite and prop. Also boulder base shadow |
| `#0b0d14` | Void, deepest dark, night side of Earth |
| `#efe9dc` | Cream: sweater yoke, hat band |
| `#f4f1e8` | Off-white: alien eye band, sketch outline, UI text |
| `#ffffff` | Eye highlights, sparkle core |
| `#ffd37a` | Warm light: ship lamps, antenna lights, name tag text |
| `#fff6c8` | Sparkle rays |

### 3.2 Iceland ground

| Hex | Use |
| --- | --- |
| `#7d9150` | Tundra grass base |
| `#8ea35c` | Tundra tuft, light |
| `#6a7f42` | Tundra tuft, dark |
| `#86964f` | Dry tundra base |
| `#98a85d` | Dry tundra, light |
| `#6f8244` | Dry tundra, dark |
| `#8a8378` | Gravel base |
| `#a39b8d` | Gravel pebble, light |
| `#6c665d` | Gravel pebble, dark |
| `#4a93b5` | Glacial water base |
| `#6fb3cf` | Water ripple, light. Also shallow-water base |
| `#9fd0e3` | Shallow water highlight |
| `#3a7a98` | Water ripple, dark |
| `#33343a` | Black sand base |
| `#4a4b52` | Black sand grain, light |
| `#26272c` | Black sand grain, dark |
| `#2e3137` | Lava rock base |
| `#24262b` | Lava rock edge |
| `#1c1e23` | Lava crack |
| `#6f9a4a` | Moss |
| `#8fb85c` | Moss, bright |
| `#dfe9ee` | Ice base |
| `#f6fafc` | Ice highlight |
| `#b9ccd6` | Ice shade |

### 3.3 Basalt (boulders, cairn)

| Hex | Use |
| --- | --- |
| `#2b2e34` | Basalt body |
| `#454a54` | Basalt mid |
| `#5c626d` | Basalt highlight |

### 3.4 Characters

| Hex | Use |
| --- | --- |
| `#f3cfae` | Skin |
| `#f0a58a` | Cheek blush |
| `#e2673f` / `#b84d2e` | Disguise A coat / coat shade |
| `#3b2a2a` | Disguise A hair |
| `#3f4866` | Disguise A beanie |
| `#2d3140` | Disguise A legs |
| `#4f7fb8` / `#3a6190` | Disguise B coat / coat shade |
| `#6b3f2a` | Disguise B hair |
| `#e9c46a` | Disguise B headband |
| `#3a3f55` | Disguise B legs, NPC legs |
| `#3f6a4a` / `#2f5238` | Sigrún coat / coat shade |
| `#cfd2d8` | Sigrún hair (grey) |

### 3.5 Aliens and ship

| Hex | Use |
| --- | --- |
| `#5fc4b0` / `#3f9d8c` | Student alien body / shade |
| `#9fd8ff` | Student alien eye glint |
| `#9a7bd1` / `#6e55a8` | Professor body / long coat |
| `#d9b8ff` | Professor bun |
| `#ffe9a8` | Professor eye glint |
| `#8a8f99` | Ship hull |
| `#b9bec8` | Ship hull, upper band |
| `#7fd1e8` | Ship dome |
| `#454851` | Ship landing feet |

### 3.6 Trees and wood

| Hex | Use |
| --- | --- |
| `#e9e4d8` | Birch trunk |
| `#555555` | Birch bark marks |
| `#7d9a3a` / `#9ab54a` / `#c9d96a` | Birch canopy dark / mid / light |
| `#6e4b2a` | Brown wood: rowan trunk, willow stem, signpost post |
| `#8a6238` | Rowan trunk highlight |
| `#4f7a3a` / `#6a9a46` / `#8fb85c` | Rowan canopy dark / mid / light |
| `#d9442f` | Rowan berries |
| `#5f7f3f` / `#7f9a50` / `#a9b86a` | Willow canopy dark / mid / light |
| `#b08a5a` | Signpost board |

### 3.7 Rock samples

| Hex | Use |
| --- | --- |
| `#3a3d44` | Basalt sample |
| `#15161c` | Obsidian sample |
| `#b9b4a6` | Pumice sample |
| `#6b6f78` | Speckle marks |
| `#9fb3c8` | Shine marks |
| `#6e6a60` | Hole marks |

## 4. Outline and shadow rules

**Outline**

- One pixel wide, colour `#1a1c20`, around the outside of every character, alien, prop, tree and boulder.
- The outline sits **inside** the canvas. Do not grow the canvas to fit it.
- Interior lines (where an arm meets the body, hair meets the face) use the same colour, one pixel.
- Ground tiles have **no** outline. They must tile seamlessly.
- No coloured or lighter outlines, and no outline thicker than one pixel.

Several placeholders do not have an outline yet (ship, signpost, pickup rocks, sparkle). The finished versions should have one, except the sparkle, which is a light effect and stays without.

**Shadow**

- Characters and aliens: a flat dark strip under the feet, about 8 to 10 px wide and 2 px tall, centred. Black at 28% opacity (`rgba(0,0,0,0.28)`).
- Trees: the same, 16 to 18 px wide and 2 to 3 px tall, black at 25% opacity.
- The shadow is part of the sprite and sits in the bottom rows of the canvas.
- Shadows are flat. No gradients, no blur.
- Boulders use a solid dark base (`#1a1c20`) instead of a transparent shadow.

**Shading**

- Three tones per material at most: base, one highlight, one shade.
- No dithering on characters. Light texture on ground tiles is fine.

## 5. Tiles

One tileset image, **224x16**, 14 tiles in a single row, no margin and no spacing. The tile order must not change, because the map file refers to tiles by position.

| # | Tile | What it is | Walkable |
| --- | --- | --- | --- |
| 1 | Tundra grass | Muted yellow-green grass with a few tufts. The most common ground | Yes |
| 2 | Dry tundra | Paler, drier variant of tile 1, to break up large fields | Yes |
| 3 | Gravel path | Grey-brown gravel with pebbles | Yes |
| 4 | Glacial water | Blue-turquoise deep water with ripples | No |
| 5 | Basalt boulder | Rounded dark boulder, lit from the upper left | No |
| 6 | Mossy boulder | Same boulder with a moss cap | No |
| 7 | Black sand | Near-black sand with grey grains | Yes |
| 8 | Void | Flat `#0b0d14`. Fills space outside the map | Yes (unused in play) |
| 9 | Moss lava A | Dark lava rock with fine moss tufts | Yes |
| 10 | Moss lava B | Denser moss | Yes |
| 11 | Ice | White-blue ice or old snow | Yes |
| 12 | Shallow water | Lighter water for lake edges | Yes |
| 13 | Moss lava C | Third variant | Yes |
| 14 | Moss lava D | Fourth variant | Yes |

Notes for the artist:

- **Seamless.** Every ground tile must tile with itself in both directions, and tiles 1 and 2 must sit next to each other without a visible seam. The same goes for the four moss lava tiles.
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
| Birch | 32x48 | Thin white trunk with dark bark marks, airy yellow-green canopy. Trunk base at bottom centre |
| Rowan | 32x48 | Brown trunk, rounder and darker green canopy, a few red berry clusters. Trunk base at bottom centre |
| Willow bush | 32x32 | Low rounded bush, soft grey-green, a short brown stem at the base |
| Pickup rock | 12x10 | A small rock on the ground with a highlight on top and a dark underside. Three versions: basalt (dark grey, dull), obsidian (black, glassy), pumice (pale grey, holes) |
| Sparkle | 7x7 | A 4-point star: a cross of pale yellow rays with a white 3x3 core. No outline. The game fades and pulses it |
| Rock sketch | 48x40 | A notebook drawing of a rock: an angular blob with an off-white outline. Patterns: speckle (small grey dots), shine (pale streaks with a white glint), holes (many small pits), plain. Shown at 2x in the lab |

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
- [ ] Tileset is 224x16 with tiles in the order in section 5.
- [ ] Character sheets are 128x24 in the order down, up, left, right, each idle then step.
- [ ] Feet are at the bottom centre in every character frame.
- [ ] Tree trunks meet the ground at the bottom centre.

**Outline and shadow**

- [ ] Outline is one pixel, `#1a1c20`, on every sprite and prop.
- [ ] No outline on ground tiles or the sparkle.
- [ ] Shadows are flat, the right opacity, and at the base.
- [ ] No anti-aliasing and no stray semi-transparent pixels.

**Colour and light**

- [ ] Every colour is in the palette in section 3, or has been added to it.
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
