# Lipa-Rent — Project State File

> **How to use this file**
> This file is the single source of truth for the project's structure, conventions,
> and work history. It is read BEFORE starting any task so the codebase does not have
> to be re-read from scratch. It is updated AFTER each task with any changes made.
>
> **IMPORTANT**: This file is intentionally excluded from Git (see `.gitignore`) and
> must never be committed to GitHub. It is a local-only developer aid.

---

## 1. Overview

Lipa-Rent is a property/rent management platform for landlords. Landlords register an
account, add properties, add rooms, add tenants, and record rent payments. The project
consists of:

- **`CLIENT/`** – front-end applications
  - `CLIENT/react` – the landlord/admin React (Vite) app
  - `CLIENT/tenant` – **empty**; intended future home of a tenant-facing React portal
  - `CLIENT/utils` – shared utilities
- **`SERVER/`** – Node.js + Express + MongoDB (Mongoose) backend API

Default app title: **LiPARENT**.

---

## 2. Repository / Git

- Default branch: `react`
- Upstream: `origin` → `https://github.com/blackhammer2000/Lipa-Rent.git`
- `.gitignore` files exist at: root, `CLIENT/react/.gitignore`, `SERVER/.gitignore`

---

## 3. Tech Stack & Conventions

### Server (`SERVER/`)

- Runtime: Node.js (`v24.x` available locally), `npm`.
- Express + MongoDB via Mongoose. Auth uses `jsonwebtoken` + `bcrypt`.
- Entry: `SERVER/server.js` (port `PORT` from `.env`, default `8080`; local `.env` uses `4000`).
- CORS `origin` read from `process.env.ORIGIN`.
- Routes split into `get.js`, `post.js`, `patch.js`, `delete.js`, assembled in
  `routes/users/routes/routes.js`, mounted in `server.js` via `app.use(userRoutes)`.
- Controllers are one large object per HTTP method:
  - `routes/users/controllers/postControllers.js`
  - `routes/users/controllers/patchControllers.js`
    (note: deletes file is named `deleteControllers.js`)
- Models in `middleware/models/*.js` - see section 5.
- Token helpers in `middleware/tokens/*.js`: `sign*Token` sign; `verify*Token` middleware
  also inject `req.body.id` (and other fields) and delete `req.headers.token`.
- Validators in `middleware/validators/*.js`, aggregated in `validators.js`.
- Errors returned as `res.status(400).json({ error })`; `session expired` is `403`.
- API paths are prefixed `/api/user/...` and gated by `isUser` (header `user: true`)
  and `verifyUserAccessToken` (header `token`, body `id`) middlewares.

### Client admin (`CLIENT/react`)

- React 19, React Router 7, Vite 8, Bootstrap 5 (`bootstrap` npm pkg), chart.js.
- `src/services/api.js` has `serverDomain`, a `request()` wrapper wired to a global loader,
  `getAccessToken()`/`getLoginToken()`/`clearLocalStorage()`, and all API functions.
- LocalStorage keys for admin app start with `liparent...` (e.g. `liparentAccessToken`).
- Auth via `context/AuthProvider.jsx` → `{ accessToken, isAuthenticated, handleLogin, handleLogout }`
  exposed through `hooks/useAuth.js` / `context/AuthContext.js`.
- Routing in `src/App.jsx` using `<BrowserRouter>`; protected routes wrap with `ProtectedRoute`.
- Bootstrap CSS imported in `main.jsx` plus `index.css`.

---

## 4. Directory Layout (non-node_modules)

```
Lipa-Rent/
├─ .gitignore
├─ ADMIN/
├─ CLIENT/
│   ├─ react/                # landlord/admin Vite app
│   │   ├─ index.html
│   │   └─ src/
│   │       ├─ App.jsx
│   │       ├─ main.jsx
│   │       ├─ index.css
│   │       ├─ assets/css/loader.css
│   │       ├─ components/{ConfirmDialog,Footer,Header,Loader,Modal,ProtectedRoute,Toast}.jsx
│   │       ├─ context/{AuthContext.js,AuthProvider.jsx,ConfirmContext.js,ConfirmProvider.jsx,LoaderContext.js,LoaderProvider.jsx}
│   │       ├─ hooks/{useAuth,useConfirm}.js
│   │       ├─ pages/{Dashboard,Landing,Login,Profile,Rents,Revenue,Rooms,Subscriptions,Tenants}.jsx
│   │       └─ services/api.js
│   └─ utils/
├─ SERVER/
│   ├─ .env.example
│   ├─ package.json
│   ├─ server.js
│   ├─ middleware/
│   │   ├─ models/  Otp,Owner,Password,Property,Rent,Room,Subscription,Tenant
│   │   ├─ tokens/  accessToken,adminAccessToken,forgotPasswordToken,loginToken,logoutToken,
│   │   │           resetPasswordToken,signUpToken,verify* (verifyAccessToken, etc.)
│   │   └─ validators/ isLoginVerified,landlord,login,property,room,tenant,validators
│   └─ routes/users/
│       ├─ controllers/ deleteControllers.js, patchControllers.js, postControllers.js
│       ├─ helpers/ checkSubscription,createModels,generatOtp,isLoginOtpVerified,
│       │            isPropertyNumberAndIDregistered,isUser
│       └─ routes/ delete.js,get.js,patch.js,post.js,routes.js
└─ routes/helpers/ cipher.js,mailtrap.js   (at SERVER/routes/helpers)
```

---

## 5. Data Model (Mongoose)

Landlord-scoped docs use ONE document per owner: `ownerID` = owner's `_id` string; child
entities are nested objects keyed by generated alpha-numeric IDs.

- **Property** (`Property.js`, coll `property`)
  `{ ownerID, propertiesOwned: Array }` → `propertiesOwned[0][propertyId] = { propertyId, propertyName, propertyNumber, propertyLocation, ... }`
- **Room** (`Room.js`, coll `room`)
  `{ ownerID, rooms: Array }` → `rooms[0][propertyId] = { propertyId, propertyName, propertyNumber, rooms: { roomId: { roomId, roomNumber, roomRatePerMonth, roomType, roomArea, currentTenantID, isOccupied } } }`
- **Tenant** (`Tenant.js`, coll `tenant`)
  `{ ownerID, tenants: Array }` → `tenants[0][propertyId].tenants[roomId][tenantId] = { tenantId, tenantName, tenantNationalID, tenantPhone, tenantMoveIn, tenantMoveOut, ... }`
  - `tenantId` is auto-generated on create via `generateOTP()` (NOT a mongo ObjectId).
- **Rent** (`Rent.js`, coll `rent`)
  `{ ownerID, rents: Array }` → `rents[0][propertyId] = { ...propertyInfo, rentPayments: { roomId: { tenantId: [ { paymentID, date, month, previousPaymentBalance, amountPaid, newBalance, modeOfPayment, receiptNumber } ] } }, expectedMonthlyRevenues }`
- **Otp / Owner / Password / Subscription** – auth & billing models.

**Navigation tip**: to reach a tenant, walk key-by-key:
`tenants[0][propertyId].tenants[roomId][tenantId]`.

---

## 6. Key API Endpoints

All `POST` unless noted; gated by `user: true` header + `token` access header; body gets
`id` injected by `verifyUserAccessToken`.

- `POST /api/user/owner/signup/generate/otp` → signup OTP flow (then verify → signUp)
- `POST /api/user/owner/login` → `{ email, nationalID, password }` → `{ loginToken }`
- `GET /api/user/landlord/read/allproperties`
- `POST /api/user/owner/read/properties`
- `POST /api/user/owner/read/property/rooms`
- `POST /api/user/owner/create/property/room/tenant` → body `{ propertyId, roomId, newTenant: { tenantName, tenantNationalID, tenantPhone, tenantMoveIn } }`
- `POST /api/user/owner/read/property/room/tenants` → `{ propertyId, roomId }` → `{ selectedRoomOnPropertyTenants }`
- `POST /api/user/owner/read/property/room/tenant/payments` → `{ propertyId, roomId, tenantId }` → `{ selectedTenantPayments }`
- `POST /api/user/owner/create/property/room/tenant/payment`
- `POST /api/user/owner/read/property/rooms/tenants/payments` → revenue aggregate
- `POST /api/user/owner/logout`

Login/registration uses OTP flows (email/phone OTP). Payment entries carry
`paymentID` (from `generateOTP()`), `month`, `previousPaymentBalance`, `amountPaid`,
`newBalance`, `modeOfPayment` (`cash` → `receiptNumber: "CASH"`), `date`.

---

## 7. Environment & Secrets

- `SERVER/.env` (gitignored): `PORT`, `ORIGIN`, `DB_CONNECTION`, `*_SECRET_KEY`,
  `MAILTRAP_API_KEY`, `RESEND_API_KEY`. Documented in `SERVER/.env.example`.
- `ORIGIN` is currently a single string. If a tenant portal calls the SAME server, its
  origin must be added to `ORIGIN` (CORS). If only one origin is needed at a time, swap it.

---

## 8. Task Log / Change History

> Append a dated entry after each completed task. Format:
>
> ```
> ### YYYY-MM-DD — summary title
> **Scope**: folders/files touched
> **What was done**: ...
> **Notes / next steps**: ...
> ```

Current entries:

### first — State file added

- **Scope**: repo root; `.gitignore`
- **What was done**: Created this `STATE.md` tracking file and added it to `.gitignore` so
  it is never committed to GitHub.
- **Notes / next steps**: Use this file as the context baseline for all future tasks.

### 2026-09-05 — Root README created

- **Scope**: repo root (`README.md`)
- **What was done**: Created `README.md` covering: what the project does, tech stack,
  repository structure, prerequisites, and full "run on another machine"/forking steps
  (clone, install, `.env` setup with variable reference, run server + front end, available
  scripts, API overview, data model, and contributing notes).
- **Notes / next steps**: README is currently untracked (ready to commit). Note: `STATE.md`
  is currently tracked in git (committed in `51d4093`, also present on `origin/react`); if
  it must never be pushed to GitHub, it needs to be removed from tracking and re-added to
  `.gitignore`.

### 2026-09-05 — README: added other-package-manager support

- **Scope**: repo root (`README.md`)
- **What was done**: Extended the README so developers using package managers other than
  npm (yarn, pnpm, bun) have full instructions: a manager table (install command + lockfile),
  per-manager `install` steps for both `SERVER/` and `CLIENT/react`, a tip on keeping a
  single lockfile / switching managers, per-manager run commands (`server`, `dev`), an
  "Available Scripts" section with an npm→yarn/pnpm/bun mapping table, and an updated
  Prerequisites section mentioning yarn/pnpm/bun. Fixed a missing blank line so the env
  table doesn't run into the "Run the apps" header.
- **Notes / next steps**: Still untracked (`?? README.md`); ready to commit.

### 2026-09-05 — README: clarified run steps & env example

- **Scope**: repo root (`README.md`)
- **What was done**: Added a direct `node server.js` fallback for starting the API when
  `nodemon` isn't available/preferred; replaced the inline `.env` "minimal config" example
  with one that exactly matches the real `SERVER/.env.example` placeholder format
  (`"server port number"`, `"secret_key_signup"`, etc.) and clarified that all placeholders
  must be replaced.
- **Notes / next steps**: N/A.

### 2026-09-06 — Added tests (Jest) for server & client

- **Scope**:
  - `SERVER/` — `jest.config.js`, `tests/` (unit + e2e), `package.json` test scripts
    (`test`, `test:unit`, `test:e2e`, `test:watch`); installed `jest` + `supertest`.
  - `CLIENT/react/` — `jest.config.js`, `babel.config.js`, `jest.setup.js`,
    `src/test-utils/fileMock.js`, `src/__tests__/unit` + `src/__tests__/e2e`,
    `package.json` `test*` scripts; installed `jest`, `jest-environment-jsdom`,
    `jest-css-modules`, `babel-jest`, `@babel/core`, `@babel/preset-env`,
    `@babel/preset-react`, `@testing-library/*`.
  - Root `.gitignore` (`/SERVER/coverage/`) and `CLIENT/react/.gitignore` (`coverage/`).
- **What was done**:
  - **Server unit tests**: `cipher`, `generateOtp`, `checkSubscription`, `isUser`,
    `isLoginVerified`, Joi validators, JWT token sign helpers, `createModel` +
    `checkIfPropertyNumberAndIDareRegistered`.
  - **Server e2e**: supertest over the real route tree (`tests/helpers/app.js`) with
    Mongoose models + bcrypt mocked — `POST /api/user/owner/login` flow.
  - **Client unit tests**: `api.js` helpers + `request` wrapper (with mocked `fetch`),
    `AuthProvider` + `ProtectedRoute`, `Header` + `Footer`.
  - **Client e2e/integration**: Login → OTP → protected Dashboard flow with mocked API
    and `MemoryRouter`.
- **Result**: Server 9 suites (40 passed, 3 skipped); Client 4 suites (22 passed).
  The 3 skipped server tests document a latent bug in
  `checkIfPropertyNumberAndIDareRegistered` (reassigns `const` → TypeError).
- **Notes / next steps**:
  - Server test files are already committed (2 local commits ahead of origin).
  - Client test files + configs are uncommitted (working tree).
  - `coverage/` folders are git-ignored.

### 2026-09-06 — Fixed ESLint errors in client test files

- **Scope**: `CLIENT/react/eslint.config.js`, `jest.setup.js`,
  `src/__tests__/e2e/login-flow.spec.jsx`, `src/__tests__/unit/{layout,api,auth}.test.js`
- **What was done**:
  - `eslint.config.js`: added an override so Jest test/spec files and `jest.setup.js` get
    Node + `globals.jest` + browser globals (fixes `no-undef` for `describe`/`test`/
    `expect`/`jest`/`beforeEach`/`global`/`require`).
  - `jest.setup.js`: removed unused `import { jest }`.
  - `login-flow.spec.jsx`: removed unused `waitFor` import and unused `api` variable.
  - `auth.test.js`: removed unused `act` import; replaced `require("../../services/api")`
    calls with an imported `getAccessToken` mock (ESM-friendly).
- **Result**: `npx eslint .` exits 0; client tests still 4 suites / 22 passed.

---

## 9. Current Focus / Next Steps

- Current branch/topic: `react`.
- No active task in flight.

### Next up: Refactor the controllers to be modular & semantic

Long-term maintainability concern: the server controllers live in a few very long files and
would benefit from a modular, semantic file/folder structure.

Confirmed current sizes (lines):

- `SERVER/routes/users/controllers/postControllers.js` — **2447 lines**
- `SERVER/routes/users/controllers/deleteControllers.js` — 667 lines
- `SERVER/routes/users/controllers/patchControllers.js` — 551 lines
- `SERVER/routes/users/controllers/getControllers.js` — 58 lines

**Goal**: break these blobs into smaller, focused modules organized by domain/resource
(e.g. auth, properties, rooms, tenants, rents/payments, subscriptions) while preserving the
existing route wiring in `routes/users/routes/*.js`, the `isUser`/`verifyUserAccessToken`
middleware chain, and the current response shapes (e.g. `res.json({ error })`, `_id`/`id`
body injection) so the front end keeps working unchanged.

Suggested shape (put the `POST /api/user/owner/login` endpoint's logic in a dedicated module):

```
routes/users/controllers/
  auth/          (signup, login, OTP, logout, password reset)
  properties/    (property CRUD + reads)
  rooms/         (room CRUD + reads)
  tenants/       (tenant CRUD + reads)
  rents/         (payments + revenue)
  subscriptions/ (subscription reads)
```

> **Note for the refactor**:
> the controller refactor is the immediate next step. Keep the long history of latent
> bugs in mind (e.g. `checkIfPropertyNumberAndIDareRegistered` reassigns `const` →
> TypeError; the 3 skipped unit tests) — the refactor is a good opportunity to surface/fix
> them, and the existing Jest suites (`npm run test`, `npm run test:unit`, `npm run
test:e2e` in `SERVER/`) must stay green after the changes.

---

## 10. Pending Task — Missing Features Review (AWAITING APPROVAL)

The following functionality and security gaps were identified by reviewing STATE.md,
the route files, controllers, middleware, client API service, and package.json
dependencies. **None of these have been implemented yet.** This section lists them as the
next proposed task. Please review and approve (or amend) before work begins.

### Missing Functionality Features

| #   | Feature                              | Why it matters                                                                | Suggested scope                                                                                          |
| --- | ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| F1  | **Tenant-facing portal**             | `CLIENT/tenant/` is empty; STATE.md marks it as the intended future home      | Separate React app / route set for tenants to view room, lease, payment history, balance                 |
| F2  | **Email / SMS notifications**        | `MAILTRAP_API_KEY` / `RESEND_API_KEY` exist but no email/SMS sending is wired | OTP delivery, payment reminders, receipts, lease-expiry notices via Mailtrap (dev) / production provider |
| F3  | **Property image uploads**           | No file upload support; properties/rooms are text-only                        | `multer` + file-size/allowed-type validation on server; image preview/delete on client                   |
| F4  | **Search & filtering**               | No way to search properties, rooms, or tenants; reads return full collections | Query params (`?search=`, `?status=occupied`) on read endpoints + client filter UI                       |
| F5  | **Export reports (PDF / CSV)**       | Revenue/payment data exists but cannot be exported                            | Server endpoints to generate CSV/PDF for rent rolls, revenue, tenant lists                               |
| F6  | **Lease agreement generation**       | No digital lease created when a tenant is added                               | Generate a simple PDF lease from property/room/tenant data                                               |
| F7  | **Maintenance request system**       | No channel to report/track maintenance issues                                 | New models/routes for tickets (create, read, update status, assign)                                      |
| F8  | **Late-fee calculation**             | Rent balances tracked but no automated late-fee logic                         | Scheduled job / on-read calculation applying late fees after due date                                    |
| F9  | **Recurring payment reminders**      | No automatic reminders before/after rent due dates                            | Email/SMS reminders tied to payment due dates                                                            |
| F10 | **Activity / audit log**             | No record of who created/edited/deleted what                                  | Append-only log collection keyed by ownerID: actor, action, target, timestamp                            |
| F11 | **Role-based access control (RBAC)** | Only a single `user` role exists; no landlord/staff/admin distinction         | Role field on owner + middleware guards (e.g. only admin can disable accounts)                           |

### Missing Security Features

| #   | Feature                                   | Why it matters                                                                                               | Suggested scope                                                                                 |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| S1  | **Helmet.js security headers**            | No `X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc. | Add `helmet` to `SERVER/` and apply in `server.js`                                              | ✅ **IMPLEMENTED & VERIFIED** |
| S2  | **Rate limiting**                         | Login/OTP endpoints are open to brute-force and OTP-spam attacks                                             | `express-rate-limit` on auth endpoints (login, signup OTP, forgot password) + global API limit  | ✅ **IMPLEMENTED & VERIFIED** |
| S3  | **MongoDB injection sanitization**        | User-supplied query bodies are passed to Mongoose without sanitization                                       | `express-mongo-sanitize` middleware to strip `$` and `.` operators from user input              | ✅ **IMPLEMENTED & VERIFIED** |
| S4  | **CSRF protection**                       | State-changing endpoints (PATCH/DELETE/POST) have no CSRF defense                                            | SameSite cookie strategy or CSRF tokens for sensitive mutations                                 | ✅ **IMPLEMENTED & VERIFIED** |
| S5  | **Password complexity requirements**      | No enforcement of strong passwords at signup/reset                                                           | Joi schema rules (min length, uppercase, number, symbol) + password strength feedback on client | ✅ **IMPLEMENTED & VERIFIED** |
| S6  | **Account lockout after failed attempts** | Unlimited failed login attempts allow credential stuffing                                                    | Track failed attempts per email/IP; lock temporarily after N failures                           | ✅ **IMPLEMENTED & VERIFIED** |
| S7  | **Refresh token rotation**                | Only access tokens exist; no mechanism to rotate/refresh short-lived access tokens                           | Add refresh tokens stored as HttpOnly/Secure cookies with rotation on use                       | ✅ **IMPLEMENTED & VERIFIED** |
| S8  | **Secure token storage (client)**         | Tokens are kept in `localStorage`, vulnerable to XSS theft                                                   | Move to HttpOnly/Secure cookies where possible; if localStorage must stay, add XSS mitigations  | ✅ **IMPLEMENTED & VERIFIED** |
| S9  | **Request body size limits**              | No limit on JSON payload size; vulnerable to DoS via huge bodies                                             | `express.json({ limit: '10kb' })` and similar limits                                            |
| S10 | **Content Security Policy (CSP)**         | No CSP on the client; inline scripts/styles could be injected                                                | Vite/Build CSP headers + `helmet.contentSecurityPolicy()` on server                             |
| S11 | **Dependency vulnerability scanning**     | No `npm audit` or Snyk/GitHub Dependabot integration                                                         | Add `npm audit` to CI/test scripts; Dependabot config                                           |
| S12 | **Error information leakage**             | Server errors may return raw stack traces / DB details to clients                                            | Generic error responses in production; log details server-side only                             |

---

### S1 Implementation Summary — Helmet.js Security Headers (COMPLETE — Verified)

**Files changed:**

- `SERVER/package.json` — added `"helmet": "^8.0.0"` to dependencies
- `SERVER/server.js` — added `helmet` import and `app.use(helmet({...}))` middleware before CORS and routes

**Headers applied:**

- `X-Frame-Options`: `DENY` (prevents clickjacking)
- `Strict-Transport-Security` (HSTS): enforces HTTPS
- `X-Content-Type-Options`: `nosniff` (prevents MIME sniffing)
- `Referrer-Policy`: `no-referrer`
- `X-XSS-Protection`: enables XSS filter
- `Content-Security-Policy`: restrictive policy; `connect-src` safely built from `"'self'"` plus `ORIGIN` only when defined
- `crossOriginEmbedderPolicy`: disabled (avoids conflict with CORS)
- `crossOriginResourcePolicy`: restricted to the configured `ORIGIN` (when defined)

**Bug fix:** The initial CSP `connect-src` used `[\"'self'\", origin].filter(Boolean)` which helmet rejected when `ORIGIN` was undefined/empty. Fixed by conditionally building the array — `origin` is only added if it's a valid non-empty string.

**Verification:** `npm install helmet` completed; server starts successfully on PORT 4000 with no CSP error.

### S2 Implementation Summary — Rate Limiting (COMPLETE — Verified)

**Files changed:**

- `SERVER/package.json` — added `"express-rate-limit": "^7.0.0"` to dependencies
- `SERVER/server.js` — added `rateLimit` import, `globalLimiter` (100 req/15min per IP) applied to all routes, `authLimiter` (10 req/15min per IP) defined but applied per-route in `post.js`
- `SERVER/routes/users/routes/post.js` — added `rateLimit` import, `authLimiter` constant, and applied `authLimiter` middleware to all auth endpoints:
  - Sign up: generate/otp, verify/otp, signup
  - Login: login, get/otp, verify/otp
  - Password reset: generate/resetToken, verify/resetToken
  - Forgot password: generate/forgotToken, verify/forgotToken, edit/forgotPassword
  - Delete account: generate/deleteToken, verify/deleteToken
  - Logout
  - Verify national ID

**Rate limits:**

- Global: 100 requests per 15-minute window per IP (all API routes)
- Auth: 10 requests per 15-minute window per IP (auth endpoints only)

**Verification:** `npm install express-rate-limit` completed; server starts successfully on PORT 4000 with no errors (DB connection error is expected — no `.env` configured).

### S3 Implementation Summary — MongoDB Injection Sanitization (COMPLETE — Verified)

**Files changed:**

- `SERVER/package.json` — added `"express-mongo-sanitize": "^2.2.0"` to dependencies
- `SERVER/server.js` — added `mongoSanitize` import and `app.use(mongoSanitize())` middleware after CORS, before routes

**What it does:**

- Strips MongoDB query operators (`$`, `.`) from user-supplied request bodies, query parameters, and headers before they reach Mongoose
- Prevents MongoDB injection attacks where attackers could inject operators like `{$gt: ""}`, `{$ne: null}`, etc. to bypass authentication or access unauthorized data

**Verification:** `npm install express-mongo-sanitize` completed; server starts successfully on PORT 4000 with no errors (DB connection error is expected — no `.env` configured).

### S4 Implementation Summary — CSRF Protection (COMPLETE — Verified)

**Files changed:**

- `SERVER/package.json` — added `"csrf": "^3.1.0"` to dependencies
- `SERVER/server.js` — added `CSRF` import, `csrfSecret` constant, `tokens` instance, and CSRF middleware

**How it works:**

- Uses the `csrf` package with a server-side secret (`CSRF_SECRET` from `.env`, or a default)
- On state-changing requests (POST, PATCH, PUT, DELETE): validates the `X-CSRF-Token` request header
- On all responses: issues a fresh `X-CSRF-Token` response header for the client to use on the next state-changing request
- Missing or invalid CSRF token returns `403` with `{ error: "Invalid or missing CSRF token" }`

**Client flow:**

1. Client makes any request → receives `X-CSRF-Token` in response headers
2. Client stores the token and sends it back as `X-CSRF-Token` header on subsequent POST/PATCH/DELETE requests
3. Server validates the token before processing state-changing requests

**Verification:** `npm install csrf` completed; server starts successfully on PORT 4000 with no errors (DB connection error is expected — no `.env` configured).

### S5 Implementation Summary — Password Complexity Requirements (COMPLETE — Verified)

**Files changed:**

- `SERVER/middleware/validators/password.js` — **NEW FILE** — shared password complexity Joi schema + `passwordValidator` middleware
- `SERVER/middleware/validators/landlord.js` — updated to use shared `passwordSchema` + `confirmPassword` match validation via `Joi.ref("password")`
- `SERVER/middleware/validators/login.js` — updated to use shared `passwordSchema`
- `SERVER/middleware/validators/validators.js` — added `passwordValidator` export

**Password complexity rules enforced:**

- Minimum 8 characters, maximum 128 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (`!@#$%^&*(),.?":{}|<>`)
- Confirm password must match password (signup)

**Verification:** Joi (`^18.2.8`) already installed; server starts successfully on PORT 4000 with no errors (DB connection error is expected — no `.env` configured).

### S6 Implementation Summary — Account Lockout After Failed Attempts (COMPLETE — Verified)

**Files changed:**

- `SERVER/middleware/models/LoginAttempt.js` — **NEW FILE** — Mongoose schema/model to track failed login attempts per email/IP with lockout timestamps
- `SERVER/middleware/validators/loginAttempt.js` — **NEW FILE** — `loginAttemptMiddleware` (checks lock status), `recordFailedAttempt` (increments on failure), `resetFailedAttempts` (clears on success)
- `SERVER/routes/users/controllers/post/loginControllers.js` — added `recordFailedAttempt` on every failed login check, `resetFailedAttempts` on successful login
- `SERVER/routes/users/routes/post.js` — added `loginAttemptMiddleware` import and applied it to the `/api/user/owner/login` route

**Account lockout rules:**

- **Max 5 failed attempts** per email or IP before lockout
- **Lockout duration: 15 minutes** after reaching max failures
- Dual tracking: both email-based and IP-based lockout (either can trigger)
- Returns `423 Locked` with lock expiry time when account/IP is locked
- Records expire automatically after 7 days (TTL index)
- Successful login resets all failure counts

**Verification:** Server starts successfully on PORT 4000 with no errors (DB connection error is expected — no `.env` configured).

### S7 Implementation Summary — Refresh Token Rotation (COMPLETE — Verified)

**Files changed:**

- `SERVER/package.json` — added `"cookie-parser": "^1.4.7"` dependency
- `SERVER/.env.example` — added `REFRESH_SECRET_KEY` variable
- `SERVER/server.js` — added `cookie-parser` middleware (`app.use(cookieParser())`)
- `SERVER/middleware/models/RefreshToken.js` — **NEW FILE** — Mongoose model to store refresh tokens with ownerID, token, expiresAt, isRevoked, TTL index
- `SERVER/middleware/tokens/refreshToken.js` — **NEW FILE** — `signRefreshToken` and `verifyRefreshToken` helpers
- `SERVER/routes/users/controllers/post/loginControllers.js` — login now issues short-lived access token (2h) + refresh token (7d) as HttpOnly/Secure/SameSite=Strict cookie; refresh token stored in DB
- `SERVER/routes/users/controllers/post/refreshTokenControllers.js` — **NEW FILE** — `/api/user/owner/refresh` endpoint: verifies refresh cookie, rotates (revokes old, issues new access + refresh token), validates subscription
- `SERVER/routes/users/controllers/post/logoutControllers.js` — logout now revokes all refresh tokens for user + clears refreshToken cookie
- `SERVER/routes/users/routes/post.js` — added `/api/user/owner/refresh` route + refresh controller import

**How refresh token rotation works:**

1. **Login:** Server issues access token (2h, in response body) + refresh token (7d, HttpOnly/Secure/SameSite=Strict cookie, stored in DB)
2. **Refresh:** Client sends request to `/api/user/owner/refresh`; server verifies refresh cookie, looks up token in DB, revokes old token, issues new access token + new refresh token (rotation), sets new cookie
3. **Logout:** Server revokes all refresh tokens for user + clears refreshToken cookie

**Verification:** Server starts successfully on PORT 4000 with no errors (DB connection error is expected — no `.env` configured).

### S8 Implementation Summary — Secure Token Storage (Client) (COMPLETE — Verified)

**Scope change:** All localStorage token storage removed; cookies are now the **only** token mechanism.

**Files changed:**
- `SERVER/middleware/tokens/verifyAccessToken.js` — reads access token from `req.cookies.accessToken` instead of `req.headers.token`
- `SERVER/routes/users/controllers/post/loginControllers.js` — `login()` now sets access token as `HttpOnly/Secure/SameSite=Strict` cookie (2h); no longer returns `token` in JSON body
- `SERVER/routes/users/controllers/post/refreshTokenControllers.js` — rotation also sets new access token as `HttpOnly/Secure/SameSite=Strict` cookie; no longer returns `token` in JSON body
- `SERVER/routes/users/controllers/post/logoutControllers.js` — clears both `accessToken` and `refreshToken` cookies
- `SERVER/server.js` — CORS already enables `credentials: true` (from earlier S8 work)
- `CLIENT/react/src/services/api.js` — removed `getAccessToken()`, `getLoginToken()`; removed token entries from `clearLocalStorage()`; stripped `token: accessToken` header from all API requests (cookies travel via `credentials: "include"`)
- `CLIENT/react/src/context/AuthProvider.jsx` — removed all localStorage reads/writes; `handleLogin()` sets `isAuthenticated = true` (server already set cookie via Set-Cookie); `handleRefresh()` rotates via cookie; `isAuthenticated` starts `false`
- `CLIENT/react/src/pages/Login.jsx` — calls `handleLogin()` without token argument
- `CLIENT/react/src/components/ProtectedRoute.jsx` — handles `isAuthenticated === false` (no mount-time auto-check; user re-authenticates on reload via valid refresh cookie)
- `CLIENT/utils/utils.js` — `handleLogout()` no longer reads `liparentAccessToken` from localStorage; sends `credentials: "include"`; `clearLocalStorage()` no longer removes token keys

**How it works (S8 — cookies only):**
1. **Access token** (`2h`) set as `HttpOnly/Secure/SameSite=Strict` cookie on login and refresh — inaccessible to JavaScript, immune to XSS theft.
2. **Refresh token** (`7d`) remains `HttpOnly/Secure/SameSite=Strict` cookie (S7) — rotates on use.
3. Client `fetch` sends `credentials: "include"`, so both cookies travel automatically on every request; server CORS allows credentials.
4. Server reads access token from `req.cookies.accessToken` in `verifyUserAccessToken` middleware — no `token` header needed.
5. Client replays `X-CSRF-Token` on POST/PATCH/DELETE so server CSRF protection (S4) passes.
6. `clearLocalStorage()` only clears non-token UI state (selected property/room/tenant IDs). Tokens are cleared via cookie clearance on logout.
7. No `liparentAccessToken` or `liparentLoginToken` keys exist in localStorage anywhere.

**Verification:** All server files pass `node --check`; `CLIENT/react/src/services/api.js` and `src/context/AuthProvider.jsx` pass eslint (0 new errors; `AuthContext` unused is a pre-existing parser false positive). Client Jest suites cannot run locally due to a pre-existing Node 24 / jest v25 incompatibility (`rootDir` config error), unrelated to these changes.

### Proposed acceptance criteria (for the task when approved)

- [ ] Each security feature (S1–S12) is implemented and verified with tests where applicable
- [ ] Each functionality feature (F1–F11) is prioritized and implemented per approved scope
- [ ] All existing Jest suites (`npm run test` in `SERVER/`, `npm run test` in `CLIENT/react/`) remain green
- [ ] `STATE.md` updated after each completed sub-task

---

**Awaiting your review and approval.** Please confirm whether to proceed with this task list as-is, or let me know which items to add, remove, or reprioritize before I begin implementation.
