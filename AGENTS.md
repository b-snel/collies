# AGENTS.md

## Style rule: no words

In-game text: as little as possible. Icons, numbers and tooltips over
sentences. Add text only when it's needed to learn the game. Same for this
file, comments, commits and PRs: short.

## The game

3D border-collie herding, one file `index.html` (three.js r160 from
`vendor/three.module.js`, plain JS, no build). Up to 4 dogs, local or online,
drive a flock along one trail (desert → mountains → ocean → the Promised
Land): graze it, pen it at camps by nightfall, fight off coyotes and cougars
till dawn.

### Run

- `node tools/serve.mjs` → http://localhost:8000 (`file://` won't work).
- `?debug`: FPS + cheats (`]` +1 h, `N` dusk, `M` dawn, `K` coyote, `J`
  cougar hunts, `O` flock +10 days, `F` to final pen). `window.GAME` exposes
  state and functions.
- `?sim`: no render loop; tests call `GAME.step(dt)`.
- Online: PeerJS (`vendor/peerjs.min.js`), room code / `?join=CODE`,
  `?peerserver=host:port` for your own server.
- Mobile: landscape. Touch → floating stick (light push = creep) + 📣 💥 ✊
  💤 ⚡ buttons (`TOUCH`, player `kind: 'touch'`), short `TOUCH_HINTS`,
  rotate prompt in portrait. Compact HUD under 520 px tall (icons, no
  labels). `?touch` forces it.
- Hybrid co-op: both screens can have a sofa. On a guest, a second person
  joins with Ⓐ on another controller or the other keyboard side and gets
  their own dog. 4 dogs in all.

### Layout (`index.html`, top to bottom)

`T` (all tuning) → `Sound` → input → world gen → renderer/terrain/water/grass
→ scenery → fences/pens/bridge → models → particles → `G` → SHEEP → DOGS →
DOG MOVES & PHYSICS → FORAGE → DIG SPOTS → NAVIGATION → COYOTES → COUGARS →
TOMBSTONES → clock/lighting → camera → visual sync → HUD → HANK, FLOCK LOOKS,
DOG WARDROBE, BARN, saved flock → game flow → main loop → `window.GAME`.

`// SHARED HOOK` comments mark cross-system seams; keep them stable or update
every caller: `knockDog`, `hurtDog(d, amt)` (1 = all hp), `hitCoyote`, `provokeRam`, `hank`, `sheepWoolColor`,
`s.headM`/`s.bodyM`, `s.air`/`s.heldBy`/`c.heldBy`, `p.gateT` (0 shut…1
open), `troughEat(tr, amt)` (1 = 1.0 hunger), `lickSalt(pen, amt)`.

### Tests (headless Chromium via `tools/harness.mjs`)

Run the ones touching your change; report the numbers.

| script | checks |
| --- | --- |
| `flock-sim.mjs [scenario] [--trials N]` | driving, scatter, gate bot, critical mass, rams, calming |
| `moves-sim.mjs` | punts, pounce/grab/fling, carrying through a gate, gates, launcher, swimming, final pen |
| `forage-sim.mjs` | plants, salt, carrying, troughs, licks, regrowth |
| `night-sim.mjs idle\|guard` | a night with coyotes, unguarded or guarded |
| `cougar-sim.mjs [day\|hunt\|rescue\|penned\|penguard]` | cougar behaviour |
| `maul-test.mjs` | dog health: maulings, mashing free, KO, nips, barks wearing off |
| `breed-sim.mjs [days]` | flock parked for days: lambs, pasture, starvation |
| `graze-sim.mjs [--moveon\|--trough N]` | fill rate, spacing, moving on |
| `lamb-sim.mjs [--hunger H]` | evening penning → lambs at dawn |
| `gateway-sim.mjs` | stalls at gates |
| `rush-test.mjs` | morning rush out of the pen; carrying a sheep in/out through an open gate |
| `cluster-sim.mjs [structure\|merge\|corner\|cost]` | knots, regrouping, unsticking, cost |
| `age-sim.mjs` | ageing and old-age deaths |
| `hank-test.mjs` | Hank, barn, saved flock |
| `dig-test.mjs` | dig spots, dog wardrobe |
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
- **Momentum and contagion.** Pushed sheep walk on ~3.5 s; calm sheep join
  movers at 0.88× (≥1.0 = runaway).
- **Fear / stress / panic.** Stress spreads 0.4/s, calms 0.15/s, panic >0.75.
  Steady pressure → tight ball; sprinting scatters; lying down calms 3×.
- **Utility goals with hysteresis** (hunger vs safety vs flock).
- **Critical mass.** Open pens pull calm, fed sheep, more as more are in;
  trough food pulls hungry ones (`T.penTroughPull`).
- **Morning rush.** Gate opened dawn–13:00 (or open at 06:00): for
  `T.morningRush.dur` s every penned sheep trots out (`penRush`, `rushOut`).
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
- **Grass** on the 2 m grid as an R8 texture (terrain + tufts). 1 h = 10 s.
  0.4 hunger/h on good grass; calm walkers snatch bites (`T.moveGraze`). Flock moves on together when eaten out
  (`grazeScan`), never while worked. Regrowth ~5 days, runs in `step()`.
- **Lambs.** Ewes under `T.breedHunger` from 16:00, courted in a shut pen,
  lamb at dawn (`T.lambChance`).
- **Age** (`s.age` days, `ageAtDawn`, `oldK(s)` from `T.oldDays`); dies of age
  at dawn past `s.life`.
- **Forage.** Run over plants to carry (`T.forage.carryCap`), walk to a trough
  to tip in.
- **Salt** (`s.salt`) runs down daily; out too long = death. Rocks off trail;
  lumps go to the pen's lick.
- **Coyote packs** flank and strike together; chase off the alpha to break
  them. Shut pens stop them.
- **Cougars** (`COUGARS`, `LAIRS`, `T.cougar`): night only, lambs first,
  never rams; pounce or bump drops the sheep; vaults pen fences. `s.grabbed`
  may be a cougar (`k.isCougar`).
- **Hank calls out only what he sees** (`hankSees`).
- **Barn**: Sheep and Dogs tabs; icon chips, no paragraphs.
- **Dig spots** (own rng, synced): finds go on the dog, saved in
  `localStorage['collies.dogs.v1']`.
- **Dog health** (`d.hp`, `T.dogHp`): heals after a few s unhurt (faster lying
  down); at 0 knocked out a while, never dies. Cougar close (`maulR`, or bumped
  while dragging) leaps on the dog: a swipe/bite every `maul.every` s up to
  `maul.max`; mash pounce to throw it off, or a partner pounces it. Coyotes nip
  (`T.nip`) when bold, screening or striking.
- **Barks wear off**: each coyote/cougar falls for `T.barkWise` barks a night,
  then turns bold (`barkWorks`).
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
