# Development

Requires Node.js `^20.19.0 || >=22.12.0`.

```console
$ pnpm install
$ pnpm dev
```

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Build for production into `dist/` |
| `pnpm preview` | Serve the build output locally |
| `pnpm typecheck` | Run type checking only |
| `pnpm lint` | Run Biome's linter |
| `pnpm lint:fix` | Apply the fixes Biome considers safe |

To open it on a real device, expose the preview server to your network.

```console
$ pnpm preview --host
```

## Dependencies

Install policy lives in `pnpm-workspace.yaml`, and most of it is stricter than
pnpm's defaults: no lifecycle scripts, nothing published in the last seven days,
no trust downgrades, and anything added from here on written down exactly rather
than with a caret. A dependency added today will not install until it has aged a
week, which is deliberate.

## Weather data

The code is MIT, but the weather is not the code's to give. Open-Meteo's free
tier is for non-commercial use, and the browser running this is what calls it -
so anyone putting a fork behind advertising or a subscription needs a paid plan
of their own. The credit at the foot of the screen is required by CC BY 4.0 and
should stay wherever the reading does.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages. Everything is
referenced relatively, so serving from a subpath works without configuration.

Every action in the workflow is pinned to a commit. `pinact run` updates them.

## Debug HUD

Attaching DevTools to a device left on a shelf is awkward, so the log can be
overlaid on the running dashboard instead. Turn it on under Debug in the
settings.

The status line reads uptime, network, weather age, error count, service worker
state and the commit the build came from.

```text
UP 3d4h | NET OK | WX 12m | ERR 0 | SW ready | 86ba0bd
```

## On service workers

The production build generates a versioned service worker and precaches one app
shell: `index.html`, the hashed JavaScript and CSS bundles, the manifest and the
icons. Navigation is cache-first, so the dashboard can start without waiting for
a slow or absent connection. Requests outside that shell are never added to the
cache, and cross-origin weather requests are not intercepted.

The page checks for an update whenever it becomes visible and every six hours
while it remains open. A new worker waits until the page is hidden before taking
control, then the page reloads once onto the new version. Activation removes the
previous version's cache so storage stays bounded to one shell.

The debug HUD reports the current state as `SW unsupported`, `SW none`,
`SW installing`, `SW ready` or `SW waiting`. Worker registration and update
failures are also recorded in the HUD log without preventing the app from
running.

## Keeping Silk open

Amazon Echo Show returns to its home screen after a few minutes without input,
and Amazon offers no setting to stop it. Playing media holds it off, so on Silk
the always-on button also starts a near-silent WAV built in code. Nothing is
shown for it and no other browser creates the audio at all.

The clip is a 100 Hz square wave at one unit of amplitude rather than digital
silence, because a decoder that finds nothing but zeroes may drop the session
the trick depends on. At fifteen seconds of 8 kHz mono it costs about 234 KB,
and the length is a single constant.

The technique comes from [keep-silk-open][], which refetches an MP3 with a
changing query string every cycle. Two changes were needed here. The source is
a blob URL, minted fresh on each `ended` event and revoked after, which keeps
the same changing-URL behaviour while avoiding the network entirely - a query
string would otherwise miss the precache, since the worker matches on the full
URL, and the audio would stop whenever the device was offline. And `loop` is
still not used: it suppresses `ended` and the whole run of load and play events
with it, and whether Silk's idle timer watches for those is not known.

[keep-silk-open]: https://gitlab.com/DaGammla/keep-silk-open

None of this has been tried on real hardware.

## Regenerating icons

The SVG files under `public/icons/` are the sources. PNGs are produced with ImageMagick.

```console
$ cd public/icons
$ convert -background none icon.svg -resize 512x512 -depth 8 PNG32:icon-512.png
$ convert -background none icon.svg -resize 192x192 -depth 8 PNG32:icon-192.png
$ convert -background none icon-maskable.svg -resize 512x512 -depth 8 PNG32:icon-maskable-512.png
```
