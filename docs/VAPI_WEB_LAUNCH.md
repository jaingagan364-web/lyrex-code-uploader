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
