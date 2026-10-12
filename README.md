# Krishna Divinity local website

Working website: `krishna_divinity_site/`. Original files are preserved outside this folder in `../Source/`.

## Run locally

- `npm run demo`: opens a server at http://127.0.0.1:4174 with local, in-memory test registrations. Use invented details. Data disappears when the server stops. Google Sheets is never contacted in demo mode.
- `npm start`: same website, registration disabled until the server environment is configured.
- `npm test`: validation, batch selection, retries, server response and Apps Script adapter tests.
- `npm run build`: prepares the Apps Script core used with the website.

No npm packages are needed for the website, local server or tests. Node 22 or newer is required.

## Current status

Implemented locally: required full name, WhatsApp with country code, email and city; optional DOB; required course-update consent; preselected course; AI Live + Recorded Course wording; updated instructor introduction; registration receipts; next-batch assignment and waiting list; duplicate protection; server-side Google Sheets adapter.

Created native Google workbook:
https://docs.google.com/spreadsheets/d/1PgupS-wlHJcqDAsP8HskS9YMysHL2Mqf8yyy2QAK3dA/edit

Tabs: Students, Registrations, Payments, Batches, Guide. No real student records or invented batch dates have been added. Sharing remains owner-only.

**Not activated:** Apps Script deployment, Netlify server configuration, payment processing, automatic messages, WhatsApp access and recorded-course accounts. The current live Netlify website has not been changed during this local development step. The payment sheet is a schema only.

## Connect Google Sheets

1. Open the workbook and select Extensions → Apps Script in your signed-in Google account.
2. Add the contents of `google-apps-script/Core.gs` and `google-apps-script/adapter.gs` as separate script files. Run `npm run build` first if the core has changed.
3. Use the manifest `google-apps-script/appsscript.json` (show the manifest in project settings). It enables the advanced Google Sheets v4 service. Verify Sheets appears under Services.
4. Set Script Properties:
   - `SPREADSHEET_ID`: `1PgupS-wlHJcqDAsP8HskS9YMysHL2Mqf8yyy2QAK3dA`
   - `REGISTRATION_SECRET`: a newly generated random secret of at least 32 characters. Use the same secret in Netlify server environment settings; never put it in public website files or Git.
5. Deploy the script as a web app, running as the workbook owner and accessible to Anyone. Google account authorization must be completed by the owner. The endpoint checks the server secret before reading/writing; GET never returns student data. Do not make the spreadsheet itself public.
6. Copy the resulting `/exec` URL into Netlify's server environment variable `GOOGLE_SCRIPT_URL`. Also configure `REGISTRATION_SECRET`, `ALLOWED_ORIGINS` and `REGISTRATION_ENABLED=true` from `.env.example`.
7. Deploy this **whole project through a Netlify build (GitHub or CLI)**. The publish directory is `krishna_divinity_site`; functions live in `netlify/functions`. Dragging only the HTML folder into Netlify Drop does not deploy this backend.
8. Check Netlify detects the `/api/register` function and its rate-limit rule. Test on a preview with a disposable test workbook before accepting actual students. Confirm a new registration writes both rows, retry writes neither, no batch results in waiting list, and a full batch advances to the next one.

The form stays disabled without configuration. Do not treat a mocked test as a verified live Google integration.

## Add batches

Use the Batches tab. Keep headers unchanged. Add a unique `batch_id`, course `gita` or `ai`, start time as ISO text including timezone (`YYYY-MM-DDTHH:mm:ss+05:30`), positive integer `capacity`, and `status` of `open`. Optional fields: language, schedule and instructor. Do not enter guessed dates.

New registrations select the earliest future open batch with room. Pending-payment registrations reserve capacity as well as confirmed ones; cancel stale reservations manually if needed. If none is available, registrations are waitlisted. Existing waitlisted students require administrator assignment when a batch is added; no scheduled promotion job is active.

Students are matched using the combination of name, email and phone, not phone alone. Corrections to identity information need administrator review. The same student can register for Gita and AI. A repeated active registration for the same course keeps the existing plan; paid upgrades will need verified payment processing later.

## Before enabling public registrations

Confirm your support contact, final privacy wording and batch details. The privacy page describes the planned flow but is marked draft. Configure and verify the Google web app and Netlify endpoint. Payment, access provisioning and messages remain separate follow-up work.

## Technical references

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/lock/lock-service
- https://docs.netlify.com/build/functions/get-started/
- https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
