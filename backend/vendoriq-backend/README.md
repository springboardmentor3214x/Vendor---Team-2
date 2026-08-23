# VendorIQ — Vendor Reliability Intelligence & Procurement Risk Management Platform

FastAPI backend for the VendorIQ platform: vendor management, procurement &
purchase orders, vendor performance tracking, an automated reliability
scoring engine, contract & compliance monitoring, vendor communication,
notifications, dashboards, and PDF/Excel reporting.

Built to pair with an Angular frontend, matching the architecture in the
project specification (JWT auth, role-based access control, FastAPI
microservice-style routers, PostgreSQL, Redis, Celery, Docker).

## 1. Tech Stack

- **Framework:** FastAPI + Uvicorn
- **ORM / Migrations:** SQLAlchemy 2.0 + Alembic
- **Database:** PostgreSQL (SQLite works for quick local testing)
- **Cache / Queue:** Redis + Celery (scheduled contract-expiry checks, score recalculation)
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing, RBAC
- **Reports:** ReportLab (PDF), openpyxl (Excel)
- **Containerization:** Docker + docker-compose

## 2. Project Structure

```
vendoriq-backend/
├── app/
│   ├── main.py                 # FastAPI app, router registration, CORS
│   ├── config.py                # Settings (env-driven)
│   ├── database.py              # SQLAlchemy engine/session
│   ├── dependencies.py          # Auth + RBAC dependencies
│   ├── celery_app.py            # Scheduled/background tasks
│   ├── seed.py                  # Seeds an admin user + demo vendors
│   ├── core/
│   │   └── security.py          # Password hashing, JWT helpers
│   ├── models/                  # SQLAlchemy models (one file per domain)
│   ├── schemas/                 # Pydantic request/response schemas
│   ├── routers/                 # One router per module (see below)
│   ├── services/                # Reliability scoring engine, notifications, code generators
│   └── utils/                   # PDF/Excel export helpers
├── alembic/                      # Migration environment
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## 3. Modules & Endpoints

All routes are mounted under `/api/v1`.

| Module | Router file | Key endpoints |
|---|---|---|
| Authentication | `auth.py` | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`, `GET /auth/me` |
| User & Role Management | `users.py` | `GET /users`, `PUT /users/me`, `POST /users/me/change-password`, `PUT /users/{id}/role`, `PUT /users/{id}/activate` |
| Vendor Management | `vendors.py` | `POST /vendors`, `GET /vendors`, `PUT /vendors/{id}`, `PUT /vendors/{id}/approval`, `PUT /vendors/{id}/suspend` |
| Procurement Management | `procurement.py` | `POST /procurement-requests`, `PUT /procurement-requests/{id}/approval`, `PUT /procurement-requests/{id}/status` |
| Purchase Orders | `purchase_orders.py` | `POST /purchase-orders`, `PUT /purchase-orders/{id}/status`, `PUT /purchase-orders/{id}/invoice` |
| Vendor Performance | `performance.py` | `POST /vendor-performance`, `GET /vendor-performance/vendor/{id}/summary` |
| Vendor Reliability | `reliability.py` | `POST /reliability/vendor/{id}/calculate`, `GET /reliability/vendor/{id}/latest`, `GET /reliability/ranking` |
| Contract & Compliance | `contracts.py` | `POST /contracts`, `PUT /contracts/{id}/renew`, `POST /contracts/certifications` |
| Communication | `communication.py` | `POST /communications`, `PUT /communications/{id}/read` |
| Notifications | `notifications.py` | `GET /notifications/me`, `PUT /notifications/{id}/read` |
| Dashboard & Analytics | `dashboard.py` | `GET /dashboard/procurement`, `GET /dashboard/vendor`, `GET /dashboard/admin` |
| Reports & Export | `reports.py` | `GET /reports/{type}/pdf`, `GET /reports/{type}/excel` (`type` ∈ vendor-performance, procurement, purchase-orders, contracts, compliance) |

Interactive docs: `GET /docs` (Swagger UI) and `GET /redoc`.

## 4. Roles

`ADMINISTRATOR`, `PROCUREMENT_MANAGER`, `SUPPLY_CHAIN_MANAGER`, `VENDOR`,
`FINANCE_OFFICER`, `AUDITOR` — enforced via `app/dependencies.py`
(`RoleChecker`), matching the spec's role list.

## 5. Reliability Scoring Engine

`app/services/reliability_scoring.py` computes a weighted 0–100 score per
vendor from six factors, matching the "Reliability Factors" in the spec:

| Factor | Weight |
|---|---|
| Delivery History | 25% |
| Product Quality | 20% |
| Communication Efficiency | 15% |
| Contract Compliance | 15% |
| Purchase History | 15% |
| Issue Resolution | 10% |

The overall score maps to a risk level (`LOW` / `MEDIUM` / `HIGH` /
`CRITICAL`), a trend (`IMPROVING` / `STABLE` / `DECLINING`, derived from the
previous snapshot), a procurement recommendation, and a vendor rank. Scores
are recalculated automatically:
- On demand via `POST /reliability/vendor/{id}/calculate`
- Automatically when a purchase order moves to `DELIVERED`/`COMPLETED` (a
  `VendorPerformance` record is created, which feeds the next scoring run)
- On a weekly Celery beat schedule (`recalculate_all_reliability_scores`)

## 6. Local Development (without Docker)

```bash
cd vendoriq-backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Point DATABASE_URL at a local Postgres instance, or use SQLite for a quick
# spin-up: DATABASE_URL=sqlite:///./vendoriq.db

# Create tables (dev-only shortcut; use Alembic for anything persistent)
python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(bind=engine)"

# Seed an admin user + demo vendors
python -m app.seed

uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs`. Log in with `admin@vendoriq.com` /
`ChangeMe123!` (change this immediately in any non-local environment).

## 7. Running with Docker

```bash
cd vendoriq-backend
cp .env.example .env   # adjust SECRET_KEY, SMTP, Twilio, etc.
docker compose up --build
```

This starts:
- `db` — PostgreSQL 16
- `redis` — Redis 7
- `backend` — FastAPI app on `http://localhost:8000`, running Alembic
  migrations on startup
- `celery_worker` — background task worker for contract-expiry checks and
  score recalculation (add a `celery beat` service in production, or trigger
  `celery -A app.celery_app beat` alongside the worker)

Seed data after the stack is up:

```bash
docker compose exec backend python -m app.seed
```

## 8. Database Migrations

```bash
# Generate a migration after changing models
alembic revision --autogenerate -m "describe the change"

# Apply migrations
alembic upgrade head
```

`alembic/env.py` reads `DATABASE_URL` from `app.config.settings`, so make
sure your `.env` is populated before running Alembic commands locally.

## 9. Environment Variables

See `.env.example` for the full list: app/security settings, `DATABASE_URL`,
Redis/Celery URLs, CORS origins, SMTP (email notifications), and Twilio
(SMS notifications). The notification service in
`app/services/notification_service.py` currently logs email/SMS dispatch as
stubs — wire in `smtplib`/an ESP and the Twilio SDK for production sending.

## 10. Testing the API Quickly

```bash
# Register
curl -X POST localhost:8000/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"full_name":"Jane Doe","email":"jane@company.com","password":"SecurePass123","role":"PROCUREMENT_MANAGER"}'

# Login (form-encoded, OAuth2 password flow)
curl -X POST localhost:8000/api/v1/auth/login \
  -d "username=jane@company.com&password=SecurePass123"

# Use the returned access_token as a Bearer token on subsequent requests
curl localhost:8000/api/v1/vendors -H "Authorization: Bearer <token>"
```

## 11. Notes & Next Steps

- `Base.metadata.create_all()` runs automatically on startup only when
  `ENVIRONMENT=development`; use Alembic migrations for staging/production.
- Add a `celery beat` service to `docker-compose.yml` for production
  (worker and beat are typically split into separate containers).
- File uploads (contract documents, certifications, attachments) currently
  accept a `document_url`/`attachment_url` string — wire up S3-compatible
  object storage and issue pre-signed URLs before going to production.
- The password-reset endpoint returns the reset token directly in
  development for testability; switch to emailing the token exclusively
  once SMTP is configured.
