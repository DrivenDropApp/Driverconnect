# DriverConnect — Deployment & Testing Guide

## Architecture Overview

```
Monorepo (npm workspaces)
├── apps/
│   ├── server/          → Express + Socket.io  (port 5000)
│   ├── customer-web/    → React + Vite          (port 5173)
│   ├── driver-web/      → React + Vite          (port 5174)
│   └── admin-web/       → React + Vite          (port 5175)
└── packages/
    └── shared-types/    → Zod schemas + state machine (shared library)
```

---

## Part 1 — Local Development Setup

### Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | ≥ 18 LTS | https://nodejs.org |
| MongoDB | ≥ 6.0 | https://www.mongodb.com/try/download/community |
| npm | ≥ 9 | Bundled with Node |
| Git | any | https://git-scm.com |

### Step 1 — Install MongoDB Locally

**Windows (easiest — MongoDB Community Server):**
1. Download from https://www.mongodb.com/try/download/community
2. Install with "Complete" setup + MongoDB Compass
3. MongoDB runs as a Windows Service automatically on port **27017**
4. Verify: Open a terminal and run `mongosh` — you should see a prompt

**Or use MongoDB Atlas (cloud, free tier):**
- Create account at https://cloud.mongodb.com
- Create a free M0 cluster
- Copy the connection string: `mongodb+srv://<user>:<pass>@cluster.mongodb.net/driverconnect_dev`
- Paste it in `apps/server/.env` → `MONGODB_URI=...`

---

### Step 2 — Configure Environment

The `.env` file is already created at `apps/server/.env` with safe dev defaults.

**Edit it only if:**
- Using MongoDB Atlas (update `MONGODB_URI`)
- Using a different port

```env
# apps/server/.env (already exists, no changes needed for local dev)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/driverconnect_dev
JWT_ACCESS_SECRET=dev_access_secret_change_in_production_min_32_chars
JWT_REFRESH_SECRET=dev_refresh_secret_change_in_production_min_32_chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
DEV_OTP_ENABLED=true
DEV_OTP=1234
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
ADMIN_EMAIL=admin@driverconnect.com
ADMIN_PASSWORD=AdminPass@123
```

---

### Step 3 — Install All Dependencies

```powershell
# From the project root
cd C:\Users\patil\Desktop\Driverconnect

npm install
```

This installs dependencies for ALL workspaces (server + 3 frontends + shared-types) in one command.

---

### Step 4 — Seed the Database

Populates MongoDB with:
- **1 Admin** account
- **15 Drivers** (12 KYC-verified, 8 online) around Pune
- **5 Customers** with saved addresses
- **4 Sample Bookings** in various states

```powershell
npm run seed
```

**Expected output:**
```
🌱 Starting seed...
✅ Connected to MongoDB
🗑️  Cleared existing data
👤 Admin created: admin@driverconnect.com
🚗 Created 15 drivers (12 verified, 8 online)
👥 Created 5 customers
📋 Created 4 sample bookings

✅ Seed complete!

─── Login Credentials ───
Admin:    admin@driverconnect.com / AdminPass@123
Customer: 9876543210 / OTP: 1234
Driver:   9876500000 / OTP: 1234
─────────────────────────
```

---

### Step 5 — Start Development Servers

**Option A — All 4 apps at once (recommended):**
```powershell
npm run dev
```
This starts all 4 servers concurrently via `concurrently`.

**Option B — Individual apps:**
```powershell
# Terminal 1 — API Server
npm run dev:server

# Terminal 2 — Customer App
npm run dev:customer

# Terminal 3 — Driver App
npm run dev:driver

# Terminal 4 — Admin App
npm run dev:admin
```

**App URLs:**

| App | URL | Credentials |
|-----|-----|-------------|
| Customer | http://localhost:5173 | Phone: `9876543210` → OTP: `1234` |
| Driver | http://localhost:5174 | Phone: `9876500000` → OTP: `1234` |
| Admin | http://localhost:5175 | Email: `admin@driverconnect.com` / `AdminPass@123` |
| API Health | http://localhost:5000/healthz | — |

---

## Part 2 — End-to-End Test Flow

### Test Scenario: Full Booking Lifecycle

Open **3 browser tabs**:

**Tab 1 — Customer (http://localhost:5173)**
1. Login with `9876543210`, OTP `1234`
2. Tap **"Local"** on home screen
3. On the map, tap to set **pickup** then **drop** point
4. Review fare estimate → Tap **"Confirm ₹XXX"**
5. You'll be taken to the Live Trip page with "Finding your driver..."

**Tab 2 — Driver (http://localhost:5174)**
1. Login with `9876500000`, OTP `1234`
2. Toggle the **Go Online** switch
3. Within seconds, the booking request modal pops up with 30s countdown
4. Tap **"✓ Accept"**

**Tab 3 — Admin (http://localhost:5175)**
1. Login with admin credentials
2. Watch the **Dashboard** KPIs update live
3. Go to **Bookings** tab to see the trip in "assigned" status

**Back in Tab 1 (Customer):**
- See driver card appear with name, rating, ✓ Verified badge
- Watch the driver marker animate smoothly on the map

**Back in Tab 2 (Driver):**
4. Tap **"📍 I Have Arrived"**
5. Customer sees "Driver has arrived!" status
6. Customer shares their OTP: Driver enters OTP in field → Tap **"✓"**
7. Tap **"🚗 Start Trip"**
8. Tap **"🏁 Complete Trip"**

**Back in Tab 1 (Customer):**
- Redirected to Trip Summary with fare breakdown
- Rate the driver with stars

---

## Part 3 — Production Deployment

### Option A: Deploy to Render.com (Free Tier)

#### Backend (API Server)

1. Push code to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `apps/server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node 18
5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=<your Atlas connection string>
   JWT_ACCESS_SECRET=<generate: openssl rand -hex 32>
   JWT_REFRESH_SECRET=<generate: openssl rand -hex 32>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=30d
   DEV_OTP_ENABLED=false
   CORS_ORIGINS=https://your-customer-app.netlify.app,https://your-driver-app.netlify.app,https://your-admin-app.netlify.app
   ```

#### Frontends (3 apps)

Deploy each to **Netlify** or **Vercel** (both free):

For each app (`customer-web`, `driver-web`, `admin-web`):
1. Go to https://netlify.com → New site from Git
2. Set:
   - **Base directory:** `apps/customer-web` (or driver-web / admin-web)
   - **Build command:** `npm run build`
   - **Publish directory:** `apps/customer-web/dist`
3. Add environment variable:
   - `VITE_API_URL=https://your-render-backend.onrender.com/api/v1`
   - `VITE_SOCKET_URL=https://your-render-backend.onrender.com`
4. Add a `_redirects` file to each app's `public/` folder:
   ```
   /*  /index.html  200
   ```

---

### Option B: Docker Compose (Self-Hosted / VPS)

Create `docker-compose.yml` at the root:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongodb:27017/driverconnect
      NODE_ENV: production
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      - mongodb

  customer-web:
    build:
      context: .
      dockerfile: apps/customer-web/Dockerfile
    ports:
      - "5173:80"

  driver-web:
    build:
      context: .
      dockerfile: apps/driver-web/Dockerfile
    ports:
      - "5174:80"

  admin-web:
    build:
      context: .
      dockerfile: apps/admin-web/Dockerfile
    ports:
      - "5175:80"

volumes:
  mongo_data:
```

**Server Dockerfile** (`apps/server/Dockerfile`):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
COPY packages/ packages/
COPY apps/server/ apps/server/
RUN npm install --workspaces
RUN npm run build --workspace=apps/server
EXPOSE 5000
CMD ["node", "apps/server/dist/index.js"]
```

**Frontend Dockerfile** (same pattern for each):
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json .
COPY packages/ packages/
COPY apps/customer-web/ apps/customer-web/
RUN npm install --workspaces
RUN npm run build --workspace=apps/customer-web

FROM nginx:alpine
COPY --from=build /app/apps/customer-web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

---

### Option C: AWS / GCP / Azure

1. **MongoDB:** Use MongoDB Atlas (managed) or AWS DocumentDB
2. **Backend:** AWS Elastic Beanstalk, GCP Cloud Run, or Azure App Service
3. **Frontend:** AWS CloudFront + S3, GCP Firebase Hosting, or Azure Static Web Apps
4. **Domain:** Point DNS to your frontend CDN; use subdomain for API (`api.yourdomain.com`)

---

## Part 4 — Production Checklist

### Security
- [ ] Change both JWT secrets to randomly generated 64-char strings
- [ ] Set `DEV_OTP_ENABLED=false`
- [ ] Set `NODE_ENV=production`
- [ ] Restrict CORS to your actual frontend domains
- [ ] Enable HTTPS everywhere (Render/Netlify handle this automatically)
- [ ] Use MongoDB Atlas with IP allowlist or VPC peering

### Performance
- [ ] Enable MongoDB Atlas index recommendations
- [ ] Add Redis for rate limiting (`REDIS_URL=redis://...`)
- [ ] Configure field encryption key (`FIELD_ENCRYPTION_KEY=`) for bank details
- [ ] Set up CDN (Cloudflare) in front of your frontends

### Observability
- [ ] Set up Sentry for error tracking (front and backend)
- [ ] Add `pino-datadog` or ship logs to Datadog/CloudWatch
- [ ] Create MongoDB Atlas alerts for high connection counts

### SMS (OTP)
- [ ] Sign up for Twilio, Fast2SMS, or MSG91
- [ ] Add `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` to env
- [ ] Update `apps/server/src/routes/api/v1/auth.ts` → replace the dev OTP log with the actual SMS send call

---

## Part 5 — Useful Commands Reference

```powershell
# Install all dependencies
npm install

# Seed the database
npm run seed

# Start everything in dev mode
npm run dev

# Start individual apps
npm run dev:server
npm run dev:customer
npm run dev:driver
npm run dev:admin

# TypeScript check all workspaces
npm run typecheck

# Build for production
npm run build

# Check API health
curl http://localhost:5000/healthz
```

---

## Part 6 — Troubleshooting

| Problem | Solution |
|---------|----------|
| `MONGODB_URI is required` | Ensure `apps/server/.env` exists with `MONGODB_URI=...` |
| `MongoDB connection refused` | Start MongoDB service: `net start MongoDB` (Windows) |
| `JWT_ACCESS_SECRET must be at least 32 chars` | Use the provided dev secrets in `.env` |
| Map doesn't show tiles | Check internet connection; Leaflet tiles load from OpenStreetMap CDN |
| Socket.io not connecting | Ensure the server is running on port 5000; check CORS |
| OTP says "expired" | The dev OTP (`1234`) is hashed with 24h expiry; re-run seed or send OTP again |
| KYC toggle says "not verified" | Go to Admin → KYC Queue → Approve the driver |
| Driver can't go online | KYC must be verified; check Admin → Drivers |
| `concurrently` not found | Run `npm install` from root first |

---

*Generated by Antigravity — DriverConnect MERN Monorepo*
