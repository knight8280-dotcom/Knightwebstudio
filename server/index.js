// Minimal Stripe embedded Checkout (Checkout Form SDK) server for
// knightwebstudio.com. The static site is hosted on GitHub Pages, which
// cannot run server code, so this service is deployed separately (e.g. as a
// Render web service) and the checkout page calls it cross-origin.
//
// It does three things:
//   1. POST /api/create-checkout-session  starts a Checkout Session for a
//      whitelisted plan (plans.json, or STRIPE_PLANS_JSON).
//   2. GET  /api/session-status            lets /checkout/success/ confirm
//      the payment.
//   3. POST /api/webhook                   receives signed Stripe events and
//      emails the client a confirmation and the business a payment notice.
//
// Every setting comes from environment variables (Render → Environment, or
// server/.env locally); see .env.example and STRIPE_INTEGRATION_TODO.md.

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1",
});

// Stripe Tax is OFF: sessions are created with automatic_tax disabled, so no
// sales tax is added at checkout. This is the one switch for it. Set
// AUTOMATIC_TAX=true only after Stripe Tax is set up in the Dashboard (a
// registration under Tax → Registrations); anything else, or unset, is off.
const AUTOMATIC_TAX =
  String(process.env.AUTOMATIC_TAX || "false").trim().toLowerCase() === "true";

// The business inbox. Payment notices go here and client replies come back
// here. OWNER_EMAIL / REPLY_TO only need setting to use a different inbox.
const BUSINESS_EMAIL = "knightwebstudio1@gmail.com";
const BUSINESS_PHONE = "(225) 255-0837";

// Confirmation emails are sent through Resend (https://resend.com). Gmail
// addresses cannot be a "From" sender on any email service, so EMAIL_FROM is
// an address on knightwebstudio.com (a domain verified in Resend) and every
// reply is routed to the business inbox with Reply-To.
const EMAIL = {
  apiKey: process.env.RESEND_API_KEY || "",
  from: process.env.EMAIL_FROM || "",
  owner: process.env.OWNER_EMAIL || BUSINESS_EMAIL,
  replyTo: process.env.REPLY_TO || BUSINESS_EMAIL,
};
const EMAIL_ENABLED = Boolean(EMAIL.apiKey && EMAIL.from);
const CALENDLY_URL = process.env.CALENDLY_URL || "https://calendly.com/knightwebstudio1";

const app = express();

// The static site calls this API cross-origin, so only these origins are
// allowed. DOMAIN (optional, from .env) adds one extra origin, e.g. staging.
const ALLOWED_ORIGINS = ["https://knightwebstudio.com", process.env.DOMAIN].filter(Boolean);
const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // Requests with no Origin header (curl, server-to-server, Stripe
      // webhooks) are not subject to CORS.
      const allowed =
        !origin || ALLOWED_ORIGINS.includes(origin) || LOCALHOST_ORIGIN.test(origin);
      callback(null, allowed);
    },
  })
);

// Registered before express.json() so the raw body is preserved for Stripe
// signature verification.
app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    // Anyone can POST to this URL, so an event is never acted on unless its
    // signature checks out. 503 makes Stripe retry once the secret is set.
    console.error("Webhook rejected: STRIPE_WEBHOOK_SECRET is not set.");
    return res.sendStatus(503);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], endpointSecret);
  } catch (err) {
    console.log("Webhook signature verification failed.", err.message);
    return res.sendStatus(400);
  }

  try {
    await handleEvent(event);
  } catch (err) {
    // A non-2xx reply makes Stripe retry the event later. Each email carries
    // an idempotency key, so a retry never sends the same email twice.
    console.error(`Webhook ${event.type} (${event.id}) failed:`, err.message);
    return res.sendStatus(500);
  }
  res.sendStatus(200);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Plan whitelist: the page sends a plan key (e.g. "starter-deposit") and the
// server maps it to a Price ID and Checkout mode. Arbitrary Price IDs from the
// client are never accepted. STRIPE_PLANS_JSON (env) overrides plans.json so
// live-mode Price IDs can be swapped in without a code change.
function loadPlans() {
  let raw;
  let source;
  if (process.env.STRIPE_PLANS_JSON) {
    raw = JSON.parse(process.env.STRIPE_PLANS_JSON);
    source = "STRIPE_PLANS_JSON";
  } else {
    raw = require("./plans.json");
    source = "plans.json";
  }
  const plans = {};
  for (const [key, plan] of Object.entries(raw)) {
    if (key.startsWith("_")) continue; // comments
    if (!plan || typeof plan.price !== "string" || !plan.price.startsWith("price_")) {
      throw new Error(`Plan "${key}" in ${source} needs a "price" starting with price_`);
    }
    if (plan.mode !== "payment" && plan.mode !== "subscription") {
      throw new Error(`Plan "${key}" in ${source} needs "mode": "payment" or "subscription"`);
    }
    plans[key] = { price: plan.price, mode: plan.mode, label: plan.label || key };
  }
  console.log(`Loaded ${Object.keys(plans).length} checkout plans from ${source}:`, Object.keys(plans).join(", "));
  return plans;
}
const PLANS = loadPlans();
console.log(`Automatic tax (Stripe Tax): ${AUTOMATIC_TAX ? "enabled" : "disabled"} (AUTOMATIC_TAX=${process.env.AUTOMATIC_TAX || "<unset, defaults to false>"})`);
console.log(
  EMAIL_ENABLED
    ? `Confirmation emails: on, from ${EMAIL.from}, notices to ${EMAIL.owner}, replies to ${EMAIL.replyTo}`
    : "Confirmation emails: OFF (set RESEND_API_KEY and EMAIL_FROM to turn them on)"
);
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn("STRIPE_WEBHOOK_SECRET is not set: /api/webhook will reject every event.");
}

app.get("/healthz", (req, res) => res.json({ ok: true }));

app.post("/api/create-checkout-session", async (req, res) => {
  const planKey = String((req.body && req.body.plan) || req.query.plan || "");
  const plan = Object.prototype.hasOwnProperty.call(PLANS, planKey) ? PLANS[planKey] : null;
  if (!plan) {
    return res.status(400).json({ error: "Unknown or missing plan.", plans: Object.keys(PLANS) });
  }
  const mode = plan.mode;

  const sessionParams = {
    // Configured in Checkout Studio — use exactly as specified.
    ui_mode: "form",
    // "auto" collects the billing address only when Stripe needs it (for
    // example if AUTOMATIC_TAX is ever turned on, Stripe Tax needs it).
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: AUTOMATIC_TAX },
    integration_identifier: "custom_embedded_web_0001",
    mode,
    line_items: [{ price: plan.price, quantity: 1 }],
    metadata: { plan: planKey },
  };
  if (mode === "payment") {
    // submit_type only applies to payment-mode sessions.
    sessionParams.submit_type = "auto";
  } else {
    sessionParams.payment_method_collection = "always";
  }
  // Stripe requires customer_update[address]=auto when automatic tax is on
  // and an existing Customer is passed, so the address collected at checkout
  // is saved to the customer for tax calculation. (customer_update is only
  // accepted alongside a customer — today no route sets one, but this keeps
  // any future customer-reuse code from silently breaking tax.)
  if (AUTOMATIC_TAX && sessionParams.customer) {
    sessionParams.customer_update = { address: "auto" };
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({
      client_secret: session.client_secret,
      session_id: session.id,
      plan: planKey,
      label: plan.label,
      mode,
    });
  } catch (err) {
    console.error(`Failed to create Checkout Session for plan ${planKey}:`, err.message);
    res.status(500).json({ error: "Could not start checkout." });
  }
});

// /checkout/success/ calls this to confirm the payment. It returns only what
// that page shows (no names, emails or addresses), and only for sessions this
// server created, which carry a plan in their metadata.
app.get("/api/session-status", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const sessionId = String(req.query.session_id || "");
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,250}$/.test(sessionId)) {
    return res.status(400).json({ error: "Missing or invalid session_id." });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const planKey = (session.metadata && session.metadata.plan) || "";
    if (!planKey) return res.status(404).json({ error: "Session not found." });
    res.json({
      status: session.status, // open | complete | expired
      payment_status: session.payment_status, // paid | unpaid | no_payment_required
      plan: planKey,
      label: PLANS[planKey] ? PLANS[planKey].label : planKey,
      mode: session.mode,
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    if (err.statusCode === 404 || err.code === "resource_missing") {
      return res.status(404).json({ error: "Session not found." });
    }
    console.error(`Failed to retrieve Checkout Session ${sessionId}:`, err.message);
    res.status(500).json({ error: "Could not check the payment." });
  }
});

// ---------------------------------------------------------------------------
// Webhook events
//
// checkout.session.completed               card payments: paid now, so the
//                                          client and the business are both
//                                          emailed. ACH bank payments arrive
//                                          here "unpaid" and settle days later.
// checkout.session.async_payment_succeeded ACH payment cleared: emails as above.
// checkout.session.async_payment_failed    ACH payment failed: business notice.
// invoice.paid                             care plan monthly renewals only (the
//                                          first payment is the session above):
//                                          business notice.
async function handleEvent(event) {
  const obj = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
      if (obj.payment_status === "unpaid") {
        const pending = sessionSummary(obj, event);
        console.log(`Checkout completed, payment processing: ${pending.id}`);
        return sendOwnerNotice(pending, "pending");
      }
      return confirmPayment(sessionSummary(obj, event));
    case "checkout.session.async_payment_succeeded":
      return confirmPayment(sessionSummary(obj, event));
    case "checkout.session.async_payment_failed":
      console.log(`Payment failed: ${obj.id}`);
      return sendOwnerNotice(sessionSummary(obj, event), "failed");
    case "invoice.paid":
      if (obj.billing_reason === "subscription_cycle") {
        return sendOwnerNotice(invoiceSummary(obj, event), "renewal");
      }
      return undefined;
    default:
      console.log("Unhandled event type:", event.type);
      return undefined;
  }
}

async function confirmPayment(summary) {
  console.log(`Payment confirmed: ${summary.id} (${summary.planKey}, ${summary.amount})`);
  // The business notice goes out even if the client's email fails, and says
  // so, so a payment is never missed.
  let clientNote;
  if (!summary.email) {
    clientNote = "No client email was available, so no confirmation was sent to the client. Contact them directly.";
  } else if (!EMAIL_ENABLED) {
    clientNote = "Email sending is not configured, so no confirmation was sent to the client.";
  } else {
    try {
      await sendEmail({ to: summary.email, ...clientEmail(summary), idempotencyKey: `client-confirmation/${summary.id}` });
      clientNote = "The client has been sent a confirmation email with the kickoff booking link.";
    } catch (err) {
      console.error(`Client confirmation for ${summary.id} failed:`, err.message);
      clientNote = "The client's confirmation email could NOT be sent. Email them directly.";
    }
  }
  await sendOwnerNotice(summary, "paid", clientNote);
}

function sessionSummary(session, event) {
  const planKey = (session.metadata && session.metadata.plan) || "";
  const details = session.customer_details || {};
  return {
    id: session.id,
    idLabel: "Stripe session ID",
    livemode: event.livemode,
    planKey,
    label: PLANS[planKey] ? PLANS[planKey].label : planKey || "Unknown plan",
    subscription: session.mode === "subscription",
    amount: formatAmount(session.amount_total, session.currency),
    name: details.name || details.individual_name || details.business_name || "",
    email: details.email || session.customer_email || "",
  };
}

function invoiceSummary(invoice, event) {
  const line = (invoice.lines && invoice.lines.data && invoice.lines.data[0]) || {};
  const priceId =
    (line.pricing && line.pricing.price_details && line.pricing.price_details.price) ||
    (line.price && line.price.id) ||
    "";
  const planKey = Object.keys(PLANS).find((key) => PLANS[key].price === priceId) || "";
  return {
    id: invoice.id,
    idLabel: "Stripe invoice ID",
    livemode: event.livemode,
    planKey,
    label: planKey ? PLANS[planKey].label : line.description || "Care plan",
    subscription: true,
    amount: formatAmount(invoice.amount_paid, invoice.currency),
    name: invoice.customer_name || "",
    email: invoice.customer_email || "",
  };
}

function formatAmount(cents, currency) {
  if (typeof cents !== "number") return "amount not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Emails

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function clientEmail(s) {
  const firstName = s.name.trim().split(/\s+/)[0];
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";
  const paid = s.subscription ? `${s.amount} a month` : s.amount;
  const subject = s.subscription ? `Your ${s.label} is active` : `Payment received: ${s.label}`;
  const intro = s.subscription
    ? `Thank you for starting your ${s.label}. Your first payment has gone through and your plan is now active.`
    : "Thank you for your payment. It has gone through, and your project is booked in.";
  const steps = s.subscription
    ? [
        { text: "We'll email you within one business day to introduce ourselves and collect anything we need to start looking after your site." },
        { text: "Want to talk it through first? Book a call:", link: CALENDLY_URL },
        { text: "You can cancel any time; cancelling takes effect at the end of the month you've paid for." },
      ]
    : [
        { text: "Book your 30-minute kickoff call to go through your goals, content and timeline:", link: CALENDLY_URL },
        { text: "We'll email you within one business day to confirm the details and let you know what we need from you." },
      ];
  const receipt = "Stripe sends your receipt separately.";
  const contact = `Questions? Just reply to this email, write to ${BUSINESS_EMAIL} or call ${BUSINESS_PHONE}.`;

  const text = [
    greeting,
    "",
    intro,
    "",
    `What you paid for: ${s.label}`,
    `Amount: ${paid}`,
    "",
    "What happens next:",
    ...steps.map((step, i) => `${i + 1}. ${step.text}${step.link ? ` ${step.link}` : ""}`),
    "",
    receipt,
    contact,
    "",
    "Christian Knight",
    "KnightWebstudio",
    "https://knightwebstudio.com",
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1d2433;line-height:1.55">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px">
  <p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
  <p style="margin:0 0 20px">${escapeHtml(intro)}</p>
  <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 20px;background:#f4f6fb;border-radius:6px">
    <tr><td style="padding:12px 16px">
      <div style="font-size:13px;color:#5b6479">What you paid for</div>
      <div style="font-weight:bold">${escapeHtml(s.label)}</div>
      <div style="font-size:13px;color:#5b6479;margin-top:8px">Amount</div>
      <div style="font-weight:bold">${escapeHtml(paid)}</div>
    </td></tr>
  </table>
  <p style="margin:0 0 8px;font-weight:bold">What happens next</p>
  <ol style="margin:0 0 20px;padding-left:20px">
    ${steps
      .map(
        (step) =>
          `<li style="margin:0 0 8px">${escapeHtml(step.text)}${
            step.link ? ` <a href="${escapeHtml(step.link)}" style="color:#3348b8">${escapeHtml(step.link)}</a>` : ""
          }</li>`
      )
      .join("\n    ")}
  </ol>
  <p style="margin:0 0 8px;color:#5b6479">${escapeHtml(receipt)}</p>
  <p style="margin:0 0 20px;color:#5b6479">Questions? Just reply to this email, write to <a href="mailto:${BUSINESS_EMAIL}" style="color:#3348b8">${BUSINESS_EMAIL}</a> or call ${BUSINESS_PHONE}.</p>
  <p style="margin:0">Christian Knight<br>KnightWebstudio<br><a href="https://knightwebstudio.com" style="color:#3348b8">knightwebstudio.com</a></p>
</div>
</body></html>`;

  return { subject, text, html };
}

const NOTICE_HEADINGS = {
  paid: "New payment",
  pending: "Bank payment processing (not cleared yet)",
  failed: "Bank payment FAILED",
  renewal: "Care plan renewal paid",
};

async function sendOwnerNotice(s, kind, paidNote) {
  const heading = NOTICE_HEADINGS[kind];
  const amount = s.subscription ? `${s.amount} a month` : s.amount;
  const who = s.name || s.email || "unknown client";
  const subject = `${s.livemode ? "" : "[TEST] "}${heading}: ${s.label}, ${s.amount} from ${who}`;
  const rows = [
    ["Client name", s.name || "Not provided"],
    ["Client email", s.email || "Not provided"],
    ["Plan", s.planKey ? `${s.label} (${s.planKey})` : s.label],
    ["Amount", amount],
    [s.idLabel, s.id],
    ["Mode", s.livemode ? "Live" : "Test"],
  ];
  const note = {
    paid: paidNote,
    pending: "The client paid by ACH bank transfer. It usually clears within a few business days; you'll get a \"New payment\" notice, and the client a confirmation, when it does.",
    failed: "The client's bank payment did not go through. Nothing was emailed to the client; follow up with them directly.",
    renewal: "Stripe collected this month's care plan payment. The client gets Stripe's own receipt; nothing else was sent.",
  }[kind];

  const text = [heading, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", note].join("\n");
  const html = `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#1d2433;line-height:1.5">
<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
<table style="border-collapse:collapse">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:4px 16px 4px 0;color:#5b6479">${escapeHtml(k)}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`
  )
  .join("\n")}
</table>
<p>${escapeHtml(note)}</p>
</body></html>`;

  await sendEmail({ to: EMAIL.owner, subject, text, html, idempotencyKey: `owner-${kind}/${s.id}` });
}

async function sendEmail({ to, subject, text, html, idempotencyKey }) {
  if (!EMAIL_ENABLED) {
    console.warn(`Email not sent (RESEND_API_KEY / EMAIL_FROM not set): "${subject}" to ${to}`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${EMAIL.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from: EMAIL.from, to: [to], reply_to: EMAIL.replyTo, subject, text, html }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
  }
  console.log(`Email sent: "${subject}" to ${to}`);
}

// Render provides PORT; 4242 is the local-dev default.
const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Server running on port ${port}`));
