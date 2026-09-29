# Stripe Integration TODO

This file is the single source of truth for finishing the Stripe embedded
Checkout (Checkout Form SDK) integration. The site itself is static (GitHub
Pages), so the Stripe API calls live in a small standalone server in
[`server/`](server/) that is deployed separately.

## Current status: LIVE

- Checkout server: Render web service `knightwebstudio-checkout` (free plan,
  Ohio) at <https://knightwebstudio-checkout.onrender.com>, auto-deploys from
  `main` (root dir `server`). Health check: `/healthz`.
- The server runs with the **live** Stripe key (Render env
  `STRIPE_SECRET_KEY`, never committed) and the live plan map below in the
  Render env `STRIPE_PLANS_JSON` (overrides the test IDs in `server/plans.json`).
- `checkout/index.html` uses the live publishable key (`pk_live_...`).
- Stripe Tax is **not** enabled yet (no head-office address on file);
  `automatic_tax` stays `false`.
- To go back to test mode: set Render `STRIPE_SECRET_KEY` to the sandbox test
  key, delete `STRIPE_PLANS_JSON`, and put the sandbox `pk_test_...` back in
  the page.

### Live-mode Price IDs (in Render `STRIPE_PLANS_JSON`)

| Plan key | Product | Price ID | Amount | Mode |
| --- | --- | --- | --- | --- |
| `starter-deposit` | Starter Website 50% Deposit | `price_1UKp1qLOmAZAVClwHMmJaqEG` | $1,000 | payment |
| `business-deposit` | Business Website 50% Deposit | `price_1UKp1qLOmAZAVClwmYndCEOp` | $2,000 | payment |
| `commerce-deposit` | Commerce Website 50% Deposit | `price_1UKp1uLOmAZAVClwWLaBxjnq` | $4,000 | payment |
| `essential-care` | Essential Care Plan | `price_1UKp1pLOmAZAVClwygi70Z4T` | $300/mo | subscription |
| `growth-care` | Growth Care Plan | `price_1UKp1pLOmAZAVClwt7Q7FRRm` | $600/mo | subscription |
| `commerce-care` | Commerce Care Plan | `price_1UKp1pLOmAZAVClwfflhnSP5` | $1,000/mo | subscription |

Other live prices (not sold on the checkout page): Starter final
`price_1UKp1pLOmAZAVClw0tiD3try` / full `price_1UKp1pLOmAZAVClw2YtF9eoZ`;
Business final `price_1UKp1pLOmAZAVClwc8YbQb0O` / full
`price_1UKp1pLOmAZAVClwzFsXDUYB`; Commerce final
`price_1UKp1uLOmAZAVClwkVRjc917` / full `price_1UKp1uLOmAZAVClwYDwM8fNX`.

Live customer portal configuration: `bpc_1UKpY2LOmAZAVClwJdiPQXoi`.

### Remaining before relying on it

- Create a **live** webhook endpoint at
  `https://knightwebstudio-checkout.onrender.com/api/webhook` and set its
  signing secret as Render env `STRIPE_WEBHOOK_SECRET`.
- Add fulfillment in the `checkout.session.completed` handler.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**

- [server/index.js](server/index.js)
- [checkout/index.html](checkout/index.html)
- [server/.env.example](server/.env.example) (copy to `server/.env` and fill in — never commit real keys)

| Field | Current Value | What to Set |
| --- | --- | --- |
| `mode` (`server/index.js`) | `"payment"` | `"payment"` for one-time charges (the website deposits) or `"subscription"` for recurring charges (the care plans). The code already adds `payment_method_collection: "always"` automatically when mode is `"subscription"`. |
| `line_items[].price` (`server/index.js`) | `"price_..."` | A real Price ID from your Stripe account — see the test-mode catalog below. |
| `STRIPE_PUBLISHABLE_KEY` (`checkout/index.html`) | `'pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY'` | Your publishable key from <https://dashboard.stripe.com/test/apikeys> (`pk_test_...` in test mode, `pk_live_...` when going live). Publishable keys are public by design — this one may live in the page. |
| `CHECKOUT_SERVER_URL` (`checkout/index.html`) | `'http://localhost:4242'` | The base URL of the deployed server, e.g. `https://knightwebstudio-checkout.onrender.com` (no trailing slash). |
| `STRIPE_SECRET_KEY` (`server/.env`) | `sk_test_...` | Your secret key from <https://dashboard.stripe.com/test/apikeys>. Environment variable only — never put it in code or commit it. |
| `STRIPE_WEBHOOK_SECRET` (`server/.env`) | `whsec_...` | The signing secret for a webhook endpoint pointing at `<server URL>/api/webhook`, from <https://dashboard.stripe.com/workbench/webhooks>. Optional until you rely on webhooks for fulfillment. |
| `DOMAIN` (`server/.env`) | `http://localhost:3000` | Optional: one extra origin allowed by CORS (e.g. a staging URL). CORS always allows `https://knightwebstudio.com` and `http://localhost`. |

### Test-mode Price IDs (sandbox, `server/plans.json`)

Plug one of these into `line_items[].price` in `server/index.js`, and set `mode`
to match the product type.

One-time deposits — use `mode: "payment"`:

| Product | Price ID | Amount |
| --- | --- | --- |
| Starter Website 50% Deposit | `price_1UKor8Q9sEpFpWZByAOqu1u0` | $1,000 |
| Business Website 50% Deposit | `price_1UKorBQ9sEpFpWZBexjRQEGQ` | $2,000 |
| Commerce Website 50% Deposit | `price_1UKorDQ9sEpFpWZBDfyRRZUm` | $4,000 |

Care plans (monthly subscriptions) — use `mode: "subscription"`:

| Product | Price ID | Amount |
| --- | --- | --- |
| Essential Care Plan | `price_1UKorGQ9sEpFpWZBnni7q737` | $300/mo |
| Growth Care Plan | `price_1UKorIQ9sEpFpWZBIPvo4IFN` | $600/mo |
| Commerce Care Plan | `price_1UKorJQ9sEpFpWZBqDSZ65q2` | $1,000/mo |

These are TEST-mode IDs. The live-mode IDs are listed under "Current status:
LIVE" above.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**

- [server/index.js](server/index.js)
- [checkout/index.html](checkout/index.html) (appearance and beta flag)

| Parameter | Value |
| --- | --- |
| `ui_mode` | `"form"` (the installed `stripe` SDK is >= 21.0.0) |
| `billing_address_collection` | `"auto"` |
| `phone_number_collection` | `{ "enabled": false }` |
| `automatic_tax` | `{ "enabled": false }` |
| `payment_method_collection` | `"always"` (applied only when `mode` is `"subscription"`) |
| `submit_type` | `"auto"` |
| `integration_identifier` | `"custom_embedded_web_0001"` |
| Stripe API version (server) | `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1` |
| Stripe.js build + beta flag (client) | `https://js.stripe.com/dahlia/stripe.js` with `betas: ['custom_checkout_payment_form_1']` |
| Checkout form appearance (client) | Theme `stripe`, spaced inputs, white background — defined in `checkout/index.html` |

## Setup

1. Install dependencies:

   ```bash
   cd server
   npm install
   ```

2. Configure keys:

   ```bash
   cp .env.example .env
   # then edit .env and fill in STRIPE_SECRET_KEY (and optionally the others)
   ```

3. Run the server locally:

   ```bash
   npm start          # listens on http://localhost:4242
   ```

4. Serve the static site locally (any static server works), e.g. from the repo
   root:

   ```bash
   python3 -m http.server 8000
   ```

   Then open <http://localhost:8000/checkout/>. The page's default
   `CHECKOUT_SERVER_URL` already points at `http://localhost:4242`, and the
   server's CORS allows any `http://localhost` origin.

## Project structure (new files)

```
checkout/index.html         New checkout page hosting the embedded Stripe form
server/index.js             Express server: Checkout Session + webhook endpoints
server/package.json         Server dependencies (express, stripe, cors, dotenv)
server/.env.example         Template for server env vars (copy to server/.env)
STRIPE_INTEGRATION_TODO.md  This file
```

## How the integration works

1. A visitor opens `https://knightwebstudio.com/checkout/` (served by GitHub
   Pages).
2. The page POSTs to `<CHECKOUT_SERVER_URL>/api/create-checkout-session`
   (cross-origin; the server's CORS allows only `https://knightwebstudio.com`,
   `http://localhost`, and the optional `DOMAIN`).
3. The server creates a Checkout Session with `ui_mode: "form"` and returns
   `{ "client_secret": "..." }` as JSON.
4. Stripe.js (dahlia build) initializes the Checkout Form SDK with that client
   secret and mounts the payment form in a Stripe-hosted iframe — card details
   never touch this site or the server.
5. When the customer submits, the form's `confirm` event triggers
   `actions.confirm(...)` and Stripe processes the payment.
6. Stripe sends events (e.g. `checkout.session.completed`) to
   `<server URL>/api/webhook`, where fulfillment logic can run.

## Testing

The integration runs in test mode until you switch to live keys. Use Stripe's
test cards with any future expiry, any CVC, and any ZIP:

| Card number | Result |
| --- | --- |
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Payment is declined (insufficient funds) |

More: <https://docs.stripe.com/testing>

## Next steps

- Replace every placeholder in the table above.
- ~~Decide what the page sells~~ Done: the page passes `?plan=<key>` and the
  server maps it to a whitelisted Price ID and `mode` (see "Plans" below).
- Add fulfillment in the `checkout.session.completed` webhook handler
  (send a receipt/kick-off email, record the order somewhere durable).
- Consider a success/thank-you experience after payment, and order tracking if
  volume grows.
- Link `/checkout/` from the site (e.g. the pricing page buttons) once the
  placeholders are filled in.
- Before launch: switch to live keys (`sk_live_...` on the server,
  `pk_live_...` on the page), recreate the products in live mode, and create a
  live webhook endpoint.

## Plans (which package the page sells)

Link to `/checkout/?plan=<key>`. The page POSTs `{ "plan": "<key>" }` and the
server looks the key up in its whitelist — arbitrary Price IDs from the browser
are never accepted (unknown keys get a 400).

| Plan key | Product | Mode |
| --- | --- | --- |
| `starter-deposit` | Starter Website 50% Deposit | payment |
| `business-deposit` | Business Website 50% Deposit | payment |
| `commerce-deposit` | Commerce Website 50% Deposit | payment |
| `essential-care` | Essential Care Plan | subscription |
| `growth-care` | Growth Care Plan | subscription |
| `commerce-care` | Commerce Care Plan | subscription |

The whitelist lives in [`server/plans.json`](server/plans.json) (TEST-mode IDs).
To swap in live Price IDs without a code change, set the `STRIPE_PLANS_JSON`
env var on the server to a JSON object of the same shape — it replaces
`plans.json` entirely.

## Deploying the server (e.g. Render)

The static site stays on GitHub Pages; only `server/` needs a host.

1. Create a **Web Service** on <https://render.com> pointing at this repo.
2. Set **Root Directory** to `server`, **Build Command** to `npm install`,
   **Start Command** to `npm start`. The server binds to Render's `PORT`
   automatically.
3. Add environment variables in the Render dashboard: `STRIPE_SECRET_KEY`
   (required), `STRIPE_WEBHOOK_SECRET` and `DOMAIN` (optional).
4. Copy the service URL (e.g. `https://knightwebstudio-checkout.onrender.com`)
   into `CHECKOUT_SERVER_URL` in [checkout/index.html](checkout/index.html) and
   publish the site.
5. Point a Stripe webhook endpoint at `<service URL>/api/webhook` and put its
   signing secret in `STRIPE_WEBHOOK_SECRET`.

Note: on Render's free plan the service spins down after 15 minutes of
inactivity, so the first checkout after a quiet period takes a few extra
seconds to load.

## Resources

- <https://support.stripe.com>
- <https://docs.stripe.com/mcp>
