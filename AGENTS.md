# AGENTS.md

Guidance for AI agents working in this repo.

## The game

Collies is a 3D border-collie herding game in one file, `index.html`
(three.js r160 as an ES module from `vendor/three.module.js`, plain
JavaScript, no build step). Up to four dogs, local or online, drive a named
flock along one continuous trail (desert corral → mountain valley →
oceanside → the Promised Land), grazing it, penning it at camps before
nightfall, and fighting off coyote packs till dawn.

It was rebuilt on the `demo-slice/sheep-herding` prototype (the grazing
economy, day/night and one continuous trail), with the best of the older game
ported on top: the sheep's emotional model, rams, the dog's pounce and grab,
push-gates, Hank, the barn and online co-op.

### Running it

- `node tools/serve.mjs` and open http://localhost:8000. Any static server
  works. `file://` usually doesn't, because of the module script.
- `?debug` shows an FPS readout and enables cheat keys (`]` +1 hour, `N` dusk,
  `M` dawn, `K` spawn a coyote, `F` teleport to the final pen).
  `window.GAME` exposes the state and most functions.
- `?sim` stops the render loop so headless tests can call `GAME.step(dt)`
  themselves.
- Online: the title's "Play online" hosts a room (5-letter code, invite link
  `?join=CODE`) or joins one. PeerJS (`vendor/peerjs.min.js`, loaded on
  demand) uses the public 0.peerjs.com for signalling; `?peerserver=host:port`
  points at your own (`npx peer --port 9000 --host 127.0.0.1`).

### Code layout (`index.html`, top to bottom)

`T`, the tuning table where every gameplay number lives, grouped by feature →
audio (`Sound`: WebAudio synthesis, plus Hank's recorded clips) → input →
world gen (trail, 1 m grid, heights, signed distance field, grass) → renderer,
terrain, water and grass tufts → scenery → fences, pens and the bridge →
creature models → particles → game state `G` → SHEEP (the mind and rams) →
DOGS → DOG MOVES & PHYSICS (pounce, grab, things in the air, push-gates, the
river launcher) → FORAGE (plants, buckets, troughs, Hank's twilight run) → NAVIGATION (A*) → COYOTES (packs) → TOMBSTONES → clock and
lighting → camera → visual sync → HUD and overlay → HANK, HANK'S BARN and the
saved flock → game flow → main loop → `window.GAME`.

Sections are delimited by `// ===` headers. The comments marked `SHARED HOOK`
are the seams between systems: `knockDog`, `hitCoyote`, `provokeRam`, `hank`,
`sheepWoolColor`, `s.headM` / `s.bodyM`, `s.air` / `s.heldBy` / `c.heldBy`,
`p.gateT` (0 shut … 1 open, derived from the gate's hinge angle), and `pen.trough` / `troughEat(pen, amt)` (food in hunger units: 1 takes 1.0 off one sheep's hunger; returns what was eaten). Keep
them stable, or update every caller.

### Tests

These are headless Chromium runs through `tools/harness.mjs`. Run the ones
that touch what you changed, and report their numbers.

| script | what it checks |
| --- | --- |
| `node tools/flock-sim.mjs [scenario] [--trials N]` | driving, sprint-scatter, the gate bot, critical mass, cornering, rams, calming, day 1 |
| `node tools/moves-sim.mjs` | punts, caroms, pounce/grab/shake/fling, push-gates, the launcher, swimming, lie-down, the final pen |
| `node tools/forage-sim.mjs` | forage plants, filling and delivering a bucket, Hank's twilight run to the trough, sheep eating from it overnight, regrowth |
| `node tools/night-sim.mjs idle\|guard` | a night in the open with coyote packs, undefended or guarded by a bot dog |
| `node tools/breed-sim.mjs [days] [--trough N] [--set k=v]` | a flock parked at a camp for days: lambs, pasture left near the pen, how far out they graze, starvation |
| `node tools/graze-sim.mjs [--moveon \| --trough N]` | how fast a hungry flock fills up and how far apart grazers stand; a grazed-bare patch (does the flock move on together?); a night at a stocked trough |
| `node tools/lamb-sim.mjs [--hunger H] [--trough N]` | the player's evening: graze by the camp, pen at 19:30, how many are well fed, courted, and lambs at dawn |
| `node tools/gateway-sim.mjs` | driving the flock into a pen and out again through a gate swung in or out: does anyone stall at the gate? |
| `node tools/cluster-sim.mjs [structure\|merge\|corner\|cost] [--trials N]` | how a grazing flock breaks into knots (sizes, share alone, spacing, gaps), calm walking speeds, a loner and a small knot drifting to the big group, sheep getting out of a rock corner, off a river bank and out of the back of a pen, the cost of 60 sheep per step |
| `node tools/hank-test.mjs` | Hank's voice rules and clips, the barn, looks in the world, the saved flock |
| `node tools/net-test.mjs [--shots DIR]` | online co-op with real PeerJS between two or three pages: inputs, the flock, grass, coyotes, Hank, punts, gates, rams, hats, drop and rejoin, errors, bytes per second (`PEERSERVER=host:port` for a local server) |

**Online co-op** (the ONLINE CO-OP section): the host runs the game; guests only
draw it. New state that's drawn needs a line in `NET_TYPES`, a new one-shot
button goes in `NET_EDGES`, and a new feedback function called from game code
(confetti, a popup, a synth sound) needs `name = fxDef('name', name)` at the
end of that section, or friends online never see or hear it. The section header
explains the rest.

Bots are players with `kind: 'bot'`: `readInput` merges `player.bot` into the
input. Inputs are screen-space, so to move along world direction (dx, dz) use
`mx = dx*CAM_R.x + dz*CAM_R.z`, `my = -(dx*CAM_F.x + dz*CAM_F.z)`.

### What makes it work (keep these true)

- **Pressure, not collision.** Each dog has a pressure radius: walk 9 m, creep
  5.5 m, sprint 12 m. Pressure bends toward the dog's direction of travel, so
  walking up behind the flock steers it.
- **Alert momentum and contagion.** After a push, a sheep keeps walking with
  the flock for about 3.5 s. Calm sheep join moving neighbours at 0.88× their
  speed. At 1.0× or more, the flock keeps itself moving forever.
- **Fear, stress and panic.** Fear is instantaneous. Stress is slow,
  contagious (it spreads up at 0.4/s and calms at 0.15/s) and only recovers
  once pressure stops. Panic starts above 0.75 stress.
  - Steady pressure gives a tight ball; sprinting at the flock scatters it.
  - Lying down (or flanking with two dogs) calms the flock about three times
    faster.
- **Hunger vs safety vs flock.** Utility goals with hysteresis: hungry sheep
  linger on good grass and need more fear to move, and scared sheep need more
  hunger to graze.
- **Critical mass.** An open pen pulls calm, fed sheep in, and the pull grows
  with the share already inside.
- **Cornered sheep break out.** Pressed hard but not moving → a warning bleat →
  a burst past the dog.
- **Knots and sheep gravity.** Every 0.5 s the free sheep are clustered into
  knots (single link at 3.6 m, split above 6). Grazers keep their knot loosely
  together and knots keep a gap from each other. Knots within 7 m of each other
  form a group with no pull inside it; a knot off on its own is pulled toward
  each other group by its whole size over the distance (`T.grav*`), and a lone
  sheep heads for the nearest knot. This replaced the old hub/stray regrouping.
- **Sheep find their way.** A calm sheep that's trying to go somewhere but has
  barely moved for 0.7 s (no dog on it) picks reachable open ground and walks
  an A* path there (`startUnstick`). Walking to grass, rejoining, moving on and
  walking into the pen use A* too when the target isn't in line of sight
  (`sheepNav`, at most one search per step, paths cached).
- **Calm but brisk.** Walking to grass, rejoining, moving on and walking to the
  pen go at a brisk walk (`T.calmBrisk` × walk) or a trot when far off or out
  of sight. Grazing itself stays slow.
- **Rams** are stubborn and charge. They target coyotes first, otherwise a dog
  leaning on them. A bark during the windup calls it off. Coyotes never take a
  ram, and lambs need a ram penned with the ewes overnight.
- **Grass** lives on the 2 m vertex grid, uploaded as an R8 texture that both
  the terrain and the tufts sample: that texture is the whole overgrazing
  visual. One in-game hour is 10 real seconds. Staying too long overgrazes the
  camp, which is the "stay vs. move on" tension.
  - Eating is counted per in-game hour (`T.eatPerHour` × `T.foodValue` = 0.25
    hunger an hour on good grass), so it keeps pace with hunger whatever
    `T.hourSec` is. Thin grass crops slower (`T.grazeFull`). A hungry flock
    is half fed in about 3 hours and well fed (under `T.breedHunger`, the
    breeding line the HUD counts) in about 4–5.
  - Grazers keep about 2.5 m apart, graze forward as a loose front, and step
    on from a cropped tuft. When the ground round most of the flock is eaten
    out, the flock picks one heading to better grass and walks on together
    (`grazeScan`), but never while a dog is working it.
  - Regrowth is slow (a cropped patch takes about five days). A parked flock
    ranges further out each day; hunger at dawn creeps up after about six
    days and starvation trickles in, rather than a one-day crash.
  - Regrowth runs in `step()`, so headless tests regrow grass too.
- **Lambs.** A ewe that's well fed (under `T.breedHunger`) any time from 16:00
  is ready for the night and stays ready unless she gets properly hungry
  (`T.readyLose`). Rams court the ready ewes in a shut pen; a courted ewe
  lambs at dawn (`T.lambChance`, better if she fed at the trough) unless
  she's hungrier than `T.lambHunger`, then rests `T.lambRest` days. Test:
  `node tools/lamb-sim.mjs [--hunger H]` (a 13:00 hunger of 0.97 leaves about 8 of
  12 fed at a 19:30 penning: 6–7 courted, about 3 lambs).
- **The trough** (`pen.trough.food`, 1 unit = 1.0 hunger): penned sheep
  hungrier than 0.18 take a place along it (one per metre), and the rest stand
  aside and wait. They feed from late afternoon and wake at night to eat. A
  ewe fed there the night she's courted is likelier to lamb (and twin).
- **Coyote packs** gather out of sight on the far side of the flock and pick
  the loneliest or weakest sheep. A driver, ambushers and a decoy take up
  posts, then strike together. The carrier drags its catch off while the rest
  screen it. Running off the alpha breaks the pack. Closed pens are
  coyote-proof.
- **Nobody dies to physics.** Sheep that land in water swim out. Deaths
  (coyotes, starvation) leave a named tombstone and go on the "Fondly
  remembered" list.

### Gotchas

- Read buttons once per rendered frame, not per physics substep, or one-shot
  actions fire twice at under 60 fps.
- Browsers don't count a gamepad press as a user gesture, so audio can't
  start from a pad alone; the "click for sound" badge stays until it does.
- The scene keeps a fixed number of lights (sun, hemisphere, dog lights,
  campfire lights, Hank's lantern), so shaders never recompile mid-game.
- `DataTexture`s for grass and depth need `unpackAlignment = 1` (odd widths).
- When `index.html`, `vendor/` or the icons change, bump `CACHE` in `sw.js`.

## Demo slices: prototyping an idea from scratch

A **demo slice** is a clean-slate branch for trying one focused idea in
isolation, away from the main game. Nothing from `main` is carried over: the
idea is built from nothing, and later the branch serves as a reference
implementation when the feature is added to the main game.

`template/demo-slice` is the empty starting point. It has `main`'s files
deleted and holds only a template `AGENTS.md` (plus a `CLAUDE.md` that
imports it). Don't build on the template itself, and change it only when the
user asks to.

### Is this a demo slice?

Treat a branch as a demo slice if either is true:

- Its name starts with `demo-slice/` (`demo-slice/sheepdog-ai`), or contains
  `demo-slice` after another prefix (`claude/demo-slice-sheepdog-ai`).
- Its root `AGENTS.md` says it is a demo slice.

If you are on a demo slice, follow **Working in a demo slice** below and
ignore guidance that only applies to the main game.

### When the user asks for one

Start a demo slice **only when the user explicitly asks for a demo slice**
("make a demo slice", "do this as a demo slice"). Every other feature request
goes into the main game on a normal branch from `main`. That includes "try
out", "prototype" or "add" requests, and garbled voice-dictated messages that
might mean "demo". If you're unsure, ask; don't guess. Starting a demo slice
by mistake resets the branch to an empty template and throws away the game.

1. **Branch off the template**, named `demo-slice/<short-idea>`:

   ```bash
   git fetch origin template/demo-slice
   git checkout -b demo-slice/<short-idea> origin/template/demo-slice
   ```

   If your environment only lets you push to a branch it assigned you, point
   that branch at the template instead
   (`git checkout -B <assigned-branch> origin/template/demo-slice`), follow
   the rest of these steps, and tell the user. The branch's `AGENTS.md` still
   marks it as a demo slice.

2. **Fill in `AGENTS.md`**: name the idea in the title and "The idea", and
   delete the "This is the template" note.

3. **Commit and push**, for example `Start demo slice: <idea>`. Then build the
   idea.

If `template/demo-slice` is missing, tell the user. To rebuild it, branch from
`main`, run `git rm -r -q .` without reading anything first, and add back an
`AGENTS.md` (in the shape of the one an existing demo slice has) and a
`CLAUDE.md` containing the single line `@AGENTS.md`.

### Working in a demo slice

- **Build from scratch.** Do not read, copy or restore code from `main` or
  other branches unless the user asks for it.
- **Stay focused** on the one idea. Placeholder art, rough UI and hard-coded
  values are fine. Skip anything the idea doesn't need.
- **Keep it easy to run.** Use a plain static page with `index.html` at the
  root and no build step, like the main game, unless the idea needs more. Put
  run instructions in the branch's `AGENTS.md`.
- **Keep "Notes for porting" current** in the branch's `AGENTS.md`. Record
  what worked, what didn't, key decisions and constants, and what the main
  game will need to change to take the feature.
- **Never merge a demo slice (or the template) into `main`**, and never open
  a PR from one into `main`. Its history deletes the whole game. Features get
  ported by hand.

### Porting a demo slice into the main game

When the user asks to add an idea from a demo slice to the game:

1. Work on a normal branch from `main`, not on the demo slice.
2. Read the demo without checking it out over your work:

   ```bash
   git fetch origin demo-slice/<idea>
   git ls-tree -r --name-only origin/demo-slice/<idea>
   git show origin/demo-slice/<idea>:<path>
   ```

   Start with its `AGENTS.md`, especially "Notes for porting".
3. Re-implement the behavior in the game's existing structure and
   conventions. Port the idea, not the files. Don't merge or cherry-pick
   demo-slice commits.
