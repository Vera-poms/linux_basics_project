from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from core.config import CORS_ORIGINS
from db.connection import engine, SessionLocal
from db.models import Base, Lab
from routers import auth, progress

app = FastAPI(title="Linux Basics API", tags=["Home"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

LAB_TITLES = {
    1: "Find your way around",
    2: "Make and read files",
    3: "Scaffold a project",
    4: "Copy, move, rename",
    5: "Delete without regret",
    6: "Find files, search text",
    7: "Permissions",
    8: "Links, sizes, archives",
    9: "Pipes and redirection",
    10: "Final challenge",
}


def seed_labs() -> None:
    db: Session = SessionLocal()
    try:
        existing_ids = {lab_id for (lab_id,) in db.query(Lab.id).all()}
        for lab_id, title in LAB_TITLES.items():
            if lab_id in existing_ids:
                continue
            db.add(Lab(id=lab_id, title=title))
        db.commit()
    finally:
        db.close()


seed_labs()

app.include_router(auth.router)
app.include_router(progress.router)


@app.get("/")
def root():
    return {"message": "Welcome to Linux Basics"}
