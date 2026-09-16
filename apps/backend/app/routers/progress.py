from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from db.models import Lab, LabProgress, User
from schemas import ProgressPayload

router = APIRouter(prefix="/progress", tags=["Progress"])


@router.get("", response_model=ProgressPayload)
def get_progress(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProgressPayload:
    rows = db.query(LabProgress).filter(LabProgress.user_id == user.id).all()
    return ProgressPayload(
        lab=user.current_lab_index,
        done={str(r.lab_id): r.done for r in rows},
        hintIdx={str(r.lab_id): r.hint_count for r in rows},
    )


@router.put("", response_model=ProgressPayload)
def put_progress(payload: ProgressPayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProgressPayload:
    user.current_lab_index = payload.lab

    lab_ids = {int(k) for k in payload.done} | {int(k) for k in payload.hintIdx}
    existing = {r.lab_id: r for r in db.query(LabProgress).filter(LabProgress.user_id == user.id).all()}
    known_lab_ids = {lab_id for (lab_id,) in db.query(Lab.id).all()}

    for lab_id in lab_ids:
        if lab_id not in known_lab_ids:
            continue  # ignore unknown lab ids rather than fail the whole update
        row = existing.get(lab_id)
        if row is None:
            row = LabProgress(user_id=user.id, lab_id=lab_id)
            db.add(row)
        row.done = payload.done.get(str(lab_id), row.done if row.id else False)
        row.hint_count = payload.hintIdx.get(str(lab_id), row.hint_count if row.id else 0)

    db.commit()
    return get_progress(user=user, db=db)
