# ambient

my ambient dashboard for small display devices

A static web app that turns a small Android device — or an Echo Show 5 running LineageOS — into an always-on display that shows a clock and just enough else, quietly.

There is no server. It runs on static hosting such as GitHub Pages.

## Features

- Analog clock on Canvas 2D (no / stepping / sweeping second hand; ticks, arabic or roman numerals)
- Digital clock (12 / 24 hour, optional seconds)
- Date, in a choice of six formats
- Monthly calendar with today marked, starting on Sunday or Monday
- Current weather from Open-Meteo, by geolocation or place name
- A background image of your own
- Themes: Light, Dark, OLED Black, Warm
- Per-widget visibility toggles
- Interface in Japanese or English, following the browser by default
- Fullscreen and screen wake lock
- A debug HUD for watching a device that has been running for days
- Installable as a PWA

Settings live in `localStorage` and the background image in IndexedDB, so each
device keeps its own and nothing is uploaded anywhere.

## Development

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

To open it on a real device, expose the preview server to your network.

```console
$ pnpm preview --host
```

## Always-on display

In a browser, the button in the bottom-left corner enters fullscreen and acquires a screen wake lock together. The Fullscreen API rejects requests that do not originate from a user gesture, so this first tap is required.

Installed as a PWA, the app already starts without browser UI, so it only acquires the wake lock.

On devices without Screen Wake Lock support, that part is skipped and the display keeps working.

## Weather

Open-Meteo needs no API key and allows cross-origin requests, so the browser
talks to it directly and no server is involved.

Geolocation is offered but not assumed: a device without GPS, a denied
permission and a LineageOS build with no location provider all fail the same
way, so searching by place name sits beside it rather than behind it.

The last reading is kept locally, so a device waking without a network shows
something rather than an empty slot. Anything over 90 minutes old is faded
instead of passed off as current.

## Debug HUD

Attaching DevTools to an Echo Show 5 is awkward, so the log can be overlaid on
the running dashboard instead. Turn it on under Debug in the settings.

The status line reads uptime, network, weather age, error count and the commit
the build came from.

```text
UP 3d4h | NET OK | WX 12m | ERR 0 | 86ba0bd
```

## On service workers

This app ships no service worker.

A PWA is installable with a manifest, icons and HTTPS alone, so home screen
installation and fullscreen launch work without one. The only thing given up is
offline startup.

On a device that runs for days, a stale cache that refuses to hand over an
update hurts more, and on hardware where attaching DevTools is awkward you
would never notice it happening. The debug HUD now exists to watch that, so a
service worker could follow — but it has not been added, and offline startup is
not supported today.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages. Everything is
referenced relatively, so serving from a subpath works without configuration.

## Regenerating icons

The SVG files under `public/icons/` are the sources. PNGs are produced with ImageMagick.

```console
$ cd public/icons
$ convert -background none icon.svg -resize 512x512 -depth 8 PNG32:icon-512.png
$ convert -background none icon.svg -resize 192x192 -depth 8 PNG32:icon-192.png
$ convert -background none icon-maskable.svg -resize 512x512 -depth 8 PNG32:icon-maskable-512.png
```

## License

The MIT License
