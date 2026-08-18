# देसी नॉस्टैल्जिया आर्काइव — project context

Hand this file to a new chat to pick up where the last one left off. It covers
what exists, why it is built this way, and the decisions that should not be
quietly undone.

---

## 1. What this is

A single-page archive of Indian "nostalgia websites" — solo-built micro-sites
that recreate one slice of desi life with period music: a chai tapri, a truck
cabin, a state roadways bus, a barbershop, a garba night, a Bollywood party
room.

**Where the trend actually started** (corrected 18 Aug after research — the
earlier note here said the thread started it, which is wrong and would read as
not having done the reading): [@s4tr2](https://x.com/s4tr2) posted the first one
on **7 August 2026** — `the-nostalgia.vercel.app`, now redirecting to
`nostalgiahits.in`. It broke out when [@ybhrdwj](https://x.com/ybhrdwj) shipped
**saloon.wtf** — ~18k likes, ~5.2M views, by far the biggest node in the niche.
[@suraj_sharma14's thread](https://x.com/suraj_sharma14/status/2087990257325412654)
came later and *collected* them; it is where this archive was seeded from, not
where the trend began. Say it that way in any post.

The page shows every site as a tile with a real screenshot, its own colours,
its maker's credit, and how many people are inside it right now.

- **Repo**: https://github.com/RushOnhere/desi-nostalgia-hub (public)
- **Owner**: Rush (@rushabh_variya on X)
- **Deploy target**: Vercel, static, no build step
- **Language**: Hindi-first, with an EN toggle

## 2. Current state (18 Aug 2026)

| | |
|---|---|
| sites | **92** |
| screenshots | 92, ~4.2 MB total in `shots.js` |
| embeddable live | 87 of 92 |
| sites reporting a count | 46 (44 live, 2 cumulative) |
| counters that never move | 12 — excluded from totals |
| trusted live total | ~4,078 |
| maker credited | 44 of 92 (40 confirmed) — **48 still unknown** |

Newest entries (18 Aug): `shaadidj.wtf` (@divvsaxena), `hanuman.live`
(@thecyberzeel), `baulgan.vibemusic.space` (@Dev_anik2003), `rakshabandhan.me`
(@thenishandas), `tuktuk-iota.vercel.app` (@ankitsharmatv, posted behind the
shortlink gotolink.cc/tuktuk — the archive stores the resolved destination),
and `townbus.vercel.app` (@iamAnish), which is a *third* town-bus site,
separate from `townbus.site` and `town-bus.vercel.app`. Do not merge them.

Not added: @BuildwithOmkarr's Ganpati site — his launch post is a video with
no link in it, so there is nothing to point a card at yet.

## 3. Files that ship

`index.html` (page: markup, styles, script, inlined fonts, the SITES array),
`shots.js`, `palette.js`, `crowd.js`, `frameable.js`, `presence.js`, `badge.js`,
`og.png`, `favicon.svg`, `robots.txt`, `sitemap.xml`, `vercel.json`.

`artifact.html` is a build output — one self-contained file with every data
file inlined, used for previewing on claude.ai. It is gitignored.

## 4. The pipeline

| script | job |
|---|---|
| `capture.js` | screenshot every site |
| `recapture.js` | re-shoot sites whose capture caught an "enter" gate |
| `fix-shots.js` | targeted re-capture: dismisses modals, then opens gates |
| `audit-shots.js` | flag previews that are blank, black or flat |
| `contact-sheet.js` | render all previews into grid images to eyeball |
| `shrink-shots.js` | re-encode previews to 700px (they paint at ~370px) |
| `extract-palette.js` | pull each site's two defining colours from its shot |
| `scrape-counts.js` | read each site's own "N listening" counter |
| `classify-counts.js` | live vs cumulative classifier (also a module) |
| `compare-counts.js` | diff two snapshots — shows which counters move |
| `test-frameable.js` | which sites allow being embedded |
| `make-og.js` | build the share card from real data |
| `make-logo.js` | trim Desi.png for the masthead |
| `fetch-poppins.js` | download + inline the Poppins subsets |
| `add-batch.js` | append a batch of new sites to SITES |
| `build-artifact.js` | inline everything into artifact.html |
| `refresh.js` | one command: counts (+ `--shots` to re-capture) |

Playwright is not a dependency of this repo — scripts import it by absolute
path from `E:/Claude Stuff/motion-kit/node_modules/playwright`. In CI the
workflow installs its own and passes `PLAYWRIGHT_PATH`.

## 5. Decisions that should not be undone

**Screenshots, not 65+ live iframes.** Measured: all-live costs **360 MB and
1,982 requests**, drops scrolling to ~12fps (83ms frames vs 16.7ms) and takes
45s to settle. Screenshots are 3.9 MB total. Also ~12 sites open on a
"tap to enter" gate that an iframe cannot click itself, so they would show a
dark landing page forever — the capture pipeline clicks through first.

**Live on hover instead.** Hovering a tile for 550ms loads the real site in a
sandboxed iframe, scaled from 1280px so it lays out as desktop. One at a time;
unloads on leave. Tapri Mode does the same fullscreen. Off on touch devices and
when the browser reports data-saver.

**Two kinds of number, never mixed.** A site printing "1,283 listening now" is
concurrent; "3,036 have passed through this gali" is a lifetime odometer that
only climbs. Ranking one against the other is meaningless — गली was permanently
#1 until this was fixed. `classify-counts.js` decides by the words next to the
number, with the history's shape as a backstop. Cumulative counts still show,
labelled "अब तक / so far", but never enter the chowk, the totals, or the sort.

**Frozen counters are detected, not hand-listed.** `crowd-history.json` keeps
the last 12 readings; anything unchanged across 3+ readings is `moved:false`,
shown with a grey dot and left out of every total. Currently 12 sites.

**Performance rules learned the hard way:**
- `loading="lazy"` does **nothing** for a data URI — no network fetch to defer.
  All 68 previews decoded before first paint (376ms). Now each `src` is held
  back and handed over by an IntersectionObserver at 600px. First paint ~60ms.
- A full-screen `mix-blend-mode` layer re-composites the whole viewport every
  scrolled frame. Removing the grain's blend mode took median frames from
  33.4ms to **16.7ms**. There are now **zero** blend modes in the page.
- Blur is expensive per element. It belongs on fixed chrome only (masthead,
  filter rail, footer, socials, sheet, tooltip) — about 17 surfaces. Putting
  it on 176 per-card badges was a major cost; those are solid now.
- `content-visibility: auto` with `contain-intrinsic-size: auto 390px` on grid
  tiles (390 is the measured median height — a wrong value makes the page
  height wobble).
- `history.scrollRestoration = 'manual'` and smooth scrolling only after load;
  otherwise a refresh restores mid-page and the browser visibly glides while
  content resolves.

**The masthead must never overflow.** It once ran off-screen at every width up
to 1920 (`overflow-x: hidden` was hiding it). Every child declares how it gives
way, and labels drop in priority order. Test with the width sweep before
changing it.

**Bilingual labels are stacked, not swapped.** Each label holds both languages
in one grid cell with the inactive one `visibility: hidden`, so switching
language never reflows the bar. Verified: zero controls move.

**Typography**: Rozha One (display — the face several of these sites use, taken
from deluxesaloon.space's own stylesheet) + Poppins (UI/body, geometric, has
Devanagari). Both inlined as data URIs; the artifact CSP blocks font CDNs.
`font-synthesis: none` — Rozha One has one weight and no italic.

## 6. Views

- **ग्रिड** — chowk spotlight (top 3 by live count, rotates every 9s), then
  category sections.
- **सीट चार्ट** — a cinema hall. Rows are playlists ordered by traffic, seats
  are sites carrying their own screenshot, Row A gets recliners, empty seats
  open the submit sheet.
- **टपरी मोड** (`T`) — fullscreen channel surfer, 7s dwell, Ken Burns, live
  site loaded under the caption, arrow keys change channel.

## 7. Counts: how they get there

**Scraped** — `scrape-counts.js` drives headless Chrome over every site and
reads the counter it prints. A browser cannot do this itself (CORS), which is
why it runs in CI. GitHub Actions runs it **every 20 minutes** and commits
`crowd.js` **and `crowd-history.json`** (committing only the former was a bug —
history is what powers frozen detection). The workflow pulls with rebase and
retries 3× because a human push during the ~7 minute scrape used to fail it.

Needs **Settings → Actions → General → Workflow permissions → Read and write**.

**Measured** — Supabase project `nostalgiahub` (`iomcpnyfnuvujgzamtbp`). A site
embedding `badge.js` heartbeats every 20s; its card then shows distinct
visitors from the last 45s, with a brighter dot. This is the only path to a
count for the ~41 sites that publish nothing.

Security shape: `presence` table has **RLS on with no policies** — the
publishable key can neither read (returns empty) nor write (401) rows. Access
is only via `heartbeat(site, visitor)` and `live_counts()`, both security
definer. `heartbeat` accepts only `hub` or a hostname and prunes rows older
than five minutes.

The key in `presence.js` is the **publishable** key and is meant to be public.
The `service_role` key must never appear in the repo, the page, or a chat.

> Removed on request: a private "here now" chip that showed how many people
> were on the archive itself, unlocked by `?owner=<token>` against a hashed
> token in an `owner_key` table. The `hub_viewers(token)` function and
> `owner_key` table still exist in the database but nothing calls them.

## 8. Submissions

- **Google Form** (live, public, no sign-in, 3 required questions) — the single
  button in the "अपनी साइट जोड़िए" sheet.
- **GitHub issue template** at `.github/ISSUE_TEMPLATE/add-a-site.yml`, with the
  form linked as the no-account fallback in `config.yml`.
- `SUBMIT_TO` near the top of the script sets both. Whatever is unset stays
  hidden — no dead buttons.

The responses Sheet is deliberately **not** in the repo or the page.

## 9. Adding a site

```js
{ t:'हिंदी नाम', u:'https://example.com', d:'एक लाइन में', c:'chai',
  g:'☕', h:24, p:'p-dots', k:'latin search words',
  maker:'Name', handle:'their_x_handle', mv:1,
  te:'English name', de:'English one-liner' },
```

Categories: `chai truck bus tyohar radio dukaan kaam retro`.
`mv:1` = credit confirmed from the site itself or the maker's own post. Leave
it off and the card shows "पुष्टि बाकी / unconfirmed" — the honest default for
a third-party listing.

Then: `recapture.js` (with the new URL in `recapture.json`) → `shrink-shots.js`
→ `extract-palette.js` → `test-frameable.js` → `build-artifact.js`.

## 10. Open items

1. **48 of 87 sites have no maker credited.** Biggest gap in the archive's
   credibility as *the* index. Priority order is by reach: the makers whose
   posts carry the niche should not be the ones showing "पुष्टि बाकी".
   Already fixed: saloon.wtf and deluxesaloon.space are **Yash Bhardwaj
   (@ybhrdwj)** — confirmed twice, by his own launch post and by
   `town-bus.vercel.app` printing "Inspired by Deluxe Saloon by Yash Bhardwaj".
   Still open: `town-bus.vercel.app` is credited to @ananyeahplsno on
   third-party evidence only and the page itself names no builder — it stays
   `mv` off until the maker confirms. Do not guess an attribution to fill a
   gap; an empty credit is recoverable, a wrong one is not.
2. **No custom domain, by decision.** Rush's call on 18 Aug: a domain does not
   make this profitable, X does. The home is `https://thechowk.vercel.app` — a
   bare desi noun, matching how every site in this trend is named, and free
   when checked (`nukkad`, `gali`, `tapri`, `mohalla`, `adda` were all taken).
   `set-home-url.js` holds that host in one constant and rewrites the meta
   tags, `badge.js`, `robots.txt` and `sitemap.xml` from it.
3. **Deployed.** The Vercel project must be renamed to `chowk` in the
   dashboard, or every absolute URL in the page points at a host that is not
   serving it. The CLI here has no valid token, so that step is manual.
4. **Screenshots ship as one 3.9 MB `shots.js`.** Every visitor downloads all
   86 even if they see twelve. Splitting them into individual files served by
   the CDN would cut a typical visit by ~87%. Not done.
5. **No badge adopters yet** — until makers embed it, all counts stay scraped.
6. Marketing/launch not started.

## 11. Working style that suited this project

- Measure before claiming. Every performance and data claim here came from a
  script that printed numbers — frame times, byte counts, contrast ratios,
  two count snapshots diffed 166 minutes apart.
- Verify with local Playwright, not the in-app browser pane (it does not
  composite on this machine — rAF and screenshots die silently). Headed Chrome
  cannot launch in the sandbox, so GPU-composited numbers are unavailable and
  should be stated as such rather than implied.
- Prefer editing `index.html` through small Node scripts with exact anchors.
  Two things bite: the file is CRLF after a git round-trip, and the first `];`
  in the script closes CATS, not SITES.
