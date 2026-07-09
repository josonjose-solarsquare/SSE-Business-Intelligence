/**
 * Data layer for the SSE Business Intelligence app.
 *
 * Returns the target tab as JSON: { sheet, headers, rows, rowCount, generatedAt, timing }.
 * Deployed as a Web App (Execute as: Me, Who has access: Anyone).
 *
 * Performance: reading ~20k x 24 cells on every request was taking ~35s. We now cache the
 * built JSON in CacheService (chunked, since each cache value is capped at ~100KB) for a few
 * minutes, so only a cache MISS pays the full sheet-read cost. Add ?nocache=1 to force a fresh read.
 */

var SPREADSHEET_ID = '1MFNtu-HInt-PyxUNHeh8xVwv1-IWWMxiDntvbHGooIk';
var TAB_NAME = 'backup from MH_MS>MD East';

var CACHE_KEY = 'tabjson:v1';   // bump to invalidate all caches
var CACHE_TTL = 3600;           // seconds the cache stays valid (max 21600); a warmCache trigger refreshes it more often
var CHUNK = 90000;              // chars per cache chunk (must stay under the ~100KB/value limit)

function doGet(e) {
  var cb = (e && e.parameter) ? e.parameter.callback : null;
  var noCache = !!(e && e.parameter && e.parameter.nocache);
  try {
    var json = noCache ? null : readCache();
    var cached = !!json;
    if (!json) { json = buildJson(); writeCache(json); }
    // annotate whether this response was served from cache (cheap string splice; keeps timing visible)
    json = json.replace(/\}$/, ',"servedFromCache":' + cached + '}');
    return rawResponse(json, cb);
  } catch (err) {
    return rawResponse(JSON.stringify({ error: String(err && err.message ? err.message : err) }), cb);
  }
}

/** Reads the tab and returns the JSON string, with server-side timing for diagnosis. */
function buildJson() {
  var t0 = Date.now();
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) throw new Error('Tab not found: "' + TAB_NAME + '"');
  var openMs = Date.now() - t0;

  var t1 = Date.now();
  var values = sheet.getDataRange().getValues();
  var readMs = Date.now() - t1;

  var headers = (values[0] || []).map(function (h) { return String(h).trim(); });
  var rows = values.slice(1).map(function (row) { return row.map(normalizeCell); });

  return JSON.stringify({
    sheet: TAB_NAME,
    headers: headers,
    rows: rows,
    rowCount: rows.length,
    generatedAt: new Date().toISOString(),
    timing: { openMs: openMs, readMs: readMs, lastColumn: sheet.getLastColumn(), lastRow: sheet.getLastRow() }
  });
}

// ---- chunked CacheService helpers (values are capped at ~100KB each) ----
function readCache() {
  var c = CacheService.getScriptCache();
  var meta = c.get(CACHE_KEY);
  if (!meta) return null;
  var n = parseInt(meta, 10);
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(CACHE_KEY + ':' + i);
  var parts = c.getAll(keys);
  var out = '';
  for (var j = 0; j < n; j++) {
    var p = parts[CACHE_KEY + ':' + j];
    if (p == null) return null; // a chunk expired -> treat as a miss
    out += p;
  }
  return out;
}
function writeCache(json) {
  try {
    var c = CacheService.getScriptCache();
    var n = Math.ceil(json.length / CHUNK);
    for (var i = 0; i < n; i++) c.put(CACHE_KEY + ':' + i, json.substr(i * CHUNK, CHUNK), CACHE_TTL);
    c.put(CACHE_KEY, String(n), CACHE_TTL);
  } catch (e) { /* cache is best-effort; ignore failures */ }
}

function rawResponse(json, cb) {
  if (cb) return ContentService.createTextOutput(cb + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function normalizeCell(v) { return (v instanceof Date) ? v.toISOString() : v; }

/**
 * Optional: run this on a time-driven trigger (e.g. every 5 min) to keep the cache warm,
 * so even the first user request of the window is fast. Set up via Triggers > Add Trigger.
 */
function warmCache() { writeCache(buildJson()); }

/** Run from the editor to see the server-side timing breakdown in the logs. */
function testReadTab() {
  var t = Date.now();
  var json = buildJson();
  Logger.log('buildJson total: %sms, bytes: %s', Date.now() - t, json.length);
  Logger.log('timing: %s', json.match(/"timing":\{[^}]*\}/));
}
