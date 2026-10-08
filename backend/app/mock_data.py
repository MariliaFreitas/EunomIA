import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .models import MeetingRecord, TaskDeadlineRecord


MOCK_DIRECTORY = Path(__file__).resolve().parents[2]
SAO_PAULO = timezone(timedelta(hours=-3))


def _read_mock(filename: str) -> dict:
    path = MOCK_DIRECTORY / filename
    with path.open(encoding="utf-8") as mock_file:
        data = json.load(mock_file)
    if not isinstance(data, dict):
        raise ValueError(f"O mock {filename} precisa conter um objeto JSON.")
    return data


def load_raw_email_thread_mock() -> dict:
    thread = _read_mock("raw_threads.json")
    if not isinstance(thread.get("emails"), list):
        raise ValueError("O mock raw_threads.json precisa conter a lista 'emails'.")
    return thread


def _deadline_datetime(deadline: dict | None) -> datetime | None:
    if not deadline:
        return None
    deadline_date = deadline.get("data_limite") or deadline.get("data")
    deadline_time = deadline.get("horario_limite") or deadline.get("horario")
    if not deadline_date or not deadline_time:
        return None
    return datetime.fromisoformat(f"{deadline_date}T{deadline_time}").replace(
        tzinfo=SAO_PAULO
    )


def load_extracted_schedule_mock() -> tuple[list[MeetingRecord], list[TaskDeadlineRecord]]:
    data = _read_mock("extracted_events_deadlines.json")
    extracted_meeting = data.get("evento_principal")
    if not isinstance(extracted_meeting, dict):
        raise ValueError(
            "O mock extracted_events_deadlines.json precisa conter 'evento_principal'."
        )

    meeting = MeetingRecord(
        id=data.get("thread_id", "extracted-mock-meeting"),
        title=extracted_meeting["titulo"],
        starts_at=datetime.fromisoformat(
            f"{extracted_meeting['data']}T{extracted_meeting['horario_inicio']}"
        ).replace(tzinfo=SAO_PAULO),
        ends_at=(
            datetime.fromisoformat(
                f"{extracted_meeting['data']}T{extracted_meeting['horario_fim']}"
            ).replace(tzinfo=SAO_PAULO)
            if extracted_meeting.get("horario_fim")
            else None
        ),
        status=extracted_meeting["status"],
        source="extracted_mock",
        location=extracted_meeting.get("local") or extracted_meeting.get("plataforma"),
        link=extracted_meeting.get("link"),
        participants=[
            participant["nome"]
            for participant in extracted_meeting.get("participantes", [])
        ],
    )

    task_deadlines: list[TaskDeadlineRecord] = []
    for task in data.get("tarefas_vinculadas", []):
        deadline = task.get("prazo_atual") or task.get("prazo")
        if not deadline and task.get("prazo_original"):
            deadline = task["prazo_original"]
        task_deadlines.append(
            TaskDeadlineRecord(
                id=task["id"],
                title=task["titulo"],
                responsible=task.get("responsavel")
                or ", ".join(task.get("responsaveis", []))
                or None,
                due_at=_deadline_datetime(deadline),
                deadline_reference=(
                    deadline.get("tipo")
                    if isinstance(deadline, dict)
                    else None
                ),
                status=task.get("status", "identificada"),
                source="extracted_mock",
                event_id=task.get("evento_pai"),
            )
        )
    return [meeting], task_deadlines
