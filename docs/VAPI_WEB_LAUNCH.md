# Febily Vapi browser launch

## What this change adds

- Adds the Vapi Web SDK to the website.
- Adds a signed-in `/receptionist` page that requests a short-lived public JWT from `POST /api/vapi/token`.
- Starts only the assistant ID returned by the server. The browser never receives the private Vapi API key.
- Displays a session-only transcript and controls for ending or muting the browser call.
- Creates a dedicated Vapi assistant per paid business and links it to that business record.
- Uses one shared strict prompt for initial assistant provisioning and safe in-place profile synchronization.

## Server-side requirements

The secure token route must be deployed with:

- `VAPI_LAUNCH_ENABLED=true` only for a deliberately enabled environment. Keep it false in Production until calendar isolation, timezone handling, booking enforcement, and phone routing are complete. Preview may be enabled for internal browser-call testing, but the assistant must clearly state that bookings are unavailable.
- `VAPI_PRIVATE_KEY` and `VAPI_ORG_ID` configured as server-side Vercel environment variables.
- The migration `20261106000000_business_vapi_assistant.sql` applied.
- Exactly one business owned by the signed-in user, exactly one active/unexpired Paddle subscription linked to that business, and a non-empty business-specific `vapi_assistant_id` with `vapi_provisioning_status='provisioned'`.

The token route currently allows the production origins `https://febily.com` and `https://www.febily.com`. Preview deployments will not be accepted by Vapi until an exact preview origin is deliberately added to the allow-list.

## Not included yet

This change does not provision Vapi assistants, connect each salon's Google Calendar, implement tenant-aware calendar tools, or activate phone numbers. Do not set the launch feature flag to true for customers until those pieces and their staging tests are complete. The existing demo assistant must not be stored as every business's assistant ID.

## Test plan

1. Deploy the branch as a Vercel Preview and confirm the route builds.
2. Apply the Vapi provisioning lease migration.
3. Configure Preview-only `VAPI_PROVISIONING_ENABLED`, `VAPI_TEMPLATE_ASSISTANT_ID`, `VAPI_PRIVATE_KEY`, and `VAPI_ORG_ID`.
4. In staging Supabase/Paddle, verify exactly one active/unexpired Sandbox subscription and provision one dedicated assistant.
5. Test the browser call from the exact Preview domain and confirm the token permits only that business's assistant.
6. Sync the business profile and verify the assistant no longer invents contact information, location, timezone, appointment availability, or request submission.
7. Verify signed-out, unlinked, expired, duplicate-subscription, unprovisioned, and assistant-ownership-mismatch states are denied.
8. Verify call-end cleans up the SDK session and the transcript remains client-session-only.

Never expose `VAPI_PRIVATE_KEY` or a full JWT in browser logs, screenshots, or source control.


## Business-specific assistant provisioning

The authenticated endpoint `POST /api/vapi/provision` creates one assistant for the signed-in business.

Apply migration `supabase/migrations/20261111000000_vapi_provisioning_lease.sql` before enabling the endpoint. It adds a 15-minute provisioning lease and service-role-only RPCs that prevent concurrent duplicate creation and recover a Vapi assistant if the first request created it but did not finish saving the database link.

Configure these **Preview-only** Vercel server variables before testing:

- `VAPI_PROVISIONING_ENABLED=true`
- `VAPI_TEMPLATE_ASSISTANT_ID=<the existing demo assistant UUID>`
- `VAPI_PRIVATE_KEY` and `VAPI_ORG_ID` from the same Vapi organization.

Do not put any Vapi private key in a `VITE_*` variable. Use a separate Vapi organization/API key for Preview and Production.

The provisioning endpoint copies only the template's model provider/model, selected non-secret model settings, voice, transcriber, and selected call behavior. It deliberately does **not** copy the demo assistant's tools, server URL/secret, credential IDs, phone number, transport configuration, custom recording storage settings, or demo prompt. The generated prompt uses the saved business profile and explicitly says booking is not live.

The generated assistant metadata contains the Febily business ID and template ID. Retries first search the authenticated Vapi organization for an assistant with matching metadata before creating another one.

## Calendar and phone readiness

Assistant provisioning is not the same as full receptionist activation. The generated assistant has no calendar tools and must not confirm or create appointments. Do not enable `VAPI_LAUNCH_ENABLED` or attach a customer phone number until:
- the tenant-specific calendar connection and availability/booking service are implemented and tested;
- timezone-safe conversion uses the business's saved IANA timezone;
- booking operations enforce business ownership and prevent double-booking;
- a real inbound phone number has been assigned to the correct business; and
- staging isolation and subscription lifecycle tests pass.

The web token endpoint allows the two canonical production origins and adds exact Vercel Preview runtime hostnames only when `VERCEL_ENV=preview`. Production tokens never trust Preview origins.


## Vercel environment deployment note

Preview variables are only loaded by a new deployment built for the Preview environment from this feature branch. Redeploying a Production deployment from `main` does not update this Preview's runtime variables. Keep `VAPI_PROVISIONING_ENABLED`, `VAPI_TEMPLATE_ASSISTANT_ID`, `VAPI_PRIVATE_KEY`, and `VAPI_ORG_ID` scoped to Preview for this staging test, and keep `VAPI_LAUNCH_ENABLED=false`.

## Preview browser-call origin

The server-side public JWT allows the two canonical Febily production origins. For Vercel Preview deployments only, it additionally includes the exact HTTPS hostnames supplied by Vercel's runtime `VERCEL_BRANCH_URL` and `VERCEL_URL`, and only when they end in `.vercel.app`. It does not trust the incoming request's Origin header as an allowlist source. Production tokens never include Vercel Preview origins.


## Strict receptionist accuracy and profile sync

The shared prompt module `src/lib/vapi-assistant-prompt.ts` is used by both initial provisioning and profile sync. It explicitly:
- forbids invented phone, email, street address, ZIP/postal code, location, timezone, prices, staff, policies, and opening hours;
- treats missing business contact details and timezone as `NOT CONFIGURED`;
- forbids asking a caller for personal details when no secure request-submission workflow exists;
- forbids claiming that a request, callback, message, or appointment was saved, sent, or forwarded; and
- keeps live appointment booking disabled until a tenant-specific calendar integration is actually connected.

The authenticated `POST /api/vapi/sync-profile` endpoint updates the existing business assistant in place. It verifies the active subscription, assistant ID, Vapi organization, and `febilyBusinessId` metadata. It refuses to update if the assistant has any tools, tool IDs, server URL/credentials, or attached credential IDs, so it cannot overwrite a live calendar integration. It fetches the complete existing nested model object before PATCHing because Vapi replaces nested model configuration on update. See the [Vapi Update Assistant API](https://docs.vapi.ai/api-reference/assistants/update) and [Vapi nested model update guidance](https://docs.vapi.ai/knowledge-base/custom-knowledge-base).


## Per-business Google Calendar connection

This branch adds the first calendar-connection layer. It does **not** enable appointment booking yet.

Apply migration:
`supabase/migrations/20261112000000_business_google_calendar_connections.sql`

It creates:
- `business_calendar_connections`: one row per business, with AES-256-GCM encrypted Google refresh token, connected account email, selected calendar ID, granted scopes, and reconnect state.
- `business_calendar_oauth_states`: hashed, single-use OAuth state challenges bound to the authenticated business owner and expiring after 10 minutes.
- RLS enabled with table access revoked from browser roles; only server-side service-role routes can read or write refresh-token data.

The owner-only `/setup` page now supports Google Calendar connection and selecting a writable calendar. Server endpoints:
- `POST /api/calendar/google/connect`
- `GET /api/calendar/google/callback`
- `GET /api/calendar/google/status`
- `GET /api/calendar/google/calendars`
- `POST /api/calendar/google/select`

The OAuth callback rechecks business ownership and the active subscription after consent, requires the Calendar event read/write, free/busy, and calendar-list read-only scopes, encrypts the refresh token before storage, and does not return any token to the browser. A reconnect to the same Google account preserves the selected calendar. Switching Google accounts defaults to `primary`.

### Google Cloud setup (Preview only)

1. In Google Cloud Console, select/create a dedicated Febily staging project and enable **Google Calendar API**.
2. Configure the OAuth consent screen. While the app is in Testing, add the exact Google account used for the first salon's test calendar as a test user.
3. Create an OAuth client of type **Web application**.
4. Add this exact Authorized redirect URI:
   `https://febily-code-uploader-git-feat-vapi-receptionist-w-f2c619-febily.vercel.app/api/calendar/google/callback`
5. Use the client credentials only in Vercel Preview variables. Do not put a client secret or token in browser code.

Preview-only Vercel variables:
- `GOOGLE_CALENDAR_CONNECT_ENABLED=true` (Config)
- `GOOGLE_OAUTH_CLIENT_ID` (Config)
- `GOOGLE_OAUTH_CLIENT_SECRET` (Secret)
- `GOOGLE_OAUTH_REDIRECT_URI=https://febily-code-uploader-git-feat-vapi-receptionist-w-f2c619-febily.vercel.app/api/calendar/google/callback` (Config)
- `APP_BASE_URL=https://febily-code-uploader-git-feat-vapi-receptionist-w-f2c619-febily.vercel.app` (Config)
- `GOOGLE_TOKEN_ENCRYPTION_KEY` (Secret): Base64 encoding of exactly 32 cryptographically random bytes.

Generate an encryption key locally in PowerShell:
`[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`
Create it once, store it as a Preview Secret, and keep a separate key for Production. Do not paste the key in chat, GitHub, SQL, or a `VITE_*` variable.

The OAuth scopes requested are:
- `openid` and `email` for verified Google account identity;
- `calendar.events` to read and edit events;
- `calendar.events.freebusy` to check availability; and
- `calendar.calendarlist.readonly` to list calendars the owner can access.

Google recommends offline access and a state parameter for server-side authorization-code flows. Febily uses offline access so the server can refresh access tokens without the owner being present, and a hashed, single-use state bound to the business owner to mitigate CSRF. See [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server) and [Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth).

Google classifies access to calendar event data as a sensitive-data use case for OAuth review. Google recommends a separate project for testing/staging; testing-stage apps can use allow-listed test accounts without completing public production verification. Before opening this connection to arbitrary salon customers, check the consent-screen scope classifications and complete any required Google brand/sensitive-scope verification. See [Google sensitive-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).

### Not yet enabled

- No Vapi calendar tools are attached by this connection step.
- No free/busy or event creation endpoint is activated for callers.
- No appointment is confirmed or submitted.
- The existing demo n8n workflow is not reused for customer businesses.
- A business must explicitly connect and select its own calendar before the next booking integration phase.

The next development phase is to add server-side availability and booking endpoints, then attach authenticated Vapi function tools that resolve the business from the assistant ID and use only that business's stored calendar connection. Add conflict protection and end-to-end tenant-isolation tests before enabling booking.
