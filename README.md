# LiPARENT — Rental Property Management Platform

> **Rental property management made easy.**

LiPARENT (Lipa-Rent) is a property and rent management platform that lets landlords
register an account, manage the properties they own, add rooms and tenants, and record
monthly rent payments — all from a single dashboard. It includes reporting/revenue views,
charts, and an OTP-verified sign-up and login flow.

---

## What It Does

- **Landlord accounts** — sign up and log in using email + National ID + password, with
  email/phone **OTP verification** on sign-up and login.
- **Property management** — create and view the properties you own.
- **Room management** — add rooms to a property with a room number, monthly rate, type, and area.
- **Tenant management** — add tenants to a room (name, National ID, phone, move-in date)
  and track who currently occupies each room.
- **Rent payments** — record monthly rent payments per tenant (amount paid, previous
  balance, new balance, mode of payment — cash → `CASH`, or M-Pesa).
- **Revenue reporting** — aggregate rent payments for revenue insights plus a dashboard with charts.

> **Note:** A tenant-facing self-service portal is planned but not yet implemented.

---

## Tech Stack

| Layer      | Technology                                                        |
| ---------- | ----------------------------------------------------------------- |
| Front end  | React 19, React Router 7, Vite 8, Bootstrap 5, Chart.js           |
| Back end   | Node.js + Express 4                                                |
| Database   | MongoDB (via Mongoose 8 + native `mongodb` driver)                 |
| Auth       | `jsonwebtoken` (JWT) + `bcrypt` (password hashing)                 |
| Validation | Joi                                                               |
| Email      | Mailtrap (dev) / Resend (production)                              |
| Module fmt | Back end: CommonJS (`require`) · Front end: ESM (`type: module`)  |

---

## Repository Structure

```
Lipa-Rent/
├─ index.html              # Legacy static landing page (see note below)
├─ CLIENT/
│   ├─ react/              # Landlord/admin web app (Vite + React)   <-- primary front end
│   │   └─ src/
│   │       ├─ pages/      # Dashboard, Login, Rooms, Tenants, Rents, Revenue, ...
│   │       ├─ components/ # Reusable UI (Modal, Toast, Loader, Header, ...)
│   │       ├─ context/    # Auth, Loader, Confirm providers
│   │       ├─ hooks/      # useAuth, useConfirm
│   │       └─ services/   # api.js — all server calls (central API layer)
│   ├─ tenant/             # (empty) planned tenant-facing portal
│   └─ utils/              # Legacy shared static utilities
├─ SERVER/                 # Express + MongoDB REST API
│   ├─ server.js           # Entry point (Express app + DB connection)
│   ├─ middleware/
│   │   ├─ models/         # Mongoose schemas (Owner, Property, Room, Tenant, Rent, Otp, ...)
│   │   ├─ tokens/         # JWT sign/verify helpers
│   │   └─ validators/     # Request validation (Joi)
│   └─ routes/users/
│       ├─ controllers/    # post / patch / delete controllers
│       └─ routes/         # Express route definitions
└─ STATE.md                # Local-only dev notes (intentionally git-ignored)
```

> **Legacy landing page:** the root `index.html` is an older static page that references
> `CLIENT/indexResources`, which no longer exists in this repo. The current, maintained
> user-facing app lives in **`CLIENT/react`**. You can safely ignore `index.html`.
---

## Prerequisites

- **Node.js 18+** (developed/tested on v24.x) — <https://nodejs.org>
- **A package manager.** npm is bundled with Node.js; you may alternatively install
  [yarn](https://yarnpkg.com/), [pnpm](https://pnpm.io/), or [bun](https://bun.sh/) and use
  it throughout (see "Install dependencies" and "Run the apps" below).
- A **MongoDB** database. For a fresh fork/dev setup the easiest option is a free
  [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (no local install needed);
  you can also run MongoDB locally (`mongod` / `mongosh`).
- *(Optional)* email API keys: [Mailtrap](https://mailtrap.io/) (development) or
  [Resend](https://resend.com/) (production).

---

## Getting Started (run on another machine / fork)

Follow these steps to clone and run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/blackhammer2000/Lipa-Rent.git
cd Lipa-Rent
```

> If you forked the repo, clone **your** fork instead:
> `git clone https://github.com/<your-username>/Lipa-Rent.git`

### 2. Install dependencies

Each sub-project manages its own dependencies. The projects ship with `package-lock.json`
(npm), but they work with any of the popular package managers. Pick one and use it
consistently for both `SERVER/` and `CLIENT/react`.

| Manager | Install command           | Lockfile created         |
| ------- | ------------------------- | ------------------------ |
| **npm** | `npm install`             | `package-lock.json`      |
| **yarn** (classic) | `yarn install`    | `yarn.lock`              |
| **pnpm** | `pnpm install`            | `pnpm-lock.yaml`         |
| **bun**  | `bun install`             | `bun.lock` / `bun.lockb` |

**Back end — `SERVER/`:**

```bash
cd SERVER
# npm
npm install
# yarn
yarn install
# pnpm
pnpm install
# bun
bun install
```

**Front end — `CLIENT/react`:**

```bash
cd CLIENT/react
# npm
npm install
# yarn
yarn install
# pnpm
pnpm install
# bun
bun install
```

> Prefer signing in with the **same** package manager for both sub-projects so only one
> lockfile type is generated. If you switch managers later, delete the old lockfile (and
> `node_modules`) before installing with the new one to avoid conflicts:
>
> ```bash
> rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml bun.lock bun.lockb
> ```

### 3. Configure the environment

The server needs a `.env` file. Copy the example and fill in your values:

```bash
cd SERVER
cp .env.example .env
```

Then edit `SERVER/.env`. A minimal working development config:

```dotenv
PORT=4000
ORIGIN="http://localhost:5173"
DB_CONNECTION="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?appName=<name>"

SIGNUP_SECRET_KEY="any-random-string-1"
LOGIN_SECRET_KEY="any-random-string-2"
LOGOUT_SECRET_KEY="any-random-string-3"
ACCESS_SECRET_KEY="any-random-string-4"
FORGOT_SECRET_KEY="any-random-string-5"
RESET_SECRET_KEY="any-random-string-6"
ADMIN_SECRET_KEY="any-random-string-7"

MAILTRAP_API_KEY=""
RESEND_API_KEY=""
```

> Use strong, unique secret keys per environment (e.g. a password manager or
> `openssl rand -hex 32`). Email keys are optional to get the app running — core
> management features work without them.

#### Environment variables reference

| Variable             | Required | Purpose                                                     |
| -------------------- | -------- | ----------------------------------------------------------- |
| `PORT`               | Yes      | Port the API listens on (e.g. `4000`)                       |
| `ORIGIN`             | Yes      | Allowed CORS front-end origin (e.g. `http://localhost:5173`) |
| `DB_CONNECTION`      | Yes      | MongoDB connection string                                   |
| `SIGNUP_SECRET_KEY`  | Yes      | JWT signing key for the sign-up flow                        |
| `LOGIN_SECRET_KEY`   | Yes      | JWT signing key for login tokens                            |
| `LOGOUT_SECRET_KEY`  | Yes      | JWT signing key for logout                                  |
| `ACCESS_SECRET_KEY`  | Yes      | JWT signing key for access tokens                           |
| `FORGOT_SECRET_KEY`  | Yes      | JWT signing key for forgot-password                         |
| `RESET_SECRET_KEY`   | Yes      | JWT signing key for the reset flow                          |
| `ADMIN_SECRET_KEY`   | Yes      | JWT signing key for admin flow                              |
| `MAILTRAP_API_KEY`   | No       | Mailtrap API key (dev email)                                |
| `RESEND_API_KEY`     | No       | Resend API key (production email)                           |

### 4. Run the apps

Use the same package manager you installed with. If you're not sure which one you're
running, `npm run <script>` is always available since npm ships with Node.js.

**Start the API** — from `SERVER/`:

```bash
# npm
npm run server
# yarn
yarn run server   (or just: yarn server)
# pnpm
pnpm run server
# bun
bun run server
```

This runs `nodemon server.js`, connects to MongoDB, and serves the API on
`http://localhost:4000` (when `PORT=4000`).

**Start the front end** — from `CLIENT/react`, in a second terminal:

```bash
# npm
npm run dev
# yarn
yarn run dev      (or just: yarn dev)
# pnpm
pnpm run dev
# bun
bun run dev
```

Vite serves the app on `http://localhost:5173` by default.

### 5. Open the app

- Front end: <http://localhost:5173>
- API base: <http://localhost:4000>

Workflow to try it out: sign up a landlord account → confirm via the OTP shown during the
flow → log in → add a property → add rooms → add tenants → record rent payments → view the
dashboard and revenue.

> In development the OTP value is surfaced locally (response/console) instead of being
> emailed. Production builds use Mailtrap/Resend.

---

## Available Scripts

| App            | npm script          | Description                                    |
| -------------- | ------------------- | ---------------------------------------------- |
| `SERVER`       | `npm run server`    | run the API with auto-reload (`nodemon`)       |
| `CLIENT/react` | `npm run dev`       | start the Vite dev server                      |
| `CLIENT/react` | `npm run build`     | production build to `dist/`                    |
| `CLIENT/react` | `npm run preview`   | preview the production build                   |
| `CLIENT/react` | `npm run lint`      | run ESLint on the front end                    |

**Running the same scripts with other package managers** — prepend the manager in the same
way shown above:

| npm            | yarn                      | pnpm               | bun             |
| -------------- | ------------------------- | ------------------ | --------------- |
| `npm run dev`  | `yarn dev`                | `pnpm run dev`     | `bun run dev`   |
| `npm run build` | `yarn build`             | `pnpm run build`   | `bun run build` |
| `npm run server` | `yarn server`           | `pnpm run server`  | `bun run server`|
| `npm run lint` | `yarn lint`               | `pnpm run lint`    | `bun run lint`  |

---

## API Overview

All API routes are prefixed with `/api/user`. They are protected by:

- a `user: true` request header (checked by the `isUser` middleware), and
- a `token` header holding a valid JWT access token (checked by
  `verifyUserAccessToken`, which also injects the authenticated owner `id` into the body).

Key endpoints (all `POST` unless noted):

| Method | Path                                                           | Purpose                        |
| ------ | -------------------------------------------------------------- | ------------------------------ |
| POST   | `/api/user/owner/signup/generate/otp`                          | start the sign-up OTP flow     |
| POST   | `/api/user/owner/login`                                        | log in → `loginToken`          |
| POST   | `/api/user/owner/read/properties`                              | list properties                |
| POST   | `/api/user/owner/read/property/rooms`                          | list rooms for a property      |
| POST   | `/api/user/owner/create/property/room/tenant`                  | add a tenant to a room         |
| POST   | `/api/user/owner/create/property/room/tenant/payment`          | record a rent payment          |
| POST   | `/api/user/owner/read/property/room/tenants`                   | list tenants in a room         |
| POST   | `/api/user/owner/read/property/room/tenant/payments`           | list a tenant's payments       |
| POST   | `/api/user/owner/read/property/rooms/tenants/payments`         | aggregate revenue              |

See `CLIENT/react/src/services/api.js` for the exact request/response shapes used by the
front end.

---

## Data Model (at a glance)

Each landlord-scoped document stores `ownerID` plus nested objects keyed by generated
alpha-numeric IDs:

- **Owner** → `name`, `nationalID`, `email`, `phone`, etc.
- **Property** → `propertiesOwned` → per property: `propertyName`, `propertyNumber`, `propertyLocation`.
- **Room** → per property → `rooms` → per room: `roomNumber`, `roomRatePerMonth`, `roomType`, `roomArea`, `currentTenantID`, `isOccupied`.
- **Tenant** → per room → per tenant: `tenantName`, `tenantNationalID`, `tenantPhone`, `tenantMoveIn`, `tenantMoveOut`.
- **Rent** → per property → `rentPayments` → per room → per tenant → array of
  `{ paymentID, date, month, previousPaymentBalance, amountPaid, newBalance, modeOfPayment, receiptNumber }`.

---

## Contributing / Forking

1. **Fork** the repo on GitHub and clone your fork.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Make your changes and **test** them locally (see "Getting Started").
4. Commit with clear messages and push to your fork.
5. Open a **pull request** against the `react` branch.

> **⚠ Security:** Never commit any `.env` file, secret keys, or database credentials.
> These are already git-ignored. Use `.env.example` as the template for your own secrets.

---

## License

ISC — **Author:** Samuel Waweru. Private / unpublished software.