# AGENTS.md

## Style rule: no words

In-game text: as little as possible. Icons, numbers and tooltips over
sentences. Add text only when it's needed to learn the game. Same for this
file, comments, commits and PRs: short.

## The game

3D border-collie herding, one file `index.html` (three.js r160 from
`vendor/three.module.js`, plain JS, no build). Up to 4 dogs (each a breed,
better with practice), local or online, drive a flock along one trail
(desert → mountains → ocean → the Promised Land → Falcon Canyon → desert →
the Trading Post): graze it, pen it at camps by nightfall,
fight off coyotes, cougars and falcons till dawn. Rattlesnakes in the last
desert. A rope on every leg: drag it, or two dogs play tug of war. Bones dug up stay for good: carry, throw, bonk.
Traders on every leg sell troughs, medicine and a shovel for wool;
Hank treats the sick and buries the dead; the Trading Post also sells Cabo
🏖️, which wins.

### Run

- `node tools/serve.mjs` → http://localhost:8000 (`file://` won't work).
- `?debug`: FPS + cheats (`]` +1 h, `N` dusk, `M` dawn, `K` coyote, `J`
  cougar hunts, `V` falcon, `O` flock +10 days, `F` to the Trading Post, ≥120 🧶,
  `H` a bite, two wounds, a death and Hank stocked, `L` to the snakes, `U` to Falcon Canyon). `window.GAME` exposes
  state and functions.
- `?sim`: no render loop; tests call `GAME.step(dt)`.
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
- One keyboard player: WASD and arrows drive the same dog.
- Drop a dog: pause → ✕ on its chip (or ←/→ + Ⓧ / Delete; `dropPlayer`).

### Layout (`index.html`, top to bottom)

`T` (all tuning) → `Sound` → input → world gen → renderer/terrain/water/grass
→ scenery → fences/pens → models → particles → `G` → SHEEP → DOGS (BREEDS & TRAINING) →
DOG MOVES & PHYSICS → FORAGE → WATER → DIG SPOTS → BRAMBLES → BONK SPOTS → RATTLESNAKES → ROPES (+ TUG OF WAR) → BONES → NAVIGATION → COYOTES → COUGARS → FALCON (+ FALCON CANYON) →
REMAINS & TOMBSTONES (YARDS) → clock/lighting → camera → visual sync (RAM NADS, CARRY SWING) → HUD (ART icons) → HANK, VET, FLOCK LOOKS,
DOG WARDROBE, BARN, DAWN REPORT, saved flock → VENDOR → game flow → main loop → `window.GAME`.

`// SHARED HOOK` comments mark cross-system seams; keep them stable or update
every caller: `knockDog`, `hurtDog(d, amt)` (1 = all hp), `train(d, trait, amt)` (xp),
`dogK(d, trait)` (breed × training multiplier, 1 = as tuned), `barkR(d)`, `hitCoyote`, `provokeRam`, `hank`, `sheepWoolColor`,
`s.headM`/`s.bodyM`, `s.air`/`s.heldBy`/`c.heldBy`/`d.heldBy`, `p.gateT` (0 shut…1
open), `troughEat(tr, amt)` (1 = 1.0 hunger), `lickSalt(pen, amt)`, `stockTroughs(pen, amt)`,
`fillWater(pen, amt)` / `drinkWater(pen, amt)` (1 = one sheep parched →
quenched; return what went in / out), `giveHankClippers()` (no-op if he has
them), `HANK.clippers`, `s.wool` (0…1), `G.wool` (🧶, whole number),
`kitSet(pen, kind, n)` (`food`/`water`/`salt`: show bought troughs and licks; `kitN`, `kitMax`),
`snakeBite(s, n)`, `woundSheep(s)` (uses `s.heldT`, `s.grabBy`), `cureSheep(s, cure)`, `s.venom`/`s.bleed`/`s.infect`
(0…1; `…Rate` > 0: getting worse; `s.ail` bits), `giveHank(wares, d)`, `HANK.meds`, `HANK.shovel`.

### Tests (headless Chromium via `tools/harness.mjs`)

Run the ones touching your change; report the numbers.

| script | checks |
| --- | --- |
| `flock-sim.mjs [scenario] [--trials N]` | driving, scatter, gate bot, critical mass, rams, calming |
| `moves-sim.mjs [name]` | punts (sheep, dogs: `dogPunt`), dog grab/fling/wriggle + same flight as a sheep (`dogGrab`), jump/vault (`jump`), pounce/grab/fling, carrying through a gate, gates, launcher, chute funnel (`launcherFunnel`), river (`river`), final pen (no finish) |
| `forage-sim.mjs` | plants, salt, carrying, troughs, licks, regrowth |
| `water-test.mjs` | buckets: pick up, fill, tip, set down, slosh; drinking, shoving, thirst deaths, `fillWater` |
| `bone-test.mjs` | bones: dug up (kept on a new journey), carried free, thrown (running: further), at rest; hits: Δv = J/m (lighter flies, bounces back off heavy), reactions; not its thrower, pounce kick, caught, saved |
| `rope-test.mjs [layout\|drag\|taps\|sheep\|tug\|even\|tired\|reset]` | ropes: one a leg, drag (links hold, no stamina), Ⓧ taps (drop, shake, buffered bite, Ⓑ no shake), tug of war (won over the line, even holds, out of stamina loses), reset |
| `night-sim.mjs idle\|guard` | a night with coyotes, unguarded or guarded |
| `cougar-sim.mjs [day\|hunt\|rescue\|penned\|penguard]` | cougar behaviour |
| `falcon-test.mjs [eat\|bark\|nest\|dog\|dogbark\|night\|odds]` | falcon: nest kills, bark drops, dog carried, its dog barks it off, day only |
| `canyon-test.mjs [layout\|eat\|bark\|shy\|dog\|limits]` | Falcon Canyon: where, narrow, pillars, bones, a way through; swoop + eat on a pillar, bark drops, bark keeps them perched, dog carried, maxAir, day only, gorge only, reset |
| `den-defend-test.mjs` | startled den: defends, stays leashed, sleeps again |
| `team-test.mjs [rules\|coyote\|pack\|cougar\|maul\|falcon]` | team bark: together/late/far/hoarse, wise coyote, 4 dogs break a pack, cougar drops its catch / lets a dog go, falcon drops from further |
| `maul-test.mjs` | dog health: maulings, mashing free, KO, nips, barks wearing off, bonking a fleeing cougar |
| `breed-sim.mjs [days]` | flock parked for days: lambs, pasture, starvation |
| `graze-sim.mjs [--moveon\|--trough N]` | fill rate, spacing, moving on |
| `crowd-sim.mjs [graze\|trough\|day] [--n N] [--at S] [--bare R]` | big flocks: middle vs edge grazing, a crowded trough night, a day at camp |
| `lamb-sim.mjs [--hunger H]` | evening penning → lambs at dawn |
| `gateway-sim.mjs` | stalls at gates |
| `straggler-sim.mjs [--trials N]` | stragglers behind the pen / the open leaf get in |
| `morning-sim.mjs [--trials N]` | penned flock leaves at dawn and stays out |
| `rush-test.mjs` | morning rush out of the pen; carrying a sheep in/out through an open gate |
| `cluster-sim.mjs [structure\|merge\|lost\|shove\|corner\|cost]` | knots, regrouping, lost sheep, grass shoves, unsticking, cost |
| `age-sim.mjs` | ageing and old-age deaths |
| `hank-test.mjs` | Hank, barn, saved flock |
| `dig-test.mjs` | dig spots, dog wardrobe |
| `vendor-test.mjs` | traders on every leg, 📍 pen pick, troughs added to the max then batches, fit, sheep use them, reset; too poor, full pen, Cabo wins, old finish gone |
| `vet-test.mjs` | snakes (placement, rattle, strike, bark/pounce), venom and wounds (slowing, death times), 💉 🩹 💊 🪏 straight to Hank, treating (in a pen too), bodies rotting to stones, cemeteries built on the first burial, burial + last words, reset |
| `shear-test.mjs` | clippers spot, dug up → Hank's, shearing (shut gate; not open, not asleep), 🧶, regrowth, looks, save |
| `bramble-test.mjs` | brambles: placement, snag, held, grab fails, pounce frees, calm sheep go round |
| `bonk-test.mjs [world\|cast\|mud\|balk\|apple]` | streams (walkable, wet, lush banks), cast sheep, bogs, the balking lead ewe, apple trees |
| `pen-trap-test.mjs` | coyote shut in a pen mauls sheep after sheep, dog saves; open gate → dragged out; ram bravery, lambs inherit |
| `nads-test.mjs` | ram nads: size by bravery, rest, swing/lag/damping, legs, flips, dt spikes, tucking, barn |
| `input-test.mjs` | Ⓐ on slow frames: quick taps between frames, held = one bark, early press waits out the cooldown (`padPoll`, `T.barkBuf`) |
| `net-test.mjs` | online co-op (`PEERSERVER=host:port`) |
| `hybrid-test.mjs` | 2 players on the host's screen + 2 on a guest's |
| `breed-test.mjs` | breeds: ★ totals, title pick (←/→ eaten, saved), a friend's pick, every trait's effect; training: xp sources, levels, cap, Header 1.5×, breed swap keeps it, reset; barn card; net `brd` |

All are `node tools/<script>`.

### Online co-op

Host simulates, guests draw. New drawn state → `NET_TYPES`; new one-shot
button → `NET_EDGES`; new feedback fn (fx, popup, sound) → `name =
fxDef('name', name)` at the end of ONLINE CO-OP. A seat is one guest browser;
`s.subs` has one `{player, held, edges}` per person on that screen (`p.seat`,
`p.sub`; `p` in `i`/`e` messages).

Bots: players with `kind: 'bot'`, `player.bot` merged into input. Inputs are
screen-space: `mx = dx*CAM_R.x + dz*CAM_R.z`, `my = -(dx*CAM_F.x + dz*CAM_F.z)`.

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
  works them (`pushed`).
- **Round the pen.** `penTarget` leads stragglers round the fence and the open
  leaf's free end; pressed ones slide along, not into it. Lambs follow a
  penned mum in.
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
- **Grass** on the 2 m grid as an R8 texture (terrain + tufts). 1 h = 13 s by day, 12 s at night (`hourLen`).
  0.4 hunger/h on good grass; calm walkers snatch bites (`T.moveGraze`). Flock moves on together when eaten out
  (`grazeScan`), never while worked. Regrowth ~5 days, runs in `step()`.
- **Lambs.** Ewes under `T.breedHunger` from 16:00, courted in a shut pen,
  lamb at dawn (`T.lambChance`). A ram over `T.readyLose` eats before he courts.
- **Age** (`s.age` days, `ageAtDawn`, `oldK(s)` from `T.oldDays`); dies of age
  at dawn past `s.life`.
- **Forage.** Run over plants to carry (`T.forage.carryCap`), walk to a trough
  to tip in. The fence by the troughs can't be hopped (`byTrough`); tip over it.
- **Trough mayhem.** Penned sheep eat/lick till full; no place → shove the
  weakest (`shoveStr`: small, old, lambs lose; rams win) off it (`barge`, `T.shove`).
  Needier shoves harder (`desp`); not one just arrived (`hold`); nearer beats one
  still on its way (`beatsTo`). All hungry ones crowd in behind, hungriest
  shoulder to the front (`heft`); non-feeders keep off the feeding line; feeders
  stand shoulder to shoulder (`side`). Night fast-forward waits for supper.
- **Hungry shove on grass.** A hungry grazer barges a fuller one off better
  grass next to it, harder the hungrier (`grassShove`, `T.grassShove`).
- **Grass dash.** Hungry and boxed in on stubble (`T.grassDash`) → runs to the
  best green patch near a flockmate, not by a den or brambles, shouldering
  through (`grassDash`, `heft`). Hungry on good grass: less flock pull (`stay`),
  lets a calm drift go by (`tuck`), food beats flock (`want`).
- **Lost sheep panic.** No flockmate within `T.lonely.far` (fences don't
  count) → `s.anx` builds: stress, wants its flock, trots back bleating, to the
  main flock however far.
- **Salt** (`s.salt`) runs down slowly (~8 days); out too long = death. Camp
  licks start stocked (`campStock`); sheep lick rocks in passing; lumps go to
  the pen's lick.
- **Water** (`s.thirst` 0…1, `T.water`): rises daily; parched too long =
  death. Each pen: a water trough (`pen.water`) and a bucket (`BUCKETS`). Grab
  a bucket to carry it (one per dog, mouth full); tap again: set down
  (`dropBucket`); quick taps slosh some out (`bucketSlosh`). A lying one gets shoved by dogs running into it, flies (spilling)
  when pounced (`bucketPhysics`, `T.water.kick`). Wade/swim to fill, walk up to any water trough to tip in.
  Penned thirsty sheep drink;
  a few crowd behind and barge (`T.water.hold`, `crowd`). First camp starts full.
- **Coyote packs** flank and strike together; chase off the alpha to break
  them. Shut pens stop them.
- **Trapped coyote.** A catch in a pen goes out by the gateway (`c.fromPen`);
  gate shut (`c.trap`) → it mauls a penned sheep where it stands
  (`coyoteMaul`, `s.maulHp`, `T.coyoteMaul`) till a dog scares it off, then
  runs down the next (`penHavoc`), dodging dogs, till the gate opens.
- **Ram bravery** (`s.brave` 0…1, `T.brave`): under `ramMin` a ram never
  fights, braver ones charge more and further, past `cougar` cougars too.
  Lambs take mostly the sire's (`sireBrave`). Scales everyone's stress gain.
- **Den defence.** A dog or sheep startling a sleeping den (`defendDen`,
  `T.denDefend`): the pack nips dogs and snaps sheep away, only within `r` of
  the mouth (leash), then goes back to sleep.
- **Cougars** (`COUGARS`, `LAIRS`, `T.cougar`): night only, nearest one hunts
  every night (held up only by a dog barking under its tree, `treedR`), lambs first,
  never rams; pounce or bump drops the sheep; vaults pen fences. Pounce one
  running away: bonked, yowls (`Sound.yowl`), runs `bonkRun`× faster. `s.grabbed`
  may be a cougar (`k.isCougar`).
- **Falcon** (`FALCON`, `NESTS`, `T.falcon`): day only, every few hours circles
  (shadow), screeches, dives. A dog: carried a way, dropped (`d.air.kind
  'falcon'`). A sheep (never rams): `s.grabbed` = falcon, carried to the nearest
  nest spire, eaten after `eatT`. A bark under it, or at the spire, drops it; its mark barking sends it off.
  Off in `?sim` (`T.falcon.on`).
- **Falcon Canyon** (`CANYON`, `T.canyon`, `canyonK`, own rng): a narrow red gorge (`s0`…`s1`)
  between the Promised Land and the snakes; the only way on. Bones and feathers at its mouth, a ram's
  skull on a stake each side, gloom (`GLOOM`, `CANYON.k`), moaning wind. `FALCONS[1…]` sit on rock
  pillars (`F.home`, `CANYON.perches`, ids 100+); more watch from the cliffs (decor). By day, while
  anything's in it (`updateCanyon`), one swoops every `every` s (`maxAir` at once) from the nearest rested
  pillar within `reach`: carried to its pillar, eaten (body at its foot). A bark near a perched one: it
  stays put `shy` s. Off in `?sim`. Nothing else goes in it (dens, nests, plants, salt, brambles, apple trees, streams, bogs).
- **Hank never leans on a wall.** Blocked short of his spot he stands easy
  (`hk.easeAt`); far off, a hop and a sidestep (`hk.sideT`).
- **Hank calls out only what he sees** (`hankSees`). Night at the campfire he
  sleeps on a mat (`hankNap`, silent); a predator within `T.hankNap.wakeR` wakes
  him shouting.
- **Shearing** (`T.shear`): Hank's clippers are always in one dig spot between
  the first two camps (`CLIP_DIG`); dug up, they're his. Awake, no predator near, he climbs into a
  shut pen (`hankCross`) and shears the woolliest (`s.wool` ≥ `min`) one at a
  time on its rump (`s.state 'shear'`): `G.wool` += yield × size². Wool regrows over `regrowDays`, saved with the flock.
- **Barn**: Sheep and Dogs tabs; icon chips, no paragraphs. Host only; guests watch it read only (`BARN.watch`, `NET_TYPES.game.barn`).
- **Dawn report** (`DAWN`, `dawnReport`, after `lambsAtDawn`): lambs born (rename, 🎲, ✏️ → barn) and
  a eulogy per sheep lost since last dawn (`eulogy`, by `s.brave`). Host only (guests: read only, `NET_TYPES.game.dawn`), world waits; `?sim` only
  fills `G.dawnReport`. Eulogies are seeded (name, day, cause): same everywhere.
- **End screen** (`finishGame`): ★ score (🐑 there vs start), 🐣 🛟 🕯️ ☀️ chips,
  an obituary for every sheep lost this journey (`endObit`, `G.lost`).
- **Dig spots** (own rng, synced): finds go on the dog, saved in
  `localStorage['collies.dogs.v1']`. Some junk is a bone (`T.dig.bone`, `digBone`): BONES.
- **Breeds** (`BREEDS`, `T.breeds`, `T.traits`): 📣 bark (reach, scare), 💥 bonk (punts,
  predator hits), ⤴ jump (height, air time), ⚡ speed, 💨 stamina, 🛡 grit (damage, heal, KO,
  mashing free), ✊ grip (hold cost, drag speed, flings, shakes). ★ 1…3 each, 14 in all; ★★ =
  as tuned. Header (all ★★, learns `learn`×), Huntaway, Heeler, Outrunner, Backer; body size
  per breed. P1 picks on the title (chips, ←/→ / A/D / D-pad, eaten before join), anyone in the
  barn's Dogs tab (R3); kept per slot in `DOGS.looks[slot].breed`; `T.breedDef` per slot (all
  Headers in `?sim`). Online: a guest's title pick goes to the host (`hi.br`, `b`).
- **Training** (`T.train`, `G.train[slot|breed]`, `trainRec`): doing it earns xp in that trait
  (barks that reach something, bonks that hit, jumps on the move `jumpGap` apart, m sprinted,
  stamina spent, hp lost, s holding); levels at `lv` (max 5), each × (1 + `per`); ⬆ over the dog
  (`trainFx`). One journey: `resetGame` clears it; swap breed and back keeps it. Off in `?sim`
  (`T.train.on`). Guests get `d.breed` + levels (`brd`, `netDogBreed`).
- **Dog health** (`d.hp`, `T.dogHp`): heals after a few s unhurt (faster lying
  down); at 0 knocked out a while, never dies. Cougar close (`maulR`, or bumped
  while dragging) leaps on the dog: a swipe/bite every `maul.every` s up to
  `maul.max`; mash pounce to throw it off, or a partner pounces it. Coyotes nip
  (`T.nip`) when bold, screening or striking.
- **Barks wear off**: each coyote/cougar falls for `T.barkWise` barks a night
  (a lone coyote: `T.coyoteBark.soloWise`), then turns bold (`barkWorks`): only
  a bonk moves it, and it lunges at dogs to nip. Packs lose less heart per bark
  (`packK`).
- **Traders** (`STALLS`, `T.vendor`): a stall `before` m short of each camp
  past the first, plus the Trading Post's (`MARKET`); a second row of mats
  (`row2`) for the vet's wares. A dog on a mat barks
  (`vendorBark`, host) to buy with `G.wool`. 📍 picks the pen (found ones,
  `G.visited`; default the furthest; `st.sel`). 🌾 💧 🧂: one more trough /
  water trough / lick in it, stocked (`kitSet`), up to `T.vendor.max` × R/9
  (slots prebuilt along the fence), then batches. Water and salt: one pool per
  pen (`p.water.at`, `p.lick.at`). New journey: back to base (`kitReset`).
  A dog stepping on a mat: the ware hops, its name plate pops up (`WARE_KINDS`
  `name`/`more`/`sub`, `drawWarePop`), each screen on its own.
- **Trading Post** (`FINAL`, `finalPen`, `MARKET`, `WARES`): the end of the
  trail, desert, no water. ✂️ free while Hank has none. Too poor or no room: ✖,
  nothing spent (`vendorFx`). 🏖️ Cabo = base + per sheep penned there, bark
  twice: those go, `finishGame(n)`. Only Cabo wins; a shut final pen doesn't.
- **Brambles** (`BRAMBLES`, `T.bramble`, own rng): patches off the trail. A
  sheep blundering in (more when running) is snagged (`s.snag`, `snagSheep`),
  stuck and bleating; only a pounce frees it (`punt` → `unsnag`), not a grab.
  Calm sheep steer round. Off in `?sim` (`T.bramble.on`).
- **Bonk spots** (BONK SPOTS): a pounce is the fix. A rescue bonk (cast, bog,
  brambles) lands calm (`a.rescue`), no scatter.
  - **Cast** (`T.cast`): a sheep in full fleece now and then rolls onto its
    back by day (state `'cast'`, legs kicking, a "!" over it, off screen too).
    Only a pounce rights it (`castFlip`); left `die` h it dies (`'cast'`).
    Shearing stops it.
  - **Mud** (`MUDS`, `T.mud`): bogs in the Promised Land. Sheep slow, may
    stick (`s.bog`, sinking), calm ones go round; a pounce pops it out over
    the nearest edge, muddy a while (`s.mud`). Dogs wade slow.
  - **Balker** (`T.balk`): of an evening (day 2 on) the bell ewe may plant
    herself in front of an open gate (`s.balk`, `p.balker`); pressure and
    grabs don't move her, the rest hang back. Bonked in: they follow
    (`p.leadT`).
  - **Apples** (`APPLE_TREES`, `APPLES`, `T.apple`): a pounce into the trunk
    (or a flying sheep) shakes some down; hungry sheep go for one before grass
    (state `'apple'`). They grow back.
- **Streams** (`STREAMS`, `T.stream`): narrow, shallow, from the hills to the
  lake; walkable (slow), wet (`wetAt`: buckets fill, sheep sip). Grass by
  streams and the river is lusher (cap up to 1.45).
- **River, no bridge** (`RIVER`, `inRiver`): dogs walk in and swim (`startSwim`,
  `collideDog` / `SWIM_SDF`; drops what they hold), Hank wades. Sheep can't: a
  splashed one swims back to its own bank (`a.side`). Only the launcher takes them over.
- **Launcher chute** (`T.launcher.funnel`, `inChute`): long wings; driven sheep bend
  for the mouth, slide round a wing's tip, walk on to the low end. In the chute: no breakouts.
- **Mouth loads swing** (CARRY SWING, `carrySwing`, `d.cw`, `T.carrySwing`, drawing only): anything in a
  dog's mouth (bucket, sheep, coyote, dog) hangs from its jaws on a pendulum: lags starts, stops, turns and hops,
  clonks off the chest (head jolts, tin tonk), kicks, sloshes. Cute and comical. New mouth load → turn it by `d.cw`.
- **Ram nads** (`s.nads`, `T.nads`, drawing only): a cord and a pair on springs,
  stepped in world space (`nadsStep`); belly, hind legs, ground and each other
  collide. Size by `s.brave` (`nadsK`). Cold, wet, scared, charging: tucked;
  desert sun, age: lower (`nadsHang`).
- **Grab by taps** (Ⓧ / R / , / ✊, `grabPress`, `T.grabTap`, `inp.grabTap`): a tap bites (a press up to `buf` s
  early still does: `d.grabBuf`); with something in its mouth one tap lets go `win` s later (running: a fling), a
  quicker next tap shakes it instead (`shakeHold`). Ⓑ only pounces (a held gate: let go first). Bots holding `grab`:
  each press once.
- **Ropes** (`ROPES`, `T.rope`, own rng): one coiled off the trail on each leg, none in Falcon Canyon. Bitten
  anywhere (`ropeGrip`, `d.ropeI`), dragged: Verlet nodes (`ropeSim`), links solved outward from the grips, a little
  stiff, sliding friction, dogs and sheep kick it. Carrying it costs no stamina. Quick taps: a wave (`ropeShake`).
  Drawn as a twisted tube through the nodes (`syncRopes`); online: `NET_TYPES.rope` (`pts`, `tug`).
- **Tug of war** (`R.tug`, `T.rope.tug`): a second dog bites it → `tugStart`. Knot (red rag) halfway between
  grips, on a white line; each side's line `win` m off. Grips can't stretch apart (`ropeHold`): the harder heave
  (`d.tugS`: planted + walking back + Ⓧ taps, each a yank; × breed grip) drags the other; it trains grip. Stamina drains (`grabKinds.tug`,
  `backDrain`, `tapCost`): out → SLIP!. Knot over a line, or a side lets go: `tugEnd` (losers yanked, OOF!).
- **Bones** (`BONES`, `T.bone`): permanent (not reset; saved in `localStorage['collies.bones.v1']`, host only, `T.bone.save`
  off in `?sim`; up to `max`). Bitten like anything (`boneGrip`, `holdKind 'bone'`, free to carry), crosswise in the jaws;
  one tap tosses it (`boneLetGo`: the run × `mul` + `add`, `up`); knocked about, just dropped. Flies, tumbles, bounces,
  slides (`boneStep`, sub-stepped), bounces off rock and fences. Hits (`boneHits`) by real physics: J = (1+e)·vn / (1/m_bone
  + 1/m), Δv = J/m (`boneMass`: × size³ for sheep, × build for dogs), the bone gets J back. `boneHit`: dog knocked, sheep
  pushed or (light) bowled, ram provoked, coyote scared, cougar spooked / drops its catch, Hank staggers. Never its own
  thrower at first; a pounce kicks a lying one; caught in the air. Online: `NET_TYPES.bone` (made and killed on guests).
- **Dog punts.** A pounce into another dog launches it like a sheep (`puntDog`,
  `T.punt`); not one under a cougar (that pounce frees it).
- **Dogs fly as sheep do.** `launchDog(d, vx, vz, vy, kind, by)`: same kinds, spin (`airSpin`),
  bounces (`airBounce`), hits (`airHits`: caroms, bowls, knocks), landing (`T.landKeep`), pose (`dogPose`).
- **Grab a dog** (`grabKinds.dog`, `grabbableDog`, `d.heldBy`): by the scruff, like a sheep; it drops what
  it had (a rope too: a tug lost). Its holder carries it (`updateHeldDog`, after it moves); one tap moving: flung (`'fling'`). Held:
  barks work, its stick tugs the holder, mash pounce to wriggle free (`heldDogInput`, `T.dogHeld`).
- **Jump** (Ⓨ / X / [ / ⤴, `startJump`, `T.jump`): a hop on the spot (`d.hopT`, `hopH`); sprinting, a long vault.
  Mid-air: rams, pouncing dogs, flying sheep and cougar leaps miss. Clears fences, not the trough one. Lie is LT.
- **Team bark** (`T.teamBark`, `teamOf`, `teamBark`, `teamBarkFx`): dogs barking within `win` s and `near` m
  of each other (chained) → "TEAM BARK!". Predators only: every bark reach × (1 + `grow`·(n−1)), always works
  (wise, bold, packs; no `barks` counted), a cougar drops its catch or lets a dog go, a falcon drops. A third,
  fourth joining: a bigger one. Then `cd` s hoarse. First wise predator with 2+ dogs: hint `team-bark`.
- **Nobody dies to physics.** Deaths leave a named body (`G.graves`, `g.stone`
  false) that rots into a tombstone over `T.remains.rotDays` (`updateRemains`).
- **Rattlesnakes** (`SNAKES`, `T.snake`, own rng): behind their own desert rocks
  past Falcon Canyon's exit. Near: rattle (sheep shy), strike one in reach, back a
  while (`cd`). Bark or pounce: back. Bite: `s.venom`, slower, sickly, dead in
  `dieHours` untreated.
- **Wounds** (`T.wound`): a sheep a predator lets go of is cut (`woundSheep`):
  deep bleeds (`bleedHours`), shallow festers (`infectHours`). No night
  fast-forward while one bleeds.
- **Vet** (`VET`, `T.vet`): traders' second row 💉 🩹 💊 🪏 goes straight
  to Hank (`giveHank`). Stocked, he walks (over fences) to the worst-off he can cure
  (`HANK.care`, `s.state 'treat'`), before shearing. Over sick sheep: icon +
  life ring; over Hank: what he's short of. Lines only for what he sees.
- **Burial** (`YARDS`, `T.remains`): with a shovel, by day, nothing prowling,
  Hank carries a body (within `reach`) to the nearest camp's cemetery, digs,
  a neat stone rises, `lastWords` (by bravery, trait, bell, lamb, age; seeded).
  No cemetery till the first body: he sets it down by the spot and builds one,
  mallet in hand, picket by picket round the fence (`Y.built` 0…1, `yardStep`,
  `syncYard`, `T.remains.build`); stopped, it stays half up till he's back.
  Full: he adds a row at the back (`yardGrow`, if `yardRoom`; up to
  `T.remains.rows`); else the next cemetery; none: it rots where it lies.

### Icons

Our own, no emoji: `ART` (32×32 SVG paths, sticker outline; helpers `ART_H`). Write the emoji
as usual: every 2D canvas's `fillText` / `strokeText` / `measureText` draws its icon instead, and
a DOM observer swaps it into any text (`artDOM`; the emoji stays hidden inside, so `textContent`
reads the same). Not in tooltips (`title`): use words. New emoji → an `ART` icon + `EMOJI_ART`.
Plain symbols stay text (→ ✔ ✖ ★ ♥ Ⓐ).

### Gotchas

- Read buttons once per frame, not per substep.
- Gamepad presses don't unlock audio.
- Fixed light count, so shaders never recompile.
- Grass/depth `DataTexture`s need `unpackAlignment = 1`.
- Changed `index.html`, `vendor/` or icons → bump `CACHE` in `sw.js`.

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
