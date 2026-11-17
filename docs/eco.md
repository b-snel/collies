# The ecosystem

- **ECO** (`ECO`, `T.eco`, ECOSYSTEM; on: off in `?sim`): the wild round the trail, leg by leg (`ECO.legs[i]`: `CAMPS[i]` → `CAMPS[i+1]`, its end
  camp's; `ecoLeg(x, z)`: 0 desert, 1 mountains, 2 ocean, 3 Sweetgrass / the canyon / the snakes, 4 the pass; −1 at sea, Cold Harbour). Each leg
  a population model, stepped every `tick` h, near or far (`updateEco`, `ecoStepLeg`, `ecoMove`, `ecoRun`). Own dice throughout (`ECO.R`).
- **Prey** (`prey`, K by leg in `hab`): mice, ducks, fish grow logistic (`r` a day), mice × e^noise (seed years: an OU walk, `noise`), `in` a day
  wander in, never past K. **Predators** (`pred`): coyotes, cougars, falcons, stray cats (prey too). Each eats by Holling II over its prey (`a`
  per prey a day, `h` days to handle one; other food `alt`: insects, berries, carrion, deer; `need` a day; prey worth `e` mice): how fed it is
  (`fed`, a `lag`-day average) sets births (`b`); deaths `m`, crowding `dd` (× n / base), hunger `starve`; `in` a day wander in. Mice drift
  to the next leg's land (`move`). So: mice boom, the coyotes follow days later; the mice crash, the coyotes go hungry and dwindle; the mice come
  back. Cats are both: coyotes keep them down (no coyotes: more cats, fewer mice). A small steady take of mice barely dents them (fast
  breeders); a big one (a few cats' fill) does, and the coyotes thin too (less for them).
- **Mating** (`ecoMate`, `pred[j].mate`): births × n / (n + mate): a mate to find; few about, fewer litters (lone cougars barely breed).
- **Migration** (`ecoDisperse`, `mig`): predators and strays set off, a day `base` + `hungry` × hunger + `lone` × (no mate); the hungrier, the
  further they look (legs away: `reach`), toward land with food, mates and room (home weighs `home` ×); they bring their hunger. So a leg that's
  eaten out empties into its neighbours, and one emptied fills again from them. Each line between legs: its flow (`ECO.cross`, `ecoCross`).
  In the game: hungry coyotes come from dens further off, hungry cougars from groves further off (`ecoReach`: `den`, `grove`).
- **A journey** (`resetEco`): fresh legs, `burn` days on its own dice: each leg somewhere else in its cycle. The long run (`ecoBase`, once, own
  dice, `base` days): each leg's mean of every kind, what `ecoK` is against.
- **The game reads it**: `ecoK(kind, li)` (n / its mean, clamped `k`; off: 1): tonight's coyotes (`ecoCoyotes`, both waves), a den's size in
  lean times (`wakeDen`: fewer, not only more), a cougar hunts (`ecoCougarP`: few about, some just watch; hungrier, keener), the falcon's
  passes and the canyon's swoops (÷), ducks taken out of sight (`ecoDuckK` × `farP`). `ecoHunger('coy')` × `bold`: braver coyotes
  (`coyoteCourage`). `ecoD(kind, li)` (prey / K): mice by the pens, fish biting; `ecoN`: strays by the camps.
- **And the game feeds it**: `preyKill` → `ecoMeal` (a coyote's, cougar's, falcon's kill: the leg's predators fed, its kind one fewer; `meal`:
  what each is worth), `ecoEat(pred, prey, li, n)` (a cat's mouse, a dog's fish), `ecoAdd` (a stray taken in). With the ducks on, their
  bunches are the ducks' count (`updateEco`).
- **Hank** (`ecoNews`, `say`): once a leg, by day, as the flock comes onto it: hungry coyotes coming in from the next leg's land (`ECO_LAND`),
  hungry coyotes, a mouse boom, many coyotes, a mouse bust, few.
- **Map** (`mapEco`, big): each leg's wild where a dog's been: 🐭 🐱 🐺 🦅 🐆, each ⬆ / ⬇ against its mean, ❗ hungry coyotes (`ECO.show`,
  `ecoShow`; online: `NET_TYPES.eco`); on each line between legs, the kind on the move most, an arrow its way (`mapEcoFlows`, `ECO.flows`:
  past `mig.show` a day × base).
- **Save** (`onSave('eco')`): the seed, every leg's numbers and how fed. **Dev**: 🌿 the leg here: a mouse boom, then a crash, then as it was
  (`devEco`). Test: `eco-sim.mjs` (years of it: persistence, cycles and lag, no predators, a plague, mesopredator release, our cats competing with
  the coyotes, the game's reading, save, migration and mating; `--chart FILE`).
