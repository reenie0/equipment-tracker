# Equipment Tracker

A small web app for tracking company equipment: what exists, its status
(available / booked / in repair), and a gate-pass booking workflow where a
manager approves or denies each request.

## Stack

- **Frontend:** React + Vite, served by nginx in production
- **Backend:** Node.js + Express, JWT auth, SQLite (via `better-sqlite3`) for storage
- **Orchestration:** Docker Compose (two containers: `frontend`, `backend`)

## Features

- Equipment catalog with categories and a status of **available** (green),
  **booked** (yellow), or **repair** (red)
- Managers can add and delete equipment, and manually flip status (e.g. send
  something to repair)
- Users request a booking, which generates a **gate pass**: equipment name,
  equipment ID, purpose, requester name, and duration
- Managers review pending requests and approve or deny them
- Users track their own requests under **Pending / Accepted / Rejected** tabs
- Accepted requests show a live countdown for the approved duration; when it
  runs out the equipment automatically flips back to available
- Users can also return equipment early from the Accepted tab

## Running it

1. (Optional) Copy `.env.example` to `.env` and set a real `JWT_SECRET`.
2. From the project root:

   ```bash
   docker compose up --build
   ```

3. Open **http://localhost:8080**.

The backend listens internally on port 4000; nginx in the frontend container
proxies `/api/*` to it, so only port 8080 needs to be exposed.

Equipment data lives in a SQLite file inside the `equipment_data` Docker
volume, so it survives container restarts. To reset everything:

```bash
docker compose down -v
```

## Demo accounts

Seeded automatically on first run:

| Role    | Username | Password   |
|---------|----------|------------|
| Manager | manager  | manager123 |
| User    | user     | user123    |

Anyone can also self-register from the login screen — new sign-ups always get
the regular `user` role. Manager accounts are only created by seeding or by
inserting a row directly into the `users` table, so no one can grant
themselves approval rights.

**Change these demo passwords (or seed different ones) before using this in a
real environment.**

## Project structure

```
equipment-tracker/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── index.js          # Express app entry point
│       ├── db.js             # SQLite schema + seed data
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js       # register / login
│           ├── equipment.js  # CRUD for equipment (manager-gated)
│           └── bookings.js   # gate pass requests, approve/deny/return
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── pages/            # Dashboard, Requests, ManagerReview, Login
        ├── components/       # EquipmentCard, GatePass, Countdown, modals
        ├── context/AuthContext.jsx
        └── api.js
```

## Notes on the booking lifecycle

1. A user requests a booking on an **available** item → a `pending` gate
   pass is created.
2. A manager **approves** it → equipment turns **booked** (yellow), the
   request becomes `accepted`, and an expiry time is stored based on the
   requested duration.
3. A manager **denies** it → the request becomes `rejected` and the
   equipment stays available.
4. When the countdown reaches zero (checked whenever bookings are fetched,
   and polled every 15s by the UI), the request is marked `completed` and
   the equipment automatically returns to **available**. Users can also
   return early with the "Return now" button.

## Extending it

- Swap SQLite for Postgres by changing `backend/src/db.js` if you need
  multiple backend replicas.
- Add email/Slack notifications on approval/denial inside
  `backend/src/routes/bookings.js`.
- Add a printable/PDF export of the gate pass for a physical copy at the
  gate.
