# Sports Wave

A fast, static channel guide for cricket, hockey, wildlife and cartoon broadcasters.
Plain HTML, CSS and vanilla JavaScript — no build step, no server code.

## What's inside

```
sports-wave-site/
├── index.html                 App shell (header, footer, search overlay)
├── assets/
│   ├── css/style.css          Full design system and responsive layout
│   ├── img/                   Hero artwork and favicon
│   └── js/
│       ├── data.js            Categories, 23 real channels, hero slides
│       ├── streams.js         Published stream sources (ships empty)
│       ├── hls.min.js         Local copy of hls.js (HLS playback)
│       └── app.js             Routing, UI, search, watchlist, studio, player
└── README.md
```

## Pages

| Route | Page |
| --- | --- |
| `#/` | Home: hero slider, category tiles, featured + category rails |
| `#/live-tv` | All channels with category filters and search |
| `#/category/cricket` | Category page (also `hockey`, `wildlife`, `cartoons`) |
| `#/watch/ptv-sports` | Player page, details and related channels |
| `#/watchlist` | Channels saved in this browser |
| `#/studio` | Add / test / export stream sources |
| `#/about`, `#/terms`, `#/privacy` | Static pages |

## Preview locally

From the `sports-wave-site` folder:

```bash
python -m http.server 8080
```

Open <http://localhost:8080>. You can also open `index.html` directly, but a local
server is recommended so relative paths and HLS behave normally.

## Stream sources and rights

The channel catalog uses real broadcaster names and links to their official
websites. **No stream URLs are included by default.** Every card shows
*Official site link*, and the watch page offers a real hand-off to the
broadcaster until an authorised source is attached.

Only add HLS, MP4 or YouTube links that you own or are licensed to distribute.

### Publish sources for every visitor

1. Open `#/studio`.
2. Pick a channel, paste the source URL, choose a type (or leave auto-detect).
3. Select **Save source**, then **Test** to open the watch page.
4. Export `streams.js` from the studio.
5. Replace `assets/js/streams.js` with the exported file and upload it.

The exported file sets `window.SW_STREAMS`, keyed by channel id:

```js
window.SW_STREAMS = {
  "ptv-sports": { "url": "https://your-authorised-source.m3u8", "type": "hls" },
  "cartoon-network": { "url": "https://www.youtube.com/watch?v=VIDEO_ID", "type": "youtube" }
};
```

Sources saved in the studio live only in that browser (`localStorage`). Visitors
never see them until you export and deploy the file. The studio can also import
a JSON object with the same shape.

### Supported source types

- **HLS** — `.m3u8` playlists, played with the bundled hls.js or native support.
- **MP4 / WebM** — direct video files.
- **YouTube** — watch, live, embed, shorts or `youtu.be` links.

## Editing the catalog

Open `assets/js/data.js`. Each channel entry looks like:

```js
{
  id: "ptv-sports",
  name: "PTV Sports",
  category: "cricket",
  logoText: "PTV",
  logoSub: "SPORTS",
  bg: "#075e32",
  fg: "#ffffff",
  accent: "#f7c948",
  quality: "HD",
  language: "Urdu / English",
  country: "Pakistan",
  description: "…",
  officialUrl: "https://sports.ptv.com.pk/",
  featured: true,
  streamUrl: ""
}
```

- `id` is used in URLs and as the key in `streams.js`.
- `bg` and `fg` control the generated brand tile.
- `featured` adds the channel to the home page's featured rail.
- `categories` and `slides` are defined in the same file.

## Deploy to Hostinger

### Option A — upload the folder

1. In hPanel, open **Files → File Manager** for your website.
2. Enter `public_html`.
3. Upload the contents of `sports-wave-site/` (not the parent folder itself).
4. Confirm `index.html` sits directly inside `public_html`.
5. Enable SSL for the domain and visit the site.

### Option B — GitHub → Hostinger

1. Create a GitHub repository and push this folder:

   ```bash
   cd sports-wave-site
   git init
   git add .
   git commit -m "Sports Wave static site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. In Hostinger hPanel, open **Advanced → GIT** (or **Website → Git** in newer panels).
3. Connect your GitHub account, choose the repository and the `main` branch.
4. Set the deploy directory to `public_html`.
5. Deploy. Future pushes can be pulled/deployed from the same screen.

No server rewrites are needed because routing is hash-based (`#/watch/...`).
The site also works from a subdirectory or a temporary Hostinger preview URL.

## Notes

- Watchlists and local test sources use `localStorage`:
  `sw_watchlist_v1` and `sw_streams_v1`.
- The header search opens with `/` or `Ctrl/Cmd + K`.
- Channel names and marks belong to their respective owners. Sports Wave is an
  independent guide and is not affiliated with any listed broadcaster.
- Before a commercial launch, review `#/terms` and `#/privacy` with your own
  counsel and replace the placeholder contact email in `assets/js/data.js`
  (`brand.email`).
