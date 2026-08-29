import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
APP_SOURCE = (ROOT / "app.js").read_text(encoding="utf-8")
HTML_SOURCE = (ROOT / "index.html").read_text(encoding="utf-8")


class RoomInformationContractTests(unittest.TestCase):
    def test_room_information_controls_exist(self):
        for element_id in (
            "roomInfoToggleButton",
            "roomEditorButton",
            "roomEditorModal",
            "roomNameInput",
            "roomTypeSelect",
            "roomAreaInput",
            "roomTopWallLength",
            "roomRightWallLength",
            "roomBottomWallLength",
            "roomLeftWallLength",
            "roomWallSegmentList",
        ):
            self.assertIn(f'id="{element_id}"', HTML_SOURCE)

    def test_room_area_and_type_are_inferred(self):
        self.assertIn("function roomAreaSquareMeters", APP_SOURCE)
        self.assertIn("function inferRoomType", APP_SOURCE)
        self.assertIn("roomOpeningProfile", APP_SOURCE)
        self.assertIn("areaSquareMeters", APP_SOURCE)

    def test_each_room_wall_length_is_calculated_and_drawn(self):
        self.assertIn("function roomWallLengthsMillimeters", APP_SOURCE)
        self.assertIn("function drawRoomWallDimensions", APP_SOURCE)
        self.assertIn("wallLengthsMillimeters: roomWallLengthsMillimeters", APP_SOURCE)
        self.assertIn("formatRoomWallLength(segment.lengthMillimeters)", APP_SOURCE)
        self.assertIn("for (const segment of lengths.segments", APP_SOURCE)

    def test_room_information_can_be_toggled_in_2d_and_3d(self):
        self.assertIn("function toggleRoomInformation", APP_SOURCE)
        self.assertIn("function drawRoomInformation", APP_SOURCE)
        self.assertIn("function updateThreeRoomLabels", APP_SOURCE)
        self.assertIn("roomLabelsGroup.visible = state.roomInfoVisible", APP_SOURCE)

    def test_room_metadata_is_persisted_and_restored(self):
        self.assertIn("roomMetadata: state.roomMetadata.map(cloneRoomMetadata)", APP_SOURCE)
        self.assertIn("archive.roomMetadata.map(cloneRoomMetadata)", APP_SOURCE)
        self.assertIn("roomInfoVisible: state.roomInfoVisible", APP_SOURCE)


if __name__ == "__main__":
    unittest.main()
