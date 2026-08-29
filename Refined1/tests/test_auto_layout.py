import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
APP_SOURCE = (ROOT / "app.js").read_text(encoding="utf-8")
HTML_SOURCE = (ROOT / "index.html").read_text(encoding="utf-8")


class AutoLayoutContractTests(unittest.TestCase):
    def test_auto_layout_controls_and_presets_exist(self):
        for element_id in (
            "autoLayoutButton",
            "autoLayoutModal",
            "autoLayoutPresetSelect",
            "autoLayoutReplaceInput",
            "generateAutoLayoutButton",
            "clearAutoLayoutButton",
        ):
            self.assertIn(f'id="{element_id}"', HTML_SOURCE)
        for preset in ("basic", "rental", "family"):
            self.assertIn(f'value="{preset}"', HTML_SOURCE)

    def test_room_templates_and_local_placeholder_products_are_available(self):
        self.assertIn("AUTO_LAYOUT_ROOM_TEMPLATES", APP_SOURCE)
        self.assertIn("AUTO_LAYOUT_ITEM_LIBRARY", APP_SOURCE)
        self.assertIn("function createAutoLayoutProduct", APP_SOURCE)
        self.assertIn("createInteriorProductMetadata", APP_SOURCE)
        self.assertIn("generated: true", APP_SOURCE)

    def test_layout_reuses_collision_and_room_containment(self):
        self.assertIn("function placeAutoLayoutProduct", APP_SOURCE)
        self.assertIn("productFitsInsideRoom(product, room)", APP_SOURCE)
        self.assertIn("findProductCollision(product)", APP_SOURCE)
        self.assertIn("function generateRoomPlacementCandidates", APP_SOURCE)

    def test_openings_have_clearance_zones(self):
        self.assertIn("function openingClearanceObb", APP_SOURCE)
        self.assertIn('kind: "opening-clearance"', APP_SOURCE)
        self.assertIn("for (const opening of constructibleOpenings())", APP_SOURCE)
        self.assertIn("前安全区", APP_SOURCE)

    def test_generated_products_can_be_replaced_without_removing_manual_products(self):
        self.assertIn("function removeAutoLayoutProductsWithoutRefresh", APP_SOURCE)
        self.assertIn("product.autoLayout?.generated === true", APP_SOURCE)
        self.assertIn("state.productModels.filter((product) => !generatedIds.has(product.id))", APP_SOURCE)
        self.assertIn('pushUndoSnapshot("generate-auto-layout")', APP_SOURCE)


if __name__ == "__main__":
    unittest.main()
