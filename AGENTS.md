# AGENTS.md

## Style rule: no words

In-game text: as little as possible. Icons, numbers and tooltips over
sentences. Add text only when it's needed to learn the game. Same for this
file, comments, commits and PRs: short.

## The game

3D border-collie herding, one file `index.html` (three.js r160 from
`vendor/three.module.js`, plain JS, no build). Up to 4 dogs (each a role and a breed,
better with practice), local or online, drive a flock along one trail
(desert → mountains → ocean → Sweetgrass Meadow → Falcon Canyon → desert →
the Trading Post → the Mountain Pass → the yeti → Cold Harbour → the sea → the Promised Land): graze it, pen it at camps by nightfall,
fight off coyotes (they dig under fences: fill the hole), cougars and falcons till dawn. Swim anywhere: a dog spent in the water goes under; Hank swims out in his trunks. Rattlesnakes in the last
desert. A rope on every leg: drag it, or dogs (up to 4, in teams) or Hank play tug of war. Bones dug up stay for good: carry, throw, bonk. Rare wild llama herds (two a journey, tucked away off the trail, land only) breed; drag a rope up to one, win the tug, lead it to the flock: it guards it, spits at predators, Hank shears it. Gear dug up for them (saddle blanket: warm up the pass; a pack: greens and salt to the troughs), dressed in the barn. Through a bog a dog comes out muddy: swim, or jump in a water trough. Left alone, a dog poops (carry it, throw it: Hank's disgusted), pees, chases its tail or naps.
A vagabond trader walks the trail (every land leg; then the first half of the sea in his Laser) selling troughs, medicine and a shovel for wool;
Hank treats the sick and buries the dead. Up the icy pass (a base camp at its foot, an ice gate past it: torch a lane through): cold, blizzards,
fires, torches that melt the snow (grass under it) and the ice, crevasses, goats; the yeti on top, the last fire in an ice cave by him. Beat him: the ice goes from a gap
in the east rim, a road leads down to Cold Harbour. No cut: it's all one land.
The sea (issue #74): herd the flock down the road and up the gangway, cast off; the flock on a boat's deck, sailed island to island to the Promised Land
(wind, sheets, tiller, reefs, anchor), orcas to a kraken on the way. Alongside an island: ashore for flowers, salt, water, buried chests.
A sheep overboard: throw it a life ring, haul it in. The Promised Land: that wins.

### Run

- `node tools/serve.mjs` → http://localhost:8000 (`file://` won't work).
- `?debug`: FPS + dev menu (`` ` `` or click the FPS line; `DEV_STOPS`, `DEV_CHEATS`): the whole journey as a strip, click a
  spot to go there (`devJump(s)` on land, `devSea(i, under)` at sea; the URL keeps it: `?go=m`, `?sea=…`); cheats as buttons. Keys: `]` +1 h, `N` dusk, `B` dawn, `K` coyote, `X` coyotes dig into a pen, `J`
  cougar hunts, `V` falcon, `O` flock +10 days, `F` to the Trading Post, ≥120 🧶 (the vagabond there too; 🎒 button: to him, `GAME.vagGo()`),
  `H` a bite, two wounds, a death and Hank stocked, `L` to the snakes, `U` to Falcon Canyon,
  `T` foot of the pass, `Y` its top (the yeti), `G` a goat comes, `Z` a blizzard, `\` llamas by the dog (again: one a guard, in a blanket and a pack); `I` to sea / on to the next island,
  `1`…`5` under way on that sea leg, `0` Hank trims / full manual, `9` a gale). `window.GAME` exposes
  state and functions.
- `?sea` (alongside at Cold Harbour, all aboard; `?sea=2`: alongside the third island, `?sea=2u` under way from it; `?sea=dock`: the top of the harbour road). `GAME.seaStart({ leg, under, dock, place })`.
- `?sim`: no render loop; tests call `GAME.step(dt)`.
- Journey save: a reload carries on (localStorage `collies.journey`; title ▶, ✖ forgets). Not under `?sim`, `?sea`, `?go`, `?join`. See `docs/ui.md`.
- Build: bottom right of the title (`BUILD`, stamped by `build.js` on deploy,
  else "Dev build"). `build.js` also writes `version.json`; a different live
  build → 🔄 on the title reloads (`checkBuild`).
- Online: PeerJS (`vendor/peerjs.min.js`), room code / `?join=CODE`,
  `?peerserver=host:port` for your own server.
- Mobile: landscape. Touch → floating stick (light push = creep) + 📣 💥 ✊
  💤 ⚡ buttons (`TOUCH`, player `kind: 'touch'`), short `TOUCH_HINTS`,
  rotate prompt in portrait. Compact HUD under 520 px tall (icons, no
  labels). `?touch` forces it.
- Hybrid co-op: both screens can have a sofa. On a guest, a second person
  joins with Ⓐ on another controller and gets their own dog. 4 dogs in all.
- Menus online: each screen pauses on its own (P / Esc / Start, 🏚️ barn, dawn card); the world waits only once every
  screen's in one ("Paused"; till then "Menu", ⏸ / ▶ by each name).
- One keyboard player: WASD and arrows drive the same dog. Left hand: Shift sprint, Q creep, C lie, Space bark, E grab, F jump, R pounce; mouse on the game (`#gl`): hold click grab, right click pounce / shake (`Mouse0` / `Mouse2` in `KB`). Controls bar always up (`ctlBar`).
- Drop a dog: pause → ✕ on its chip (or ←/→ + Ⓧ / Delete; `dropPlayer`).
- Map: minimap bottom left (over the controls bar while it's up; touch: under the flock
  panel); `M` / R3 / tap it → the whole trail, big. At a trader: 📍 its pen.

### Layout (`index.html`, top to bottom)

- registries: `onReset`, `onSync`, `expose`
- `T` (all tuning)
- `Sound`
- `AMB` (ambience)
- input
- world gen
- renderer/terrain/water/grass
- scenery
- fences/pens
- models (DOG BREEDS)
- particles
- `G`
- SHEEP
- DOGS (ROLES & TRAINING, IDLE)
- DOG MOVES & PHYSICS
- FORAGE (DOG PACK)
- WATER
- DIG SPOTS
- BRAMBLES
- BONK SPOTS
- MUDDY DOGS
- RATTLESNAKES
- ROPES (+ TUG OF WAR)
- BONES
- NAVIGATION
- COYOTES (+ BURROWS)
- COUGARS
- FALCON (+ FALCON CANYON)
- MOUNTAIN PASS (cold, fires, blizzards, ice, crevasses, burning, ICE GATE, MELT, TORCHES, GOATS, SNOWBALLS, THE ICE CAVE, YETI, HANK'S NAGS, THE RICKETY WALLS)
- REMAINS & TOMBSTONES (YARDS)
- clock/lighting
- camera
- visual sync (RAM NADS, CARRY SWING, HAIR)
- HUD (ART icons)
- MAP
- HANK
- VET
- RESCUE
- FLOCK LOOKS
- DOG WARDROBE
- BARN
- DAWN REPORT
- saved flock
- JOURNEY SAVE
- VAGABOND (the VENDOR's wares)
- LLAMAS (LLAMA WARDROBE, COLD, PACK)
- SAILING (waves, WIND, the boat, LIFE RINGS, STATIONS, mooring, route, ISLANDS, Hank at sea, HAZARDS, KRAKEN, chase camera, sky, water, drawing, HUD + chart, flow)
- game flow
- `ambMix`
- main loop
- DEV MENU
- `window.GAME`

(`HARB`, `BOAT`, `QUAY`, `inSea`: world gen; the harbour's cut after its draws. `DECK`, `deckKit`: pens. `LAND`: renderer.)

A new feature registers itself in its own section: its reset `onReset`, its drawing `onSync`, its test hooks `expose`, what a reload keeps `onSave`; nothing goes into `resetGame`, the main loop or a `window.GAME` list. Order numbers (see each call): resets 10 sea … 180 balker, 300–420 game flow, 430 Hank; syncs 10 dogs … 240 poop. Lists that stay shared (`EMOJI_ART`, `newStats`, Hank's `…Can` checks, `netKindOf`, CSS selector lists): add a line.

`// SHARED HOOK` comments mark cross-system seams; keep them stable or update every caller:

- `onReset(fn, o)`: a new journey; `resetGame` runs them, lowest `o` first (default 200: after the sea's back, before the flock and dogs)
- `onSync(fn, o)`: every drawn frame; `frame` and `renderOnce` run them, `fn(dt, once)` (default 500: last)
- `expose(() => ({ … }))`: into `window.GAME`, read once loading's done (after the `fxDef` wraps)
- `onSave(key, save, load, o)`: JOURNEY SAVE; `save()` → plain JSON, `load(v)` on a resumed journey, lowest `o` first (`savePlain` / `loadPlain`, `journeyAt` / `journeyPlace`)
- `knockDog`
- `grabPick(d)` (what Ⓧ would take, no side effects; `tryGrab` bites it, the sea overlay marks it)
- `d.mud`/`d.wet` (0…1), `tubStep` (in a water trough: updateDog hands over)
- `hurtDog(d, amt)` (1 = all hp)
- `dogDrown(d)`
- `reviveDog(d, self)`
- `collideWade(e, r)` / `wadeSdfAt`
- `train(d, trait, amt)` (xp)
- `dogK(d, trait)` (role × training multiplier, 1 = as tuned)
- `barkR(d)`
- `hitCoyote`
- `provokeRam`
- `hank`
- `sheepWoolColor`
- `s.headM`/`s.bodyM`
- `s.air`/`s.heldBy`/`c.heldBy`/`d.heldBy`
- `p.gateT` (0 shut…1 open)
- `troughEat(tr, amt)` (1 = 1.0 hunger)
- `troughSet(s)` (0…1: hungry / thirsty with food / water in its pen's troughs; barks don't shift it)
- `lickSalt(pen, amt)`
- `stockTroughs(pen, amt)`
- `fillWater(pen, amt)` / `drinkWater(pen, amt)` (1 = one sheep parched → quenched; return what went in / out)
- `giveHankClippers()` (no-op if he has them)
- `HANK.clippers`
- `s.wool` (0…1)
- `G.wool` (🧶, whole number)
- `kitSet(pen, kind, n)` (`food`/`water`/`salt`: show bought troughs and licks; `kitN`, `kitMax`)
- `snakeBite(s, n)`
- `woundSheep(s)` (uses `s.heldT`, `s.grabBy`)
- `cureSheep(s, cure)`
- `s.venom`/`s.bleed`/`s.infect` (0…1; `…Rate` > 0: getting worse; `s.ail` bits)
- `giveHank(wares, d)`
- `HANK.meds`
- `HANK.shovel`
- `downhill(x, z)` (unit + slope)
- `passUp(x, z)` (the way on up: unit + k 0…1, kb: loath to go back)
- `heatAt(x, z)` (0…1)
- `startSlide(e, 'ice'|'roll', o)`
- `crevOut(e, hop)`
- `s.cold`/`d.cold`/`s.snow` (0…1)
- `s.burn` (s left)
- `hankTumble(vx, vz, vy)`
- `passSheepStep`, `passSheepMove`, `passHeld`, `passAir`, `passDogMove` (where the pass takes over)
- `MELT` / `meltAt(x, z)` / `meltDisc(x, z, r, r0, amt)` (snow melted, 0…1; `meltSet(v, m)` moves `gCap`)
- `torchHeat(x, z)`
- `HEAP` / `HEAP2` / `heapH(x, z)` (in `groundY`)
- `sdfPatch(i0, i1, j0, j1)`
- `inCave(x, z, pad)`
- `waterLevel(x, z)` (the water's top there: flat ashore, the waves at sea)
- `pen.deck` / `pen.lock` (the boat's deck)
- `seaShove({ heel, yaw, surge, sway, ju, jv })`
- `seaOverRail(e, side, out, up, how)`
- `seaStress(s)` / `seaSheepDeck(s, dt)`
- `s.seaHold`
- `s.lure`
- `seaBark(d, k, team)`
- `seaPounce(d)`
- `seaFx(kind, k, x, z, a)`
- `seaCheckpoint(w)` → `SEA.checkpoint`
- `SEA.onSave(w, snap)` (for the save system to come)
- `seaWay()` (is the sea the way on?)
- `harbIce(on)`
- `seaWake()` (the flock's through the gap)
- `seaMoor(i)`
- `seaCastOff()`
- `inSea(x, z)`
- `QUAY` / `ISLE` / `seaGround(x, z)` / `seaH(x, z)` (what there is to stand on out there, and how high)
- `seaFresh(x, z)`
- `LAND` / `seaKeep(obj)` (the land's, or the boat's)
- `ringSheep(s, a, dt)`
- `p.off` / `r.off` / `sp.off` (an island's things while she's not there)
- `sp.chest`
- `e.npc` (HANK, VAG: a man on a rope; `ropeNpc(R)`, `hankTug(R, dt, beat, hk)`, `hankTugEnd(R, won, ax, az, hk)`)
- `VAG.mode` ('land' | 'sea' | 'away'; 'sea': `VAG.seaStep(dt, dtH)` runs him)
- `vagAt(x, z, yaw)`
- `vagHide()`
- `vagLayout(x, z, yaw, tight)` → `{ L: [x, z, yaw(, 1: tight)], ok }`
- `vagPlaceMats(L)`
- `vagTrade(d)`
- `vagRate()` (price ×)
- `vagGood(kind)`
- `vagGrief()`
- `vagReach()` (dogs can get at him: on land, or ashore where she lies)
- `vagSeaStart()` (from `seaStart`)
- `vagBarkAt(d, busy)` (busy: loose sheep / foes the bark reached: not a nag)
- `e.isLlama` (LLAMAS: on a rope it's an `e.npc`; `R.llama`, `ropeNpc(R)`), `llamaNeck(L, out)` (its halter), `launchLlama(L, vx, vz, vy, kind, by)` / `L.air` / `L.heldBy` (as a sheep's), `llamasAboard()`
- `L.wear` (`{ hat, tint, acc }`, `llamaHas(L, id)`), `llamaSet(L, ch)` (LLAMA WARDROBE: a guest's goes to the host as `ll`), `L.greens` / `L.salt` (its pack), `L.cold` (0…1)

### Tests (headless Chromium via `tools/harness.mjs`)

`node tools/test.mjs`: the tests for your change (diffed against origin/main), several at a time, a line each; report its last line.
`--why` (what, why), `name[:arg]`, `--all`, `--list` (each test, its args, what it checks: its header comment). CI runs them all on every PR (`.github/workflows/tests.yml`): keep main green.
Seeded (`SEED=n` / `SEED=random`: other dice), offline. `-sim`s print numbers and `ok` checks on the default run (as tuned; none with `--set` / variants).
Nightly (`.github/workflows/nightly.yml`): all tests on a new SEED each night (printed); again: `SEED=n node tools/test.mjs NAME`.
New `index.html` section → its line in `SECTIONS` (`tools/test.mjs`).
After merging main: clean, or conflicts only in docs (AGENTS.md, `docs/`, sw.js): push, CI runs them all. Code conflicts resolved: `node tools/test.mjs --merge` (only lines unlike both parents; `--merge C` for another merge).
New test → its header comment: how to run it, what it checks.
All are `node tools/<script>`.

### Online co-op

Host simulates, guests draw. New drawn state → `NET_TYPES`; new one-shot
button → `NET_EDGES`; new feedback fn (fx, popup, sound) → `name =
fxDef('name', name)` at the end of ONLINE CO-OP. A seat is one guest browser;
`s.subs` has one `{player, held, edges}` per person on that screen (`p.seat`,
`p.sub`; `p` in `i`/`e` messages).

Bots: players with `kind: 'bot'`, `player.bot` merged into input. Inputs are
screen-space: `mx = dx*CAM_R.x + dz*CAM_R.z`, `my = -(dx*CAM_F.x + dz*CAM_F.z)`.
At sea each screen's camera turns on its own: a guest's input carries its camera's heading (`cy`), the host
turns the stick into its own (`netReadInput`).

### Keep these true

- **Pressure, not collision.** Radius: walk 9, creep 5.5, sprint 12 m, bent
  toward the dog's heading.
- **Penned sheep ignore dogs outside the pen** (no press, no bump, no
  stress) unless one barks; a dog or predator inside: as normal.
- **Momentum and contagion.** Pushed sheep walk on ~3.5 s; calm sheep join
  movers at 0.88× (≥1.0 = runaway).
- **Fear / stress / panic.** Stress spreads 0.4/s, calms 0.15/s, panic >0.75.
  Steady pressure → tight ball; sprinting scatters; lying down calms 3×.
- **Utility goals with hysteresis** (hunger vs safety vs flock).
- **Critical mass.** Open pens pull calm, fed sheep, more as more are in;
  trough food pulls hungry ones (`T.penTroughPull`).
- **Homeward.** From 13:00 to night (`homeK`, `T.penHome`) the pen pull
  reaches further, beats stress, and a bark bends flight toward the gate.
- **Morning rush.** Gate opened dawn–13:00 (or open at 06:00): for
  `T.morningRush.dur` s every penned sheep trots out (`penRush`, `rushOut`);
  then till 13:00 no pen pull, nobody goes back in (`morningOut`). Trough food
  and water beat both: hungry/thirsty penned sheep eat or drink first, ones
  outside come in for it any time of day (`T.troughDraw`), barely while a dog
  works them (`pushed`). Hungry ones set on a trough eat through barks (`troughSet`, `T.hungry`).
- **Round the pen.** `penTarget` leads stragglers round the fence and the open
  leaf's free end; pressed ones slide along, not into it. Lambs follow a
  penned mum in.
- **Ajar gates.** Unlatched and a crack open (`penAjar`): pens pull as if open; a sheep wanting in (`s.ppPen`) or driven at
  it shoulders it wider (`sheepNudgesGate`, `T.gate.sheep`).
- **Carrying.** A held sheep passes an open gateway (`mouthOf`), not a shut
  gate or a fence.
- **Cornered sheep break out** past the dog after a warning bleat.
- **Knots.** Every 0.5 s sheep cluster (link 3.6 m); lone knots are pulled to
  groups (`T.grav*`).
- **Sheep path-find** with A* when stuck or target out of sight (`startUnstick`,
  `sheepNav`, ≤1 search/step).
- **Calm but brisk** (`T.calmBrisk`); grazing stays slow.
- **Rams** charge coyotes, then leaning dogs; bark cancels; punted → dazed +
  grudge. Lambs need a ram penned overnight.
- **Grass** on the 2 m grid as an R8 texture (terrain + tufts). 1 h = 13 s by day, 18 s at night (`hourLen`).
  0.5 hunger/h on good grass; calm walkers snatch bites (`T.moveGraze`). Flock moves on together when eaten out
  (`grazeScan`), never while worked. Regrowth ~5 days, runs in `step()`.
- **Nobody dies to physics.** Deaths leave a named body (`G.graves`, `g.stone`
  false) that rots into a tombstone over `T.remains.rotDays` (`updateRemains`).

### Systems (`docs/`)

One file a system: what it keeps true, its names. Read the one you're changing.
A change to a system updates its file (a new system: a new file + its line here).

- `docs/sheep.md`: lambs, age, forage, trough mayhem, shoves, grass dash, poop, lost sheep, shared stores, salt, water, ram bravery, ram nads.
- `docs/dogs.md`: roles, training, idle, muddy dogs, dog health, grab, bones, punts, flights, grabbing a dog, jump.
- `docs/dog-looks.md`: anything drawn on a dog: the pack, wearables, breeds, mouth loads swing, fur, hair.
- `docs/predators.md`: coyotes (packs, trapped, burrows, den defence, fences), cougars, falcon, Falcon Canyon, barks wearing off, team bark, rattlesnakes.
- `docs/hank.md`: round pens, what he sees, shearing, rescue, wounds, vet, burial.
- `docs/land.md`: dig spots, brambles, bonk spots (cast, mud, balker, apples).
- `docs/water.md`: streams, the river, open water, swimming, sand, the launcher chute.
- `docs/ropes.md`: ropes, tug of war, Hank's tug.
- `docs/ui.md`: map, menus, barn, dawn report, end screen.
- `docs/ambience.md`: the sound of each leg (`AMB`, `ambMix`).
- `docs/vagabond.md`: the vagabond (trading, mood, at sea), the Trading Post.
- `docs/llamas.md`: wild herds, population, capture (rope, tug), guards and their spit, bonk and grab, shearing, gear (wardrobe, barn), cold, packs.
- `docs/pass.md`: the mountain pass: cold, fires, Up, base camp, ice gate, torches, melt, snow, ice, crevasses, goats, burning, ice cave, yeti, nags, walls, scenery.
- `docs/sailing.md`: Cold Harbour and the sea: online, the boat, camera, waves, wind, sail, stations, overboard, rings, anchor, route, islands, hazards, kraken, the Laser, HUD.

### Icons

Our own, no emoji: `ART` (32×32 SVG paths, sticker outline; helpers `ART_H`). Write the emoji
as usual: every 2D canvas's `fillText` / `strokeText` / `measureText` draws its icon instead, and
a DOM observer swaps it into any text (`artDOM`; the emoji stays hidden inside, so `textContent`
reads the same). Not in tooltips (`title`): use words. New emoji → an `ART` icon + `EMOJI_ART`.
Plain symbols stay text (→ ✔ ✖ ★ ♥ Ⓐ).

### Gotchas

- Read buttons once per frame, not per substep. Pad presses: `padEdge` (sampled at the frame's start, `padFrame`); never re-read the pad at the frame's end to mark presses seen.
- Gamepad presses don't unlock audio.
- Sound params that move: ease them (`setTargetAtTime`), never `.value =` every frame (zipper buzz).
- Fixed light count, so shaders never recompile.
- Grass/depth `DataTexture`s need `unpackAlignment = 1`.
- Every three.js geometry, material or object made takes a `Math.random()` (its uuid): a feature that's off in `?sim` makes its own lazily (first use), so seeded runs keep their dice (LLAMAS: `spitGeo`, `llamaHalterGeo`, `llamaGear`; MUDDY DOGS: `paws`, coat copies, flies).
- `CACHE` in `sw.js`: `build.js` names it from a hash of the site. Never bump it by hand.
- World gen must not see the sea or the harbour (`SEA_LIVE`, `HARB.mask` come after its draws): else the whole world moves. Nor the base
  camp (pushed onto `PASS.fires` after them), nor the ice cave (the top fire moved in at the end of the pass scenery), nor the door
  (`doorStamp`), nor `MELT` (all 0 then). It still sees the old stalls (`STALLS`: flattened, stamped; freed by `vagStall`).
- Anything in `scene` goes off with the land at cast-off unless it's the boat's (`seaKeep`: the vagabond, his bed and mats are) or lies aboard.
  Far off the boat under way, draw in `seaG` (sea coords): the world's frame heels with her.

## Demo slices

A clean-slate branch for one idea, built from nothing, later ported by hand.

- Only when the user explicitly says "demo slice". Otherwise work on a normal
  branch from `main`. Unsure → ask (a mistake wipes the game from the branch).
- Start: `git fetch origin template/demo-slice && git checkout -b
  demo-slice/<idea> origin/template/demo-slice` (or `-B <assigned-branch>`).
  Fill in its `AGENTS.md`, commit, push.
- A branch is a demo slice if its name contains `demo-slice` or its
  `AGENTS.md` says so. There: build from scratch, stay focused, plain static
  `index.html`, keep "Notes for porting" current.
- Template missing → tell the user. Rebuild: branch from `main`, `git rm -r
  -q .`, add a template `AGENTS.md` and a `CLAUDE.md` of `@AGENTS.md`.
- **Never merge a demo slice or the template into `main`.**
- Porting: normal branch from `main`; read with `git show
  origin/demo-slice/<idea>:<path>` (start with "Notes for porting");
  re-implement, don't cherry-pick.
