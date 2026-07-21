import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import server  # noqa: E402


class ServerContractTests(unittest.TestCase):
    def test_default_30_epoch_model_is_selected(self):
        selected = server.selected_onnx_path()
        self.assertIsNotNone(selected)
        self.assertEqual(selected.name, "cubicasa5k-20260711-30epoch.onnx")

    def test_health_contract_reports_model_and_dependencies(self):
        payload = server.health_payload()
        self.assertEqual(payload["schemaVersion"], "floorplan-ai-v1")
        self.assertEqual(payload["activeModel"], "cubicasa5k-20260711-30epoch.onnx")
        self.assertIn("onnxruntime", payload["dependencies"])
        self.assertIn(payload["status"], {"ok", "degraded"})

    def test_geometry_gap_is_returned_as_generic_opening(self):
        walls = [
            server.make_line("horizontal", 0, 10, 40, 10, 8),
            server.make_line("horizontal", 70, 10, 120, 10, 8),
        ]
        for index, wall in enumerate(walls, start=1):
            wall["id"] = f"wall-{index}"
        openings = server.detect_opening_candidates(
            walls,
            {"mergeGap": 4, "minWallThickness": 4, "openingMinWidth": 20, "openingMaxWidth": 40, "maxThickness": 8},
        )
        self.assertEqual(len(openings), 1)
        self.assertEqual(openings[0]["kind"], "opening")
        self.assertEqual(openings[0]["width"], 30.0)

    def test_closed_rectangle_is_returned_as_room(self):
        walls = [
            server.make_line("horizontal", 0, 0, 200, 0, 8),
            server.make_line("horizontal", 0, 160, 200, 160, 8),
            server.make_line("vertical", 0, 0, 0, 160, 8),
            server.make_line("vertical", 200, 0, 200, 160, 8),
        ]
        rooms = server.detect_rectangular_rooms(walls, {"mergeGap": 4, "minWallThickness": 4, "minLength": 40})
        self.assertEqual(len(rooms), 1)
        self.assertEqual(rooms[0]["area"], 32000.0)


if __name__ == "__main__":
    unittest.main()
