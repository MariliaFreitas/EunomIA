import os
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from google.auth.exceptions import GoogleAuthError
from googleapiclient.errors import HttpError
from pydantic import BaseModel, Field

from .db import initialize_database
from .google_integration import (
    begin_oauth,
    finish_oauth,
    integration_status,
    sync_google,
)


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="EunomIA Google Integration API",
    description="Endpoints de conexão e sincronização com Gmail e Google Calendar.",
    version="0.1.0",
)
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
allowed_origins = [frontend_origin]
if frontend_origin in {"http://localhost:5173", "http://127.0.0.1:5173"}:
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GoogleSyncRequest(BaseModel):
    email_since: date = Field(default_factory=lambda: date.today() - timedelta(days=30))
    email_until: date = Field(default_factory=date.today)


@app.on_event("startup")
def startup():
    initialize_database()


@app.get("/api/integrations/google/status")
def google_status():
    return integration_status()


@app.get("/api/integrations/google/auth")
def google_auth():
    try:
        return RedirectResponse(begin_oauth())
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.get("/api/integrations/google/callback")
def google_callback(request: Request, code: str, state: str):
    try:
        finish_oauth(str(request.url), state)
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return RedirectResponse("http://localhost:5173/?google=connected")


@app.post("/api/integrations/google/sync")
def google_sync(request: GoogleSyncRequest | None = None):
    request = request or GoogleSyncRequest()
    if request.email_since > request.email_until:
        raise HTTPException(
            status_code=422,
            detail="A data inicial deve ser anterior ou igual à data final.",
        )
    if request.email_until > date.today():
        raise HTTPException(status_code=422, detail="A data final não pode ser futura.")
    try:
        result = sync_google(request.email_since, request.email_until)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except (HttpError, GoogleAuthError, OSError, RuntimeError) as error:
        raise HTTPException(
            status_code=502,
            detail=f"Falha ao sincronizar com o Google: {error}",
        ) from error
    return {"result": result}
