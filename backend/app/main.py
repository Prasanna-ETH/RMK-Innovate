from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router as api_router
from app.api.health import router as health_router
from app.api.websocket import router as ws_router
from app.utils.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}...")
    yield
    logger.info("Shutting down BlindSpot backend...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Intelligent Spatial Awareness & Risk Prediction Engine for Safer Mobility.",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints
app.include_router(health_router)
app.include_router(api_router)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "websocket_endpoint": "/ws/perception",
    }
