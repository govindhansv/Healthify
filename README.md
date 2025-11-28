# Healthify

Monorepo for the Healthify platform:

- **healthify-backend** – Node.js/Express REST API (MongoDB)
- **healthify-admin-ui** – Next.js 14 Admin Dashboard
- **healthify-user-ui** – Next.js 16 mock User Web App (mobile-style UI)

---

## 1. Project Structure

```text
Healthify/
├─ healthify-backend/      # Express API, MongoDB models, public HTML
├─ healthify-admin-ui/     # Admin dashboard (Next.js 14 + Tailwind)
└─ healthify-user-ui/      # User-facing mock app (Next.js 16 + Tailwind v4)
```

---

## 2. Running the Apps

From the repo root (`Healthify/`):

### Backend (API server)

```bash
cd healthify-backend
npm install        # first time
npm start          # runs server.js on http://localhost:4000
```

- Health check: `GET http://localhost:4000/health` → `{ "status": "ok" }`

### Admin UI (Next.js 14)

```bash
cd healthify-admin-ui
npm install        # first time
npm run dev        # http://localhost:3000 (or 3001 if 3000 is in use)
```

Admin app uses the backend for authentication and CRUD over categories, exercises, workouts, meditations, nutrition, medicines and FAQs.

### User UI (Next.js 16 mock app)

```bash
cd healthify-user-ui
npm install        # first time
npm run dev        # http://localhost:3002 (configured via package.json)
```

Environment for the user UI (in `healthify-user-ui/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

The user UI currently acts as a **mock mobile-style web app** consuming the public API routes, with fallback mock data for design/demo.

---

## 3. Core API Routes (healthify-backend)

Base URL (dev): `http://localhost:4000/api`

### Auth

- `POST /auth/register`
  - Create a regular user.
  - Body: `{ email, password }`
  - Returns: `{ message, token, user: { id, email, role } }`

- `POST /auth/login`
  - User login.
  - Body: `{ email, password }`
  - Returns: `{ message, token, user: { id, email, role } }`

- `POST /auth/register-admin` (dev-only)
  - Create an admin user.
  - Same payload as `/auth/register`; sets `role: "admin"`.

### Admin

- `GET /admin` (protected, admin)
- `GET /admin/summary` (protected, admin)
  - Aggregated counts for users, categories, workouts, etc.

### Categories

- `GET /categories`
  - Query params: `page`, `limit`, `q` (search).
  - Response: `{ page, limit, total, pages, data: Category[] }`.

- `GET /categories/:id`
- `POST /categories` (admin)
- `PUT /categories/:id` (admin)
- `DELETE /categories/:id` (admin)

### Exercises

- `GET /exercises`
- `GET /exercises/:id`
- `POST /exercises` (admin)
- `PUT /exercises/:id` (admin)
- `DELETE /exercises/:id` (admin)

Exercises reference categories and are used inside workouts.

### Workouts

- `GET /workouts`
  - Query params: `page`, `limit`, `q`, `difficulty`, `category`.
  - Response: `{ page, limit, total, pages, data: Workout[] }`.
  - Workouts can populate with exercise details (`title`, `duration`, `difficulty`).

- `GET /workouts/:id`
- `POST /workouts` (admin)
- `PUT /workouts/:id` (admin)
- `DELETE /workouts/:id` (admin)

### Meditations

- `GET /meditations`
- `GET /meditations/:id`
- `POST /meditations` (admin)
- `PUT /meditations/:id` (admin)
- `DELETE /meditations/:id` (admin)

### Nutrition

- `GET /nutrition`
- `GET /nutrition/:id`
- `POST /nutrition` (admin)
- `PUT /nutrition/:id` (admin)
- `DELETE /nutrition/:id` (admin)

### Medicines

- `GET /medicines`
- `GET /medicines/:id`
- `POST /medicines` (admin)
- `PUT /medicines/:id` (admin)
- `DELETE /medicines/:id` (admin)

### FAQs

- `GET /faqs`
- `POST /faqs` (admin)
- `PUT /faqs/:id` (admin)
- `DELETE /faqs/:id` (admin)

### File Uploads

- `POST /uploads` (admin)
  - Uses Cloudinary (env vars must be configured).

---

## 4. Frontends and How They Use the API

### Admin UI (healthify-admin-ui)

- Next.js 14 app with layouts under `app/(auth)` and `app/(main)`.
- Uses `lib/api.ts` to call backend with JWT.
- Manages:
  - Users
  - Categories & Exercises
  - Workout bundles
  - Meditations & nutrition content
  - Medicines catalog
  - FAQs

### User UI (healthify-user-ui)

- Next.js 16 app, mobile-style layout, using Tailwind v4.
- Uses `src/lib/api.ts` with `NEXT_PUBLIC_API_BASE_URL` for public endpoints.
- Key screens (mocked but API-aware):
  - `/login` – simple login/signup mock, currently not wired to real auth.
  - `/exercises` – All Exercises (reads `/categories` with pagination shape).
  - `/workouts` – Workout Bundles (reads `/workouts` with pagination shape).
  - `/exercises/[slug]` – Exercise detail mock, can be wired to `/exercises/:id`.
  - `/nutrition` – static Nutrition tips (placeholder for `/nutrition` API).

The user UI is intentionally lightweight so a frontend developer can replace the mock UX with the final mobile/web design while keeping the API wiring and project setup.

---

## 5. Environment Variables

Each app has its own `.env.local` (ignored by Git). Typical values:

### healthify-backend/.env.local

```env
MONGODB_URI=mongodb://localhost:27017/healthify
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=4000
```

### healthify-admin-ui/.env.local

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

### healthify-user-ui/.env.local

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Update these as needed for your environment (dev/staging/production).
