# Screenshots

The images the README uses. Retake them when the interface changes — a
screenshot that no longer matches the app is worse than none, because it is the
first thing a visitor trusts.

| File | Screen | Captured at |
| --- | --- | --- |
| `feed.png` | The queue | 1280 x 900 |
| `deep-dive.png` | One issue, with its reasoning | 1280 x 1340 |
| `onboarding.png` | The skill profile | 1280 x 880 |

Each has a `-dark.png` twin at the same size. The app has no theme toggle — it
follows `prefers-color-scheme` — so the README serves each pair through a
`<picture>` element and the reader gets whichever theme they are already in.
Capture both halves of a pair in the same run, or the relative dates in them
("opened 2 weeks ago") can drift apart.

All six at device pixel ratio 2.

## How these were made

Not by hand, and not from the live site: every screen past the landing page is
behind GitHub sign-in, and a real session would put a real avatar and handle
into a public image.

Instead a temporary route rendered the real components against seed data, and
headless Chrome captured it. The repositories in the images are invented; the
scores are not. The seed is fed through `recommend()` — the same entry point
`getOpportunity` uses — so every number, every verdict and every line of
reasoning on screen is what Tracer actually produces for that input.

Inventing the repositories is deliberate. A fabricated project-health score
next to a real project's name, in a README, is a claim about real maintainers
that nothing supports.

## Retaking them

There is no capture script committed — it is a handful of temporary files, and
leaving a fake-data route in the app to rot is worse than rewriting it when it
is next needed. To redo it:

1. Add a route under `src/app/` that renders the page you want with seed data.
   Mirror the real page's composition, so what you capture is what ships. The
   real feed is `PageHeader` + `FeedConsole`; the deep dive is `VerdictPanel`,
   `ScoreBreakdown`, `StartingPointsPanel`, `AiPanel`, `RepositoryPanel` and
   the issue body, in that order.
2. `SiteNav` calls `auth()`, and sessions live in Postgres, so a signed-out nav
   will render instead of the real one. Stub the session for the capture.
3. Set `devIndicators: false` in `next.config.ts`, or Next's dev badge lands in
   the corner of every image.
4. Run the dev server and capture:

   ```bash
   chrome --headless --disable-gpu --hide-scrollbars \
     --force-device-scale-factor=2 \
     --blink-settings=preferredColorScheme=1 \
     --virtual-time-budget=8000 \
     --window-size=1280,900 \
     --screenshot=docs/screenshots/feed.png \
     http://localhost:3000/<your-preview-route>
   ```

   `preferredColorScheme` is **1 for light and 0 for dark**. Any other value —
   `2`, say — is silently clamped to light rather than rejected, so confirm the
   pair actually differs before believing you captured both:

   ```bash
   md5sum docs/screenshots/feed.png docs/screenshots/feed-dark.png
   ```

   Omit the flag and Chrome follows the operating system, which leaks the theme
   of whoever ran the capture into the repository.

5. Delete the temporary route, the session stub and the `next.config.ts`
   change. None of it belongs on `main`.

## If you capture from a real session instead

Check the pixels before committing. Real screenshots leak: your avatar, your
GitHub handle, the bookmarks bar, a notification that arrived mid-capture.
Crop to the page content.

## An animated version

A short GIF of one discovery run — the docked widget filling, then the ranked
queue — would carry the product better than any still. It needs a real run
against the GitHub API, so it is a manual capture. Keep it under 5 MB, put it
at `discovery.gif`, and place it above the stills in the README.
