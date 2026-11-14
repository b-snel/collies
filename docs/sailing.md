# Sailing (issue #74)

Online: the host sails, guests draw it (`NET_TYPES` `sea`, `wind`, `wave`, `ring`, `station`, `orca`, `shark`, `kraken`; sheep `sw`
`sh` `lure`; `seaFx` / `ringFx` relayed). A guest keeps her clock, the waves' phases, her wake, the gusts, a front and a great wave going between
snapshots (`netSeaAnim`, `netWindAnim`, `netFront`), and does the land's carrying off / an island's things itself (`netSeaAfter`, `seaLandAway`, `isleShow`).

- **Cold Harbour** (`HARB`, `harbRoad`, `harbK`): real land. A gap in the summit's east rim, a road down the mountainside (`HARB.pts`),
  a mole, then the jetty. Cut into the terrain after world gen's draws (heights, `blk`, colours; the bay sunk); `HARB.mask`: its cells
  count as below the pass (`trailInfo`). World gen sees no sea (`SEA_LIVE`), so nothing else moves. She lies alongside from the start.
  Something through the gap: `seaWake` → `seaStart({ dock })`: nobody's moved, the gangway opens (stocked troughs draw the hungry); Hank
  walks down (`seaHankGoal`). Once aboard a sheep doesn't walk back off (`pen.mouthSeg`). Every sheep and dog aboard: Hank lashes it
  (`seaGangway`). Alongside, its leaf's held wide open (`gangHeld`): no dog swings, slams or grabs it into the way; only Hank (`p.auto`). Bow station, stick up: `seaCastOff` (not with sheep or dogs ashore: 🐑 / 🐕 n ✖). Sheep never brought down: `'left'`.
  The gap still shut: anything knocked onto the road hops back up (`seaWake`).
- **What's sea** (`inSea`): past the pier's shore end (`SEAM_V`), and everywhere once she's cast off (`SEA_AWAY`).
- **The boat never moves; the sea does.** The deck is a pen (`DECK`: `pen.deck`, its bulwark `pen.segs`, a gangway gate lashed at sea:
  `pen.lock`). 43.5 m stern to bow, 15 m across (`BOAT`; `boatHB`; the water shader's hull mask is built from it). Room to work: the tiller
  at the stern, the sheet aft, the halyard at the mast, the anchor at the bow; troughs along the rails (`deckKit`), the rings aft of them. `SEA.e/n/hdg` is where she is on the sea; `seaG` (the sea, islands, orcas: sea coords) is set to her pose undone. Cast off
  from Cold Harbour, the land goes with the sea (`seaLandOff`: `LAND` under `seaG`, and everything in `scene` that isn't the boat's:
  `seaKeep`); a new journey puts it back (`seaLandOn`). Things in the water drift astern (`seaDrift`).
- **Camera** (`seaCam`, `SEAC`, `T.sea.cam`): under way, a perspective chase camera astern and above, on the sea (not on her): the
  horizon's level and still, she heels and turns in front of it, it swings after her (`lag`). Alongside: the land's camera (`SEAC.k` 0);
  it glides between. `CAM_F` / `CAM_R` follow it (sticks go by the screen). Further back with something overboard.
- **Sky, haze** (`SKY_DOME`, `scene.fog`, `seaLight`): a dome on the sea, clouds that stay put; haze to the horizon (outlines too).
- **Pace** (`T.sea.pace`): she covers the sea that much faster than her hull feels it (`seaSpd`).
- **Waves** (`SWAVES`, `seaEta`, `T.sea.wave`): five trochoid trains (two of swell, in sets; three of wind sea) that
  grow with the wind (`SEA.state`). The wind sea runs with the wind (`SEA.run`); the swell runs from the weather that raised it, slow to come
  round (`SEA.swell`, `swellTurn`): after a shift, a cross sea; the water shader (`SEAW`: rings out to the horizon, per-pixel slope, Fresnel sky, glitter, haze)
  draws the same sum, so she floats on what you see. Nothing crawls on it. `seaRogue`: a lone great wave. `waterLevel` is a swimmer's y.
- **Wind** (`WIND`, `T.sea.wind`, `windWeather`): from, m/s. Each leg has its own (`ROUTE[i].wind`, `seaWeather`); a new leg's comes round
  to it over a while (`prevail`; a long way round: light airs as it goes). It never sits still: shifts that hold (now and then it settles
  `shiftStep` further round and stays, more often back toward the leg's own, never past `shiftMax`: `WIND.shift`), a quick wobble on top; light
  airs and calms wander more. Gusts drift down it as dark patches on the water (lulls: glassy), drawn where they are; a gust veers, a lull backs.
  `windAt(e, n)`: the wind there.
- **Fronts** (`windFront`, `WIND.front`, `T.sea.wind.front`, `ROUTE[i].front`): a line of new wind 55–85° round sweeps down from its windward,
  faster than she sails (set off to reach her in `eta` s): dark water and breaking crests behind it, a glassy lull ahead, a cloud bank over it;
  a dashed arrow on the dial where the new wind's from, a cold front's teeth on the chart, 💨 ❗, Hank calls it. The wind falls light, then a
  squall (+`k`) and a burst of rain (`windSquall`), and the new wind holds. Gull Rock's and Siren's Rest's legs: maybe one; Storm Key's: at the
  storm's height, it veers (she'll gybe). The Laser feels it where it is.
- **Sail** (`seaBoatStep`, `sailCoef`, `T.sea.sail`): lift and drag off the apparent wind and the boom's angle. The
  boom swings to leeward as far as the sheet lets it. From that alone: no-go zone, irons (she drifts astern; helm
  over, her head pays off), luffing, stalling, heel, leeway (more when slow), weather helm, tack, gybe (the boom
  crashes across: `seaBoomSlam`, swats dogs and sheep: `seaBoomSweep`; lying down ducks it; sheeted in: gentle).
  Reefed: less heel, less speed. Hull: drag, keel, a rudder that bites with way on; hard over it brakes.
- **Heel / pitch / heave** follow the water at bow, stern and sides; the sail heels her; the flock is live ballast
  (`SEA.bal`, `seaMass`): to windward they hold her up. Past `T.sea.deck.grip` feet slide to the low side
  (`seaDeckPush`); green water over the low rail washes sheep off (`SEA.awash`). The ride frightens them
  (`seaUnease`: a floor under stress; on deck they can panic, penned or not).
- **Stations** (`STATIONS`, `holdKind 'station'`, `T.sea.station`): ✊ held bites one, the stick works it; let go of ✊: off it
  at once, free to run.
  Tiller: stick steers; let go of the stick, she holds that heading (`SEA.course`); let go of ✊: lashed (`SEA.lash`, 🔒), she
  holds it still (`stationLetGo`); taken again: unlashed.
  Sheet: aft hauls, forward eases; a shake lets it fly. Halyard: up / down, settles on a reef. Anchor: down (held `dropHold` s)
  drops, up weighs (alongside: casts off); hauling paused, it holds a moment (`slip`). Just weighed or cast off: no drop for `lock` s
  (`SEA.aweighT`) nor till the stick's let go (`st.free`). Nobody on the tiller, nor lashed (nor Hank's `pilot`): it swings amidships and she rounds up.
- **Hank's crew**: on the sheet while no dog has it (`SEA.assist`; off: it runs out), a beat late; eases her when
  pressed; lets fly at anchor or with a dog overboard. On the helm out of harbour (`SEA.pilot`) till a dog takes it: for the next island's
  jetty, never closer to the wind than close-hauled (`seaPilotCrs`). Calls what he sees (`seaHank`).
- **Overboard** (`seaSwimSheep`, `T.sea.over`): a sheep swims after her, tires (`a.lung`, a ring over it), clings
  alongside if she's slow; a dog on deck within `reach` ✊ hauls it in (`seaHaul`; before any other grab: `seaGrabPick`), a
  swimming dog tows it (`d.tow`). Left: drowned.
  Dogs: over the rail only by a jump; swim, climb the nets against the hull (`seaSwimDog`). Under way she outsails a dog:
  one falling astern (or past `dogFar`) gets Hank's line (`a.line`), hauled in alongside and up.
- **Life rings** (`RINGS`, `T.sea.ring`, `holdKind 'ring'` / `'ringRope'`): one on each rail. ✊ takes it; let go: thrown to the sheep
  in the water it faces, else the nearest in reach (`ringAim`, led for her drift: `ringTarget`). On the water it tows on its line. A sheep near makes for it and
  takes hold (`a.ring`: tires no more). ✊ at its post: the line comes in; Ⓑ heaves (`ringHeave`). In under the rail: `seaHaul`. Cues:
  hooks glow and 🛟 ✊ while one's in the water, the flight dotted, a ring where it'll land, 🛟 ✔, HEAVE!, a bar, SAVED! (`drawRingOverlay`, `ringFx`).
- **Anchor** (`T.sea.anchor`): holds in under `depth` m, she swings head to wind; deeper, it only drags. The night
  fast-forwards at rest (`seaAtRest`: alongside, or holding).
- **Route** (`ROUTE`, `DOCKS`, `REEFS`, `BUOYS`): Cold Harbour → Seal Skerry → Gull Rock → Storm Key → Siren's Rest → the Promised Land. Each island
  to port of the way in, a jetty on that side. No island's a stop she must make, nor need she keep to the way: the leg she's on (`SEA.leg`: its
  weather, its trouble, the compass's island) is the nearest of those still to come, never one back; the islands before it are passed by once
  she's well clear of them (`seaLegStep`). Straight for the Promised Land, the legs come by in turn.
- **Alongside an island** (`seaMoorStep`, `seaMoor`, `SEA.berth`, `SEA.warp`): any island's, in or out of turn. In by its jetty and slow (Hank
  spills her wind), or her anchor down near it: warped in. `seaCheckpoint` (saved, hull mended, troughs filled from `SEA.stores`), gangway open. The Promised Land: `finishGame`.
- **Islands** (`ISLES`, `ISLE`, `T.sea.isle`): ground in deck coords while she's alongside (`sdf`, `h`): beach, meadow, a crag (rock),
  a spring (`fresh`: the bucket fills). Drawn from the same shape. On each (own rng, there only then: `isleShow`): flowers (`PLANTS`),
  a salt rock, two chests (`sp.chest`: 💎 +🧶). Dogs wade in off the beach and swim. The flock stays aboard.
- **Hazards, worse each leg** (`HAZ`, `seaHazards`): 🐋 orcas bonk the hull (sheep by that rail go over; a bark
  turns one; they pick the rail the sheep are by). 🪨 reefs (a ♥ off the hull; at 0 she wallows till mended), gusts,
  and from here on 🦈 a shark for each sheep in the water (bark: off a while). ⛈️ storm: gale, breaking seas,
  lightning, a great wave now and then (abeam: sweeps the deck; on the bow: fine), a waterspout that flings sheep.
  🧜 sirens in fog: sheep walk to that rail and jump (`s.lure`, `seaLure`); a bark frees them, a dog in the way
  stops them; in the water they swim for the rock. The land she left: she fetches up on it (`seaLandDepth`).
  Deaths: `drowned`, `shark`, `siren`, `kraken` (`SEA_LOSS`: no body; `left` on the mountain too).
- **The kraken** (`KRAKEN`, `krakenStep`, `T.sea.kraken`): the wind dies, ink wells up. Arms over one rail haul it
  down (`SEA.hold.heel`): herd the flock to the high side, pounce each arm off (`seaPounce`; a bold ram butts one).
  A loose arm snatches a sheep (`s.seaHold`): bonk it and it drops it. Arms off: its head comes up, dazed: a sheep
  (or a dog) flying into its eye is a hit and bounces back aboard (`krakenEyeHits`). `hp` (+`perDog`) hits: beaten,
  +`bounty` 🧶, the wind fills in. Barks: 😾. HUD: 🐙 ♥♥♥ (`#bossBar`).
- **The vagabond's Laser** (`VAG.sea`, `T.vag.sea`, `vagSeaStep`; `seaStart` → `vagSeaStart`): white single-hander, a red star up its sail
  (`makeLaser`, in `seaG`; `syncLaser`). Cold Harbour: out in the bay, round and round off her starboard side, out of reach (`vagBay`, `bay`;
  by night hove to); nothing on the quay. For legs 1…`legs` (to Gull Rock) he sails by her (sea coords: a slot off her port bow, `vagSlot`;
  out of the bay to starboard till his first beach, `slotSd`; `vagSail`: polar × wind, no-go zone, tacks, heel and boom to leeward, clear of
  her by `keep` and the reefs; far behind out of sight: caught up). Near the next island (`landR`), or by night, he makes for its beach ahead
  of her and pulls up (`vagLand`). Sites (`vagSite`: deck coords at that berth, own rng: his spot, the mats' layout (tight grid), his boat, his
  bed by it). Ashore where she lies (`vagReach`): as on land (trade, deliveries to the deck: `penFound`, sleep, bonk, grab, fetch, tug);
  else drawn on the sea, waiting (by night asleep). She casts off: after her (`vagLaunch0`); his last island: `bye`, home over the horizon
  (`vagPart`), gone (`st 'off'`). Put out: off in his Laser for a day, back by sea. Under way out of reach; hails (`vagSeaCalls`).
- **What ✊ takes** (`drawGrabMarks`, `grabPick`): a ring in the dog's colour round it; the boat's gear and a sheep in the water get
  a chip with the button. Free stations: a faint icon. Chips, marks and arrows at sea are `T.sea.ui`× (`seaUI`: less on a compact screen; `forageChip`).
- **Hungry sheep** eat through barks and the ride (`troughSet`, docs/sheep.md): the deck's troughs aren't left for fright.
- **HUD**: the dial (`drawSeaDial`): wind arrow (a front coming: a dashed one, blinking, where the new wind's from), no-go wedge, boom (green
  drawing, amber luffing / stalled, dashed: best), rudder, heel + where the flock's weight is, knots, reefs, hull ♥. The sail's cloth tints the same. Compass:
  the next island (the boat, alongside; from the yeti's end: Cold Harbour). Map: a chart with the coast on it (`seaChart`; minimap
  camera-up, big north-up; a front: its line); ashore at Cold Harbour: the land's map.
