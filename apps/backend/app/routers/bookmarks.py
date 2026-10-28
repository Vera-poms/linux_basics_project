from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from deps import get_current_user, get_db
from db.models import Bookmark, Lab, User
from schemas import BookmarkIn, BookmarkOut

router = APIRouter(prefix="/bookmarks", tags=["Bookmarks"])


def _out(b: Bookmark) -> BookmarkOut:
    return BookmarkOut(lab=b.lab_id, key=b.topic_key, title=b.title)


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[BookmarkOut]:
    rows = db.query(Bookmark).filter(Bookmark.user_id == user.id).order_by(Bookmark.created_at).all()
    return [_out(b) for b in rows]


@router.put("", response_model=BookmarkOut)
def add_bookmark(payload: BookmarkIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BookmarkOut:
    if db.get(Lab, payload.lab) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown lab")
    # A user holds a single bookmark: saving a new one replaces any previous one.
    db.query(Bookmark).filter(
        Bookmark.user_id == user.id,
        ~((Bookmark.lab_id == payload.lab) & (Bookmark.topic_key == payload.key)),
    ).delete(synchronize_session=False)
    row = (
        db.query(Bookmark)
        .filter(Bookmark.user_id == user.id, Bookmark.lab_id == payload.lab, Bookmark.topic_key == payload.key)
        .one_or_none()
    )
    if row is None:
        row = Bookmark(user_id=user.id, lab_id=payload.lab, topic_key=payload.key, title=payload.title)
        db.add(row)
    else:
        row.title = payload.title
    db.commit()
    return _out(row)


@router.delete("/{lab_id}/{key}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bookmark(lab_id: int, key: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    db.query(Bookmark).filter(
        Bookmark.user_id == user.id, Bookmark.lab_id == lab_id, Bookmark.topic_key == key
    ).delete()
    db.commit()
