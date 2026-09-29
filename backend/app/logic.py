from datetime import datetime, timedelta


def attach_event_signals(events: list[dict]) -> list[dict]:
    active = [event for event in events if event["status"] != "cancelled"]
    conflicts: set[str] = set()
    parsed = {
        event["id"]: (
            datetime.fromisoformat(event["starts_at"]),
            datetime.fromisoformat(event["ends_at"]),
        )
        for event in active
    }
    for index, first in enumerate(active):
        first_start, first_end = parsed[first["id"]]
        for second in active[index + 1 :]:
            second_start, second_end = parsed[second["id"]]
            if first_start < second_end and second_start < first_end:
                conflicts.update((first["id"], second["id"]))

    now = datetime.now().astimezone()
    result = []
    for event in events:
        start = datetime.fromisoformat(event["starts_at"])
        has_preparation = bool(event.get("preparation"))
        result.append(
            {
                **event,
                "conflict": event["id"] in conflicts,
                "priority": "high"
                if event["id"] in conflicts
                or (start >= now and start - now <= timedelta(days=2) and has_preparation)
                else "normal",
            }
        )
    return result
