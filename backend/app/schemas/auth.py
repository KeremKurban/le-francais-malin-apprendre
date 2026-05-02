from uuid import UUID

from pydantic import BaseModel, EmailStr, field_serializer


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    target_exam: str = "DELF"
    target_level: str = "B1"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    username: str
    target_exam: str
    target_level: str

    @field_serializer("id")
    def serialize_id(self, v: UUID) -> str:
        return str(v)

    class Config:
        from_attributes = True
