# Mountain pass

- **Mountain pass** (`PASS`, `T.pass`, `passK`, `liftArr`): past the Trading Post the floor
  climbs `rise` m (flat at each fire camp); `blk` is by height over the floor. Walls in ledges
  west, a lip then the drop east. Nothing else up there (dens, nests, plants, salt, brambles, digs).
  No coyotes while the flock's up there; at night by a fire is safe (`passSafe`: the night hurries).
  - **Cold** (`T.cold`, `sheepCold`, `dogCold`): builds in the snow × (1 − `wool`·`s.wool`) × snow on it,
    night, blizzard, lamb; huddled less; `heatAt` warms; below thaws. At 1 for `dieHours`: dead ('cold').
    Slower (`coldPep`, `dogColdK`), blue, shivering. Dogs never worse than slow. Llamas: `llamaCold` (docs/llamas.md; a saddle blanket).
    The keg (a TRIALS prize, docs/trials.md): a dog wearing it warms what's round it (`kegHeat` in `heatAt`); its bark's a nip.
  - **Fires** (`PASS.fires`, camps without pens): Hank lights the flock's (`passFireGoal`: the next one up within
    `reach`, or one it's under `left` m past; never back down; from `base` − 30 m; `hankFire`, `light` s), `burn` h of fuel; by night he sits by it
    (his side of it kept while the flock's all round it, `f.hankA`; blocked short of it, he stokes it and sleeps from as near as he gets).
    Out or under `low` h: his first job after a dog down (`fireDue`): patients, shearing, ropes, burials wait; asleep, he's up to stoke it. Cold ones take the `spots`
    (two rings) round it, the coldest first (`warmGo`, state 'warm'; one up the hill first: Up); nobody's jostled into it (`fireShove`). Warm out to `r1`.
    Windbreak and watchtower are set against the cliff: nothing between a fire and the ground round it. The top one's in the ice cave.
  - **Up** (`T.pass.up`, `passUpFire` → `MIND.upF`, `passUp`, `upScore`): the flock's way on is the next camp up (its middle `past` m
    beyond one: the next; at one, left alone, that one till `hold` m past). Toward it: the grazing front leans `graze` (a climb at `pace`),
    a look for grass `seek`, grass back down counts `behind` less; flight off a dog to the side bends up `flee` (not with the dog above);
    the walk-on `move`; milling `wander`. None within `stop` m of the camp, above it, off the floor, by the side trail's mouth, within
    `edge` m of the arena. The cold: a lit fire up within `draw` m first (the top's: as ever); one behind only within `back` m past it, or freezing
    (`freeze`). Calm ones go round the ice and the cracks along their edge, however keen. The ice gate shut, the flock below it: its foot
    (`GATE.foot`, `gateHold`: in to `hold` m short of its edge, none on up; `kb`: grass back down still counts less), no fire past it.
    A lane through: to its foot, up it (`gateLead`), on to the next camp past it (the base camp left behind). Host only (sheep).
  - **Base camp** (`T.pass.base`, `f.base`): a fire at the foot of the climb, added after world gen's draws (world gen never sees it). Its
    stick teaches the torch: `hint('torch')`, nudges (`drawTorchOverlay`), Hank's lines.
  - **Ice gate** (`GATE`, `T.iceGate`, `gateIce0` / `gateIce`, `gateS`): a band of ice wall to wall across the climb just past the base camp (`s0`…`s1`,
    wavy edges), switched on after world gen's draws and the scenery (`GATE.on`: before that `iceK` doesn't see it; its treads hidden: `instanced` `gate`).
    Up onto it: a skid (`keep`), then back down (`gateBack`, `g`), even creeping, no `slipCd`. The way on: a lit torch melts a lane (`gateScan`:
    ≥ `lane` m all the way, `GATE.open`, `GATE.path`); its melt never snows over (`gateV`). Hank waits by the base camp's fire (`gateWaitGoal`,
    `hankGate`: `GATE.wait`), then walks up the lane; the flock waits at its foot (Up), then it's steered to the lane (`gateSteer` in `passAvoid`).
    No grass on it. Lines: "Grab the torch…" (`gateIntro`: the base camp lit, what he sees), nags on a slip with no lane and no torch lit or
    carried (`gateSlip`, `GATE_NAGS`, `nag` s apart, then further, what he sees; not over a line that matters: `hankBusy`), lit near it, the
    lane through (`gateOpenFx`; after what he's saying).
    A dev jump onto it or past: all melted (`gateMelt`, `GATE.all`). Online: what's melted of it (`NET_TYPES.pass.gate`, `gateMask`: friends only melt
    more from it; none: iced again); guests find their own lane (`gateScanTick`).
  - **Torches** (`TORCHES`, `T.torch`, `holdKind 'torch'`): a stick by each fire (`f.torch`), stood in a cairn, leaning, a warm glow and a twinkle
    over it (`torchPlanted`); dropped: along the ground under it, never into it. ✊ carries it; its tip in a lit fire: alight
    `burn` h (× `blizz` in a blizzard). A lit one lights a cold fire, warms (`torchHeat`), melts. Off the mountain: home (`torchHome`).
    On the ice gate's ice it slides back down (`torchFly`); out on it burnt out or stuck (shut): home. Online: `NET_TYPES.torch`.
  - **Melt** (`MELT`, `T.melt`, `meltTex`, own 2 m grid; `MELTV` the pass's vertices): lit torches and fires melt the snow: `gCap` goes
    from what shows through (`gSnow`) to the meadow under it (`gUnder`), the grass with it; `iceK` × (1 − melt), the ice glaze gone there.
    Snows over `refreeze`/h (× `night`), `blizz`/h × a blizzard. Guests melt their own (`updateMelt` in `syncPass`), the host sends the grass.
  - **Snow** (`s.snow`, `T.snow`): a blizzard piles it on; running sheds it; heat melts it.
    **Blizzards** (`PASS.blizz`, `T.blizz`): now and then while the flock's up there; whiteout.
  - **Ice** (`ICES`, `T.ice`, `startSlide`): onto it moving: slide downhill, spinning, legs going,
    slide whistle (`SFX.slip`). Dogs barely steer; a jump gets out. Hank too. Calm sheep go round.
  - **Crevasses** (`CREVS`, `T.crev`, `crevFall`): sheep or dogs (not hopping/lunging) drop in
    ('crev', sunk). A sheep: grabbed out. A dog: mash Ⓑ out (`crevEsc`), `cost` stamina a press, no breath
    back while mashing (`rest`); exhausted: 💨, nothing (`crevTiredFx`). A friend's grab gets it out too (`crevAlone` false: 🗣 ✊). Calm sheep go round.
  - **Goats** (`GOATS`, `T.goat`): on ledges; by day one bounds down at a sheep, dog or Hank in reach,
    windup ❗, charges, bonks it down the mountain (launched 'tumble', lands, rolls 'roll').
    A bark (`goatBark`) or a pounce (`goatPounced`) sends it home.
  - **Burning** (`s.burn`, `T.burn`): a sheep carried, flung or bolting into a lit fire catches;
    too hot to hold (HOT!); runs mad, then rolls it out; singed (`s.wool` → `wool`, `s.soot`). Alight, it melts the snow and ice round it (`melt`).
  - **The ice cave** (`CAVE`, `T.pass.cave`, `caveD`, `inCave`): the top fire (`f.cave`) moved into it after world gen's draws, west of
    his spot, its mouth (±`mouth`) toward him: past his reach (leash + butt), in a punt's (~15 m). Walls `block`ed (a ring), a dome of
    glassy ice (fresnel), the doorway (low jambs, no lintel: side on it read as a wall; flagstones out of it), icicles, the fire's glow
    (`C.glow`, out of its mouth `C.spill`), a beacon on a spire off the back of its crown. Snowballs smash on it (`caveFx`); he throws at
    what's out in the open first (`yetiPick`). While he's up Hank keeps in it (`passFireFind`); round to its mouth the clear way (`caveDetour`:
    it backs onto the cliff). A burning sheep or a lit torch against it: steam, a hiss (`caveHiss`); nothing melts it.
  - **The yeti** (`YETI`, `T.yeti`, `SNOWBALLS`): wakes when something's past `arena`; rolls snowballs
    that grow, headbutts what's close; a pounce bounces off him. A burning sheep flying into him:
    a hit (`yetiStruck`); `hp` and he's done (`yetiBeaten('fire')`). HUD 🦍 ♥♥♥.
  - **Hank's nags** (`YETI.nag`, `T.yeti.nag`, `YETI_NAGS`, `yetiNag`, `yetiNagOn(kind)`): no hit yet: a line `first` s in, then every
    `every` s (the clock waits while one's alight or a dog's up the side trail; a crack in the rock wall: as a hit); on a pounce off him, a
    cold sheep a dog sent at him, a snowball bowling a dog (`kind`); `cd` s apart (both further each nag: `yetiNagK`), only what he sees,
    subtitles only; never over a line that matters (`hankBusy`: forced, till it's off the screen, or on its way; the gate's nags too): after
    it; one nag (gate or yeti) `T.hankNagGap` s after another. No torch hint or nudge at the cave while he's up. `tiers` lines a kind,
    snarkier (SIGH… / TSK!: `yetiNagFx`); a hit: a cheer, back `back` tiers (`yetiNagHit`). Beaten: none. Only flights into him count
    (`yetiStruck`: not his own butts, snowballs).
  - **The rock wall** (`SIDE`, `ROCK`, `wallD`): the hidden side trail (`sideD`: a level road `hw`×2 wide, its mouth
    `flare` wider, `flat` m level past its edges) up behind the west rim to a ledge (only up it: a narrow cut to the
    rock); `cracks` sheep flying into the wall: it falls on him ('crushed', an arm out). A fin of
    split rock: its blocks one instanced mesh (`R.stones`, `wallDraw`: standing, leaning, toppling, heaped).
    Down, its heap's a way over the rim from the ledge: walkable (`rubbleStamp`, `sdfPatch`), a bump underfoot (`HEAP`, `heapH` in
    `groundY`; its stones drawn on `terrainH`) till `resetPass`. Stamped after `yetiBeaten` (the gap's ice stamp comes off first).
  - **The door** (`SIDE.door`, `DOOR`, `T.yeti.door`): the same, lower, across the side trail's road `at` m up it, between its gate
    stones: in the way (`doorStamp`, after world gen; online: `NET_TYPES.door`) till `cracks` sheep knock it down up the road (open; its
    heap a bump: `HEAP2`). Hank wonders at it the first time he sees it.
  - **Rickety, both** (`WALLS`, `wallStruck`, `wallFall`, `updateWall`): cracked, leaning, gaps (`lean0`, `gone0`), grit trickling,
    loose stones rocking and a creak with a dog by. A dog's pounce (`wallPounce`, `T.yeti.wob`): a wobble, the dog bounced back, never a
    fall (Hank says so once). Hits: cracks, chunks off (`DEBRIS`, drawing only); down: rumble, dust, shake, hit-stop, blocks tumbling.
  - **Scenery** (block before `buildSDF`; own rngs): crags (`passWall`, `passRim`), goat ledges
    (`PASS.ledges`), the Shepherd Kings at the snow line, the old road (flags, treads), a watchtower at
    each fire camp, its beacon lit with the fire (`f.beacon`), frozen falls, needles, ice crystals, the
    hidden stair (flagstone courses, kerbs, walls, arches, gate stones, rune stone; nothing on the road), its door, the yeti's
    hall behind his pen, the ice cave (and its old camp below, cold), mist in the valley.
    Keep `blk`, `gCap` and the global rng as they are below the snow line (else the whole world moves):
    new decor → its own rng, in that block. The world-gen draws run over the pass first, so they still see
    the side trail as it first was (`sideWas`, `hWas`); the road opens up after (`sideOpen`).
  - **His cave** (`FINAL`, `finalPen`): iced shut (`p.frozen`) till he's beaten; then a pen. The way on is the gap
    (`HARB.gap`, `harbIce`, its ice gone when he's beaten: `seaWay`, always true now) and the road down to Cold Harbour.
