import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
APP_SOURCE = (ROOT / "app.js").read_text(encoding="utf-8")
FEATURE_SOURCE = (ROOT / "FEATURES.md").read_text(encoding="utf-8")


class RoomPolygonContractTests(unittest.TestCase):
    def test_constructible_openings_are_bridged_only_for_room_topology(self):
        self.assertIn("function bridgeRoomOpenings", APP_SOURCE)
        self.assertIn("temporaryRoomBridge: true", APP_SOURCE)
        self.assertIn("const roomBridges = bridgeRoomOpenings", APP_SOURCE)
        self.assertIn("findClosedRoomPolygons([...roomLines, ...roomBridges]", APP_SOURCE)
        self.assertIn("return { intersections, breaks, openings, endPiers, roomBridges, rooms }", APP_SOURCE)

    def test_closed_spaces_are_polygonal_and_use_shoelace_area(self):
        self.assertIn("function findClosedRoomPolygons", APP_SOURCE)
        self.assertIn("function traceRoomComponentPolygon", APP_SOURCE)
        self.assertIn("function polygonSignedArea", APP_SOURCE)
        self.assertIn("area = Math.abs(polygonSignedArea(polygon))", APP_SOURCE)
        self.assertIn("polygon: roomPolygon(room).map", APP_SOURCE)

    def test_non_rectangular_boundaries_flow_into_labels_and_layout(self):
        self.assertIn("function pointInRoomPolygon", APP_SOURCE)
        self.assertIn("function roomInteriorPoint", APP_SOURCE)
        self.assertIn("samples.every((point) => pointInRoomPolygon", APP_SOURCE)
        self.assertIn("const polygon = roomPolygon(room)", APP_SOURCE)
        self.assertIn("逐段墙壁长度", (ROOT / "index.html").read_text(encoding="utf-8"))

    def test_feature_list_documents_polygon_room_support(self):
        self.assertIn("临时桥接门窗洞口", FEATURE_SOURCE)
        self.assertIn("封闭空间多边形", FEATURE_SOURCE)
        self.assertIn("非标准矩形房间", FEATURE_SOURCE)


if __name__ == "__main__":
    unittest.main()
