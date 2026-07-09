# Deploying the data-layer Web App

This is **step 1** of the build: a Google Apps Script `doGet` endpoint that returns
the target tab as JSON. The spreadsheet stays private; only this tab's JSON is exposed.

## 1. Create the Apps Script project (standalone)

We use a **standalone** script (not container-bound to any sheet). `Code.gs` opens the
spreadsheet explicitly via `SpreadsheetApp.openById(...)`, so it doesn't need to live
inside the source sheet — it just needs to run as an account that can read that sheet.

1. Go to <https://script.google.com> → **New project**. (Sign in with the account that
   can access the source spreadsheet.)
2. Delete the default `Code.gs` contents and paste in the contents of [`Code.gs`](Code.gs).
3. **Save** (Ctrl+S).

## 2. Test before deploying

1. In the editor's function dropdown pick **`testReadTab`**, click **Run**.
2. First run: approve the authorization prompt (it's your own script accessing your own sheet).
3. Open **Execution log** — you should see the header list and a row count. If you see
   `Tab not found`, double-check the tab name in `Code.gs` matches exactly:
   `backup from MH_MS>MD East`.

## 3. Deploy as a Web App

1. **Deploy → New deployment**.
2. Gear icon → select type **Web app**.
3. Settings:
   - **Description:** `pivot data layer` (anything)
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. **Deploy**, approve access again if asked.
5. Copy the **Web app URL** — it ends in `/exec`. This is the data URL the front-end uses.

## 4. Verify in the browser

Paste the `/exec` URL into a new browser tab. You should get JSON like:

```json
{
  "sheet": "backup from MH_MS>MD East",
  "headers": ["...", "..."],
  "rows": [["...", 123], ["...", 456]],
  "rowCount": 1234,
  "generatedAt": "2026-06-18T..."
}
```

Note: the `/exec` URL issues a redirect to `script.googleusercontent.com` — the browser
follows it automatically, so you'll land on the JSON.

## ✅ Live deployment (status)

- **Deployed:** 2026-06-18, standalone script.
- **Access:** Execute as Me, Who has access: **Anyone** (chosen so the no-login local
  front-end can fetch; only this one tab's JSON is exposed, via the unguessable `/exec` URL).
- **Endpoint:** `https://script.google.com/macros/s/AKfycbz-RkeGCheRjEZ49MuU__LhAGOpkr5o503rMSgw7WKVt8mp-e2gU4qRx4uOEcUR1TTl/exec`
- **Verified:** returns 24 headers, 20,131 rows. Response carries
  `Access-Control-Allow-Origin: *`, so plain browser `fetch` works (no JSONP needed).

### Re-deploying after code changes
Editing `Code.gs` does **not** update the live URL automatically. Use
**Deploy → Manage deployments → (edit, pencil icon) → Version: New version → Deploy**.
This keeps the same `/exec` URL. (Creating a *new* deployment instead would give a new URL.)
