import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.init_db import init_database_on_startup
from app.routers import (
    auth, dashboard, institutions, complaints, overlaps, reports, notifications
)

logger = logging.getLogger("anvesh.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables, schema migrations, and idempotent admin credentials on startup
    try:
        init_database_on_startup()
        logger.info("ANVESH application initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database on startup: %s", str(e))
    yield

app = FastAPI(
    title="ANVESH — AICTE Inter-Bureau Grievance Intelligence API",
    description=(
        "ANVESH: Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances. "
        "Integrated Platform for Monitoring, Tracking, and Resolving Institution-Related Complaint Cases Across AICTE Bureaus and Cells."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration supporting localhost, Vercel deployments, and custom Render origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(institutions.router)
app.include_router(complaints.router)
app.include_router(overlaps.router)
app.include_router(reports.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {
        "project": "ANVESH",
        "expansion": "Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances",
        "tagline": "Discover Connections. Drive Resolution. Strengthen Accountability.",
        "title": "Integrated Dashboard for Monitoring and Tracking Institution-Related Complaint Cases Across AICTE Bureaus/Cells",
        "version": "2.0.0",
        "status": "Operational",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "anvesh-backend",
        "database": "connected"
    }
