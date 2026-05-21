from sqlalchemy.ext.asyncio import create_async_engine,AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
import shutil

load_dotenv()




DATABASE_URL = os.getenv("DATABASE_URL")   


engine = create_async_engine(DATABASE_URL, echo=True)  # echo true to show the sql queries in terminal


AsyncSessionLocal = sessionmaker(bind=engine,
                                 class_=AsyncSession,
                                 expire_on_commit=False)    # used to talk with db

Base = declarative_base()   # to create the database models


# databse dependancy
async def get_db():

    # opens db and closes db
    async with AsyncSessionLocal() as db:
        yield db
    

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)