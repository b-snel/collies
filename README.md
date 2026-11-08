# Collie at Dusk

A 3D herding game. You're a border collie with until sunset to get the whole flock into the pen. If any sheep are still out after dark, coyotes come and try to drag them away, and you have to chase them off until dawn.

Live at **https://collies.bsnel.com**

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move (sheep move away from you, so get behind them) |
| Shift | Run |
| Space | Bark: scatters sheep, scares coyotes |
| E | Pounce: a flying leap that knocks coyotes over and makes them drop sheep |
| C | Lie down: calms the flock |
| P / Esc | Pause |
| M | Sound on/off |

On phones and tablets you get an on-screen joystick and buttons. You can add it to your home screen, and it works offline after the first visit.

**Wool and the shearing shed:** every day earns wool (2 per penned sheep, 4 per ram, 10 for the golden sheep, 1 per lamb or sheep that survives outside, 3 per star, 1 per coyote driven off). Spend it at Morag's shearing shed, from the end-of-day screen or the title, on upgrades that stay on the device: Sturdy paws, Big lungs, Calm presence, Loud bark, Thick collar, Sharp nip, Longer days and Keen nose, plus the Shepherd's whistle (Q / LB: calms every sheep nearby) and a Guard llama that spits at coyotes.

**Power-ups:** Bone (zoomies), Apple basket (sheep follow you), Lantern (coyotes keep back). Each day also has one golden sheep worth 50 points.

## How it's built

It's a static site with no build step:

- `index.html`: the whole game (three.js r128, plain JavaScript, recorded audio plus a few sounds synthesized with Web Audio)
- `vendor/three.min.js`: a local copy of three.js so the game works offline
- `manifest.webmanifest`, `sw.js`, `icons/`: what makes it an installable app that works offline
- `vercel.json`: caching headers
- `audio/`: recorded dog barks and Hank's voice clips (see [CREDITS.md](CREDITS.md) for sources and licenses)

To run it locally:

```bash
npx serve .
```

## Deploying

This repo is meant to be deployed on Vercel as a static project with framework preset **Other** and no build command. Every push to `main` deploys automatically.

Custom domain: `collies.bsnel.com` is added to the Vercel project, and DNS has a `CNAME` record from `collies` to `cname.vercel-dns.com`.

When `index.html`, `vendor/three.min.js` or the icons change, bump `CACHE` in `sw.js` (for example `collies-v2`) so installed copies pick up the new files.
