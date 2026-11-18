# Ducks

- **Bunches** (`HERDS`, `HERD`, `T.duck`, DUCKS; on: off in `?sim`): runner ducks, `groups` a leg on every leg before Falcon Canyon
  (`legs`; not in it or past it), `n` a bunch, `lat` m off the trail, by water within `wet` m if it can (`duckWater`), off the trials' ring.
  Own rng, a new seed a journey (`HERD.seed`, `duckPlan`, `duckSpotOK`). Found: the first dog within `findR` (`duckFind`): ❗🦆; the first,
  Hank's word and the hint. Only stepped within `near` m of a dog.
- **Left be** (`duckGroupStep`, `herdIdle`): peck about; now and then (`moveT`) the leader walks them in a line (`line` m apart) to a spot
  near home (by the water: in it half the time; the line leads, no contagion meanwhile); swim on the water; asleep huddled by night. Driven
  somewhere and left be: home's there (no march off till then).
- **Life** (LIFE, `T.duck.life`; wild ones, `duckWild`): `e.age` days, `e.male` (a drake: a curled tail feather) or a hen, `e.life`. A new
  bunch: a drake and a hen at least, all ages, `brood` of them a hen with ducklings. A **duckling** (`duckling`, under `grow` days, from `small` ×
  the size, `fluff` down feathering out) trails its mum (`e.mum`, `duckMum`): in a line behind her as she walks or swims (`duckTrail`, `duckAhead`,
  `follow` m: each at the one ahead's pace, closing in; behind, they hurry), pecking round her, tucked in by her asleep; pushed, back to her. Can't fly: rushed, barked at, it runs (cheeping), bonked it tumbles.
  Grown: on its own. **Old** from `old` (`duckOldK`): paler, slower (`slow`, `e.pep`); gone at `e.life` (a few feathers). **Mating** (by day): a
  grown drake and a free hen in a bunch (`duckHenFree`: no brood, no clutch, not too old), `mateP` an hour × room (1 − n / `cap`, clutches to come
  counted; ♥); she hatches `clutch` ducklings `incubH` h on (`e.clutch`, `duckHatch`), her coat or the drake's (`e.dad`). No drake (or hen) in a
  bunch: one comes over from a bunch within `seek` m with one to spare (`duckVisit`; out of sight: it's there; both near: it walks). Never past
  `T.duck.max`. `duckLife`: every `tick` h, every bunch, near or far (`HERD.lifeH`, `HERD.born`, `HERD.died`).
- **Imprint** (IMPRINT): a duckling whose mum dies (`e.orphan`, `herdRemove`) takes the first dog within `imprintR` m for its mum (`duckImprint`,
  `e.dog`, ♥, cheeps): trails it in a line (`duckLead`, `dogGap` m back; a walking dog outruns them, creeping it doesn't; left behind, they
  hurry), pecks round it, sleeps by it at night, unafraid of it (no pressure, its barks don't scatter them). Stepped wherever its bunch is. Grown,
  or `loseR` m behind, or its dog gone: on its own again, in the nearest bunch within `settleR` m or one of its own (`duckSettle`). Saved with
  its dog's slot (`e.dogSlot`) and new bunches.
- **Prey** (PREY, `T.duck.prey`): a hunting coyote ('pack', not striking) runs at one on land within `coyR` m (`coyoteDuck`, `chase` s, then `cd`),
  grabs it (`grab`: the pack hunts on), eats it `eatT` s on (`preyKill` → `duckDie`), off home. The falcon takes one on land by day (`falconPick`, `T.duck.prey.falcon`; docs/predators.md). A cougar hunts one in its range (`cougarTarget`,
  `cougarSc` m worse than a sheep), up its tree. Awake ones shy off a predator within `seeR` (a cougar: half) and fly up within `flyR` (`duckFoes`;
  ducklings run); asleep they don't see it, till one's taken (`duckSnatched`: the rest up and off, awake `alarmT` s). On the water: safe. Dropped
  (a dog, dawn): up and off (`duckFreed`). Out of every dog's reach and off screen, by night: `farP` an hour × (n / cap)² one's taken
  (`duckFarPrey`, ducklings likeliest, then the old: `farW`). Any predator: `duckPrey(e)` / `duckNear(x, z, r)`, `e.grabbed`, `preyKill`. Not ours:
  no alerts (`preyWild`: no toast, Hank, hint, rumble, "Saved!", red arrow; the night still fast-forwards).
- **HERD** (the small-herd mover, `herdStep`; `T.herd[kind]`; the trials' sheep and ducks too): a dog's pressure as the sheep feel it
  (`T.pressR` × `press`, bent toward a moving dog's heading; lying by: settles them), momentum (`mom` s), contagion (calm ones join movers),
  a bunch (`bunch`, `space`), stress and panic (weaving). A duck flaps up and off (`herdFly`: `fly.close`, a sprinter within `fly.sprint`,
  a pounce, a bark harder than `fly.bark`) and lands a few metres off. A bark scatters them (`herdBark`: herding, not a nag). A pounce:
  bonked (a sheep flies, a duck flaps up: `herdBonked`). ✊ (`herdGrip`, `herdHoldKind`: `duck` / `tsheep` in `T.grabKinds`) carries one;
  let go on the run: flung (`herdLaunch`; a duck flaps down slowly). `e.state` 'idle' 'graze' 'walk' 'move' 'fly' 'air' 'held' 'sleep'
  (the trials: 'stay' penned, 'shear', 'leave').
- **Drawing** (`syncDucks`, instanced, made the first time there's one: `duckInst`): an upright body, neck and head (pecking, tucked
  asleep, dabbling), bill, wings (beating), feet (waddling), a drake's curl. Coats `T.duck.coats`; by age `duckTint` (down, pale). Ducklings
  cheep (`DSND.peep`, the nearest to the camera, every screen). The trials' sheep draw in the flock's instances after
  it (`syncHerdSheep`). Sounds `DSND` (quack, flap); `herdFx` (relayed).
- **Online**: `NET_TYPES.herd` (`age`, `life`, `male`; held in jaws: state 'held'); a guest wipes its own (`herdWipe`). **Save** (`onSave('ducks')`):
  the seed, which were found, every bunch as it is (home; each duck: where, age, drake, coat, life, clutch, mum, `duckSaveGroup`).
- **Map**: bunches where a dog's been (`mapDucks`). **Dev**: `6` a bunch by the dog (`devDucks`: two drakes, an old hen, a hen with a brood).
  Test: `duck-test.mjs`.
