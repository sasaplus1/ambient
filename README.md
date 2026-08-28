# ambient

my ambient dashboard for small display devices

A static web app that turns a small screen — a spare phone, a tablet — into an always-on display that shows a clock and just enough else, quietly.

There is no server. It runs on static hosting such as GitHub Pages.

## Features

- Analog clock on Canvas 2D — a second hand that sweeps, steps or is absent, over a dial of ticks, arabic or roman numerals
- Digital clock — 12 or 24 hour, optional seconds
- Date, in a choice of six formats
- Monthly calendar with today marked, starting on Sunday or Monday, the days either side dimmed or hidden
- Current weather from Open-Meteo, by geolocation or place name, in whichever unit the region reads or one you pick
- A background image of your own, with a fit and a dimming level
- Twenty themes, either fixed or following the time of day through morning, day, evening, night and the small hours
- Per-widget visibility, size and typeface
- Pixel shift, for panels that burn in
- Interface in Japanese or English, following the browser by default
- Fullscreen and screen wake lock
- A debug HUD for watching a device that has been running for days
- Installable as a PWA, with offline startup after the first successful load

Out of the box it shows the analog clock and the calendar. The date and the
weather are there to be turned on.

Settings live in `localStorage` and the background image in IndexedDB, so each
device keeps its own and neither ever leaves it. The weather is the one thing
that reaches out, and only for what it needs: coordinates, or the place name
you searched for.

## Always-on display

In a browser, the button in the bottom-left corner enters fullscreen and acquires a screen wake lock together. The Fullscreen API rejects requests that do not originate from a user gesture, so this first tap is required.

Installed as a PWA, the app already starts without browser UI, so it only acquires the wake lock.

On devices without Screen Wake Lock support, that part is skipped and the display keeps working.

## Weather

Open-Meteo needs no API key and allows cross-origin requests, so the browser
talks to it directly and no server is involved.

Geolocation is offered but not assumed: a device without GPS, a denied
permission and a build with no location provider at all fail the same way, so
searching by place name sits beside it rather than behind it.

The last reading is kept locally, so a device waking without a network shows
something rather than an empty slot. Anything over 90 minutes old is faded
instead of passed off as current.

Weather data by [Open-Meteo](https://open-meteo.com/), under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Development

Running it locally, deploying it, and the reasoning behind a few of the choices
are in [docs/development.md](docs/development.md).

## License

The MIT License
