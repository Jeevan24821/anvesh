from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database import engine, Base
from app.routers import (
    auth, dashboard, institutions, complaints, overlaps, reports, notifications
)

# Create tables if not already present
Base.metadata.create_all(bind=engine)
from app.database import apply_safe_migrations
apply_safe_migrations()

app = FastAPI(
    title="ANVESH — AICTE Inter-Bureau Grievance Intelligence API",
    description=(
        "ANVESH: Analytics-Driven Network for Verifying, Evaluating, and Synchronizing Higher-Education Grievances. "
        "Integrated Platform for Monitoring, Tracking, and Resolving Institution-Related Complaint Cases Across AICTE Bureaus and Cells."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration restricted to local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
    return {"status": "healthy", "service": "anvesh-backend"}
