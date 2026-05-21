from fastapi import FastAPI, Depends
import routes.Admin
import routes.User
from fastapi.staticfiles import StaticFiles
import os
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from auth.auth import verify_admin
from core.limiter import limiter
from slowapi.middleware import SlowAPIMiddleware

# Initialize FastAPI App
app = FastAPI()

# Add CORS middleware to allow the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        
    ],  # Adjust or extend in production
    allow_origin_regex="https://.*\\.vercel\\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up static directory dynamically based on Vercel serverless environment

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")



# Include Routers
app.include_router(routes.Admin.router)
app.include_router(routes.Admin.admin_login_router)
app.include_router(routes.User.router)

@app.get('/api')
def home():
    return 'app is running successfully'

@app.get("/api/test")
def test():
    return {"status": "working"}

# rate limiter
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)