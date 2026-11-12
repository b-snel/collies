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
the Trading Post → the Mountain Pass → the yeti's cave → the sea → Cabo): graze it, pen it at camps by nightfall,
fight off coyotes, cougars and falcons till dawn. Rattlesnakes in the last
desert. A rope on every leg: drag it, or dogs (up to 4, in teams) or Hank play tug of war. Bones dug up stay for good: carry, throw, bonk.
Traders on every leg sell troughs, medicine and a shovel for wool;
Hank treats the sick and buries the dead. Up the icy pass: cold, blizzards,
fires, ice, crevasses, goats; the yeti on top. Beat him, shut the flock in his
cave: it leads down to Cold Harbour.
The sea (issue #74): herd the flock up the gangway, cast off; the flock on a boat's deck, sailed island to island to Cabo
(wind, sheets, tiller, reefs, anchor), orcas to a kraken on the way. Cabo: that wins.

### Run

- `node tools/serve.mjs` → http://localhost:8000 (`file://` won't work).
- `?debug`: FPS + cheats (`]` +1 h, `N` dusk, `B` dawn, `K` coyote, `J`
  cougar hunts, `V` falcon, `O` flock +10 days, `F` to the Trading Post, ≥120 🧶,
  `H` a bite, two wounds, a death and Hank stocked, `L` to the snakes, `U` to Falcon Canyon,
  `T` foot of the pass, `Y` its top (the yeti), `G` a goat comes, `Z` a blizzard; `I` to sea / on to the next island,
  `1`…`5` under way on that sea leg, `0` Hank trims / full manual, `9` a gale). `window.GAME` exposes
  state and functions.
- `?sea` (`?sea=2`: from the third island; `?sea=dock`: at the quay, as out of the cave): start at sea. `GAME.seaStart({ leg, under, dock })`.
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
- Map: minimap bottom left (over the controls bar while it's up; touch: under the flock
  panel); `M` / R3 / tap it → the whole trail, big. At a trader: 📍 its pen.

### Layout (`index.html`, top to bottom)

`T` (all tuning) → `Sound` → input → world gen → renderer/terrain/water/grass
→ scenery → fences/pens → models → particles → `G` → SHEEP → DOGS (BREEDS & TRAINING) →
DOG MOVES & PHYSICS → FORAGE → WATER → DIG SPOTS → BRAMBLES → BONK SPOTS → RATTLESNAKES → ROPES (+ TUG OF WAR) → BONES → NAVIGATION → COYOTES → COUGARS → FALCON (+ FALCON CANYON) →
MOUNTAIN PASS (cold, fires, blizzards, ice, crevasses, burning, GOATS, SNOWBALLS, YETI, the spire) →
REMAINS & TOMBSTONES (YARDS) → clock/lighting → camera → visual sync (RAM NADS, CARRY SWING) → HUD (ART icons) → MAP → HANK, VET, FLOCK LOOKS,
DOG WARDROBE, BARN, DAWN REPORT, saved flock → VENDOR → SAILING (waves, WIND, the boat, STATIONS, route, Hank at sea,
HAZARDS, KRAKEN, drawing, HUD + chart, flow) → game flow → main loop → `window.GAME`.
(`BOAT`, `deckSdf`, the sea zone: world gen. `DECK`, `deckKit`: pens.)

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
(0…1; `…Rate` > 0: getting worse; `s.ail` bits), `giveHank(wares, d)`, `HANK.meds`, `HANK.shovel`,
`downhill(x, z)` (unit + slope), `heatAt(x, z)` (0…1), `startSlide(e, 'ice'|'roll', o)`, `crevOut(e, hop)`,
`s.cold`/`d.cold`/`s.snow` (0…1), `s.burn` (s left), `hankTumble(vx, vz, vy)`; `passSheepStep`, `passSheepMove`,
`passHeld`, `passAir`, `passDogMove` (where the pass takes over),
`waterLevel(x, z)` (the water's top there: flat ashore, the waves at sea), `pen.deck` / `pen.lock` (the boat's deck),
`seaShove({ heel, yaw, surge, sway, ju, jv })`, `seaOverRail(e, side, out, up, how)`, `seaStress(s)` / `seaSheepDeck(s, dt)`,
`s.seaHold`, `s.lure`, `seaBark(d, k, team)`, `seaPounce(d)`, `seaFx(kind, k, x, z, a)`, `seaCheckpoint(w)` → `SEA.checkpoint`,
`SEA.onSave(w, snap)` (for the save system to come), `seaFromCave(inn)` (the pass's cave → the quay), `seaCastOff()`,
`QUAY` / `seaGround(x, z)` (what there is to stand on out there).

### Tests (headless Chromium via `tools/harness.mjs`)

Run the ones touching your change; report the numbers.

| script | checks |
| --- | --- |
| `flock-sim.mjs [scenario] [--trials N]` | driving, scatter, gate bot, critical mass, rams, calming |
| `moves-sim.mjs [name]` | punts (sheep, dogs: `dogPunt`), dog grab/fling/wriggle + same flight as a sheep (`dogGrab`), jump/vault (`jump`), pounce/grab/fling, carrying through a gate, gates, launcher, chute funnel (`launcherFunnel`), river (`river`), final pen (no finish) |
| `forage-sim.mjs` | plants, salt, carrying, troughs, licks, regrowth |
| `water-test.mjs` | buckets: pick up, fill, tip, set down, slosh; drinking, shoving, thirst deaths, `fillWater` |
| `bone-test.mjs` | bones: dug up (kept on a new journey), carried free, thrown (running: further), at rest; hits: Δv = J/m (lighter flies, bounces back off heavy), reactions; not its thrower, pounce kick, caught, saved |
| `rope-test.mjs [layout\|drag\|taps\|sheep\|tug\|even\|tired\|team\|hank\|reset]` | ropes: one a leg, drag (links hold, no stamina), Ⓧ taps (drop, shake, buffered bite, Ⓑ no shake), tug of war (won over the line, even holds, out of stamina loses), teams (3rd/4th dog, 2 beat 1, 2 v 2 holds), Hank (takes the far end, beats a planted dog, 2 dogs beat him), reset |
| `night-sim.mjs idle\|guard` | a night with coyotes, unguarded or guarded |
| `cougar-sim.mjs [day\|hunt\|rescue\|penned\|penguard\|grove]` | cougar behaviour; random trees in the grove, hunters by dogs and day |
| `falcon-test.mjs [eat\|bark\|nest\|dog\|dogbark\|night\|odds]` | falcon: nest kills, bark drops, dog carried, its dog barks it off, day only |
| `canyon-test.mjs [layout\|eat\|bark\|shy\|dog\|limits\|boss]` | Falcon Canyon: where, narrow, pillars, bones, a way through; swoop + eat on a pillar, bark drops, bark keeps them perched, dog carried, maxAir, day only, gorge only, reset; the Great Falcon: eats undefended (barks or not), eyrie shake, beaten by pounces, reset |
| `den-defend-test.mjs` | startled den: defends, stays leashed, sleeps again |
| `team-test.mjs [rules\|coyote\|pack\|cougar\|maul\|falcon]` | team bark: together/late/far/hoarse, one bark per coyote (team too), 4 dogs break a pack, cougar drops its catch / lets a dog go, falcon drops from further |
| `maul-test.mjs` | dog health: maulings, mashing free, KO, nips, barks wearing off, bonking a fleeing cougar, again and again till it's home |
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
| `vendor-test.mjs` | traders on every leg (none up the pass), 📍 pen pick, troughs added to the max then batches, fit, sheep use them, reset; too poor, full pen, no Cabo, the Trading Post doesn't end it |
| `pass-test.mjs [layout\|cold\|fire\|blizzard\|ice\|crev\|goat\|yeti\|rock\|burn\|finish]` | the pass: climb, walls, camps, ice, cracks, side trail, nothing else up there; cold by fleece and snow, thaw, frozen death; Hank lights a fire, the coldest warm by it; blizzard snow, shaken off, melted; ice slides (sheep, dog, Hank), calm ones go round; cracks (sheep grabbed out, a dog alone mashes out, with a friend grabbed out); goats bonk (sheep, Hank), bark, pounce; yeti wakes, snowballs grow, headbutt, 3 burning sheep; the spire falls on him; burning sheep; the cave: down to the quay, one left behind |
| `vet-test.mjs` | snakes (placement, rattle, strike, bark/pounce), venom and wounds (slowing, death times), 💉 🩹 💊 🪏 straight to Hank, treating (in a pen too), bodies rotting to stones, cemeteries built on the first burial, burial + last words, reset |
| `shear-test.mjs` | clippers spot, dug up → Hank's, shearing (shut gate; not open, not asleep), 🧶, regrowth, looks, save |
| `bramble-test.mjs` | brambles: placement, snag, held, grab fails, pounce frees, calm sheep go round |
| `bonk-test.mjs [world\|cast\|mud\|balk\|apple]` | streams (walkable, wet, lush banks), cast sheep, bogs, the balking lead ewe, apple trees |
| `pen-trap-test.mjs` | coyote shut in a pen mauls sheep after sheep, dog saves; open gate → dragged out; ram bravery, lambs inherit |
| `nads-test.mjs` | ram nads: size by bravery, rest, swing/lag/damping, legs, flips, dt spikes, tucking, barn |
| `input-test.mjs` | Ⓐ on slow frames: quick taps between frames, held = one bark, early press waits out the cooldown (`padPoll`, `T.barkBuf`) |
| `sail-test.mjs [polar\|irons\|tack\|gybe\|heel\|stations\|hank\|over\|dog\|anchor\|orca\|reef\|shark\|storm\|spout\|siren\|kraken\|arrive\|start\|dock\|land]` | sailing: points of sail, no-go zone, irons and out, tack, gybe (crash, duck, sheeted in), heel (flock as ballast, reef), stations (tiller: steer / hold / lash; sheet, halyard, anchor), Hank's trim, sheep overboard (swims, clings, hauled in, towed, drowns), dog overboard and back, anchoring (holds: saved, mended; drags), orcas (bonk, bark), reefs, sharks, storm (gale, great wave abeam / on the bow), waterspout, sirens (lured, bark, blocked), kraken (arms, ballast, bonks, eye, beaten), Cabo, the first minute (weigh, take the tiller, away), the quay (still, no leaving sheep, the edge, herded aboard, lashed, cast off, away), the land untouched |
| `net-test.mjs` | online co-op (`PEERSERVER=host:port`) |
| `hybrid-test.mjs` | 2 players on the host's screen + 2 on a guest's |
| `breed-test.mjs` | breeds: ★ totals, title pick (←/→ eaten, saved), a friend's pick, every trait's effect; training: xp sources, levels, cap, Header 1.5×, breed swap keeps it, reset; barn card; net `brd` |
| `map-test.mjs` | map: dogs uncover, parchment elsewhere, minimap place, 📍 at a trader, M / click → big, arrows dodge it, fog for late friends, reset, cost |

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
  them. Shut pens stop them. One more a night per extra dog (`T.coyotePerDog`).
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
- **Cougars** (`COUGARS`, `GROVES`, `LAIRS`, `T.cougar`): `n` of them; a grove of `trees`
  trees by each hill camp. Night only: they take random trees in the grove nearest the
  flock (`perchGrove`, `k.lair`, synced); `hunt[dogs−1]` of them hunt every night, +1 from
  day `moreFrom` (`cougarHunters`); held up only by a dog barking under its tree (`treedR`). Lambs first,
  never rams; pounce or bump drops the sheep; vaults pen fences. Pounce one
  running away: bonked, yowls (`Sound.yowl`), tumbles toward its tree dazed (`daze`), runs
  `bonkRun`× faster, still slower than a sprinting dog: bonk it again, all the way home. `s.grabbed`
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
  - **The Great Falcon** (mini boss: `BOSS`, `F.boss`, `CANYON.eyrie` id 99, `CANYON.boss`, `T.canyon.boss`): big, on the
    tallest pillar mid-gorge. Swoops on its own clock (`updateBoss`), ❗ over its mark from the start. Barks (team ones too)
    do nothing (😾, `bossScoff`); a pounce while it's low (diving, or its first `lowT` s struggling off with a sheep) hits
    it (`bossHit`): drops what it has. `hp` (+`perDog`) hits: gone for the journey, +`bounty` 🧶, the gorge quiet
    (`bossBeaten`). Eating on the eyrie: a pounce into its foot shakes the sheep loose (`eyrieShake`). HUD 🦅 ♥♥♥
    (`#bossBar`, `body.boss`). Off in `?sim` (`T.canyon.boss.on`).
- **Hank never leans on a wall.** Blocked short of his spot he stands easy
  (`hk.easeAt`); far off, a hop and a sidestep (`hk.sideT`).
- **Hank calls out only what he sees** (`hankSees`). Night at the campfire he
  sleeps on a mat (`hankNap`, silent); a predator within `T.hankNap.wakeR` wakes
  him shouting.
- **Shearing** (`T.shear`): Hank's clippers are always in one dig spot between
  the first two camps (`CLIP_DIG`); dug up, they're his. Awake, no predator near, he climbs into a
  shut pen (`hankCross`) and shears the woolliest (`s.wool` ≥ `min`) one at a
  time on its rump (`s.state 'shear'`): `G.wool` += yield × size². Wool regrows over `regrowDays`, saved with the flock.
- **Map** (`MAP`, `T.map`, drawing only): parchment till a dog's been within `r` m (`MAP.rv`, 2 m grid,
  `mapReveal`); the land inked round a ragged edge, grazed patches bare. Camera's way round. Camps, traders,
  salt, graves once uncovered; flock, Hank, dogs always; predators only while a dog sees them. Each screen
  uncovers its own; a late friend gets the host's (`NET_TYPES.game.fog`). New journey: parchment (`mapReset`).
  Edge arrows keep clear of it (`mapDodge`). At a trader, its pen ringed + 📍 (on the edge if off it). No trail bar.
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
- **Barks wear off**: a coyote falls for one bark a night (`T.coyoteBark.wise`,
  `coyoteBarkWorks`; a team bark too, barks within `same` s are that one), a cougar
  for `T.barkWise`; then bold (`barkWorks`, hint `coyote-wise`): only a bonk moves it,
  and it lunges at dogs to nip. Packs lose less heart per bark (`packK`).
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
- **Trading Post** (`POST`, `postPen`, `MARKET`, `WARES`): desert, no water, the foot of
  the pass. ✂️ free while Hank has none. Too poor or no room: ✖, nothing spent
  (`vendorFx`). No trader up the pass, none delivers to the yeti's cave (`penFound`).
- **Mountain pass** (`PASS`, `T.pass`, `passK`, `liftArr`): past the Trading Post the floor
  climbs `rise` m (flat at each fire camp); `blk` is by height over the floor. Walls in ledges
  west, a lip then the drop east. Nothing else up there (dens, nests, plants, salt, brambles, digs).
  No coyotes while the flock's up there; at night by a fire is safe (`passSafe`: the night hurries).
  - **Cold** (`T.cold`, `sheepCold`, `dogCold`): builds in the snow × (1 − `wool`·`s.wool`) × snow on it,
    night, blizzard, lamb; huddled less; `heatAt` warms; below thaws. At 1 for `dieHours`: dead ('cold').
    Slower (`coldPep`, `dogColdK`), blue, shivering. Dogs never worse than slow.
  - **Fires** (`PASS.fires`, camps without pens): Hank lights the one by the flock (`passFireGoal`,
    `hankFire`, `light` s), `burn` h of fuel; by night he sits by it. Cold ones take the `spots`
    round it, the coldest first (`warmGo`, state 'warm'); nobody's jostled into it (`fireShove`).
  - **Snow** (`s.snow`, `T.snow`): a blizzard piles it on; running sheds it; heat melts it.
    **Blizzards** (`PASS.blizz`, `T.blizz`): now and then while the flock's up there; whiteout.
  - **Ice** (`ICES`, `T.ice`, `startSlide`): onto it moving: slide downhill, spinning, legs going,
    slide whistle (`SFX.slip`). Dogs barely steer; a jump gets out. Hank too. Calm sheep go round.
  - **Crevasses** (`CREVS`, `T.crev`, `crevFall`): sheep or dogs (not hopping/lunging) drop in
    ('crev', sunk). A sheep: grabbed out. A dog alone: mash Ⓑ out (`crevEsc`); with friends
    (`crevAlone` false): only a friend's grab gets it out. Calm sheep go round.
  - **Goats** (`GOATS`, `T.goat`): on ledges; by day one bounds down at a sheep, dog or Hank in reach,
    windup ❗, charges, bonks it down the mountain (launched 'tumble', lands, rolls 'roll').
    A bark (`goatBark`) or a pounce (`goatPounced`) sends it home.
  - **Burning** (`s.burn`, `T.burn`): a sheep carried, flung or bolting into a lit fire catches;
    too hot to hold (HOT!); runs mad, then rolls it out; singed (`s.wool` → `wool`, `s.soot`).
  - **The yeti** (`YETI`, `T.yeti`, `SNOWBALLS`): wakes when something's past `arena`; rolls snowballs
    that grow, headbutts what's close; a pounce bounces off him. A burning sheep flying into him:
    a hit (`yetiStruck`); `hp` and he's done (`yetiBeaten('fire')`). HUD 🦍 ♥♥♥.
  - **The spire** (`SIDE`, `ROCK`): the hidden side trail (`sideD`, single file) up behind the west
    rim to a ledge; `cracks` sheep flying into the spire: it falls on him ('crushed', an arm out).
  - **His cave** (`FINAL`, `finalPen`): iced shut (`p.frozen`) till he's beaten. Then the flock
    shut in it (all, or some for `finish` s): through the mountain to the quay at Cold Harbour (`seaFromCave`); the ones
    not shut in are left behind (`'left'`). Online with friends it still ends there (`finishGame(n)`): they can't see the sea yet.
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
  Up to 4 dogs: across the knot each side's heaves add up and it moves as one (`ropeHold`).
- **Hank's tug** (`hankRope`, `hankTug`, `HANK.rope`, `T.rope.tug.hank`): a dog brings a rope within `r` of him, he's free
  (`hankRopeFree`: awake, no job, nothing prowling): he walks to the far end, takes it, tugs every dog on it; walks back,
  heaves every `every` s, tires after `tire` s. Lost: OOF, stumbles. Either way he lets go (`again` s). Online: `NET_TYPES.hank` `rope`/`ropeI`.
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
  of each other (chained) → "TEAM BARK!". Predators only: every bark reach × (1 + `grow`·(n−1)). Cougars and
  falcons: always works (wise or not; no `barks` counted), a cougar drops its catch or lets a dog go, a falcon drops.
  Coyotes: more heart lost, no `packK`, but still their one bark. A third, fourth joining: a bigger one. Then `cd` s
  hoarse. First wise cougar with 2+ dogs: hint `team-bark`.
- **Nobody dies to physics.** Deaths leave a named body (`G.graves`, `g.stone`
  false) that rots into a tombstone over `T.remains.rotDays` (`updateRemains`).
- **Rattlesnakes** (`SNAKES`, `T.snake`, own rng): behind their own desert rocks
  (`latMin`…`lat` off the trail) past Falcon Canyon's exit. Near: rattle (sheep shy), slither out
  after its mark (`snakeSlide`, `slither`; `n.x0/z0` home), strike one in reach, back home a
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

### Sailing (issue #74)

The yeti's cave leads down to it (`seaFromCave`); dev: `?sea`, `I`. Guests don't see the sea yet (no `NET_TYPES`):
host / offline only, so with friends online the journey still ends at the cave.

- **Cold Harbour's quay** (`QUAY`, `DOCK`, `SEA.docked`, `seaStart({ dock })`): she lies alongside, still (`seaMoored`), sheet let
  fly; the quay is ground while she does (`seaGround`: deck ∪ quay, lapping at the gangway), the flock and the dogs on it. The
  gangway (the deck pen's gate, unlocked, at the quay's aft end: the open leaf lies along the rail) is open: herd them aboard
  (stocked troughs draw the hungry). Dogs stop at the quay's edge (a leap goes in; up the ladder); a sheep in the harbour
  scrambles out. Every sheep and dog aboard: Hank shuts and lashes it (`seaGangway`). Bow station, stick up: `seaCastOff` (not
  with sheep ashore: 🐑 n ✖): the quay's left behind, Hank shoves off and minds the helm down the fairway (`SEA.pilot`) till a
  dog takes the tiller. No morning rush off the deck, nobody leaves it to graze.

- **The boat never moves; the sea does.** The deck is a pen (`DECK`: `pen.deck`, its bulwark `pen.segs`, a gangway
  gate lashed shut: `pen.lock`) out in the sea zone (`x > SEA_X0`: `terrainH` / `sdfIn` / `trailInfo` / grass answer
  for it), bow up the screen. `SEA.e/n/hdg` is where she is on the sea; `seaG` (the sea, islands, orcas: sea coords)
  is set to her pose undone, the camera and the sun tilted the same (`seaCamTilt`, `seaLight`), so the sea lies level
  on screen and she heels. Everything aboard runs unchanged. Things in the water drift astern (`seaDrift`).
- **Waves** (`SWAVES`, `seaEta`, `T.sea.wave`): five trochoid trains (two of swell, in sets; three of wind sea) that
  grow with the wind (`SEA.state`); the water shader (`SEAW`) draws the same sum, so she floats on what you see.
  `seaRogue`: a lone great wave. `waterLevel` is a swimmer's y.
- **Wind** (`WIND`, `T.sea.wind`): from, m/s; veers and breathes; gusts drift down it as dark patches on the water
  (lulls: glassy), drawn where they are. Each leg has its own (`ROUTE[i].wind`, `seaWeather`).
- **Sail** (`seaBoatStep`, `sailCoef`, `T.sea.sail`): lift and drag off the apparent wind and the boom's angle. The
  boom swings to leeward as far as the sheet lets it. From that alone: no-go zone, irons (she drifts astern; helm
  over, her head pays off), luffing, stalling, heel, leeway (more when slow), weather helm, tack, gybe (the boom
  crashes across: `seaBoomSlam`, swats dogs and sheep: `seaBoomSweep`; lying down ducks it; sheeted in: gentle).
  Reefed: less heel, less speed. Hull: drag, keel, a rudder that bites with way on; hard over it brakes.
- **Heel / pitch / heave** follow the water at bow, stern and sides; the sail heels her; the flock is live ballast
  (`SEA.bal`, `seaMass`): to windward they hold her up. Past `T.sea.deck.grip` feet slide to the low side
  (`seaDeckPush`); green water over the low rail washes sheep off (`SEA.awash`). The ride frightens them
  (`seaUnease`: a floor under stress; on deck they can panic, penned or not).
- **Stations** (`STATIONS`, `holdKind 'station'`, `T.sea.station`): ✊ bites one, the stick works it, a tap lets go.
  Tiller: stick steers; let go of the stick, she holds that heading (`SEA.course`); ✊✊ lashes it (`SEA.lash`).
  Sheet: aft hauls, forward eases; ✊✊ lets it fly. Halyard: up / down, settles on a reef. Anchor: down drops, up
  weighs. Nobody on the tiller: it swings amidships and she rounds up.
- **Hank's crew**: on the sheet while no dog has it (`SEA.assist`; off: it runs out), a beat late; eases her when
  pressed; lets fly at anchor or with a dog overboard. Calls what he sees (`seaHank`).
- **Overboard** (`seaSwimSheep`, `T.sea.over`): a sheep swims after her, tires (`a.lung`, a ring over it), clings
  alongside if she's slow; a dog at the rail ✊ hauls it in (`seaHaul`), a swimming dog tows it (`d.tow`). Left: drowned.
  Dogs: over the rail only by a jump; swim, climb the nets against the hull (`seaSwimDog`).
- **Anchor** (`T.sea.anchor`): holds in under `depth` m (by islands), she swings head to wind; deeper, it only drags.
  Anchored in an island's lee: `seaCheckpoint` (saved, hull mended, troughs filled from `SEA.stores`), the night
  fast-forwards (`seaAtRest`).
- **Route** (`ROUTE`, `REEFS`, `BUOYS`): Cold Harbour → Seal Skerry → Gull Rock → Storm Key → Siren's Rest → Cabo.
  Anchoring at Cabo (or stopping there): `finishGame(sheep aboard)`. The only win (offline).
- **Hazards, worse each leg** (`HAZ`, `seaHazards`): 🐋 orcas bonk the hull (sheep by that rail go over; a bark
  turns one; they pick the rail the sheep are by). 🪨 reefs (a ♥ off the hull; at 0 she wallows till mended), gusts,
  and from here on 🦈 a shark for each sheep in the water (bark: off a while). ⛈️ storm: gale, breaking seas,
  lightning, a great wave now and then (abeam: sweeps the deck; on the bow: fine), a waterspout that flings sheep.
  🧜 sirens in fog: sheep walk to that rail and jump (`s.lure`, `seaLure`); a bark frees them, a dog in the way
  stops them; in the water they swim for the rock. Deaths: `drowned`, `shark`, `siren`, `kraken` (`SEA_LOSS`: no body; `left` on the mountain too).
- **The kraken** (`KRAKEN`, `krakenStep`, `T.sea.kraken`): the wind dies, ink wells up. Arms over one rail haul it
  down (`SEA.hold.heel`): herd the flock to the high side, pounce each arm off (`seaPounce`; a bold ram butts one).
  A loose arm snatches a sheep (`s.seaHold`): bonk it and it drops it. Arms off: its head comes up, dazed: a sheep
  (or a dog) flying into its eye is a hit and bounces back aboard (`krakenEyeHits`). `hp` (+`perDog`) hits: beaten,
  +`bounty` 🧶, the wind fills in. Barks: 😾. HUD: 🐙 ♥♥♥ (`#bossBar`).
- **HUD**: the dial (`drawSeaDial`): wind arrow, no-go wedge, boom (green drawing, amber luffing / stalled, dashed:
  best), rudder, heel + where the flock's weight is, knots, reefs, hull ♥. The sail's cloth tints the same. Compass:
  the next island. Map: a chart (`seaChart`; minimap bow-up, big north-up).

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
