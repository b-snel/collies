# Water

- **Streams** (`STREAMS`, `T.stream`): narrow, shallow, from the hills to the
  lake; walkable (slow), wet (`wetAt`: buckets fill, sheep sip). Grass by
  streams and the river is lusher (cap up to 1.45).
- **River, no bridge** (`RIVER`, `inRiver`): dogs walk in and swim (`startSwim`,
  `collideDog` / `SWIM_SDF`; drops what they hold), Hank wades. Sheep can't: a
  splashed one swims back to its own bank (`a.side`, the sea off its mouth too). Only the launcher takes them over.
- **Open water** (`seaOK`, `openWater`, `WADE_SDF`, `collideWade`, `wadeSdfAt`): no wall at the water line. The sea, the lake
  (and the lake's low shore past the trail's edge) stay blocked in `blk` / `SDF` (world gen, grazing, A* unchanged) but are open
  to dogs and Hank (`SWIM_SDF`) and to sheep, coyotes, cougars (`WADE_SDF`; not the river). Out of their depth: sheep swim back
  (`sheepWadeIn`), coyotes swim out soggy and leave, cougars swim slow. Calm ones keep off it; bolting ones can be driven in.
  Dressed, Hank keeps out of the sea (`seaDeep`).
- **Swimming tires a dog** (`T.rescue.drain`, `idle` floating): ~90 s paddling from full. At 0: under (`dogDrown`, `a.drown`,
  `d.ko`), limp (`drownStep`).
- **Sand** (`T.bare`, `offBare`): the beach grows nothing (zeroed after world gen); a calm sheep on it walks to grass; no wandering onto it.
- **Launcher chute** (`T.launcher.funnel`, `inChute`): long wings; driven sheep bend
  for the mouth, slide round a wing's tip, walk on to the low end. In the chute: no breakouts.
