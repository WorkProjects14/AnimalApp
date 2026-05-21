from fastapi import FastAPI, Depends
import routes.Admin
import routes.User

from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from auth.auth import verify_admin
from core.limiter import limiter
from slowapi.middleware import SlowAPIMiddleware
from database import init_db


# run once to create the table in the database, then comment out the lifespan function and use the normal FastAPI app initialization to avoid re-creating tables on every startup

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     await init_db()
#     yield


# app = FastAPI(lifespan=lifespan)

app = FastAPI()

# Add CORS middleware to allow the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://animal-app-68rf.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include Routers
app.include_router(routes.Admin.router)
app.include_router(routes.Admin.admin_login_router)
app.include_router(routes.User.router)

@app.get('/')
def home():
    return 'app is running successfully'






# rate limiter
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)