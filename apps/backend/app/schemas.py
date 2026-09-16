from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    model_config = {"from_attributes": True}


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProgressPayload(BaseModel):
    """Same shape as the frontend's `Progress` type — the relational rows are just storage detail."""

    lab: int = 0
    done: dict[str, bool] = Field(default_factory=dict)
    hintIdx: dict[str, int] = Field(default_factory=dict)
