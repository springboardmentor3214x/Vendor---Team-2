from fastapi import APIRouter
from app.api.endpoints import auth, vendors

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
