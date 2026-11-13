# Screens

- **Map** (`MAP`, `T.map`, drawing only): parchment till a dog's been within `r` m (`MAP.rv`, 2 m grid,
  `mapReveal`); the land inked round a ragged edge, grazed patches bare. Camera's way round. Camps,
  salt, graves once uncovered; the vagabond where he is once met (`VAG.seen`); flock, Hank, dogs always; predators only while a dog sees them. Each screen
  uncovers its own; a late friend gets the host's (`NET_TYPES.game.fog`). New journey: parchment (`mapReset`).
  Edge arrows keep clear of it (`mapDodge`). By his wares, the pen they go to ringed + 📍 (on the edge if off it). No trail bar.
- **Menus** (`MENU`, `menuUp`, `menuTick`, `setPause`): each screen's own pause menu, barn and dawn card. Offline any of them stops
  the world. Online `G.paused` only once every connected screen's in one (a guest says so: `m`, `s.menu`), or held (`holdWorld`:
  the host's tab hidden, tests). Meanwhile their dogs lie down and wait (`menuInput`, `netReadInput`), ⏸ by the name (`G.menus`).
  The pause screen: "Menu" + ⏸ / ▶ chips while it goes on (`#pause.live`), "Paused" once it waits; over a barn / dawn card `#menuBadge`.
- **Barn**: Dogs (first; opens on it unless a sheep's asked for) and Sheep tabs; icon chips, no paragraphs. Dogs: a card each, 2×2 (a portrait: `THUMB`, `dogThumb`, one a frame; pick: `barnPickDog`, hop, sparks, bark; the turntable dog hops and spins on a new look). Breed: ‹ ▦ › → the picker (`breedPickOpen`, L3): the live dog, name, tags; filters (`BREED_FILTERS`: group, coat `BREED_COAT`, size `breedSize`); every breed a tile (`THUMB.bq`), its own lit; arrows / D-pad walk it, Esc / Ⓑ done.
  Every screen its own (Tab / View / 🏚️ / pause). A guest dresses its own dogs (`barnDogs`: DOGS.looks[k] → its k-th dog, colours `barnSlot`;
  saved on its device; sent as `dl`, `netLookOut`: a coat or collar never picked (`pick`) takes its slot's colours there) and renames /
  dresses any sheep (`barnEdit` → `sh`, checked: `cleanSheepEdit`); the host lists only its own dogs. Open while the world goes on:
  `barnSync`. A friend's dig find goes to their wardrobe (`find`).
- **Dawn report** (`DAWN`, `dawnReport`, after `lambsAtDawn`): lambs born (rename, 🎲, ✏️ → barn) and
  a eulogy per sheep lost since last dawn (`eulogy`, by `s.brave`). Every screen gets it (`dawnShare`, an effect) and goes on from its own;
  a guest's names go to the host. Waits while the barn's open (`DAWN.pending`). `?sim` only fills `G.dawnReport`. Eulogies are seeded
  (name, day, cause): same everywhere. Never scrolls (`dawnFit`: wide, compact, small, then zoomed).
  Held to go on (`T.dawn`: Ⓐ / Start, Enter / Space / Esc, ▶; `dawnHoldStart`, timed by press and let-go, `padT`); nothing in the first `grace` s; mashing never skips it.
- **End screen** (`finishGame`): ★ score (🐑 there vs start), 🐣 🛟 🕯️ ☀️ chips,
  an obituary for every sheep lost this journey (`endObit`, `G.lost`).
- **Journey save** (`JOURNEY`, `localStorage['collies.journey']`): a reload carries on; it never undoes. Written every `T.save.every` s
  of play, at dawn, when the tab hides, and at once on a death (`mournSheep`): no save-scumming. No save / load button: the title shows
  ▶ day · flock (`#tSave`; ✖ forgets it), the first dog in resumes (`startGame` → `journeyResume`). Gone on a new journey, at the end,
  "Start a fresh flock". Host / offline only. Closed tab: the world waits (nothing runs).
  Each section keeps its own (`onSave`): `core` (clock, `G.time`, tally, wool, hints, lost, training), `flock` (every living sheep's plain
  fields, look, mum, spot), `dogs`, `hank` (spot, kit), `pass` (fuel, ice gate, walls, yeti), `graves`, `where` (land: `devJump` to the
  flock's s, then every saved spot that fits; sea: `seaStart` alongside the last island reached, `SEA.saved`), `pens` (gates, bought kit,
  `STORE`), `map` (fog, `G.visited`), `llamas` (seed, guards), `falcon`, `sea` (hold, hull, deck troughs), `coyotes` / `cougars` (still
  hunting: back). Not kept: what's mid-air or in a mouth, the vagabond's mood (he's at his next pitch), dens, grass, melted snow, ropes.
  New builds: each part loads alone (one that throws keeps its fresh state); `loadPlain` copies a field only onto the same type or a
  field the code doesn't set yet; a spot that's not walkable or `T.save.lag` m off along the trail goes by the flock (`journeyPlace`).
  A change of meaning: bump `JOURNEY_V`, add its step to `JOURNEY_UP`.
