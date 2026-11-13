# Sheep

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
- **Scared sheep poop** (`T.poop`, `poopFx`, `POOP`, drawing only): past `at` stress or panic, now and then a few pellets out the back
  (`Sound.prrt`); they bounce, lie `life` s, shrink away. Each screen its own; `poopFx` is an fx (guests get it).
- **Lost sheep panic.** No flockmate within `T.lonely.far` (fences don't
  count) → `s.anx` builds: stress, wants its flock, trots back bleating, to the
  main flock however far.
- **Shared stores** (`STORE`, `shareStores`, `storeReset`): food, water and salt are one pool each across every pen ashore
  (not the deck). Put in or eaten anywhere: the pool; each pen shows as much as it holds. Start: the most any pen had.
- **Salt** (`s.salt`) runs down slowly (~8 days); out too long = death. Camp
  licks start stocked (`campStock`); sheep lick rocks in passing; lumps go to
  the pen's lick.
- **Water** (`s.thirst` 0…1, `T.water`): rises daily; parched too long =
  death. Each pen: a water trough (`pen.water`, on the side facing the nearest water: `waterDir`, `kitRing`) and a bucket (`BUCKETS`). Hold
  grab to carry a bucket (one per dog, mouth full); let go: set down
  (`dropBucket`); Ⓑ sloshes some out (`bucketSlosh`). A lying one gets shoved by dogs running into it, flies (spilling)
  when pounced (`bucketPhysics`, `T.water.kick`). Wade/swim to fill, walk up to any water trough to tip in.
  Penned thirsty sheep drink;
  a few crowd behind and barge (`T.water.hold`, `crowd`). First camp starts full.
- **Ram bravery** (`s.brave` 0…1, `T.brave`): under `ramMin` a ram never
  fights, braver ones charge more and further, past `cougar` cougars too.
  Lambs take mostly the sire's (`sireBrave`). Scales everyone's stress gain.
- **Ram nads** (`s.nads`, `T.nads`, drawing only): a cord and a pair on springs,
  stepped in world space (`nadsStep`); belly, hind legs, ground and each other
  collide. Size by `s.brave` (`nadsK`). Cold, wet, scared, charging: tucked;
  desert sun, age: lower (`nadsHang`).
