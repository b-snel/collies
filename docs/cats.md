# Mice & cats

- **Holes** (`MOUSE_HOLES`, `mouseHoles`, `mouseHoleOK`, `T.mouse`; on: off in `?sim`): `holes` round each camp's pen (`ring` m past its fence),
  `field` every `gap` m along the trail (`lat` m off it), in grass; none in water, a pen, the canyon, the harbour, at sea, on the trials' ring.
  Own rng (fixed seeds): every screen the same, made at load (a test: on first use).
- **Field mice** (`MICE`, MICE): out of holes within `near` m of a dog or the flock (`h.live`), `n` [day, dusk, night] × `ecoD('mice')` (≤ `max`;
  a boom: lots, a crash: hardly any; `miceWant`); over that or out of range: down their holes, gone (`mouseHome`). Dash and stop (`dash` m;
  sitting up to sniff), nibble seeds round home (`mousePlan`), groom. Off home (within `home` m; else away) from a dog (`shy`, sprinting ×1.5,
  pouncing `pounce`, lying ×0.4), Hank, a moving sheep's feet, a cat it sees (`mouseThreat`, `mouseSees`): a cat out in the open from `see` × 2.2;
  one creeping up only if it's sitting up and the cat moves (the wiggle: now and then), or right on it. A stalking cat within `hear`: it sits
  up (`ears` a s; `sitT`), looking round. States `run walk sit nibble groom hide caught air dead`; `m.h` its height (a trough, batted about).
- **Raid** (RAID): by night mice from holes near the raid pen (`MC.raid`: the flock's, else the camp pen nearest it; never the deck or a fold)
  go to its troughs (`mousePlan` 'raid'), nibbling `eat` food an hour each (`mouseNibble`, `troughEat`). A cat in or by it: they smell it
  (`catScent`: ×(1 − 0.9) awake, ×(1 − 0.7) asleep), keep `fear` m off one they know is there (`catFearAt`: not one creeping up or lying in
  wait), leave a trough one comes by. Out of sight or fast-forwarding (`raidStep`): `raid` an hour × ecoD × (1 − `raidGuard`: ours by it
  `guard`, asleep `doze`; a stray hunting there too). Llamas: nothing. `MC.night` (the night's loss, `G.stats.miceAte`): the dawn card's
  `🐭 −n 🌾`; past `say`, once: Hank's word, the hint.
- **Strays** (`CATS`, `T.cat`): by each camp the flock comes within `near` of, round(`ecoN('cats')` × `share`) (≤ `max`; `catStrays`): mostly
  moggies, `pure` a purebred (`CAT_BREED_IDS`, a coat < `CAT_COATS`; by the mountain camp and the Trading Post `cold` a Norwegian Forest
  Cat), a queen's kittens (`kit`, mostly her breed); each a hideout (`catHideout`: by the
  cemetery, round the back of the pen, off the trail). Gone past `far` (not a follower; `catCamps`). By day in the hideout loafing, asleep,
  grooming (`catIdle`; under cover: `c.cover`); `dusk`…`dawn` (or hungry) out hunting round the camp (`catArea`: the hungrier, the further; a
  lone one roams now and then, `roamT`). Shy (`catDogs`): a dog coming on within `shy` (sprinting ×1.6): off (`catRun`); just standing: it
  watches; lying still past `lie`: fine; cornered within `corner`: a hiss, right on it (`swipe` m): a swipe (the dog stunned), then off. A
  bark: off, trust −`barkTrust` (`catBark`; mice dive too).
- **The hunt** (`catHunt`, `c.hunt`): sees one within `see` (night `seeN`; `catSpot`), stalks low (`stalk` m/s; a crouched run further out),
  freezes while it's up and now and then, `wiggle` at `leap` m, `pounce` (an arc: `pounceT`, `pounceH`). The odds (`catOdds`): `base` × `busy`
  (nibbling, unaware) × `alert` (up, looking, off) × `kit` + `hungry` × hunger; `MC.force` (tests). Caught: `pin`; well fed (`play` × (1 −
  hunger)) it plays: bats it about, lets it run `lets` s, after it again (`re`; ≤ `rounds`; near its hole it gets away); `bite` (ECO:
  `ecoEat('cats','mouse')`, `MC.kills`, ours `G.stats.mice`), `eat` `eatT` s (−`mouse` hunger), `groom`. A miss: it darts off (home if near);
  the cat grooms (it meant that) or chases `chase` s, a last pounce. Out of sight or fast-forwarding (`catFar`): `farHunt` an hour × ecoD.
- **Hunger** (`catHunger`): +`hungerH` an hour (a stray by its camp −`scrap`; a kitten by its mum less); a mouse −`mouse`, a fish −`fish`.
  At 1 for `starveH` h: gone (`catKilled` 'starved': ours a toast, Hank, `G.stats.catsLost`; a stray: ECO one fewer). Ours past 0.75: Hank
  (once a day), the hint; the HUD's count marked `!`.
- **The bowl** (FISHING's `BOWL`, `bowlTake`; `catBowl`): a cat smells fish in it within `catBowlR` (`smell`, × `duskSmell` late, × (1 +
  `hungrySmell` × hunger); ours: anywhere near) and comes; ours first, one at a time. A stray waits out of reach while a dog's within `bowlShy`
  (a dog lying still past `lie`: fine; patience). Eaten (`bowlT` s, `catFed`, ♥): a new day fed: `c.fed` + 1, trust; fed once: it follows the
  flock camp to camp (its camp's the flock's; between, `follow` m off). A day unfed: −`forget` (`mcDawn`). `adopt` days: ours (`catAdopt`).
- **Ours** (`c.owned`: a name from `CAT_NAMES`, a collar; ECO one stray fewer, `G.stats.cats`; her kittens too): unafraid of dogs (a bound right
  at it: a hop aside, `catDodge`); by day at its place by the flock's edge (`ours` m out; by its pen), now and then rubbing a dog standing
  about (`rubP`, `rub`, a purr, tail up); far behind out of sight: caught up. By night in the flock's pen (a hop over the fence: `catGo`,
  `catHop`): patrols by the troughs (lying in wait: `c.ambush`) and naps by turns (`patrol`, `nap`). Hungry: hunts, further from the flock. At
  sea: aboard by the stern (`catAboard`).
- **Kittens** (KITTENS, `T.cat.mate`): at nightfall (`catNightfall`) a tom (`c.male`) and a queen of ours, grown, under `fed` hunger, by the
  flock's pen: `p` she's expecting (`c.preg` days, `c.sire`), ♥; strays by their camp: `wild`. A litter of `litter` by her (`catLitter`: her
  breed or his, either's coat; ours named; Hank's word; strays: ECO + n); ≤ `kits` kittens, `ours` cats. A kitten (`c.kit`, under `grow`
  days, `c.mum`) trails her in a line, tumbles round her resting, sleeps by her (`catTrail`); grown: on its own.
- **Prey** (PREY): `catPrey(c, by)`: not in the air, a hop, held; up a post: safe from coyotes and cougars; behind a shut fence: from coyotes;
  under cover: from the falcon. A coyote on the hunt runs at one within `coyR` (`coyoteCat`, `chase` s, then `cd`), grabs it (`grab`: a snack,
  `preySnack`, the pack hunts on), eats it `eatT` s on; a cougar's `cougarTarget` (`cougarSc` m worse than a sheep); the falcon by day
  (`falconPick` / `falconSnackW`: `falcon` × a sheep's pick, a kitten ×3, near a dog; `falconSnatch`, to its nest, `preyKill`; dropped:
  `falconLetGoSnack`: it falls and lands on its feet). It sees one within `seeR` (asleep: 0.4×; a start first, `c.react`): runs for a shut
  pen within `penR` (a coyote), a fence post within `postR` (`catPost`, `perch`, down once it's gone a while), cover within `coverR` (the
  falcon: its hideout, beside a trough), else away (`catRefuge`, `catDanger`). Taken: `catSnatched` (a yowl); dropped: `catFreed` (off). A
  stray's wild (`preyWild`): no toast, Hank, stats; ours: the toast, Hank, `G.stats.catsLost` (`catKilled`). Never `killSheep`.
- **The falcon takes ducks** too (DUCKS): one on land by day near a dog (`falconSnackW`: `T.duck.prey.falcon`), to its nest, eaten
  (`preyKill` → `duckDie`); dropped: it flaps down (`herdLaunch`). No alerts.
- **✊** (`T.grabKinds.cat`, `catGrip`, `catGrabbed`, `catHeld`): by the scruff it goes limp ('held'). Let go: on its feet (a stray off, trust
  down; ours a groom); flung: it flies (`catLaunch`, `catAirStep`) and lands on its feet. A shake: a cross mew.
- **States** (CAT LOOKS poses each): `sit loaf sleep groom stretch walk trot run flee stalk freeze wiggle pounce pin play bite eat drink hiss
  swipe rub meow climb perch held taken`; `c.h` its height (a pounce, a hop, a post), `look`/`lookUp`, `tail`, `puff`, `crouch` (`catAnim`).
- **Sound and fx** (`catFx`, relayed: `CSND` meow, purr, a mouse's squeak; `Sound.hiss`): found, meow, cry (taken, flung), hiss, swipe,
  pounce, kill, fed, love, kittens, adopt (a banner), lost, land.
- **Online**: `NET_TYPES.cat` (tag `'I'`: `netRefStr`; pose, height, looks, mood, ours, held, taken, its mouse, its mum), `NET_TYPES.mouse`
  (tag `'1'`; its hole by index: the holes are every screen's own). **Save** (`onSave('cats')`): ours (breed, coat, sex, name, hunger, age,
  expecting, her kittens), followers (fed days, trust), what's been said, the night's loss so far.
- **HUD / map**: 🐱 ours in the flock panel (`!`: a hungry one, `hudCats`); the map: ours (`mapCats`; taken: a red blink). **Dev**: 🐱 a stray
  by the dog, mice round it; again: it's ours, and a mate (`devCat`). Test: `cat-test.mjs`.
- **The barn** (HANK'S BARN, docs/ui.md): ours in its 🐱 tab: renamed, a collar's colour (`catEdit`; online `ct`), the mice each has caught (`c.caught`).
- **Gandy and Linus** (`CAT_STARS`): the player's own two toms, met every journey as strays: Gandy (a grey and white Norwegian Forest Cat) by the
  mountains' camp, Linus (an orange tabby, ringed tail) by the ocean's; once a journey (`MC.stars`, saved). Adopted, they keep their names; another of
  ours in the same coat takes the name only while it's free (`catNameNew(c)`).
