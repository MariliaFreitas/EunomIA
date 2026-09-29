import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

TEST_DATABASE = Path(tempfile.gettempdir()) / "eunomia-api-tests.sqlite"
os.environ["DATABASE_PATH"] = str(TEST_DATABASE)

from fastapi.testclient import TestClient

from app.main import app


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)
        TEST_DATABASE.unlink(missing_ok=True)

    def test_health_and_dashboard(self):
        self.assertEqual(self.client.get("/api/health").json()["status"], "ok")
        dashboard = self.client.get("/api/dashboard")
        self.assertEqual(dashboard.status_code, 200)
        self.assertGreaterEqual(dashboard.json()["stats"]["events"], 1)

    def test_create_event(self):
        response = self.client.post(
            "/api/events",
            json={
                "title": "Teste de criação",
                "starts_at": "2026-10-05T10:00:00-03:00",
                "ends_at": "2026-10-05T11:00:00-03:00",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["event"]["title"], "Teste de criação")

    def test_chat_creates_an_event_from_iso_date(self):
        response = self.client.post(
            "/api/chat",
            json={"message": "Crie um evento chamado Revisão do protótipo em 2026-10-06 às 16h"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["action"]["type"], "event_created")
        self.assertIn("Revisão do protótipo", response.json()["reply"])

    def test_google_sync_uses_the_selected_email_date_range(self):
        result = {"calendar_events": 0, "emails": 8, "email_threads_with_events": 2}
        with patch("app.main.sync_google", return_value=result) as sync:
            response = self.client.post(
                "/api/integrations/google/sync",
                json={"email_since": "2026-09-01", "email_until": "2026-09-29"},
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["result"], result)
        sync.assert_called_once()
        self.assertEqual(sync.call_args.args[0].isoformat(), "2026-09-01")
        self.assertEqual(sync.call_args.args[1].isoformat(), "2026-09-29")

    def test_google_sync_rejects_an_invalid_email_date_range(self):
        with patch("app.main.sync_google") as sync:
            response = self.client.post(
                "/api/integrations/google/sync",
                json={"email_since": "2026-09-29", "email_until": "2026-09-01"},
            )
        self.assertEqual(response.status_code, 422)
        sync.assert_not_called()


if __name__ == "__main__":
    unittest.main()
