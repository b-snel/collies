# The vagabond

- **The vagabond** (`VAG`, `T.vag`, VAGABOND; on: off in `?sim`): the one trader, on foot. No stalls: their sites (`STALLS`) are clearings
  world gen still flattens and stamps (freed after its draws: `vagStall`; nothing moves). Each journey a new `VAG.seed` (own rng, `vagPlan`):
  1–2 pitches a land leg (`VAG.pitches`: trail's edge, clear flat ground with room for the mats, not in the canyon, by the river, a camp,
  den, cemetery), the last where the Trading Post's stall stood; never up the pass. He waits at the next pitch ahead of the flock;
  it's `past` m past, nobody by him: walks on along the trail (`st 'walk'`, clear of the pens); behind and off screen: just there. By
  night asleep on his bedroll. Cues (`vagCalls`, `vagNeeds`: Hank's missing cures, a shovel, clippers, low `STORE`s first), his own
  bubble (`#vagBubble`, `vagSay`, a fx), only on screen with a dog by.
  - **Trading**: a dog within `tradeR`: the bark (Ⓐ, Space, 📣) is `vagPress` (not a bark; asleep:
    woken, grumbling): `vagTrade` lays the mats out where he stands (`vagLayout`, `vagPlaceMats`: rows, turned / shifted to fit, popping
    in one by one), wares big (`ware` ×), price tags (icon, price, count; `vagTag`). Packed `packT` s after no dog's within `stayR`.
    VENDOR as before on his one "stall" (`VSTALL` = `MARKET`, `ALL_WARES` = `WARES`): a dog on a mat barks (`vendorBark`, host) to buy
    with `G.wool`. 📍 picks the pen (found ones, `G.visited`; default the furthest; `st.sel`). 🌾 💧 🧂: one more trough / water trough /
    lick in it, stocked (`kitSet`), up to `T.vendor.max` × R/9 (slots prebuilt round the fence, `kitRing` / `deckKit`: a sheep's width
    apart, flush to it, no pockets), then batches. Water and salt: one pool per pen (`p.water.at`, `p.lick.at`). New journey: back to base
    (`kitReset`). On a mat: the ware hops, its name plate pops up (`drawWarePop`). ✂️ free while Hank has none. 🧪: `T.vendor.vaccine.n` doses (`docs/pox.md`). ♈ a ram, on a mat of its own out front (row 2), one a pitch, on land
    (`vagRamStock`, `vagRamSell`: he's on the mat, then off to the flock; new blood, docs/kin.md); called when the flock needs one (`kinNeedRam`). Too poor or no room: ✖,
    nothing spent (`vendorFx`); none delivers to the yeti's cave (`penFound`).
  - **Mood**: a bonk (`vagPounced`; a flying sheep: `vagAirHit`), a nag (`barkN` barks within `barkR` in `barkWin` s that bought nothing
    and reached no loose sheep or foe: `vagBarkAt`; herding by him isn't one), a grab (`vagGrip`, `holdKind 'vag'`: dragged, flailing, screaming; let go: dusts off) are grievances (`VAG.griev`,
    `vagGrief`): `mood.free` warn, then prices × `vagRate` (up, capped; in `wareDeal`, so tags, buying, fx agree; ↑ / ↓ on the tags).
    Fetch (a dog's bone or stick let go by him or thrown at him: caught, thrown on; `vagFetch`; his sticks: `b.stick`, not saved),
    a tug (`vagRope`, as Hank's), an apple held out or dropped by him: good deeds (`vagGood`, `gap` s apart): a grievance off, else
    `VAG.good` (a discount, capped). Each act also `VAG.annoy` (decays /h): at `leave` a spiteful line, off out of sight (`vagLeave`),
    gone `awayH` h, back at a pitch ahead of the flock (`vagBack`). Online: `NET_TYPES.vag`, `vagSay`, `vagFx`.
  - **At sea**: his Laser (`docs/sailing.md`): out in Cold Harbour's bay, first met at the first island.
- **Trading Post** (`POST`, `postPen`): desert, no water, the foot of the pass; the vagabond's last pitch is by it.
