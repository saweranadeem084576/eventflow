# EventFlow Backend

MVC REST API for the EventFlow event management system.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Run the backend test suite with:

```bash
npm test
```

Tests use `mongodb-memory-server`, so they do not require a running local MongoDB instance. The first test run may download a MongoDB binary.

The API runs on `http://localhost:5000` by default. Liveness and readiness checks are available at `/health`, `/api/v1/health`, and `/api/v1/ready`. Readiness returns `503` until MongoDB is connected.

For Docker deployment:

```bash
cp .env.example .env
docker compose up --build
```

Production requires `MONGODB_URI` and a strong `JWT_SECRET`. Keep provider secrets out of source control.

## Implemented authentication

- `POST /api/v1/auth/register` - create a user account (optional `role`: `user` or `organizer`; admins are assigned by an existing admin)
- `POST /api/v1/auth/login` - return a bearer token
- `POST /api/v1/auth/forgot-password` - send a password reset email
- `PATCH /api/v1/auth/reset-password/:token` - set a new password from a reset link
- `GET /api/v1/auth/me` - return the authenticated user
- `PATCH /api/v1/auth/password` - change the authenticated user's password
- `POST /api/v1/auth/logout` - client-side token removal response

Send the token on protected requests with `Authorization: Bearer <token>`. Set a strong `JWT_SECRET` in `.env` before deploying.

Password changes invalidate previously issued tokens and return a new bearer token.

Public signup is available at `POST /api/v1/auth/register`, and the React frontend exposes signup, forgot-password, and reset-password screens. Configure `SMTP_*` and `PASSWORD_RESET_URL` in `.env` for email delivery.

Write routes validate request bodies, parameters, and query values with Zod before controllers run.

## Implemented event management

- `GET /api/v1/events` - list published events with `search`, `category` (case-insensitive), `from`, `to`, `page`, and `limit` filters
- `GET /api/v1/events/mine` - list the organizer's own events in any status
- `GET /api/v1/events/:id` - retrieve a published event
- `GET /api/v1/events/:id/bookings` - list active registrations for an owned event (organizer/admin)
- `POST /api/v1/events` - create an event as an admin or organizer; accepts an optional cover `image` URL and up to three gallery `images`
- `PATCH /api/v1/events/:id` - update an owned event, or any event as an admin; attendees receive an `event_updated` notification
- `DELETE /api/v1/events/:id` - delete an owned event; refused with `409` while it has active bookings

Organizer-created events start as `pending`; admin-created events are published immediately.

## Implemented payments

- `POST /api/v1/payments/intent` - create a Stripe payment intent for a booking
- `POST /api/v1/payments/:id/confirm` - verify the provider payment and confirm the booking
- `POST /api/v1/payments/webhook` - receive verified Stripe payment status events

### Stripe setup

1. **API keys** — Stripe Dashboard → Developers → API keys. Put the **secret** key (`sk_test_…`) in `backend/.env` as `STRIPE_SECRET_KEY`, and the **publishable** key (`pk_test_…`) in `frontend/.env` as `VITE_STRIPE_PUBLISHABLE_KEY`. The publishable key is safe in client code; the secret key must never leave `.env`.

2. **Webhook secret, local development** — install the [Stripe CLI](https://stripe.com/docs/stripe-cli), then run it alongside the API:

   ```bash
   stripe login                      # or pass --api-key on each command
   stripe listen --events payment_intent.succeeded,payment_intent.payment_failed \
     --forward-to http://localhost:5000/api/v1/payments/webhook
   ```

   `stripe listen` prints `Your webhook signing secret is whsec_…` — copy it into `STRIPE_WEBHOOK_SECRET` and **restart the API** so it picks up the new value. Test it with `stripe trigger payment_intent.succeeded`; the CLI should log `[200]`.

3. **Webhook secret, deployed** — Dashboard → Developers → Webhooks → *Add endpoint*, URL `https://<your-host>/api/v1/payments/webhook`, events `payment_intent.succeeded` and `payment_intent.payment_failed`. Reveal the endpoint's signing secret and set it as `STRIPE_WEBHOOK_SECRET` there.

Checkout works with just the two API keys: the browser confirms the payment and the client calls `POST /payments/:id/confirm`. The webhook is the server-side safety net for when a user closes the tab mid-payment, so configure it before going live.

Payment amount is calculated from the event price on the server. Calling `/payments/intent` again for a booking with an unfinished payment returns the same intent so an abandoned checkout can be resumed. Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` before using payment endpoints. The client must use the returned `clientSecret` to complete payment with Stripe before calling confirmation. Stripe webhooks provide the server-side confirmation path.

## Implemented feedback

- `GET /api/v1/feedback/recent` - latest six reviews with a comment, for the landing page
- `GET /api/v1/feedback/event/:eventId` - list event reviews with average rating statistics
- `POST /api/v1/feedback` - submit one review after attending a confirmed booking

## Implemented notifications

- `GET /api/v1/notifications` - list the authenticated user's notifications
- `GET /api/v1/notifications?unread=true` - list unread notifications
- `PATCH /api/v1/notifications/:id/read` - mark one notification as read
- `PATCH /api/v1/notifications/read-all` - mark all notifications as read
- `POST /api/v1/notifications/devices` - register an FCM device token

Successful payment confirmation creates a durable booking-confirmation notification. FCM delivery is enabled when `FIREBASE_SERVICE_ACCOUNT_JSON` is configured.

## Implemented admin and complaints

- `GET /api/v1/admin/overview` - dashboard counts for users, events, bookings, and open complaints
- `PATCH /api/v1/admin/events/:id/approve` - publish a pending event
- `GET /api/v1/admin/bookings` - view all bookings with pagination and status filtering
- `GET /api/v1/admin/complaints` - view complaints with optional status filtering
- `PATCH /api/v1/admin/complaints/:id/resolve` - resolve an open complaint
- `POST /api/v1/complaints` - submit a complaint as an authenticated user
- `GET /api/v1/complaints` - list the authenticated user's own complaints
- `GET /api/v1/users` - admin-only user list
- `GET/PATCH/DELETE /api/v1/users/:id` - guarded user profile management; deleting a user releases their active bookings and removes their avatar file
- `POST /api/v1/users/me/avatar` - upload a profile picture (multipart `avatar` field, images only, 5 MB max)

Uploaded avatars are resized to a 256x256 WebP with `sharp` and written to `backend/uploads/avatars/`, served read-only from `/uploads`. Replacing a picture deletes the previous file. Set `UPLOADS_DIR` to store them elsewhere; the folder is gitignored, so back it up or point it at a volume in production.

## Implemented bookings

- `GET /api/v1/bookings` - authenticated user's booking history with pagination and status filtering
- `GET /api/v1/bookings/:id` - retrieve one of the authenticated user's bookings
- `POST /api/v1/bookings` - reserve one seat for a published future event
- `PATCH /api/v1/bookings/:id/cancel` - cancel an active booking and release its seat

Bookings begin as `pending` and reserve capacity immediately. The partial unique index allows a user to book again after cancellation. On an existing database, remove the original non-partial `event_1_user_1` index before allowing rebooking.

Paid booking cancellation requests a Stripe refund before cancelling the booking. Successful refunds are stored with the payment record; failed refunds leave the booking active and preserve its reserved seat.

Seat reservation, release, and payment state transitions use conditional atomic MongoDB updates. For full multi-document transactions in production, run MongoDB as a replica set and wrap deployment-level workflows with sessions.

## Structure

- `app.js` - Express application and middleware
- `server.js` - HTTP server and database startup
- `routes/` - versioned API route modules
- `controllers/` - request/response orchestration
- `models/` - Mongoose domain models
- `services/` - Firebase, payment, and notification integration boundaries
- `middleware/` - authentication and error handling
- `utils/` - shared infrastructure helpers
- `Dockerfile` and `docker-compose.yml` - containerized API and MongoDB setup
