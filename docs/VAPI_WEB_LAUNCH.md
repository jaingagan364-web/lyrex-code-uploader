# Febily Vapi browser launch

## What this change adds

- Adds the Vapi Web SDK to the website.
- Adds a signed-in `/receptionist` page that requests a short-lived public JWT from `POST /api/vapi/token`.
- Starts only the assistant ID returned by the server. The browser never receives the private Vapi API key.
- Displays a session-only transcript and controls for ending or muting the browser call.

## Server-side requirements

The secure token route must be deployed with:

- `VAPI_LAUNCH_ENABLED=true` only after the business assistant is provisioned and the rest of the launch checks have passed.
- `VAPI_PRIVATE_KEY` and `VAPI_ORG_ID` configured as server-side Vercel environment variables.
- The migration `20261106000000_business_vapi_assistant.sql` applied.
- Exactly one business owned by the signed-in user, exactly one active/unexpired Paddle subscription linked to that business, and a non-empty business-specific `vapi_assistant_id` with `vapi_provisioning_status='provisioned'`.

The token route currently allows the production origins `https://febily.com` and `https://www.febily.com`. Preview deployments will not be accepted by Vapi until an exact preview origin is deliberately added to the allow-list.

## Not included yet

This change does not provision Vapi assistants, connect each salon's Google Calendar, implement tenant-aware calendar tools, or activate phone numbers. Do not set the launch feature flag to true for customers until those pieces and their staging tests are complete. The existing demo assistant must not be stored as every business's assistant ID.

## Test plan

1. Deploy the branch as a Vercel Preview and confirm the route builds.
2. Keep `VAPI_LAUNCH_ENABLED` disabled and verify the page reports the server's activation-pending response without starting a call.
3. In a staging Supabase/Paddle environment, provision a dedicated test assistant for a test business and link one verified active Sandbox subscription.
4. Test from an allowed HTTPS origin; verify calls start only the assistant ID returned by the backend.
5. Verify signed-out, unlinked, expired, duplicate-subscription, and unprovisioned states are denied.
6. Verify call-end cleans up the SDK session and transcript remains client-session-only.

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

The current web token endpoint only allows `https://febily.com` and `https://www.febily.com`. Browser calls from a Vercel Preview origin will remain blocked until that exact Preview origin is deliberately added to the allow-list for Preview only.


## Vercel environment deployment note

Preview variables are only loaded by a new deployment built for the Preview environment from this feature branch. Redeploying a Production deployment from `main` does not update this Preview's runtime variables. Keep `VAPI_PROVISIONING_ENABLED`, `VAPI_TEMPLATE_ASSISTANT_ID`, `VAPI_PRIVATE_KEY`, and `VAPI_ORG_ID` scoped to Preview for this staging test, and keep `VAPI_LAUNCH_ENABLED=false`.

## Preview browser-call origin

The server-side public JWT allows the two canonical Febily production origins. For Vercel Preview deployments only, it additionally includes the exact HTTPS hostnames supplied by Vercel's runtime `VERCEL_BRANCH_URL` and `VERCEL_URL`, and only when they end in `.vercel.app`. It does not trust the incoming request's Origin header as an allowlist source. Production tokens never include Vercel Preview origins.
