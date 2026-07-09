# Sharing & Deployment Plan — SSE Business Intelligence

## How the app is built (recap)
- **One static file**: `index.html` — all logic is client-side; it loads jQuery, Plotly and Gridstack from public CDNs (so it needs internet).
- **Data layer**: a Google Apps Script Web App (`/exec`) that returns the sheet tab as `{ headers, rows }` JSON, cached server-side. The URL is typed into the app's endpoint box.
- **All user work** (measures, calculated/linked measures, charts, dashboards, tabs, grid layout, slicers, cross-filters) is saved in the **browser's `localStorage`** (key `sheetsPivot.state.v2`). It is **per-browser/per-device, not on a server, and not shared automatically.**

## What that means for sharing
- Anyone who opens the page gets their **own blank workspace** (their own `localStorage`). 👍 for "build your own".
- Your dashboards **do not travel with the page** — they live only in your browser. To let others see them you must move the config (Export/Import) or bake it into the file.
- Each distinct data source needs **its own Apps Script endpoint**.
- "View my charts" only makes sense against the **same data source** (measures reference field names; a different sheet would error).

---

## Goal-by-goal

### Goal 2 — Others create their own measures/charts/dashboards (works today)
1. Host `index.html` at a URL (see Hosting).
2. Share the URL. Each person opens it, pastes a data endpoint, builds — their work auto-saves locally.

### Goal 3 — Others connect a NEW data source and start fresh (works today; +1 small build tweak)
1. They deploy their own data layer: copy `apps-script/Code.gs` into a **standalone** Apps Script project, set `SPREADSHEET_ID` + `TAB_NAME` to their sheet/tab, **Deploy → Web app** (Execute as: Me, Access: Anyone), copy the `/exec` URL. (See `apps-script/DEPLOY.md`.)
2. In the app: paste that URL into the endpoint box → **Refresh data**.
3. Start clean with **Reset layout** (clears the builder) or **Clear everything** (wipes saved measures + dashboards — see code additions).
- Tweak: ship a build whose endpoint box is **blank by default** so it doesn't point at your sheet.

### Goal 1 — Others VIEW & refresh YOUR measures/charts (needs Export/Import)
- Add **Export** (download the whole workspace as `.json`) and **Import** (load a `.json`). Send recipients the file; they Import once, then **Refresh data** for live numbers.
- OR bake a default config into the HTML so the page opens with your dashboards preloaded (best for a read-mostly share).

---

## Hosting options (pick one)
1. **GitHub Pages (recommended)** — commit `index.html`, enable Pages → free `https://…` URL. Stable, https (no `file://` quirks), CDN + endpoint all work.
2. **Netlify / Vercel drag-drop** — drop the folder → instant https URL.
3. **Send the `.html` file** — simplest; each person runs it locally (`file://`) with separate storage and a harmless "file: unique origin" console warning.
4. Google Sites/Drive — clunky for raw HTML; not recommended.

## Small code additions that make this real (I can implement)
1. **Export / Import workspace (JSON)** — enables Goal 1 and doubles as a backup against `localStorage` loss. (~30 lines.)
2. **"Clear everything"** button — wipes saved measures + dashboards to truly start fresh (distinct from "Reset layout", which keeps them).
3. **Blank-endpoint distribution build** — same file, empty endpoint default, for handing to others.
4. *(Optional)* make the title/subtitle editable instead of hard-coded "SSE Business Intelligence / Nagpur MS Allocation".

## Security & privacy (important)
- The `/exec` endpoint is deployed **"Anyone"** — anyone with the URL can read that tab's JSON. If you host the HTML publicly with your URL baked in, treat that data as effectively public. For sensitive data: share the file privately, or have each viewer use their own endpoint.
- `localStorage` is per browser/device; clearing browser data erases unsaved work → use **Export** as backup.
- There's no login/auth; this is a lightweight analysis tool, not a multi-user server app.

## Recommended rollout order
1. *(me)* Add Export/Import + "Clear everything"; produce a blank-endpoint build.
2. Host `index.html` on GitHub Pages.
3. **Viewers of your dashboards** → send Pages URL + your exported `.json` (Import + Refresh).
4. **Builders** → send the URL; they add an endpoint and go.
5. **New data sources** → send `Code.gs` + `DEPLOY.md`; they deploy and paste their `/exec`.
