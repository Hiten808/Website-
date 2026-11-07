"""Voltra API — FastAPI + SQLAlchemy + PostgreSQL.

Run:
    uvicorn app.main:app --reload --port 8000   (from the backend/ folder)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import auth, orders, products
from .database import Base, engine

app = FastAPI(title="Voltra API", version="1.0.0")

# In dev, the Next.js dev server proxies /api/* here (see web/next.config.mjs).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "service": "voltra-api"}
