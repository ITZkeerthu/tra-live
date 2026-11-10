# TRA Live Tracker

Live positions of Taiwan Railway (TRA) trains, built on official data from TDX (Ministry of Transportation and Communications).

Open: https://itzkeerthu.github.io/tra-live/

1. Search a station.
2. See upcoming trains with live delays.
3. Tap a train to see where it is now. Auto-refreshes every minute.

Add your free TDX key (https://tdx.transportdata.tw/register) with the **API key** button for unlimited refreshes.

## How it works

The whole app is a single static page (`index.html`, no build step, no dependencies) hosted on GitHub Pages.

- **Data**: the TDX Basic API (`/v3/Rail/TRA/...`, falling back to `/v2/...`) for stations, today's station and train timetables, and the live train board.
- **Refresh**: live positions reload every 60 seconds (paused while the tab is hidden); station list is cached in `localStorage` for 7 days.
- **API key**: an optional TDX Client Id and Secret are stored only in your browser's `localStorage` and are sent only to TDX to obtain a token.
- **Routing**: URL hash (`#s=<station id>` and `#t=<train no>`), so views are linkable.
- **Time**: all schedule maths uses Taiwan time (Asia/Taipei) regardless of the viewer's timezone.

## Run locally

```
python -m http.server 8000
```

then open http://localhost:8000. Opening `index.html` directly via `file://` may be blocked by the browser's CORS rules.
