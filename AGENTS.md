# AGENTS.md

## Style rule: no words

In-game text: as little as possible. Icons, numbers and tooltips over
sentences. Add text only when it's needed to learn the game. Same for this
file, comments, commits and PRs: short.

## The game

3D border-collie herding, one file `index.html` (three.js r160 from
`vendor/three.module.js`, plain JS, no build). Up to 4 dogs, local or online,
drive a flock along one trail (desert → mountains → ocean → the Promised
Land → desert → the Trading Post): graze it, pen it at camps by nightfall,
fight off coyotes, cougars and falcons till dawn. At the Trading Post wool
buys supplies, and Cabo 🏖️, which wins.

### Run

- `node tools/serve.mjs` → http://localhost:8000 (`file://` won't work).
- `?debug`: FPS + cheats (`]` +1 h, `N` dusk, `M` dawn, `K` coyote, `J`
  cougar hunts, `V` falcon, `O` flock +10 days, `F` to the Trading Post, ≥120 🧶). `window.GAME` exposes
  state and functions.
- `?sim`: no render loop; tests call `GAME.step(dt)`.
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
→ scenery → fences/pens → models → particles → `G` → SHEEP → DOGS →
DOG MOVES & PHYSICS → FORAGE → WATER → DIG SPOTS → BRAMBLES → NAVIGATION → COYOTES → COUGARS → FALCON →
TOMBSTONES → clock/lighting → camera → visual sync (RAM NADS) → HUD → HANK, FLOCK LOOKS,
DOG WARDROBE, BARN, DAWN REPORT, saved flock → VENDOR → game flow → main loop → `window.GAME`.

`// SHARED HOOK` comments mark cross-system seams; keep them stable or update
every caller: `knockDog`, `hurtDog(d, amt)` (1 = all hp), `hitCoyote`, `provokeRam`, `hank`, `sheepWoolColor`,
`s.headM`/`s.bodyM`, `s.air`/`s.heldBy`/`c.heldBy`, `p.gateT` (0 shut…1
open), `troughEat(tr, amt)` (1 = 1.0 hunger), `lickSalt(pen, amt)`, `stockTroughs(pen, amt)`,
`fillWater(pen, amt)` / `drinkWater(pen, amt)` (1 = one sheep parched →
quenched; return what went in / out), `giveHankClippers()` (no-op if he has
them), `HANK.clippers`, `s.wool` (0…1), `G.wool` (🧶, whole number).

### Tests (headless Chromium via `tools/harness.mjs`)

Run the ones touching your change; report the numbers.

| script | checks |
| --- | --- |
| `flock-sim.mjs [scenario] [--trials N]` | driving, scatter, gate bot, critical mass, rams, calming |
| `moves-sim.mjs [name]` | punts (sheep, dogs: `dogPunt`), pounce/grab/fling, carrying through a gate, gates, launcher, chute funnel (`launcherFunnel`), river (`river`), final pen (no finish) |
| `forage-sim.mjs` | plants, salt, carrying, troughs, licks, regrowth |
| `water-test.mjs` | buckets: pick up, fill, tip; drinking, shoving, thirst deaths, `fillWater` |
| `night-sim.mjs idle\|guard` | a night with coyotes, unguarded or guarded |
| `cougar-sim.mjs [day\|hunt\|rescue\|penned\|penguard]` | cougar behaviour |
| `falcon-test.mjs [eat\|bark\|nest\|dog\|dogbark\|night\|odds]` | falcon: nest kills, bark drops, dog carried, its dog barks it off, day only |
| `den-defend-test.mjs` | startled den: defends, stays leashed, sleeps again |
| `maul-test.mjs` | dog health: maulings, mashing free, KO, nips, barks wearing off, bonking a fleeing cougar |
| `breed-sim.mjs [days]` | flock parked for days: lambs, pasture, starvation |
| `graze-sim.mjs [--moveon\|--trough N]` | fill rate, spacing, moving on |
| `lamb-sim.mjs [--hunger H]` | evening penning → lambs at dawn |
| `gateway-sim.mjs` | stalls at gates |
| `straggler-sim.mjs [--trials N]` | stragglers behind the pen / the open leaf get in |
| `morning-sim.mjs [--trials N]` | penned flock leaves at dawn and stays out |
| `rush-test.mjs` | morning rush out of the pen; carrying a sheep in/out through an open gate |
| `cluster-sim.mjs [structure\|merge\|lost\|shove\|corner\|cost]` | knots, regrouping, lost sheep, grass shoves, unsticking, cost |
| `age-sim.mjs` | ageing and old-age deaths |
| `hank-test.mjs` | Hank, barn, saved flock |
| `dig-test.mjs` | dig spots, dog wardrobe |
| `vendor-test.mjs` | Trading Post: wares bought, too poor, full pen, bark on a mat, Cabo wins, old finish gone |
| `shear-test.mjs` | clippers spot, carrying to Hank, shearing (shut gate; not open, not asleep), 🧶, regrowth, looks, save |
| `bramble-test.mjs` | brambles: placement, snag, held, grab fails, pounce frees, calm sheep go round |
| `pen-trap-test.mjs` | coyote shut in a pen mauls sheep after sheep, dog saves; open gate → dragged out; ram bravery, lambs inherit |
| `nads-test.mjs` | ram nads: size by bravery, rest, swing/lag/damping, legs, flips, dt spikes, tucking, barn |
| `net-test.mjs` | online co-op (`PEERSERVER=host:port`) |
| `hybrid-test.mjs` | 2 players on the host's screen + 2 on a guest's |

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
  then till 13:00 no pen or trough pull, nobody goes back in (`morningOut`).
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
- **Grass** on the 2 m grid as an R8 texture (terrain + tufts). 1 h = 13 s by day, 10 s at night (`hourLen`).
  0.4 hunger/h on good grass; calm walkers snatch bites (`T.moveGraze`). Flock moves on together when eaten out
  (`grazeScan`), never while worked. Regrowth ~5 days, runs in `step()`.
- **Lambs.** Ewes under `T.breedHunger` from 16:00, courted in a shut pen,
  lamb at dawn (`T.lambChance`).
- **Age** (`s.age` days, `ageAtDawn`, `oldK(s)` from `T.oldDays`); dies of age
  at dawn past `s.life`.
- **Forage.** Run over plants to carry (`T.forage.carryCap`), walk to a trough
  to tip in. The fence by the troughs can't be hopped (`byTrough`); tip over it.
- **Trough mayhem.** Penned sheep eat/lick till full; no place → shove the
  weakest (`shoveStr`: small, old, lambs lose; rams win) off it (`barge`, `T.shove`).
- **Hungry shove on grass.** A hungry grazer barges a fuller one off better
  grass next to it, harder the hungrier (`grassShove`, `T.grassShove`).
- **Lost sheep panic.** No flockmate within `T.lonely.far` (fences don't
  count) → `s.anx` builds: stress, wants its flock, trots back bleating, to the
  main flock however far.
- **Salt** (`s.salt`) runs down slowly (~8 days); out too long = death. Camp
  licks start stocked (`campStock`); sheep lick rocks in passing; lumps go to
  the pen's lick.
- **Water** (`s.thirst` 0…1, `T.water`): rises daily; parched too long =
  death. Each pen: a water trough (`pen.water`) and a bucket (`BUCKETS`). Hold
  grab on a bucket to carry it (one per dog, mouth full); let go: set down
  (`dropBucket`). A lying one gets shoved by dogs running into it, flies (spilling)
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
- **Hank calls out only what he sees** (`hankSees`). Night at the campfire he
  sleeps on a mat (`hankNap`, silent); a predator within `T.hankNap.wakeR` wakes
  him shouting.
- **Shearing** (`T.shear`): Hank's clippers are always in one dig spot between
  the first two camps (`CLIP_DIG`); a dog carries them to him (a thought bubble
  nags till then, `T.shear.think`). Awake, no predator near, he climbs into a
  shut pen (`hankCross`) and shears the woolliest (`s.wool` ≥ `min`) one at a
  time on its rump (`s.state 'shear'`): `G.wool` += yield × size². Wool regrows over `regrowDays`, saved with the flock.
- **Barn**: Sheep and Dogs tabs; icon chips, no paragraphs. Host only; guests watch it read only (`BARN.watch`, `NET_TYPES.game.barn`).
- **Dawn report** (`DAWN`, `dawnReport`, after `lambsAtDawn`): lambs born (rename, 🎲, ✏️ → barn) and
  a eulogy per sheep lost since last dawn (`eulogy`, by `s.brave`). Host only (guests: read only, `NET_TYPES.game.dawn`), world waits; `?sim` only
  fills `G.dawnReport`.
- **Dig spots** (own rng, synced): finds go on the dog, saved in
  `localStorage['collies.dogs.v1']`.
- **Dog health** (`d.hp`, `T.dogHp`): heals after a few s unhurt (faster lying
  down); at 0 knocked out a while, never dies. Cougar close (`maulR`, or bumped
  while dragging) leaps on the dog: a swipe/bite every `maul.every` s up to
  `maul.max`; mash pounce to throw it off, or a partner pounces it. Coyotes nip
  (`T.nip`) when bold, screening or striking.
- **Barks wear off**: each coyote/cougar falls for `T.barkWise` barks a night
  (a lone coyote: `T.coyoteBark.soloWise`), then turns bold (`barkWorks`): only
  a bonk moves it, and it lunges at dogs to nip. Packs lose less heart per bark
  (`packK`).
- **Trading Post** (`FINAL`, `finalPen`, `MARKET`, `WARES`, `T.vendor`): the
  end of the trail, desert, no water. A dog on a mat barks (`vendorBark`, host)
  to buy with `G.wool`: 💧 (`fillWater`), 🌾 (`stockTroughs`), 🧂 into the final
  pen; ✂️ free while Hank has none. Too poor or no room: ✖, nothing spent
  (`vendorFx`). 🏖️ Cabo = base + per sheep penned there, bark twice: those go,
  `finishGame(n)`. Only Cabo wins; a shut final pen doesn't.
- **Brambles** (`BRAMBLES`, `T.bramble`, own rng): patches off the trail. A
  sheep blundering in (more when running) is snagged (`s.snag`, `snagSheep`),
  stuck and bleating; only a pounce frees it (`punt` → `unsnag`), not a grab.
  Calm sheep steer round. Off in `?sim` (`T.bramble.on`).
- **River, no bridge** (`RIVER`, `inRiver`): dogs walk in and swim (`startSwim`,
  `collideDog` / `SWIM_SDF`; drops what they hold), Hank wades. Sheep can't: a
  splashed one swims back to its own bank (`a.side`). Only the launcher takes them over.
- **Launcher chute** (`T.launcher.funnel`, `inChute`): long wings; driven sheep bend
  for the mouth, slide round a wing's tip, walk on to the low end. In the chute: no breakouts.
- **Ram nads** (`s.nads`, `T.nads`, drawing only): a cord and a pair on springs,
  stepped in world space (`nadsStep`); belly, hind legs, ground and each other
  collide. Size by `s.brave` (`nadsK`). Cold, wet, scared, charging: tucked;
  desert sun, age: lower (`nadsHang`).
- **Dog punts.** A pounce into another dog launches it like a sheep (`puntDog`,
  `T.punt.dogK`/`dogUp`); not one under a cougar (that pounce frees it).
- **Nobody dies to physics.** Deaths leave a named tombstone.

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
