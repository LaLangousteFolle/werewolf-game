# backend/auth.py
import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, Header
import httpx

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 jours

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "http://localhost:3000/auth/callback")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
  to_encode = data.copy()
  expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
  to_encode.update({"exp": expire})
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(authorization: str = Header(None)):
  if not authorization or not authorization.startswith("Bearer "):
      raise HTTPException(status_code=401, detail="Token manquant")
  token = authorization.replace("Bearer ", "")
  try:
      payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
      discord_id: str = payload.get("discord_id")
      if discord_id is None:
          raise HTTPException(status_code=401, detail="Token invalide")
      return discord_id
  except JWTError:
      raise HTTPException(status_code=401, detail="Token invalide ou expiré")


async def exchange_code(code: str):
  """Échange le code Discord contre un access_token."""
  data = {
      "client_id": DISCORD_CLIENT_ID,
      "client_secret": DISCORD_CLIENT_SECRET,
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": DISCORD_REDIRECT_URI,
  }
  headers = {"Content-Type": "application/x-www-form-urlencoded"}

  async with httpx.AsyncClient() as client:
      resp = await client.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
      return resp.json()


async def get_discord_user(access_token: str):
  headers = {"Authorization": f"Bearer {access_token}"}
  async with httpx.AsyncClient() as client:
      resp = await client.get("https://discord.com/api/users/@me", headers=headers)
      return resp.json()
