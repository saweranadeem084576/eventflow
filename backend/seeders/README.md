# Demo Seeder

From `backend/`:

```bash
npm run seed        # replace all event data with the demo catalogue
npm run seed:clear  # remove demo events and accounts
```

`npm run seed` **replaces** every event, booking, payment, review, and notification with the catalogue in `events.js` (18 upcoming events across nine categories, plus 9 past events carrying 31 reviews from confirmed attendees). Demo accounts from `users.js` are upserted and keep their ids; on first creation a portrait is downloaded from randomuser.me and stored through the normal avatar pipeline (resized, WebP, in `uploads/avatars/`). If the download fails the account is still created, just without a picture.

Demo accounts use the password from `SEED_DEMO_PASSWORD`, or `EventFlowDemo123!` by default:

- ten attendees: `demo.user@`, `ayesha@`, `bilal@`, `hamza@`, `sana@`, `zara@`, `usman@`, `mahnoor@`, `ali@`, `fatima@eventflow.test`
- `organizer@eventflow.test` - organizer (owns every seeded event)
- `admin@eventflow.test` - admin

Reviews can only be written after an event has ended, so they live on the past events. Use the **Past & reviewed** tab on the Explore page to browse them.

Change the demo password before sharing a non-development environment.
