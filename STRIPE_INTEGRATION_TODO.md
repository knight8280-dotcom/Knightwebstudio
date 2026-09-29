# Stripe checkout: current state and setup

How payments work on knightwebstudio.com, what is configured today, and the
steps that have to be done by hand in Stripe, Render and Resend. The site is
static (GitHub Pages), so every Stripe call goes through a small server in
[`server/`](server/), hosted separately on Render.

## Current state (29 September 2026)

- **Live.** Checkout server: Render web service `knightwebstudio-checkout`
  (free plan, Ohio) at <https://knightwebstudio-checkout.onrender.com>.
  It auto-deploys from `main` (root directory `server`). Health check:
  `/healthz`.
- The server uses the **live** Stripe secret key (Render env
  `STRIPE_SECRET_KEY`, never committed). The live plan map below is in the
  Render env `STRIPE_PLANS_JSON`, which overrides the test IDs in
  `server/plans.json`. `checkout/index.html` uses the live publishable key
  (`pk_live_...`, public by design).
- **Stripe Tax is off.** The server creates every session with
  `automatic_tax: { enabled: false }`. The only switch is the
  `AUTOMATIC_TAX` env var, which defaults to off; see
  [Stripe Tax](#stripe-tax).
- **After a payment**, the webhook emails the client a confirmation and
  sends knightwebstudio1@gmail.com a payment notice, and `/checkout/success/`
  confirms the payment with Stripe. This only works once the webhook and
  email env vars below are set in Render. Until then the webhook rejects
  events and no emails are sent. Stripe's own receipts are unaffected.
- **Payment methods** shown in the form come from the Stripe Dashboard
  (Settings → Payment methods), not from the code. Card is on. For ACH
  bank transfer, turn on **ACH Direct Debit** there. Checks are handled
  outside Stripe: take them by hand, then mark the invoice paid in Stripe
  ("Paid out of band") if one was issued.
- To go back to test mode: set Render `STRIPE_SECRET_KEY` to the sandbox test
  key, delete `STRIPE_PLANS_JSON`, put the sandbox `pk_test_...` back in the
  page, and use a test-mode webhook secret.

## What happens when someone pays

1. The pricing page links to `/checkout/?plan=<key>`. The page POSTs the plan
   key to `/api/create-checkout-session`. The server looks it up in its
   whitelist (the browser never sends a price) and returns the session's
   `client_secret` and `session_id`.
2. Stripe's embedded form takes the payment. Card and bank details go
   straight to Stripe and never touch this site or the server.
3. The page redirects to `/checkout/success/?plan=<key>&session_id=<id>`.
   That page calls `/api/session-status`, which asks Stripe for the
   session's status, and shows one of these:
   - **"Payment confirmed"** (card).
   - **"Your bank payment is processing"** (ACH, which takes a few business
     days).
   - **"Your payment wasn't completed"**, with a button back to checkout.

   If the server can't be reached, the page falls back to neutral wording.
   The status endpoint returns only the plan, amount and status: no names,
   emails or addresses.
4. Stripe sends signed events to `/api/webhook`. The server rejects any event
   whose signature doesn't match `STRIPE_WEBHOOK_SECRET`.

   | Event | What the server does |
   | --- | --- |
   | `checkout.session.completed` (paid) | Emails the client a confirmation and emails the business a "New payment" notice |
   | `checkout.session.completed` (unpaid: ACH still processing) | Emails the business a "Bank payment processing" notice |
   | `checkout.session.async_payment_succeeded` | ACH cleared. Same emails as a paid session |
   | `checkout.session.async_payment_failed` | Emails the business a "Bank payment FAILED" notice, so you can follow up |
   | `invoice.paid` (monthly renewals only, `billing_reason: subscription_cycle`) | Emails the business a "Care plan renewal paid" notice. The client gets Stripe's own receipt |

   **The client's confirmation includes:**
   - what they paid for and the amount;
   - what happens next;
   - the Calendly link to book the kickoff call;
   - knightwebstudio1@gmail.com and (225) 255-0837.

   Replies go to knightwebstudio1@gmail.com.

   **The business notice includes:**
   - client name and email;
   - plan and amount;
   - the Stripe session ID (or invoice ID for renewals).

   Test-mode notices start with `[TEST]`.

   Each email is sent with an idempotency key, so a repeated event never sends
   the same email twice. If the business notice can't be sent, the server
   answers 500 and Stripe retries the event later. If only the client email
   fails, the business notice still goes out and says so.

   The client's name can be blank for card payments, because the form doesn't
   always ask for one. The email then opens with "Hi there," and the notice
   says "Not provided". Stripe's `name_collection` session option could
   require a name. It is not turned on, because it hasn't been tested with
   this embedded form.

## Environment variables (Render → knightwebstudio-checkout → Environment)

| Name | Needed? | Value |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Already set | Live secret key (`sk_live_...`) |
| `STRIPE_PLANS_JSON` | Already set | Live plan map (see [Plans](#plans-and-price-ids)) |
| `STRIPE_WEBHOOK_SECRET` | **Add** | Signing secret (`whsec_...`) of the live webhook endpoint below. Without it the webhook rejects every event |
| `RESEND_API_KEY` | **Add** | Resend API key (`re_...`) |
| `EMAIL_FROM` | **Add** | `KnightWebstudio <payments@knightwebstudio.com>`. Any address on the domain verified in Resend works. It can't be a Gmail address (see below) |
| `OWNER_EMAIL` | Optional | Where payment notices go. Default `knightwebstudio1@gmail.com` |
| `REPLY_TO` | Optional | Where client replies go. Default `knightwebstudio1@gmail.com` |
| `CALENDLY_URL` | Optional | Booking link in the client email. Default `https://calendly.com/knightwebstudio1` |
| `AUTOMATIC_TAX` | Optional | Leave unset (off). See [Stripe Tax](#stripe-tax) |
| `DOMAIN` | Optional | One extra CORS origin, e.g. a staging URL |

The template, with comments, is [`server/.env.example`](server/.env.example).
Never put keys in code or commit a `.env` file (`.env` is git-ignored).

## Stripe webhook (live)

In the Stripe Dashboard, in **live** mode: Developers → Webhooks → **Add
destination** (or "Add endpoint").

- **Endpoint URL:** `https://knightwebstudio-checkout.onrender.com/api/webhook`
- **Events:**
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `invoice.paid`
- After saving, reveal the **signing secret** (`whsec_...`) and add it in
  Render as `STRIPE_WEBHOOK_SECRET`. Render redeploys automatically.

Stripe shows every delivery and its response code on the endpoint's page, and
retries failed deliveries for up to 3 days.

## Emails (Resend)

Emails are sent through [Resend](https://resend.com). Its free tier covers
3,000 emails a month and 100 a day. Everything ties back to the business
inbox, **knightwebstudio1@gmail.com**:

- Sign up for Resend with knightwebstudio1@gmail.com.
- Payment notices go to knightwebstudio1@gmail.com (`OWNER_EMAIL` default).
- A client's reply to their confirmation goes to knightwebstudio1@gmail.com
  (`REPLY_TO` default).
- The email body gives knightwebstudio1@gmail.com as the contact address.

The visible **sender** is `KnightWebstudio <payments@knightwebstudio.com>`,
not the Gmail address. Gmail addresses can't be used as a sender on Resend
or any other sending service, because Gmail blocks mail that claims to come
from it through another server. The domain has to be verified instead.

Setup:

1. Sign up at <https://resend.com> with knightwebstudio1@gmail.com.
2. Domains → Add domain → `knightwebstudio.com`. Resend lists a few DNS
   records (DKIM, SPF/MX on a `send` subdomain, optional DMARC).
3. Add those records at the domain's DNS host (IONOS) and wait for Resend to
   show the domain as **Verified**. These records don't affect the website or
   GitHub Pages.
4. API Keys → Create API key (permission: sending access). Add it in Render
   as `RESEND_API_KEY`, and set `EMAIL_FROM` as above.

Until both `RESEND_API_KEY` and `EMAIL_FROM` are set, the server logs
"Email not sent" instead of sending, and payments still work.

## Stripe Tax

Stripe Tax is **off**, and the code matches: `AUTOMATIC_TAX` defaults to off,
so sessions are created with `automatic_tax: { enabled: false }` and no sales
tax is added at checkout. The server logs the setting at startup ("Automatic
tax (Stripe Tax): disabled").

To turn it on later:

1. Set up Stripe Tax in the Dashboard (Tax → head-office address and a
   registration).
2. Set `AUTOMATIC_TAX=true` in Render.

`billing_address_collection` is `"auto"`, so the form asks for the full
address only when Stripe needs it.

## Render free plan: sleeping (keep-warm note)

The free Render service **sleeps after 15 minutes without traffic**. The
next request wakes it, which takes about 30–60 seconds. In practice:

- **Checkout page:** the first visitor after a quiet spell waits longer for
  the form to appear ("Loading secure checkout…").
- **Success page:** the server is usually awake straight after a payment. The
  page waits up to 60 seconds for it before falling back to neutral wording.
- **Webhooks:** payment events arrive right after checkout, while the server
  is awake. Monthly renewal events (`invoice.paid`) can hit a sleeping
  server. If the first delivery times out, Stripe retries it and the retry
  lands on the now-awake server. Nothing is lost, but the notice can arrive
  a little late.

No paid services have been added. If the wake-up delay becomes a problem,
there are two options:

- Upgrade the Render instance to a paid plan, which doesn't sleep.
- Use a free uptime monitor (e.g. UptimeRobot or cron-job.org) to request
  `https://knightwebstudio-checkout.onrender.com/healthz` every 10–14
  minutes. Check Render's current free-tier limits first: a service kept
  awake around the clock uses most of the monthly free instance hours.

## Plans and price IDs

Link to `/checkout/?plan=<key>`. Unknown keys get a 400.

### Live mode (in Render `STRIPE_PLANS_JSON`)

| Plan key | Product | Price ID | Amount | Mode |
| --- | --- | --- | --- | --- |
| `starter-deposit` | Starter Website 50% Deposit | `price_1UKp1qLOmAZAVClwHMmJaqEG` | $1,000 | payment |
| `business-deposit` | Business Website 50% Deposit | `price_1UKp1qLOmAZAVClwmYndCEOp` | $2,000 | payment |
| `commerce-deposit` | Commerce Website 50% Deposit | `price_1UKp1uLOmAZAVClwWLaBxjnq` | $4,000 | payment |
| `essential-care` | Essential Care Plan | `price_1UKp1pLOmAZAVClwygi70Z4T` | $300/mo | subscription |
| `growth-care` | Growth Care Plan | `price_1UKp1pLOmAZAVClwt7Q7FRRm` | $600/mo | subscription |
| `commerce-care` | Commerce Care Plan | `price_1UKp1pLOmAZAVClwfflhnSP5` | $1,000/mo | subscription |

Other live prices (not sold on the checkout page):

| Package | Final payment | Full price |
| --- | --- | --- |
| Starter | `price_1UKp1pLOmAZAVClw0tiD3try` | `price_1UKp1pLOmAZAVClw2YtF9eoZ` |
| Business | `price_1UKp1pLOmAZAVClwc8YbQb0O` | `price_1UKp1pLOmAZAVClwzFsXDUYB` |
| Commerce | `price_1UKp1uLOmAZAVClwkVRjc917` | `price_1UKp1uLOmAZAVClwYDwM8fNX` |

Live customer portal configuration: `bpc_1UKpY2LOmAZAVClwJdiPQXoi`.

### Test mode (sandbox, `server/plans.json`)

| Plan key | Price ID |
| --- | --- |
| `starter-deposit` | `price_1UKor8Q9sEpFpWZByAOqu1u0` |
| `business-deposit` | `price_1UKorBQ9sEpFpWZBexjRQEGQ` |
| `commerce-deposit` | `price_1UKorDQ9sEpFpWZBDfyRRZUm` |
| `essential-care` | `price_1UKorGQ9sEpFpWZBnni7q737` |
| `growth-care` | `price_1UKorIQ9sEpFpWZBIPvo4IFN` |
| `commerce-care` | `price_1UKorJQ9sEpFpWZBqDSZ65q2` |

## Testing (test mode only)

Never test with live keys. These steps use the sandbox, so no real money
moves.

1. `cd server && npm install && cp .env.example .env`. In `.env`, fill in the
   sandbox `STRIPE_SECRET_KEY` (`sk_test_...`), your `RESEND_API_KEY` and
   `EMAIL_FROM`. Leave `STRIPE_PLANS_JSON` unset so the test IDs in
   `plans.json` are used.
2. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run
   `stripe listen --forward-to localhost:4242/api/webhook`. Put the
   `whsec_...` it prints into `.env` as `STRIPE_WEBHOOK_SECRET`.
3. `npm start` (the server listens on <http://localhost:4242>).
4. On a local copy of the site, point `checkout/index.html` and
   `checkout/success/index.html` at the local server
   (`CHECKOUT_SERVER_URL = 'http://localhost:4242'`), and put the sandbox
   `pk_test_...` key in `checkout/index.html`. Don't commit those edits.
5. Serve the site (`python3 -m http.server 8000` from the repo root) and open
   <http://localhost:8000/checkout/?plan=starter-deposit>.
6. Pay with test card `4242 4242 4242 4242` (any future expiry, any CVC, any
   ZIP). The success page should say "Payment confirmed". The webhook sends
   both emails, and the notice subject starts with `[TEST]`.

Other test cards:

| Card number | Result |
| --- | --- |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Declined (insufficient funds) |

For ACH, use Stripe's test bank account. Stripe's ACH testing docs list its
routing and account numbers, including ones that fail.

More: <https://docs.stripe.com/testing>

## Configured session parameters

| Parameter | Value |
| --- | --- |
| `ui_mode` | `"form"` (Checkout Form SDK) |
| `billing_address_collection` | `"auto"` |
| `phone_number_collection` | `{ "enabled": false }` |
| `automatic_tax` | `{ "enabled": false }` (the `AUTOMATIC_TAX` env var, default off) |
| `payment_method_collection` | `"always"` (subscriptions only) |
| `submit_type` | `"auto"` (payments only) |
| `integration_identifier` | `"custom_embedded_web_0001"` |
| `metadata.plan` | The plan key. Used by the webhook and the status endpoint |
| Stripe API version (server) | `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1` |
| Stripe.js build + beta flag (client) | `https://js.stripe.com/dahlia/stripe.js` with `betas: ['custom_checkout_payment_form_1']` |
| Form appearance (client) | Theme `stripe`, spaced inputs, white background (in `checkout/index.html`) |

## Files

```
checkout/index.html          Checkout page with the embedded Stripe form
checkout/success/index.html  Confirmation page (asks the server for the payment status)
server/index.js              Express server: sessions, status, webhook and emails
server/plans.json            Plan whitelist (test-mode Price IDs)
server/.env.example          Every environment variable, with comments
STRIPE_INTEGRATION_TODO.md   This file
```

## Resources

- <https://docs.stripe.com/webhooks>
- <https://docs.stripe.com/payments/ach-direct-debit>
- <https://resend.com/docs>
- <https://render.com/docs/free>
