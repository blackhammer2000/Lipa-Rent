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

- **`ADMIN/`** – admin/legacy assets
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
│   ├─ tenant/               # EMPTY - future tenant portal
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
> ```
> ### YYYY-MM-DD — summary title
> **Scope**: folders/files touched
> **What was done**: ...
> **Notes / next steps**: ...
> ```

Current entries:

- *(none yet — this is the first time this state file exists.)*

### first — State file added

- **Scope**: repo root; `.gitignore`
- **What was done**: Created this `STATE.md` tracking file and added it to `.gitignore` so
  it is never committed to GitHub.
- **Notes / next steps**: Use this file as the context baseline for all future tasks.

---

## 9. Current Focus / Next Steps

- Current branch/topic: `react`.
- No active task in flight.
- **Planned/next**: a tenant-facing React portal at `CLIENT/tenant/` where tenants log in
  with tenant ID + property ID + password (no OTP**), then view a read-only payment
  history dashboard filterable by room dwelt and by date. Likely needs new read-only server
  endpoints, a tenant access token, optional `tenantPassword` on the tenant model, and
  adding the portal origin to CORS.