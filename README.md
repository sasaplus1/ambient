# ambient

my ambient dashboard for small display devices

A static web app that turns a small Android device — or an Echo Show 5 running LineageOS — into an always-on display that shows a clock and just enough else, quietly.

There is no server. It runs on static hosting such as GitHub Pages.

## Features

- Digital clock (12 / 24 hour, optional seconds)
- Analog clock on Canvas 2D (no / stepping / sweeping second hand; ticks, arabic or roman numerals)
- Date, formatted for the device locale
- Themes: Light, Dark, OLED Black, Warm
- Per-widget visibility toggles
- Fullscreen and screen wake lock
- Installable as a PWA

Settings are stored in `localStorage`, so each device keeps its own.

Weather, a monthly calendar, background images and a debug HUD are planned.

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

## On service workers

This app ships no service worker.

A PWA is installable with a manifest, icons and HTTPS alone, so home screen installation and fullscreen launch work without one. The only thing given up is offline startup.

On a device that runs for days, a stale cache that refuses to hand over an update hurts more — and on hardware where attaching DevTools is awkward, you would never notice it happening. So the plan is to build the on-screen debug HUD first, and add a service worker once its behaviour can be observed on the device itself.

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
