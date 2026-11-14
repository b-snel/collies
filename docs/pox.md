# Sheep pox

- **Too long in one place** (`POX`, `T.pox`, SHEEP POX): at each nightfall (`poxNight`, from `stepClock`) the flock's place
  (`poxPlace`: the nearest camp `c…` or pass fire `f…` along the trail; at sea, the leg `s…`) is the same as last night's: `POX.n`
  one more; another place: 1. Past `nights` (4): one sheep (not jabbed) falls ill, one more each night it stays.
- **Warned**: the dawn before (`POX.n` = `nights`, still there), Hank says so once a stay (`POX.warned`), hint `stay`; the HUD shows
  `⚠ 🌙n ➜ 🤒` while one more night there brings it (`poxStay`). The morning after it's come: Hank says why (`POX.news`), hint `pox`.
- **It spreads** (`updatePox`, host, every `tick` s): a sick one past `shed` passes it to a sheep within `r` m on its side of a fence
  (same `s.pen`), `catch` /h each. Not to a jabbed one (`s.vax`).
- **A VET ailment** (`AIL`: `s.pox` 0…1, `s.poxRate`, bit 8, 🤒, why `pox`): slower (`slow`), coughs, dead in `dieHours` h. Hank's
  🧪 (the vagabond's second row: `T.vendor.vaccine`, `n` doses a buy) cures it (`cureSheep`) and the sheep never catches it again.
- Kept on a reload (`onSave('pox')`; the sheep's fields with the flock). Online: `NET_TYPES.pox` (the HUD's count), sheep `pox`, `ail`.
  Dev: 🤒 (a night too many here: `devPox`).
