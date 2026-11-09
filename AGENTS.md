# Demo slice: sheep herding

This branch is a **demo slice**: a clean-slate prototype for trying one
focused idea in isolation. Everything from `main` was deleted on purpose. See
`AGENTS.md` on `main` for the full workflow.

## Rules

- Build from scratch. Don't read, copy or restore code from `main` or other
  branches unless the user asks.
- Stay focused on the idea below. Placeholder art and rough UI are fine.
- Keep it easy to run, and say how below.
- Never merge this branch into `main` or open a PR into `main`: its history
  deletes the whole game. Features are ported to `main` by hand.
- Keep "Notes for porting" current as you go.

## The idea

Local co-op sheep herding. Up to four border collies drive a boids flock along
one continuous trail (desert corral → mountain valley → oceanside → the
Promised Land), penning it at camps before nightfall to keep coyotes off, and
moving on before the sheep overgraze the pasture. Score = sheep delivered.

## How to run

Open `index.html` in a desktop browser (Chrome/Edge/Firefox). Everything is in
that one file; three.js r160 loads from jsDelivr, so you need a connection.
If your browser blocks module scripts from `file://`, serve it instead:
`python3 -m http.server` and visit http://localhost:8000.

Controls: Xbox pad (left stick move, A bark, X/Y gate, RT/B sprint, LT/LB
creep) or keyboard (P1: WASD, Space, E, Left-Shift, Q; P2: arrows, `/`, `.`,
Right-Shift, `,`). Extra pads press A at any time to drop in.

Debug: add `?debug` to the URL for an FPS readout and cheat keys
(`]` +1 hour, `N` dusk, `M` dawn, `K` spawn a coyote, `F` teleport to the
final pen). `window.GAME` exposes the state for poking in the console; a
player with `kind: 'bot'` reads its input from `player.bot`, which is how the
headless balance tests drive a dog.

## Notes for porting

Code layout (all in `index.html`, top to bottom): `T` tuning table → audio
(pure WebAudio synthesis) → input → world gen → renderer/terrain/water/grass →
scenery, pens, bridge → creature models → sheep + dog sim → coyotes, clock,
lighting, camera → visual sync + HUD → game flow + main loop.

What made herding feel right (all tested headlessly, see numbers below):

- **Pressure, not collision.** Each dog has a pressure radius (walk 9 m,
  creep 5.5 m, sprint 12 m). Sheep flee directly away with speed
  `1.6 + 5.6 * pressure`. Creep gives slow, precise pushes; sprint scatters.
- **Alert momentum.** After being pushed a sheep keeps walking with the flock
  for ~3.5 s (`alert`) instead of dropping straight back to grazing. Without
  this, driving a flock moved it 10 m/min and it fell apart.
- **Contagion.** Calm sheep with 2+ neighbours moving within 6 m join them at
  0.88× their speed. The 0.88 matters: at ≥1.0 the flock keeps itself moving
  forever after the dog stops.
- **Cohesive grazing, bolder when hungry.** Grass-seeking scores candidate
  spots with a penalty for distance from the local flock centre, so the flock
  drifts as a group instead of chaining out across the map. The penalty fades
  and the search radius grows (to 17 m) as hunger rises; without that, a hungry
  flock huddled and starved 15 m from untouched grass.
- **Chokepoints need help.** The river bridge was a jam until it was widened to
  9 m and moving sheep got a gentle pull toward the bridge axis (sheep follow
  trails). Any future chokepoint (gates in walls, canyon passes) wants the same.
- Result: one dog walking 7 m behind the flock drives it at ~2.1 m/s with a
  5–8 m spread over every stretch of the trail; it coasts ~4 s when the dog
  backs off, then resumes grazing. A dumb "drive at the gate" bot pens 13/14
  sheep in 15 s, so the gate + funnel wings are forgiving enough.
- Day 1 is the tightest: 7:00 start, 227 m to the valley camp, nightfall at
  20:30 (135 s). Pushing steadily gets there with ~30 s to spare.

Grass / hunger economy (per in-game hour; one hour = 10 real seconds):

- Grass lives on the 2 m terrain vertex grid (`gAmt` / `gCap`), uploaded to an
  R8 texture that both the terrain shader (blends bare→grass colour) and the
  instanced grass tufts (shrink + sway) sample. That one texture is the whole
  overgrazing visual.
- hunger +0.034/h (×0.4 while asleep), eating 0.35 units/s × 0.04 hunger per
  unit, regrowth 0.022/h × (0.35 + cap). Death after ~9 h (±35%) at max hunger.
- Simulated: 14 sheep parked at the valley camp, penned nightly → 22 sheep by
  day 4, grazing up to 60 m from the pen as the pasture thins, first
  starvation on day 5. That arc is the core "stay vs. move on" tension.
- Lambs: at 23:00, adults inside a closed pen with hunger < 0.5 are flagged;
  at dawn each flagged adult has a 22% chance of a lamb. So penning AND
  feeding both pay off. Lambs follow their mothers and grow up after 2 dawns.

Coyotes: spawn off-screen at 20:30 (2 + 1 per day, +1 per 18 sheep) plus a
second smaller wave at 00:30. They target isolated sheep and lambs, stalk,
chase, then drag a caught sheep away for ~9 s. A dog getting close or barking
makes them drop it ("Saved!"). Each scare costs courage; at zero they leave.
Tested: an undefended night in the open lost 3 of 14 sheep; a simple bot dog
that barks and charges lost none. Closed pens are coyote-proof.

Flow / feel:

- The night fast-forwards ×7 when every living sheep is in a closed pen, so
  penning is rewarded with time and never feels like waiting.
- Dogs hop fences automatically when pushing into them; sheep and coyotes
  can't. The gate is a swinging segment collider: open, it lines up with one
  funnel wing.
- Collision: a 1 m signed distance field (chamfer transform) for all static
  walls (corridor edges, water, rocks, trees) + segment colliders for fences.
  Sheep steer away from the SDF before touching it.
- Camera: orthographic, fixed iso direction (1, 1.2, 1). It follows the dog
  centroid and zooms 25→46 m to fit co-op dogs; dogs are leashed to one screen.
  Everything tall is kept on the far (west) side of the trail; the camera side
  is low ridges, canyons and sea so nothing hides the play.
- Lights: a fixed count (sun, hemi, 4 dog lights, 2 campfire lights) so
  shaders never recompile mid-game.

Gotchas: buttons must be read once per rendered frame, not per physics
sub-step, or toggles (the gate) fire twice at < 60 fps. Browsers don't treat
gamepad presses as a user gesture, so audio can't start from a pad alone; a
"click for sound" badge shows until it does. The cel look is `MeshToonMaterial` with a 3-step `RedFormat` gradient
plus a screen-space inverted-hull outline `ShaderMaterial` that also works on
`InstancedMesh`. DataTextures for grass/depth need `unpackAlignment = 1`
(odd widths).
