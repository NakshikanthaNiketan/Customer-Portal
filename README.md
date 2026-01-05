# Saree Inventory (Frontend)

A small, static front-end for viewing a saree inventory stored in a Google Sheet. The app reads rows from a sheet and renders cards with image thumbnails, filters, cart UI, sold-item handling and a detail modal with next/previous navigation.

This repository is a single-page static app (HTML/CSS/JS). It supports two ways to read the sheet:
- Public sheet using a Google API key (fast, no sign-in)
- Private sheet using OAuth sign-in (client ID) — the app will prompt the user to sign in and request readonly access to Sheets

Features
- Load inventory rows from a Google Sheet (auto-detects common column names)
- Filters: search, price range, fabric, color, sort
- Sold filter: Show All / Available / Sold and a Hide Sold shortcut
- Sold items are visually marked and show sell price
- Serial numbers for visible items (updates with filters/sort)
- Item details modal with large image and Prev/Next navigation (keyboard support ← / →)
- Cart (localStorage), CSV export, and simple toast messages
- Status panel: totals, invested, sold totals and profit

Files
- `index.html` — main page
- `style.css` — styles
- `script.js` — application logic

Quick start (serve locally)

You can open `index.html` directly in a browser, but for consistent behavior (and for OAuth to work reliably) run a small static server.

Using Python 3:

```powershell
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Or using Node (if you have `npx`):

```powershell
npx serve -s .
# then open the printed local URL (e.g. http://localhost:5000)
```

Configuration (Google Sheets)

⚠️ **IMPORTANT: Setup Required**

This application requires configuration to connect to your Google Sheets. Follow these steps:

### 1. Copy the configuration template
```bash
cp config.example.js config.js
```

### 2. Get your Google Sheets API credentials
1. Open the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google Sheets API
4. Create an API key and restrict it appropriately

### 3. Update config.js with your values
```javascript
const CONFIG = {
  API_KEY: 'your_actual_google_api_key',
  SHEET_ID: 'your_google_sheet_id',
  SHEET_NAME: 'Sheet1'
};
```

- `SHEET_ID`: Found in your Google Sheet URL between `/d/` and `/edit`
- `SHEET_NAME`: The name of the tab in your spreadsheet (default: 'Sheet1')

### 4. Security Notes
- **NEVER commit `config.js` or `.env` files to git** - they contain your secrets
- The `.gitignore` file is already configured to exclude these files
- Only commit `config.example.js` which has placeholder values
- For production, consider using environment variables or GitHub Actions secrets

Public vs Private sheet access
- Public: If you make the sheet viewable by Anyone with the link (or public), the app will use the API key (no sign-in required). Ensure the Google Sheets API is enabled for the API key.
- Private: If the sheet is private, the app will load Google's JS client and prompt the user to sign in with OAuth (Client ID is already present in `script.js`). The signed-in account must have access to the sheet.

Important: Security
- Do NOT commit private client secrets or server-side credentials to a public repository. The frontend uses a client ID (OK for browser use); do NOT add a client secret here.

Google Cloud setup (if needed)
1. Create or open a Google Cloud project and enable the Google Sheets API.
2. Create an API key (for public-sheet access) and restrict it appropriately (HTTP referrers for production).
3. Create OAuth 2.0 credentials (Client ID for web application) for browser sign-in and set the authorized origins (e.g., `http://localhost:8000`) if you plan to use OAuth locally.

Columns and parsing
The app attempts to detect common column headers (case-insensitive). Expected fields include:
- Number / Saree / No
- Color / Colour
- Fabric / Material
- Price / Cost / MRP
- Photo / Image / URL
- Status (optional) — rows containing 'sold' will be treated as sold
- Sell Price (optional) — used in sold-item totals

If your sheet uses different headers, either rename the headers or update `script.js` parsing logic.

Troubleshooting
- If you see "Sheets API error or key/range invalid" in the UI:
	- Check the `SHEET_ID` and `SHEET_RANGE` values in `script.js`.
	- If using API key path, ensure the key has Sheets API enabled and that the sheet is publicly viewable.
	- If using OAuth fallback, ensure the client ID is configured in Google Cloud with the correct authorized origins and the OAuth consent screen is configured.

Contributing / Extending
- This is a small single-file frontend. You can extend parsing, add server-side endpoints (recommended for using service accounts securely), or add features such as categories, bulk updates, or image hosting.

License
- Add a license file if you plan to publish this repo publicly.

Contact
- If you want me to implement additional UI changes (e.g., nicer modal controls, persist filters, or server-side integration), tell me which feature and I will implement it.
