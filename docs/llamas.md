# Llamas

- **Wild herds** (`LLAMAS`, `LLAMA`, `T.llama`; `on`: off in `?sim`): rare, a find. `herds` a journey, each on its own leg of `legs` (never the
  first), tucked away `lat` m off the trail; now and then (`bach`) a lone male on another. None in Falcon Canyon, up the pass or at sea. Own
  rng, a new seed a journey (`LLAMA.seed`, `llamaPlan`, `llamaSpotOK`). A herd: a male, `f` females, a cria maybe. Found: the first dog within
  `findR` of one (`llamaFind`, `H.found`): ❗🦙, a chime; the journey's first, a banner, Hank's word, the hint. They graze their range (`range` m,
  `llamaGraze`), kush by night, shy off a dog going faster than `creep` m/s (`shy` m) or any within `close` (a creeping dog gets close); a bark
  sends them off (`llamaBark`: herding, not a nag). A dog crowding one (`spit.dogR`, `dogT` s): spat at.
- **Population**: a grown male (`adultDays`, `L.grown`) seeks the nearest free female within `seek` m (`seekB`: a bachelor), `llamaMateFor`;
  they kush and mate `mateT` s (an orgle, ♥), she's pregnant `gestH` h (`L.preg`; a male near: spat off), then a cria at her side
  (`llamaBirth`, `L.mum`), grown at `adultDays`; a young male grown leaves his herd (`llamaGrownUp`, `llamaRoam`). Two males after one:
  a spitting match, the weaker gives up. Caps: `max` wild, `maxG` guards. A guard's cria is a guard; wild males court guards too.
- **Prey** (COYOTES, COUGARS): a cria's taken as a lamb is (`criaPrey`; in `pickPackTarget`, `cougarTarget`: lambs first). `L.grabbed`:
  the predator, which moves it (it dangles, kicking); a shut pen keeps it safe (`L.pen`). Dropped (a dog, a guard's spit): off it runs.
  Carried home: gone (`preyKill` → `llamaKilled`, `G.stats.criasLost`; no grave). Online: `grabbed`; a coyote's `prey` is a sheep or a cria.
- **Capture** (ROPES): a dog dragging a rope within `catchR` of a grown wild one (not `L.waryH`): the rope's on its halter (`llamaRope`,
  `R.llama`, `L.ropeI` a little past the dog's grip) and it's a tug of war, the llama as a man on a rope (`e.npc`, `ropeNpc(R)`,
  `hankTug` with `T.llama.tug` × `L.str`; it pulls facing away, spits at the dog now and then: just goo). Heaves on the beat break it;
  mashing or just walking back loses. Lost (or let go): it bolts (`boltSpd`, `bolt` s), wary `waryH` h (`llamaTugEnd`). Won: broken
  (`L.tame` 1), led on the rope (`llamaLed`, `lead`: barely pulls back); within `joinR` of 2 sheep, or in a pen: a guard (`llamaJoin`,
  `L.tame` 2), off the rope (still in the dog's mouth), her cria too. Hank and the vagabond keep off a rope with a llama on it.
- **Guards** (`llamaGuard`, `llamaGuardGoal`): round the flock's edge (`L.ga`), in its pen (a hop over the fence: `llamaHop`, `llamaGo`),
  kushed by night; far off and out of sight: caught up (`far`). A foe within `alarm` m: an alarm call, at it; within `spit.r`: SPIT
  (`llamaSpitAt` → windup `wind` s → `llamaSpitLaunch` → `fly` s → `llamaSpitHit` if it's still within `hit` m): coyotes (`hitCoyote`,
  `coyote` heart), cougars (drop / spooked / off the dog), the falcon low (drops, off), snakes (home), goats (home). Barks don't move them.
- **Sea**: at Cold Harbour they hop aboard with the flock (the deck's a pen); cast off (`llamasAboard`, `seaCastOff`, `seaStart`): every
  guard aboard, kushed forward of the mast (`llamaDeckSpot`). Wild ones stay with the land (hidden).
- **Bonk and grab, as sheep** (`launchLlama`, `llamaAirStep` with `airStep`/`airSpin`/`airBounce`/`airHits`, `llamaPounce`, `puntK` by
  `llamaMass`): punted, it flies, somersaults, bounces, lands (into water: it scrambles out); it caroms sheep, bowls coyotes, knocks dogs; a sheep
  (dog, llama) flying into one caroms it (`airHits`, by weight).
  Grabbed by the scruff (`grabKinds.llama` / `cria`, `holdStep`, CARRY SWING), carried, flung (`llamaLetGo`); a grown wild one bucks
  free after `buck` s and spits. On a rope (or a tug): it stands its ground (BOING). Landed: a wild one runs (or spits back).
- **Shearing** (HANK): no sheep to shear, he shears a guard (`llamaShearNext`, `HANK.job.L`, `llamaShearStep`): `shear.yield` × wool ×
  size² 🧶; fleece regrows over `regrowDays`.
- **Drawing** (`llamaModel`, `llamaGeo` per coat, `syncLlamas`, every screen): a woolly barrel and neck (FUR shells), banana ears, a
  topknot, big lashy eyes, a split-lip smile, two-toed feet; coats (`LLAMA_COATS`): white … black, paint, appaloosa, two-tone. Pacing
  walk, grazing, kushed, chewing, ears back when cross, cheeks puffed to spit. Tame: a halter; guards: tassels on the ears. Fleece by
  `L.wool`. Spit: `spitFx` (a glob, a splat). Sounds: `LSND` (hum, alarm, gurgle, spit). `llamaFx`: what the sim's events look and sound like.
- **Journey save** (`onSave('llamas')`): the seed (the same herds), which were found, the guards (by the flock; aboard at sea). Wild
  herds come back as they started.
- **Online**: `NET_TYPES.llama` (`rp`: its rope, `ropeI`, held, flying), `llamaFx` / `spitFx` relayed; a guest wipes its own (`llamaWipe`).
- **HUD / map**: 🦙 guards in the flock panel; the map: guards always, wild ones where a dog's been (`mapLlamas`). Dev: `\` a herd by
  the first dog, again: one a guard (`devLlama`).
