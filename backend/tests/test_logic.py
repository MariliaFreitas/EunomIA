import unittest
from datetime import datetime, timedelta

from app.assistant import _interpret_without_model
from app.logic import attach_event_signals


class AssistantFallbackTests(unittest.TestCase):
    def test_identifies_agenda_query_about_conflicts(self):
        self.assertEqual(
            _interpret_without_model("Tenho algum conflito de horário?")["intent"],
            "conflicts",
        )

    def test_identifies_pending_tasks_query(self):
        self.assertEqual(
            _interpret_without_model("Quais são minhas pendências?")["intent"],
            "list_tasks",
        )

    def test_parses_new_event_with_iso_date_and_time(self):
        result = _interpret_without_model(
            "Crie um evento chamado Revisão do projeto em 2026-10-03 às 16h"
        )
        self.assertEqual(result["intent"], "create_event")
        self.assertEqual(result["title"], "Revisão do projeto")
        self.assertTrue(result["starts_at"].startswith("2026-10-03T16:00"))


class EventSignalTests(unittest.TestCase):
    def test_detects_overlapping_events_symmetrically(self):
        start = datetime.now().astimezone() + timedelta(days=5)
        events = [
            {
                "id": "first",
                "title": "Reunião",
                "starts_at": start.isoformat(),
                "ends_at": (start + timedelta(hours=1)).isoformat(),
                "status": "confirmed",
                "preparation": "",
            },
            {
                "id": "second",
                "title": "Consulta",
                "starts_at": (start + timedelta(minutes=30)).isoformat(),
                "ends_at": (start + timedelta(hours=2)).isoformat(),
                "status": "confirmed",
                "preparation": "",
            },
        ]
        marked = attach_event_signals(events)
        self.assertEqual([event["conflict"] for event in marked], [True, True])

    def test_cancelled_events_do_not_conflict(self):
        start = datetime.now().astimezone() + timedelta(days=5)
        events = [
            {
                "id": "cancelled",
                "title": "Cancelado",
                "starts_at": start.isoformat(),
                "ends_at": (start + timedelta(hours=1)).isoformat(),
                "status": "cancelled",
                "preparation": "",
            },
            {
                "id": "active",
                "title": "Ativo",
                "starts_at": start.isoformat(),
                "ends_at": (start + timedelta(hours=1)).isoformat(),
                "status": "confirmed",
                "preparation": "",
            },
        ]
        marked = attach_event_signals(events)
        self.assertFalse(marked[0]["conflict"])
        self.assertFalse(marked[1]["conflict"])


if __name__ == "__main__":
    unittest.main()
