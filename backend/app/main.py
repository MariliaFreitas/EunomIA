import os
from pathlib import Path
from datetime import datetime, timedelta
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from google.auth.exceptions import GoogleAuthError
from googleapiclient.errors import HttpError

from .assistant import interpret_message
from .db import connect, initialize_database
from .google_integration import (
    begin_oauth,
    finish_oauth,
    integration_status,
    sync_google,
    write_calendar_event,
)
from .logic import attach_event_signals

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="EunomIA API",
    description="API para agenda inteligente, e-mails e assistente conversacional.",
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


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    starts_at: datetime
    ends_at: datetime
    description: str = ""
    location: str = ""
    preparation: str = ""


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    description: str | None = None
    location: str | None = None
    preparation: str | None = None
    status: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class TaskUpdate(BaseModel):
    status: str


@app.on_event("startup")
def startup():
    initialize_database()


def _event_rows(from_date: str | None = None, to_date: str | None = None) -> list[dict]:
    sql = "SELECT * FROM events WHERE user_id = ?"
    parameters: list[str] = ["demo"]
    if from_date:
        sql += " AND ends_at >= ?"
        parameters.append(from_date)
    if to_date:
        sql += " AND starts_at <= ?"
        parameters.append(to_date)
    sql += " ORDER BY starts_at"
    with connect() as connection:
        rows = connection.execute(sql, parameters).fetchall()
    return attach_event_signals([dict(row) for row in rows])


def _event_by_id(event_id: str) -> dict | None:
    with connect() as connection:
        row = connection.execute(
            "SELECT * FROM events WHERE id = ? AND user_id = 'demo'", (event_id,)
        ).fetchone()
    return dict(row) if row else None


def _create_event(payload: dict, source: str = "manual") -> dict:
    starts_at = _to_datetime(payload.get("starts_at"), "Data e horário inicial")
    ends_at = _to_datetime(payload.get("ends_at"), "Data e horário final")
    if ends_at <= starts_at:
        raise HTTPException(status_code=422, detail="O horário final deve ser posterior ao inicial.")
    title = str(payload.get("title") or "").strip()
    if not title:
        raise HTTPException(status_code=422, detail="Informe um título para o compromisso.")
    event_id = str(uuid4())
    now = datetime.now().astimezone().isoformat()
    with connect() as connection:
        connection.execute(
            """
            INSERT INTO events(id, user_id, title, description, starts_at, ends_at, location,
                               status, source, preparation, updated_at)
            VALUES (?, 'demo', ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
            """,
            (
                event_id,
                title,
                payload.get("description", ""),
                starts_at.isoformat(),
                ends_at.isoformat(),
                payload.get("location", ""),
                source,
                payload.get("preparation", ""),
                now,
            ),
        )
    event = _event_by_id(event_id)
    if integration_status()["connected"]:
        try:
            provider_id = write_calendar_event(event)
        except (HttpError, GoogleAuthError, OSError) as error:
            raise HTTPException(
                status_code=502,
                detail=f"Compromisso salvo localmente, mas não foi possível enviá-lo ao Google Calendar: {error}",
            ) from error
        with connect() as connection:
            connection.execute(
                "UPDATE events SET provider_id = ?, source = 'calendar' WHERE id = ?",
                (provider_id, event_id),
            )
        event = _event_by_id(event_id)
    return attach_event_signals([event])[0]


def _to_datetime(value, label: str) -> datetime:
    try:
        parsed = value if isinstance(value, datetime) else datetime.fromisoformat(str(value))
    except (TypeError, ValueError) as error:
        raise HTTPException(status_code=422, detail=f"{label} inválidos.") from error
    if parsed.tzinfo is None:
        parsed = parsed.astimezone()
    return parsed


def _update_event(event_id: str, updates: dict) -> dict:
    event = _event_by_id(event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Compromisso não encontrado.")
    updates = {key: value for key, value in updates.items() if value is not None}
    if "starts_at" in updates:
        updates["starts_at"] = _to_datetime(updates["starts_at"], "Data e horário inicial").isoformat()
    if "ends_at" in updates:
        updates["ends_at"] = _to_datetime(updates["ends_at"], "Data e horário final").isoformat()
    updated_event = {**event, **updates}
    if datetime.fromisoformat(updated_event["ends_at"]) <= datetime.fromisoformat(updated_event["starts_at"]):
        raise HTTPException(status_code=422, detail="O horário final deve ser posterior ao inicial.")
    if "status" in updates and updates["status"] not in {"confirmed", "detected", "cancelled"}:
        raise HTTPException(status_code=422, detail="Situação do compromisso inválida.")
    assignments = [f"{key} = ?" for key in updates]
    values = list(updates.values())
    assignments.append("updated_at = ?")
    values.extend([datetime.now().astimezone().isoformat(), event_id])
    if updates:
        with connect() as connection:
            connection.execute(
                f"UPDATE events SET {', '.join(assignments)} WHERE id = ?",
                values,
            )
    event = _event_by_id(event_id)
    should_sync = event.get("provider_id") or (
        event.get("source") == "email"
        and updates.get("status") == "confirmed"
        and integration_status()["connected"]
    )
    if should_sync and integration_status()["connected"]:
        try:
            provider_id = write_calendar_event(event)
        except (HttpError, GoogleAuthError, OSError) as error:
            raise HTTPException(
                status_code=502,
                detail=f"Compromisso atualizado localmente, mas não foi possível atualizar o Google Calendar: {error}",
            ) from error
        if provider_id and not event.get("provider_id"):
            with connect() as connection:
                connection.execute(
                    "UPDATE events SET provider_id = ?, source = 'calendar' WHERE id = ?",
                    (provider_id, event_id),
                )
            event = _event_by_id(event_id)
    return attach_event_signals([event])[0]


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "EunomIA"}


@app.get("/api/dashboard")
def dashboard():
    now = datetime.now().astimezone()
    events = _event_rows(
        (now - timedelta(days=1)).isoformat(),
        (now + timedelta(days=14)).isoformat(),
    )
    conflicts = [event for event in events if event["conflict"]]
    detected = [event for event in events if event["status"] == "detected"]
    with connect() as connection:
        tasks = [
            dict(row)
            for row in connection.execute(
                "SELECT * FROM tasks WHERE user_id = 'demo' AND status = 'pending' ORDER BY due_at"
            ).fetchall()
        ]
    return {
        "events": events,
        "tasks": tasks,
        "conflicts": conflicts,
        "stats": {
            "events": len([event for event in events if event["status"] != "cancelled"]),
            "detected": len(detected),
            "pending": len(tasks),
            "conflicts": len(conflicts),
        },
        "google": integration_status(),
    }


@app.get("/api/events")
def list_events(
    from_date: str | None = Query(default=None, alias="from"),
    to_date: str | None = Query(default=None, alias="to"),
):
    return {"events": _event_rows(from_date, to_date)}


@app.post("/api/events", status_code=201)
def create_event(payload: EventCreate):
    event = _create_event(payload.model_dump())
    return {"event": event}


@app.patch("/api/events/{event_id}")
def update_event(event_id: str, payload: EventUpdate):
    event = _update_event(event_id, payload.model_dump(exclude_unset=True))
    return {"event": event}


@app.get("/api/tasks")
def list_tasks():
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM tasks WHERE user_id = 'demo' ORDER BY due_at"
        ).fetchall()
    return {"tasks": [dict(row) for row in rows]}


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, payload: TaskUpdate):
    if payload.status not in {"pending", "done"}:
        raise HTTPException(status_code=422, detail="Situação da pendência inválida.")
    with connect() as connection:
        result = connection.execute(
            "UPDATE tasks SET status = ? WHERE id = ? AND user_id = 'demo'",
            (payload.status, task_id),
        )
        if not result.rowcount:
            raise HTTPException(status_code=404, detail="Pendência não encontrada.")
        row = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return {"task": dict(row)}


@app.get("/api/emails")
def list_emails():
    with connect() as connection:
        rows = connection.execute(
            """
            SELECT emails.*, events.id AS event_id, events.title AS event_title
            FROM emails LEFT JOIN email_events ON email_events.email_id = emails.id
            LEFT JOIN events ON events.id = email_events.event_id
            WHERE emails.user_id = 'demo'
            ORDER BY received_at DESC LIMIT 40
            """
        ).fetchall()
    return {"emails": [dict(row) for row in rows]}


@app.post("/api/chat")
def chat(payload: ChatRequest):
    try:
        intent = interpret_message(payload.message)
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
    intent_name = intent.get("intent", "help")
    action = None
    if intent_name == "create_event":
        if not intent.get("title") or not intent.get("starts_at"):
            return {
                "reply": "Posso criar esse compromisso. Diga o título, a data e o horário, por exemplo: “Crie Reunião com Ana amanhã às 14h”.",
                "action": None,
            }
        start = _to_datetime(intent["starts_at"], "Data e horário inicial")
        end = _to_datetime(intent.get("ends_at") or (start + timedelta(hours=1)), "Data e horário final")
        event = _create_event({**intent, "starts_at": start, "ends_at": end}, source="chat")
        action = {"type": "event_created", "event": event}
        reply = f"Compromisso “{event['title']}” criado para {start.strftime('%d/%m às %H:%M')}."
    elif intent_name == "update_event":
        if not intent.get("search_title") or not intent.get("starts_at"):
            return {
                "reply": "Para alterar, informe qual compromisso e o novo dia e horário.",
                "action": None,
            }
        candidates = _event_rows()
        search_terms = intent["search_title"].lower().split()
        matching = [
            event
            for event in candidates
            if all(term in event["title"].lower() for term in search_terms)
        ]
        if not matching:
            return {"reply": f"Não encontrei um compromisso com o nome “{intent['search_title']}”.", "action": None}
        start = _to_datetime(intent["starts_at"], "Nova data e horário")
        duration = datetime.fromisoformat(matching[0]["ends_at"]) - datetime.fromisoformat(
            matching[0]["starts_at"]
        )
        event = _update_event(
            matching[0]["id"],
            {"starts_at": start, "ends_at": start + duration},
        )
        action = {"type": "event_updated", "event": event}
        reply = f"Atualizei “{event['title']}” para {start.strftime('%d/%m às %H:%M')}."
    elif intent_name in {"list_events", "summary"}:
        events = [event for event in _event_rows() if event["status"] != "cancelled"]
        events = events[:8]
        if not events:
            reply = "Sua agenda está livre nos próximos dias."
        else:
            reply = "Seus próximos compromissos:\n" + "\n".join(
                f"• {datetime.fromisoformat(event['starts_at']).strftime('%d/%m %H:%M')} — "
                f"{event['title']}{' (conflito)' if event['conflict'] else ''}"
                for event in events
            )
    elif intent_name == "list_tasks":
        with connect() as connection:
            tasks = connection.execute(
                "SELECT title, due_at FROM tasks WHERE user_id = 'demo' AND status = 'pending' ORDER BY due_at"
            ).fetchall()
        reply = (
            "Pendências em aberto:\n"
            + "\n".join(
                f"• {task['title']}" + (
                    f" — prazo {datetime.fromisoformat(task['due_at']).strftime('%d/%m %H:%M')}"
                    if task["due_at"]
                    else ""
                )
                for task in tasks
            )
            if tasks
            else "Você não tem pendências em aberto."
        )
    elif intent_name == "list_detected":
        detected = [event for event in _event_rows() if event["status"] == "detected"]
        reply = (
            "Encontrei estes compromissos em e-mails que ainda não estão no calendário:\n"
            + "\n".join(
                f"• {event['title']} — {datetime.fromisoformat(event['starts_at']).strftime('%d/%m %H:%M')}"
                for event in detected
            )
            if detected
            else "Não há compromissos detectados em e-mails aguardando inclusão na agenda."
        )
    elif intent_name == "conflicts":
        conflicts = [event for event in _event_rows() if event["conflict"]]
        reply = (
            "Conflitos identificados:\n"
            + "\n".join(
                f"• {event['title']} — {datetime.fromisoformat(event['starts_at']).strftime('%d/%m %H:%M')}"
                for event in conflicts
            )
            if conflicts
            else "Não encontrei conflitos de horário na agenda."
        )
    else:
        reply = (
            "Olá! Posso consultar sua agenda e pendências, encontrar conflitos ou criar e alterar compromissos. "
            "Exemplo: “Crie Revisão do projeto amanhã às 16h”."
        )
    return {"reply": reply, "action": action}


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
def google_sync():
    try:
        result = sync_google()
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except (HttpError, GoogleAuthError, OSError, ValueError, RuntimeError) as error:
        raise HTTPException(status_code=502, detail=f"Falha ao sincronizar com o Google: {error}") from error
    return {"result": result, "dashboard": dashboard()}
