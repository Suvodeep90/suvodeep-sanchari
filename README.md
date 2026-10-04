# Suvodeep &amp; Sanchari

A wedding site for **December 11–14, 2026** at **Blue Cedar Lodge, Gatlinburg, Tennessee** —
a weekend-long celebration in the Great Smoky Mountains. A Smoky Mountain sunset hero over a page drawn from the same indigo ridgeline.

**Live site: https://suvodeep90.github.io/suvodeep-sanchari/**

> **New here? Read [SETUP.md](SETUP.md).** It walks through publishing to GitHub Pages,
> connecting the RSVP form, and filling in the remaining details.

---

## What's in the box

| | |
|---|---|
| **Hero** | Smoky Mountain sunset — seven SVG ridges, conifer treelines on the near three, haze between |
| **Our Story** | Portrait plus "A Weekend in the Mountains" |
| **Countdown** | Live days / hours / minutes / seconds to the ceremony |
| **The Lodge** | Full-bleed exterior, then each room paired with the moment it hosts |
| **Itinerary** | A pinned scroll story: one landscape, a camera that sinks continuously into the valley, and light that blends from dusk to night to mist to dawn while each day's entry swaps in place |
| **Travel & Stay** | The lodge's address with an embedded Google Map (click it to open Google Maps), directions, Apple Maps and copy-address; then airports, lodging and things to do |
| **Gallery** | Your photos in a self-balancing masonry grid with a lightbox; add more any time with `tools/add-photos.py` |
| **RSVP** | Form → a Google Sheet you own |
| **FAQ** | Collapsible answers |

A ridgeline rises out of the charcoal footer to close the page.

Plus a muted-by-default music toggle, full keyboard navigation, a mobile menu,
and a print stylesheet.

## Built with

Nothing. No framework, no build step, no `npm install` — static files and some SVG.
It loads fast on hotel wifi and will still work in ten years.

- `index.html` — all the content
- `assets/css/styles.css` — the whole design system (palette lives in `:root`, sampled from the hero ridges)
- `assets/js/main.js` — behaviour (you shouldn't need to touch this)
- `assets/js/config.js` — **the knobs you actually turn**
- `rsvp-backend/Code.gs` — the Google Apps Script that catches RSVPs
- `tools/generate-ridges.py` — optional; redraws the mountains if you want a different range
- `tools/build-story.py` — optional; regenerates the itinerary scenes and journal entries
- `assets/js/gallery.js` — the gallery's photo list
- `tools/add-photos.py` — adds photos to the gallery (resize, convert, list them)
- `assets/js/weather.js` + `tools/weather-normals.py` — typical weather at the lodge for each day; the page switches to a live Open-Meteo forecast about two weeks out

## Run it locally

```bash
python3 -m http.server 8777
# → http://localhost:8777
```

## Accessibility &amp; taste notes

- Respects `prefers-reduced-motion` — every animation switches off for guests who ask.
- The music **never autoplays**. Guests press the button or they don't.
- Keyboard navigable throughout, with a skip link and visible focus rings.
- Works with JavaScript disabled, apart from the countdown and the RSVP form.

## Credits

Save-the-date artwork exported from the original Canva design. Typefaces are
Cormorant Garamond and Montserrat, via Google Fonts.
