# Project Brief — SSE Business Intelligence

> Hand-off context for a browser-based pivot/chart tool over private Google Sheets.
> This started as a planning doc (sections below); the "Current implementation"
> section reflects what's actually built and supersedes anything that conflicts.

## Repo

Single source of truth: this repo (`SSE-Business-Intelligence`, hosted on GitHub
Pages). `index.html` is the entire front-end — one self-contained file. Older
working copies at `C:\Users\Joson\dev\BI` and `C:\Users\Joson\Documents\BI` were
consolidated here on 2026-07-09 and removed; don't recreate them.

## Current implementation (as of 2026-07-09)

- **Not PivotTable.js.** The pivot/measures engine is custom-built (in `index.html`),
  rendered with Plotly. Reason: PivotTable.js only supports one measure at a time;
  this app needs multiple simultaneous measures, calculated measures, and a
  multi-chart dashboard. See "Scope" below for what's still out of scope (DAX,
  multi-table relationships).
- **Dashboards**: Rows/Columns/Values/Filters builder, multiple measures per visual,
  calculated measures (arithmetic over aggregates, client-side expression parser),
  a tabbed dashboard of pinned tiles (table/chart/KPI), slicers, and chart-click
  cross-filtering.
- **Date hierarchy**: any date-like field can drill Year ▸ Quarter ▸ Month ▸ Day in
  Rows, Columns, or Values (not just the filter popup). Date detection recognizes
  ISO, `D/M/YYYY`, and `MMM-YY`/`MMM-YYYY` (e.g. `Jun-26`) formats.
- **Flexible ingestion**: the data endpoint no longer has to return the native
  `{ headers, rows }` shape — an array of flat objects, or a nested object of
  objects (e.g. `{ month: { region: { metric: value } } }`), are auto-reshaped
  into a flat table. Nested shapes prompt once per endpoint for column names,
  which are then remembered (persisted per endpoint URL).
- **Endpoint persistence**: the data endpoint URL is saved per-browser
  (`localStorage`) so it survives a page reload.
- **Export/Import**: a workspace (measures, dashboard tabs, endpoint, and a
  user-given **dashboard name** shown as the header subtitle) can be exported to
  a `.json` file and committed to the repo root; the in-app Import dialog
  auto-lists `.json` files there (shows `Dashboard name — file.json`), or a file
  can be picked manually.

## Data source

- Primary spreadsheet ID: `1MFNtu-HInt-PyxUNHeh8xVwv1-IWWMxiDntvbHGooIk`
- Tab to visualize: **"backup from MH_MS>MD East"**
- The sheet is private and must stay private. Other endpoints (e.g. a
  colleague's own sheet) can be pasted into the endpoint box — each needs its
  own Apps Script deployment (see `apps-script/DEPLOY.md`).

## Architecture (original decisions, mostly still true)

### 1. Data layer — Apps Script Web App
- `doGet(e)` in `apps-script/Code.gs` opens the spreadsheet and returns the
  target tab as JSON (`{ sheet, headers, rows, rowCount, generatedAt, timing }`),
  with a CacheService layer since reading ~20k rows takes ~35s uncached.
- Deploy as a Web App: **Execute as: Me**, **Who has access: Anyone (or Anyone with link)**.
  This keeps the sheet itself private while exposing only the JSON the app needs.
- The front-end fetches this URL via a manual **Refresh data** button.
- CORS / gotcha: Apps Script returns JSON via `ContentService`; the `/exec` URL
  issues a redirect, so fetch the final URL and expect that hop.

### 2. Front-end — single HTML page
One self-contained `index.html` (see "Current implementation" above for what
actually runs — this section is the original, largely superseded plan).
- ~~PivotTable.js (nicolaskruchten) for the drag-and-drop pivot UI~~ — superseded
  by the custom engine.
- **Plotly** as the chart renderer: bar, stacked bar, line, area, scatter, heatmap,
  treemap, sunburst, icicle, KPI tiles.
- **Calculated-measures panel**: the user types arithmetic-over-aggregates
  expressions — e.g. `SUM(Revenue) / SUM(Units)`, margins, ratios, % of total.

## Scope (decided)

**In scope — typical Excel pivot measures:**
- Built-in aggregators: Sum, Count, Count Numbers, Average, Min, Max,
  StdDev/StdDevp, Var/Varp (most are native to PivotTable.js).
- "Show Values As": % of grand total, % of row total, % of column total (native).
- Calculated fields via the measures panel.

**Out of scope (unless explicitly requested later):**
- Niche "Show Values As" modes: running total, rank, % difference from previous
  (these need custom code).
- Real DAX semantics: `CALCULATE` / filter-context modifiers, time intelligence
  (`TOTALYTD`, `SAMEPERIODLASTYEAR`, etc.), context transition, multi-table
  relationships. The data is a single flat table, so relationships aren't needed.

## Feasibility summary
- Pivot table + pivot charts + field drag-and-drop: **fully feasible** (PivotTable.js + Plotly).
- Calculated measures: **feasible in a simplified arithmetic-over-aggregates form** (not real DAX).
- Full DAX fidelity: **not attempted**.

## Open decisions to settle at kickoff
1. Single self-contained HTML file (opened locally) vs a hosted page.
2. Web App access setting (Anyone vs Anyone with link).
3. JSON shape returned by `doGet` (row objects vs `{headers, rows}`).

## Suggested build order
1. `doGet` endpoint returning the tab as JSON; verify by opening the URL in a browser.
2. HTML page that fetches the endpoint and renders the raw data in a plain table.
3. Wire up PivotTable.js with Plotly renderers.
4. Add the calculated-measures panel.
5. Polish: refresh control, number formatting, persisted field layout.
