# Hank

- **Hank never leans on a wall.** A pen in his way: round it, one side, kept (`hankRound`, `hk.round`); a goal in it: over
  the fence (`hankCross`). Blocked short of his spot he stands easy (`hk.easeAt`, till it moves or he's shoved off where he stood); far off, a hop and a sidestep (`hk.sideT`).
- **Hank calls out only what he sees** (`hankSees`). Night at the campfire he
  sleeps on a mat (`hankNap`, silent); a predator within `T.hankNap.wakeR` wakes
  him shouting.
- **Shearing** (`T.shear`): Hank's clippers are always in one dig spot between
  the first two camps (`CLIP_DIG`); dug up, they're his. Awake, no predator near, he climbs into a
  shut pen (`hankCross`) and shears the woolliest (`s.wool` ≥ `min`) one at a
  time on its rump (`s.state 'shear'`): `G.wool` += yield × size². Wool regrows over `regrowDays`, saved with the flock.
- **Rescue** (`HANK.rescue`, `T.rescue`, `updateRescue`, `rescueGoal`, `rescueStep`, `reviveDog`): a dog out cold or drowning is
  his first job: he wakes, drops jobs and ropes, runs (`run`). In the water: trunks on at its edge (`hankChange`, `HANK.trunks`),
  swims (`HANK.swim`), tows it to `shoreNear`, CPR there (`HANK.cpr`, a drowned one coughs); trunks off once ashore. A partner
  can't nose a KO'd dog up. Nobody in `giveUp` s: it comes round itself. At sea: as before (it comes round). Online: `NET_TYPES.hank`
  `trunks`/`swim`/`cpr`, `rescueFx`.
- **Wounds** (`T.wound`): a sheep a predator lets go of is cut (`woundSheep`):
  deep bleeds (`bleedHours`), shallow festers (`infectHours`). No night
  fast-forward while one bleeds.
- **Vet** (`VET`, `T.vet`): the vagabond's second row 💉 🩹 💊 🧪 🪏 goes straight
  to Hank (`giveHank`; 🧪: doses for the pox, `docs/pox.md`). Stocked, he walks (over fences) to the worst-off he can cure
  (`HANK.care`, `s.state 'treat'`), before shearing (even the one he is shearing). His jobs: a dog down (RESCUE, above all), fire, patients, a tug, shearing, burials, then sleep (`hankWorkDue`: work keeps him up, or gets him up). Over sick sheep: icon +
  life ring; over Hank: what he's short of. Lines only for what he sees.
- **Burial** (`YARDS`, `T.remains`): his last job (`buryCan`): with a shovel, by day, nothing prowling, no
  patient, shearing or tug to do, not while the flock's up the pass, Hank carries a body (within `reach`) to the nearest camp's cemetery, digs,
  a neat stone rises, `lastWords` (by bravery, trait, bell, lamb, age; seeded).
  No cemetery till the first body: he sets it down by the spot and builds one,
  mallet in hand, picket by picket round the fence (`Y.built` 0…1, `yardStep`,
  `syncYard`, `T.remains.build`); stopped, it stays half up till he's back.
  Full: he adds a row at the back (`yardGrow`, if `yardRoom`; up to
  `T.remains.rows`); else the next cemetery; none: it rots where it lies.
- **At the trials** (docs/trials.md): an event on, the handler's post (the pen's gate for the pen), his shearing board (he shears what's
  brought: `trialShearStep`), the line; between events by the judge (after his jobs). He steps over the ring's hurdles.
