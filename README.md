# Chez Fifi — Staff Education Portal

A simple internal training site: an interactive beverage menu, a food menu,
flashcards, and an interactive wine region map. Content lives in a **Google
Sheet** — no GitHub, no code, no JSON editing needed for day-to-day changes.

## What's here

```
index.html              Home page
menu.html                Interactive beverage menu
food-menu.html           Food menu (descriptions, allergies, substitutions)
flashcards.html          Flashcard study tool
maps.html                Interactive wine region map
team-quiz.html           Bonus "Match the Wine to the Team" game
css/style.css            All styling
js/config.js              Your Google Maps key + Google Sheets links go here
js/data-source.js         Loads content from Sheets (falls back to data/ JSON)
js/                        Everything else — page logic, shouldn't need to touch
data/                      Local fallback copies (used only if Sheets is unreachable)
resources/pdfs/            The downloadable BTG packet PDF lives here
resources/images/          Bottle/dish photos live here
```

## How content works now

The site reads from three tabs in a Google Sheet: **Wines**, **Flashcards**,
and **Food**. Edit a cell in the Sheet, and — usually within a few minutes —
the live site reflects it. No file to edit, no upload, no GitHub for content
changes.

The one exception is the **downloadable PDF packet**, which is a static file
and does need to be regenerated and re-uploaded when the wine list changes
(see "Keeping the PDF in sync" below).

## One-time setup: the Google Sheet

1. Create a new Google Sheet with three tabs, named exactly `Wines`,
   `Flashcards`, and `Food`.
2. ✅ *Wines and Flashcards are already done* — seeded from a one-time CSV
   export of the site's starting content, imported via File → Import →
   Upload. For the new `Food` tab, ask Claude for a starter CSV the same
   way and import it the same way.
3. For **each** tab: File → Share → **Publish to web** → select that specific
   sheet (not "Entire document") → format **Comma-separated values (.csv)** →
   Publish. Copy the URL it gives you.
4. Open `js/config.js` and paste the URLs in:
   ```js
   self.WINES_CSV_URL = "your Wines tab CSV URL";
   self.FLASHCARDS_CSV_URL = "your Flashcards tab CSV URL";
   self.FOOD_CSV_URL = "your Food tab CSV URL";
   ```
5. Save and upload `js/config.js` to GitHub. The site will start reading
   from the Sheet instead of the bundled local files.

**Important:** "Publish to web" makes that tab's data readable by anyone
with the link — fine for a wine list, but don't put anything in the Sheet
you wouldn't want a guest to stumble onto if the link ever got out.

## Sheet column reference

### Wines tab

| Column | What goes here |
|---|---|
| `id` | Unique ID, e.g. `m-28`. **Never reuse an old wine's ID** — always the next unused number. |
| `category` | One of: `white`, `red`, `rose`, `sparkling`, `dessert` |
| `name`, `producer`, `vintage`, `region`, `grape` | As shown on the menu card |
| `priceGlass`, `priceBottle` | Leave `priceBottle` blank for glass-only pours |
| `tastingNotes`, `wineryProfile`, `farmingWinemaking`, `aboutCuvee`, `vintageDetails` | The five sections shown when a server clicks into the wine |
| `lat`, `lng` | The wine region's coordinates (right-click the spot on Google Maps to copy them) |
| `pinLabel` | The map pin's name, e.g. `Sauternes, Bordeaux`. **To share a pin with another wine** (like the two Sauternes bottles do), copy that wine's `pinLabel`, `lat`, and `lng` *exactly* — matching label is what groups wines onto the same pin. |
| `imageUrl` | A relative path to a photo stored in this repo, e.g. `resources/images/m-01.jpg` — not a link to another website (see "A note on bottle photos" below). Leave blank and the card just shows without a photo, no broken-image icon. |

### Flashcards tab

Each wine needs **exactly 4 rows** (one per difficulty).

| Column | What goes here |
|---|---|
| `id` | Unique ID, e.g. `f-109` |
| `wineId` | Must match a wine's `id` in the Wines tab — this is what powers "Quiz me on this wine" |
| `category` | Same category as the wine, for the colored tag |
| `wine` | The wine's display name, shown on the flashcard front |
| `question`, `answer` | The card content |
| `q` | `1` = Easy, `2` or `3` = Medium, `4` = Hard |

### Food tab

Powers the Food Menu page (descriptions only, no flashcards/quiz for food).

| Column | What goes here |
|---|---|
| `id` | Unique ID, e.g. `d-26` for the next new dish |
| `category` | One of: `charcuterie`, `entrees`, `plats`, `accompagnements`, `desserts` |
| `name` | Dish name as shown on the printed menu |
| `price` | Text field — handles `$25`, `MP`, or `$78 (+$30 au foie gras)` equally well |
| `description` | How it's made — shown under "How It's Made" when clicked into |
| `allergies`, `substitutions` | Shown as their own sections. Leave either blank and that section just doesn't appear — no empty "Allergies:" line |
| `imageUrl` | Same as wine photos — a relative path like `resources/images/d-01.jpg`, not a link to another site |

Leaving `description`/`allergies`/`substitutions` blank for a dish is fine —
the card still shows on the Food Menu with just its name and price, and the
detail view simply skips whichever sections have nothing in them.

### A note on bottle photos

Photos live in this repo, in `resources/images/`, rather than being linked
from other websites — hotlinking from producer/retailer sites turned out to
be unreliable (many block it), so this is the durable option. This applies
to food photos too, if you add any later.

**To add a photo:**
1. Get the image file (ask Claude to prep it from whatever you have, or do
   it yourself — a reasonable size is under ~500KB, roughly 800px on the
   long edge).
2. Upload it into `resources/images/` in this repo. A clear filename like
   `m-01.jpg` (matching the wine's `id`) keeps things easy to manage.
3. In the Sheet, set that wine's `imageUrl` to the relative path, e.g.
   `resources/images/m-01.jpg` — not a full `https://` link.

Since the image is served from this same site, it's cached for offline use
automatically, same as everything else.

## Workflows

### Replacing a wine

1. Draft the new wine's full content (all Wines-tab columns) and its 4
   flashcard questions — ask Claude to do this if you want a hand, providing
   whatever source material you have (importer sheet, back label, producer
   site).
2. Decide the map pin: if the new wine is from a region already on the map,
   copy that `pinLabel`/`lat`/`lng` from an existing row exactly. Otherwise
   it needs a new pin (just give it a `pinLabel` no other row uses).
3. In the Sheet: delete the outgoing wine's row from `Wines`, delete its 4
   rows from `Flashcards`, then add the new wine's row and its 4 flashcard
   rows.
4. If the outgoing wine was the *only* wine on its pin, its `pinLabel` simply
   disappears from the sheet on its own — nothing extra to clean up, since
   pins are derived live from whichever wines currently reference them.
5. Regenerate and re-upload the PDF (see below).

### Adding a wine (no replacement)

Same as above, minus the deletion — just add the new row to `Wines` and its
4 rows to `Flashcards`.

### Deleting a wine (no replacement)

Delete its row from `Wines` and its 4 rows from `Flashcards`. If it shared a
pin with other wines, nothing else to do. If it was alone on its pin, that
pin simply stops appearing — pins are derived automatically from whatever
wines currently reference them, so there's no separate pin list to maintain.

## Keeping the PDF in sync

The downloadable packet at the bottom of the Beverage Menu is a static file,
not sheet-driven — it's the one thing that needs a manual regenerate step
after a content change. Ask Claude to regenerate it from the current wine
list, then drop the new file into `resources/pdfs/` (same filename, or
update the link in `menu.html` if you rename it) and upload it.

## Offline use

The site works without a connection after a first visit. A service worker
(`sw.js`) caches every page, the current Sheets data, and the BTG packet PDF
the first time they load over wifi or cell data — after that, the Beverage
Menu, Flashcards, and Home page keep working with no signal at all.

The **Wine Map is the one exception** — it streams live map data from
Google, so it genuinely can't work offline. It shows a plain message saying
so instead of a blank or broken map if opened without a connection.

Once something is cached, a phone that's offline keeps seeing that cached
version until it's back online and revisits it — so someone on spotty wifi
might see a slightly stale wine list for a bit after you make a change,
rather than an error. Not a big deal for a reference tool like this, but
worth knowing.

If you ever want to force everyone's cache to refresh, bump the version
number in `sw.js` (`CACHE_NAME = 'chez-fifi-cache-v3'` → `v4`) and re-upload
it — that tells every phone to fetch fresh copies next time it's online. If
Sheets ever fails to load entirely (bad URL, sheet unpublished, etc.), the
site automatically falls back to the bundled `data/*.json` files, so it
never just breaks — worth periodically re-exporting the Sheet back into
those files as a backup (ask Claude to do this any time you want a fresh
snapshot).

## Setting up the interactive wine region map

The Maps page (`maps.html`) uses Google Maps to show pins for where each wine
on the list comes from. It needs a free Google Maps API key to work:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   sign in (or create a free account).
2. Create a new project (any name is fine, e.g. "Chez Fifi Wine Site").
3. In the search bar, look up **"Maps JavaScript API"** and click **Enable**.
4. Go to **APIs & Services → Credentials → Create Credentials → API Key**.
   Copy the key it gives you.
5. Google requires a billing account on file to issue a key, even though the
   free monthly credit (about $200) covers roughly 28,500 map loads —
   far more than an internal staff site will ever use. You will not be
   charged unless you exceed that.
6. Open `js/config.js` and paste your key in place of `PASTE_YOUR_KEY_HERE`,
   keeping the quotes:
   ```js
   self.GOOGLE_MAPS_API_KEY = "your-key-goes-here";
   ```
7. Save, re-upload `js/config.js` to GitHub, and the map will start working.

Optional but recommended: in Google Cloud Console, under your API key's
settings, restrict it to your site's URL(s) (e.g.
`https://yourusername.github.io/*`) so it can't be used elsewhere if it ever
leaks. If you're running a separate dev site, add its URL to the same
restriction list too.

## Testing changes locally before you publish

Because this site loads its content with JavaScript, opening `index.html`
directly by double-clicking it won't work (browsers block local file
fetches, and the Sheets CSV links need a real server context). To preview
it properly on your computer:

1. Open a terminal in this folder.
2. Run: `python3 -m http.server 8000` (or `python -m http.server 8000` on
   Windows).
3. Open `http://localhost:8000` in your browser.

If you don't want to bother with this, publish to your **dev** GitHub Pages
site instead and check it there before touching production.

## Running a dev + production site

Because the live site is already in front of staff, code/design changes
should go to a separate dev repo first:

1. Create a second GitHub repository (e.g. `chez-fifi-wine-program-dev`)
   with its own GitHub Pages site, same setup steps as production.
2. New file/code changes get uploaded to dev first; check them there.
3. Once you're happy, upload the same files to the production repo.

**Content changes (the Sheet) are shared** between dev and prod unless you
set up two separate Sheets — editing the Sheet updates both sites at once,
since they'd both be pointing at the same published CSV links. If you want
real staging for content too (test a wine change before staff see it), use
two Sheets: a "draft" one for dev's `config.js`, and a "live" one for
prod's — copy rows over once you're happy with a change.

## Publishing with GitHub Pages (free)

1. Create a free account at [github.com](https://github.com) if you don't
   have one.
2. Create a new repository (e.g. `chez-fifi-wine-program`). It can be public
   or private — Pages works with either on paid GitHub plans; public repos
   get Pages for free.
3. Upload every file and folder in this project to that repository (drag and
   drop works fine on github.com, or use GitHub Desktop if you prefer a
   visual app over the command line).
4. In the repository, go to **Settings → Pages**.
5. Under "Build and deployment," set **Source** to "Deploy from a branch,"
   branch `main`, folder `/ (root)`. Save.
6. GitHub will give you a URL like
   `https://yourusername.github.io/chez-fifi-wine-program/` within a minute
   or two. That's the link you send to staff.

## Adding a custom domain (optional)

Not required, but if you want something like `wine.chezfifi.com` instead of
the default GitHub URL, that's a DNS setting with your domain registrar plus
a `CNAME` file in this repo. Ask if you want help setting that up later.
