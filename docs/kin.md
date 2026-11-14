# Lineage and new blood

Issue #176. Sections: LINEAGE (after FLOCK SAVE), WILD RAMS (after LLAMAS). Test: `kin-test`.

## Lineage (`KIN`)

- **Records** (`KIN.recs`, `kinRec(id)`): one per sheep ever, `{ i, n, r, m, f, j, d, w, s, x, e }`: name, ram, mum, sire, journey and
  day born, wool, new blood (`KIN_SRC`: 🏆 trial, 🎒 vag, 🌿 wild, 🏖 isle), how it died (`x`, '' alive), day it died. `s.lid` on a sheep.
  Ids only go up: a lamb's is always above its parents' (no loops; `kinIn` drops any that aren't).
- **Founders** (`kinFounder`): no known parents. A new journey's new arrivals (`kinStart`, after `applySavedFlock`); the first lambs get
  their mum and a ram in turn (no dice). New blood is a founder with a source; it's on the next dawn card (`kinNewcomers`).
- **Kinship** (`kinship(a, b)`, memo: records never change parents): Wright's coancestry. `kinF(id)`: a sheep's inbreeding, its parents'
  kinship (½ sibs 1/8, full sibs or parent × child 1/4). `kinPair(ram, ewe)`: how inbred their lambs would be.
- **Born inbred** (`kinBorn`, `T.kin`): life, bravery, size, hardiness (`starveMax`, `parchMax`, `saltMax`) down with F; `s.inF` slows
  the fleece (`T.kin.wool`). A pairing's lamb chance × `kinFert` (the ewe's `sireLid`: the ram that courted her).
- **A ram courting kin** (`kinCourt`, from `courtStep`): ≥ `T.kin.warn`: 🧬 over them (`kinFx`), bred: again; Hank's word once a
  journey (`KIN.said.court`), the `kin` hint. Rams don't avoid kin: the player keeps the old ram out of the pen.
- **Kept**: the flock save (`kin`, `kinNext`; `kinOut(true)`: every living, home and remembered sheep's forebears first, then the newest,
  `T.kin.keep` in all; records' names and wool synced first: `kinSync`). Saved sheep and memorial entries carry `lid`. The journey save
  (`kin`). A fresh flock forgets it.
- **Online**: `NET_TYPES.kin` (the records as one string, made again only when `KIN.rev` changes: `kinNetOut` / `kinNetIn`); sheep `lid`, `inF`.

## The tree (`kinTreeHTML(id, o)`)

- One sheep at the bottom (its live self if out here, else its record: gone, or at home), forebears up to great-grandparents above
  (sire left, dam right; '?' where one isn't known), its lambs below as green shoots (10 at most, then +n).
- A forebear that comes up twice (the inbreeding) is ringed in its own colour (`KIN_DUP`), a dotted arc between each place.
- Head: name, ♈ / ♀ / 🍼, days old (or the day it died / 🏠), new blood, 🧬 meter (`kinCol`: green, yellow, amber ≥ `warn`, red ≥ `bad`).
- `o.mates`: ♥ who a live grown one could breed with, safest first, kin flagged. `o.back`: ↶.
- HTML nodes (emoji → icons) over an SVG of branches (`vector-effect: non-scaling-stroke`). Icons: 🌳 `tree`, 🧬 `dna`.
- **Barn** 🌳 Family tab (`barnTab('kin')`, needs a sheep picked): the list (inbred: a dot), the tree spanning the rest (`barnKinDraw`,
  redrawn when the family or the flock changes). A node: its tree (`barnKinGo`; one out here is picked in the list too), ↶ `barnKinBack`.
  Pad: D-pad ↑↓ pick, ← sire, → dam, Ⓨ back.
- **Dawn card**: each new lamb's 🧬 (≥ `warn`) and 🌳 → `dawnTree`: the tree over the card (`.kinPop`); a node: its tree; Backspace / Ⓑ
  back, Esc / ✕ the card.

## New blood

- **The trials' champion** (docs/trials.md): `kinFounder(s, 'trial')`.
- **The vagabond's ram** (docs/vagabond.md): ♈ on its own mat out front, `T.vendor.ram.price` 🧶, one a pitch (`VAG.ramAt`), on land
  only (`vagRamStock`). Sold (`vagRamSell`): he's on the mat, and trots off to the flock (lost, he wants it). He calls it when the flock
  needs one (`kinNeedRam`: no ram, or every ram close kin to half the ewes).
- **Wild rams** (`WILDS`, `T.wild`; on: off in ?sim; own rng, a new seed a journey: `WILD.seed`, `wildPlan`): 1–2 a journey, each on a land
  leg (`legs`), `lat` m off the trail (`wildSpotOK`: a llama's spot, away from the herds). Dark, shaggy, big horns. Grazes his patch,
  lies still by night; a dog walking at him (faster than `creep`) or within `close`: off (`flee`, back toward his patch if he's strayed);
  creeping, a dog gets close. Found within `findR` (🌿 ♈, Hank, the `wild` hint).
  - **Capture** as a llama's (docs/ropes.md): a dog dragging a rope within `catchR` (`wildCatch`, `wildRope`): `R.wild`, round his horns
    (`wildNeck`), a tug (`e.npc`, `hankTug` with `T.wild.tug`). He wins: bolts, wary `waryH` h. Lost: broken, `led` (`wildLed`). Two of
    the flock within `joinR`, or a pen: `wildJoin`, a sheep where he stands (his name, his fleece as `look.wool`, stubborn), `wild`.
- **The castaway** (`kind: 'isle'`, `WILD.isle`: one of `isles`): on his island only while she's alongside it (`W.off` otherwise; his
  spot made then: `wildIsleSpot`, deck coords). Lonely: a dog within `cast.follow` and he follows it (`wildCastaway`; lost past `lose`),
  keeping to what there is to stand on (`seaGround`; stuck: a hop on). The dog aboard within `hop` m: a hop on (`wildHop`, `deckFree`);
  on her deck: `isle`. Left ashore when she sails: he stays.
- Online: `NET_TYPES.wild` (`netGuestWild`, `netWildRope`), `wildFx`. Saved: `wild` (the seed; who's still out there).
- Dev: ♈ (a wild ram by the dog; again: on a rope, led), 🏖 (alongside the castaway's island).
