import json
import os
import re
import urllib.error
import urllib.request
from datetime import date, datetime, time, timedelta


def _gemini_json(prompt: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise LookupError("GEMINI_API_KEY não configurada")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError) as error:
        raise RuntimeError(f"Não foi possível consultar o Gemini: {error}") from error
    try:
        text = payload["candidates"][0]["content"]["parts"][0]["text"]
        result = json.loads(text)
    except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
        raise RuntimeError("O Gemini retornou uma resposta fora do formato esperado.") from error
    if not isinstance(result, dict):
        raise RuntimeError("O Gemini retornou uma resposta fora do formato esperado.")
    return result


def interpret_message(message: str) -> dict:
    if os.getenv("GEMINI_API_KEY"):
        today = date.today().isoformat()
        return _gemini_json(
            "Interprete a mensagem em português como um agente de agenda. Hoje é "
            f"{today}. Retorne exclusivamente um objeto JSON com campos: intent (create_event, "
            "update_event, list_events, list_tasks, list_detected, conflicts, summary, help), "
            "title, starts_at (ISO 8601 com fuso se possível), ends_at, location, description, "
            "preparation, search_title. Não invente datas. Em consultas, escolha a intenção "
            "mais adequada. Mensagem: " + message
        )
    return _interpret_without_model(message)


def _resolve_date(message: str) -> date | None:
    iso_date = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", message)
    if iso_date:
        try:
            return date.fromisoformat(iso_date.group(1))
        except ValueError:
            return None
    lowered = message.lower()
    today = date.today()
    if "amanhã" in lowered or "amanha" in lowered:
        return today + timedelta(days=1)
    if "hoje" in lowered:
        return today
    weekdays = {
        "segunda": 0,
        "terça": 1,
        "terca": 1,
        "quarta": 2,
        "quinta": 3,
        "sexta": 4,
        "sábado": 5,
        "sabado": 5,
        "domingo": 6,
    }
    for name, weekday in weekdays.items():
        if name in lowered:
            days_ahead = (weekday - today.weekday()) % 7 or 7
            return today + timedelta(days=days_ahead)
    return None


def _resolve_time(message: str) -> time | None:
    match = re.search(r"\b([01]?\d|2[0-3])(?:[:h]([0-5]\d)?)\b", message.lower())
    if not match:
        return None
    return time(int(match.group(1)), int(match.group(2) or "0"))


def _interpret_without_model(message: str) -> dict:
    lowered = message.lower()
    create_words = ("crie", "criar", "agende", "marque", "adicionar", "adicione")
    update_words = ("altere", "alterar", "mude", "mudar", "remarque", "remarcar")
    if any(word in lowered for word in create_words):
        event_date = _resolve_date(message)
        event_time = _resolve_time(message)
        title_match = re.search(
            r"(?:chamad[oa]|intitulado|para)\s+(.+?)(?=\s+(?:hoje|amanh[ãa]|"
            r"segunda|terça|ter[cç]a|quarta|quinta|sexta|s[áa]bado|domingo|"
            r"(?:em\s+)?\d{4}-\d{2}-\d{2}|(?:na\s+)?(?:segunda|terça|ter[cç]a|"
            r"quarta|quinta|sexta|s[áa]bado|domingo)|às?\s+\d{1,2}(?::\d{2}|h))|$)",
            message,
            re.IGNORECASE,
        )
        title = title_match.group(1).strip(" .,!") if title_match else None
        if not title:
            cleaned = re.sub(
                r"(?i)\b(crie|criar|agende|marque|adicionar|adicione|um evento|"
                r"um compromisso|evento|compromisso)\b",
                " ",
                message,
            )
            cleaned = re.sub(
                r"(?i)\b(hoje|amanh[ãa]|segunda(?:-feira)?|terça(?:-feira)?|"
                r"ter[cç]a(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|"
                r"sexta(?:-feira)?|s[áa]bado|domingo|\d{4}-\d{2}-\d{2}|"
                r"às?\s+\d{1,2}(?::\d{2}|h))\b",
                " ",
                cleaned,
            )
            title = re.sub(r"\s+", " ", cleaned).strip(" .,!") or None
        starts_at = None
        if event_date and event_time:
            starts_at = datetime.combine(event_date, event_time).astimezone().isoformat()
        return {"intent": "create_event", "title": title, "starts_at": starts_at}
    if any(word in lowered for word in update_words):
        title_match = re.search(
            r"(?:altere|alterar|mude|mudar|remarque|remarcar)\s+(?:o\s+)?(?:evento\s+)?(.+?)"
            r"\s+(?:para|pra)\b",
            message,
            re.IGNORECASE,
        )
        event_date = _resolve_date(message)
        event_time = _resolve_time(message)
        starts_at = (
            datetime.combine(event_date, event_time).astimezone().isoformat()
            if event_date and event_time
            else None
        )
        return {
            "intent": "update_event",
            "search_title": title_match.group(1).strip(" .,!") if title_match else "",
            "starts_at": starts_at,
        }
    if any(word in lowered for word in ("conflito", "sobreposição", "sobreposicao")):
        return {"intent": "conflicts"}
    if any(word in lowered for word in ("pendência", "pendencia", "pendente", "tarefa")):
        return {"intent": "list_tasks"}
    if any(word in lowered for word in ("e-mail", "email", "detectado", "detectados", "não está na agenda")):
        return {"intent": "list_detected"}
    if any(word in lowered for word in ("resumo", "semana", "compromisso", "agenda", "evento")):
        return {"intent": "list_events"}
    return {"intent": "help"}


def interpret_email_thread(subject: str, messages: list[dict]) -> dict | None:
    if not messages:
        return None
    if os.getenv("GEMINI_API_KEY"):
        result = _gemini_json(
            "Consolide as mensagens deste mesmo thread de email sobre um compromisso. "
            "Use a mensagem mais recente para refletir alterações e cancelamentos. "
            "Responda JSON: {\"is_event\": boolean, \"title\": string, "
            "\"date\": \"YYYY-MM-DD\", \"time\": \"HH:MM\", \"duration_minutes\": number, "
            "\"location\": string, \"description\": string, \"preparation\": string, "
            "\"cancelled\": boolean, \"confirmed\": boolean}. Se não houver compromisso, "
            "is_event=false. Assunto: "
            + subject
            + " Mensagens (em ordem cronológica): "
            + json.dumps(messages, ensure_ascii=False)
        )
        if result.get("is_event"):
            event_date = result.get("date")
            event_time = result.get("time")
            if not isinstance(event_date, str) or not event_date.strip():
                raise RuntimeError("O Gemini identificou um compromisso sem data. Revise a conversa no Gmail.")
            if not isinstance(event_time, str) or not event_time.strip():
                raise RuntimeError("O Gemini identificou um compromisso sem horário. Revise a conversa no Gmail.")
            try:
                datetime.strptime(f"{event_date} {event_time}", "%Y-%m-%d %H:%M")
            except ValueError as error:
                raise RuntimeError("O Gemini retornou uma data ou horário inválido para um compromisso.") from error
        return result
    combined = " ".join([subject, *(item.get("body", "") for item in messages)])
    event_date = _resolve_date(combined)
    event_time = _resolve_time(combined)
    if not event_date or not event_time or not any(
        word in combined.lower()
        for word in ("reuni", "encontro", "consulta", "entrevista", "evento", "call")
    ):
        return None
    canceled = any(word in combined.lower() for word in ("cancelada", "cancelado", "desmarcada", "desmarcado"))
    title = subject.removeprefix("Re: ").strip() or "Compromisso detectado"
    return {
        "is_event": True,
        "title": title,
        "date": event_date.isoformat(),
        "time": event_time.strftime("%H:%M"),
        "duration_minutes": 60,
        "location": "",
        "description": f"Consolidado a partir de {len(messages)} mensagens da conversa.",
        "preparation": "",
        "cancelled": canceled,
        "confirmed": not any(word in combined.lower() for word in ("podemos", "talvez", "sugiro")),
    }
