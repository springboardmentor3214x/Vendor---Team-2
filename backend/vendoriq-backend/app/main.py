import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401  (ensures models are registered on Base.metadata)

from app.routers import (
    auth, users, vendors, procurement, purchase_orders,
    performance, reliability, contracts, communication,
    notifications, dashboard, reports, status_history,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vendoriq")

app = FastAPI(
    title=settings.APP_NAME,
    description="Vendor Reliability Intelligence & Procurement Risk Management Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # For local/dev convenience. In production, use Alembic migrations instead.
    if settings.ENVIRONMENT == "development":
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables ensured (development mode).")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation error"},
    )


@app.get("/", tags=["Health"])
def root():
    return {"service": settings.APP_NAME, "status": "running", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


api_prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(vendors.router, prefix=api_prefix)
app.include_router(procurement.router, prefix=api_prefix)
app.include_router(purchase_orders.router, prefix=api_prefix)
app.include_router(performance.router, prefix=api_prefix)
app.include_router(reliability.router, prefix=api_prefix)
app.include_router(contracts.router, prefix=api_prefix)
app.include_router(communication.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(status_history.router, prefix=api_prefix)
