# Predators

- **Coyote packs** flank and strike together; chase off the alpha to break
  them. Shut pens stop them (till they dig under: Burrows). One more a night per extra dog (`T.coyotePerDog`).
- **Trapped coyote.** A catch in a pen goes out by the gateway (`c.fromPen`);
  gate shut (`c.trap`) → it mauls a penned sheep where it stands
  (`coyoteMaul`, `s.maulHp`, `T.coyoteMaul`) till a dog scares it off, then
  runs down the next (`penHavoc`), dodging dogs, till the gate opens.
- **Burrows** (`BURROWS`, `T.burrow`, COYOTES): from night `fromDay`, some packs a night (`chance`, `p.digs`) that find the flock
  all shut in prowl `wait` s, then dig under the fence (`p.phase 'dig'`, `burrowSpot`: off the gateway, between the troughs, far
  from dogs; `p.digger`, `burrowDig`, `c.digOn`), not with a dog within `shy`. Open (`h.open`): one at a time under it (`'raid'`,
  state `'burrow'`, `c.bur`, `burrowGo`/`burrowStep`; out of reach down there), a sheep grabbed and dragged out the same way
  (`burrowOut`; leaving at dawn too). A dog standing still on either end fills it (`updateBurrows`, `fill` s): every pack there
  loses `dismay` heart, starts over. Filled with one inside: trapped as above. Stays till filled; no night fast-forward while
  they're coming to dig or one's open. Off in `?sim` (`T.burrow.on`). Online: `NET_TYPES.burrow`, coyote `sink`/`bt`/`digOn`.
- **Den defence.** A dog or sheep startling a sleeping den (`defendDen`,
  `T.denDefend`): the pack nips dogs and snaps sheep away, only within `r` of
  the mouth (leash), then goes back to sleep.
- **Cougars** (`COUGARS`, `GROVES`, `LAIRS`, `T.cougar`): loners. `legs[i]` round the camp at the end
  of leg i (`COUGAR_CAMPS`), each its own territory (`k.grove`: `trees` trees, `apart` m from any other's,
  `penGap`+ m off pens; the land `room` m wider there). Night only: each near the flock (`cougarsNear`)
  takes a random tree of its own (`perchGrove`, `k.lair`, synced) and hunts, one after another (`delay`,
  `gap`); none comes down while another's out (`cougarAbroad`). Held up only by a dog barking under its
  tree (`treedR`). Lambs first, never rams; pounce or bump drops the sheep; vaults pen fences. Pounce one
  running away: bonked, yowls (`Sound.yowl`), knocked head over heels, dazed (`daze`, `k.dazeT`, synced;
  stars), limps home at `bonkRun`×: bonk it again, all the way home (dazed at its trunk: up it goes).
  The night doesn't fast-forward while one's out. `s.grabbed` may be a cougar (`k.isCougar`).
- **Falcon** (`FALCON`, `NESTS`, `T.falcon`): day only, from day 2 (`fromDay`), every few hours circles
  (shadow), screeches, dives. A dog: carried a way, dropped (`d.air.kind
  'falcon'`). A sheep (never rams): `s.grabbed` = falcon, carried to the nearest
  nest spire, eaten after `eatT`. A bark under it, or at the spire, drops it; its mark barking sends it off.
  Only short of Falcon Canyon's far end (`falconLand`, nests too); once the flock's past it, gone for the journey
  (`G.falconGone`): none in the snakes, up the pass, at sea. Off in `?sim` (`T.falcon.on`).
- **Falcon Canyon** (`CANYON`, `T.canyon`, `canyonK`, own rng): a narrow red gorge (`s0`…`s1`)
  between Sweetgrass Meadow and the snakes; the only way on. Bones and feathers at its mouth, a ram's
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
- **Coyotes never shove at a fence.** A goal behind a shut pen's fence: the nearest spot this side (`navPenSide`); none
  reachable: as near as it gets, standing (`NAVDIR.stop`). Pulls that cancel (walls, packmates) slow it, not spin it.
  A sheep behind a shut fence isn't prey, whatever `s.pen` says (`shutIn`).
- **Barks wear off**: a coyote falls for one bark a night (`T.coyoteBark.wise`,
  `coyoteBarkWorks`; a team bark too, barks within `same` s are that one), a cougar
  for `T.barkWise`; then bold (`barkWorks`, hint `coyote-wise`): only a bonk moves it,
  and it lunges at dogs to nip. Packs lose less heart per bark (`packK`).
- **Team bark** (`T.teamBark`, `teamOf`, `teamBark`, `teamBarkFx`): dogs barking within `win` s and `near` m
  of each other (chained) → "TEAM BARK!". Predators only: every bark reach × (1 + `grow`·(n−1)). Cougars and
  falcons: always works (wise or not; no `barks` counted), a cougar drops its catch or lets a dog go, a falcon drops.
  Coyotes: more heart lost, no `packK`, but still their one bark. A third, fourth joining: a bigger one. Then `cd` s
  hoarse. First wise cougar with 2+ dogs: hint `team-bark`.
- **Rattlesnakes** (`SNAKES`, `T.snake`, own rng): behind their own desert rocks
  (`latMin`…`lat` off the trail) past Falcon Canyon's exit. Near: rattle (sheep shy), slither out
  after its mark (`snakeSlide`, `slither`; `n.x0/z0` home), strike one in reach, back home a
  while (`cd`). Bark or pounce: back. Bite: `s.venom`, slower, sickly, dead in
  `dieHours` untreated.
