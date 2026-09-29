// Minimal Stripe embedded Checkout (Checkout Form SDK) server for
// knightwebstudio.com. The static site is hosted on GitHub Pages, which
// cannot run server code, so this service is deployed separately (e.g. as a
// Render web service) and the checkout page calls it cross-origin.
//
// See STRIPE_INTEGRATION_TODO.md at the repo root for the placeholder values
// that must be replaced before going live.

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1",
});

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
app.post("/api/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  if (endpointSecret) {
    const signature = req.headers["stripe-signature"];
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
    } catch (err) {
      console.log("Webhook signature verification failed.", err.message);
      return res.sendStatus(400);
    }
  } else {
    event = JSON.parse(req.body);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("Checkout completed:", session.id);
      if (session.consent?.terms_of_service === "accepted") {
        console.log("Customer accepted terms of service");
      }
      if (session.consent?.promotions === "opt_in") {
        const email = session.customer_details?.email;
        console.log("Customer opted in for promotional emails:", email);
      }
      break;
    }
    default:
      console.log("Unhandled event type:", event.type);
  }

  res.sendStatus(200);
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/api/create-checkout-session", async (req, res) => {
  // TODO: Set mode to "subscription" for recurring products (care plans).
  // See STRIPE_INTEGRATION_TODO.md.
  const mode = "payment";

  const sessionParams = {
    // Configured in Checkout Studio — use exactly as specified.
    ui_mode: "form",
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: false },
    submit_type: "auto",
    integration_identifier: "custom_embedded_web_0001",
    // Placeholders — replace with a real price ID from
    // STRIPE_INTEGRATION_TODO.md before going live.
    mode,
    line_items: [{ price: "price_...", quantity: 1 }],
  };
  if (mode === "subscription") {
    sessionParams.payment_method_collection = "always";
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ client_secret: session.client_secret });
  } catch (err) {
    console.error("Failed to create Checkout Session:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Render provides PORT; 4242 is the local-dev default.
const port = process.env.PORT || 4242;
app.listen(port, () => console.log(`Server running on port ${port}`));
