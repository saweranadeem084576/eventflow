# EventFlow Frontend

React + Vite single-page app for the EventFlow event management system. It uses React Router for navigation and a single small stylesheet (`src/style.css`) — no CSS framework.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The client expects the backend at `http://localhost:5000/api/v1` by default. Override it with `VITE_API_URL`.

Paid checkout uses the Stripe Payment Element. Set `VITE_STRIPE_PUBLISHABLE_KEY` in `.env`; the backend needs its own Stripe secret. Without a key the checkout page explains that payments are not configured.

Seed demo accounts with `npm run seed` in `backend/` (password `EventFlowDemo123!`): `demo.user@`, `organizer@`, and `admin@eventflow.test`.

## Pages

| Route                     | Access            | Purpose                                                        |
| ------------------------- | ----------------- | -------------------------------------------------------------- |
| `/`                       | public            | Landing page: hero, categories, upcoming events, stories, CTA  |
| `/events`                 | public            | Search and browse upcoming events (`?search=&category=`)       |
| `/events/:id`             | public            | Event details: overview, gallery, reviews, reserve a seat      |
| `/about`                  | public            | Mission, how it works, roles, tech stack, team                 |
| `/login`, `/signup`, …    | public            | Auth; signup lets you register as attendee or organizer        |
| `/account/*`              | signed in         | Bookings, notifications, profile & password, support           |
| `/bookings/:id/pay`       | signed in         | Stripe checkout for a pending paid booking                     |
| `/organizer/*`            | organizer, admin  | Overview, my events (edit/delete/registrations), create event  |
| `/admin/*`                | admin             | Overview, events (approve/delete), bookings, users, complaints |

## Structure

- `src/api.js` – typed API client; stores the bearer token in `localStorage`
- `src/context/AuthContext.jsx` – current user, `login`/`logout` state
- `src/components/RequireAuth.jsx` – route guard with optional role list
- `src/components/ui.jsx` – shared primitives (`Dashboard`, `Badge`, `Alert`, `Stat`, `Field`, …)
- `src/components/*Page.jsx` – one component per route
- `src/hooks/` – `useEvents` (search + pagination), `useAccount` (bookings + notifications)

Useful commands:

```bash
npm run lint
npm run format
npm run build
```
