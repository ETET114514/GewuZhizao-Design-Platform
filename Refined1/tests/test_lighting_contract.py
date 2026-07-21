import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
APP_SOURCE = (ROOT / "app.js").read_text(encoding="utf-8")
HTML_SOURCE = (ROOT / "index.html").read_text(encoding="utf-8")


class LightingContractTests(unittest.TestCase):
    def test_manual_point_and_line_light_controls_exist(self):
        for element_id in (
            "threeLightingButton",
            "addPointLightButton",
            "addLineLightButton",
            "lightingColorInput",
            "lightingTemperatureInput",
            "lightingBrightnessInput",
        ):
            self.assertIn(f'id="{element_id}"', HTML_SOURCE)

    def test_line_light_is_built_from_distributed_point_lights(self):
        self.assertIn('source.type === "line"', APP_SOURCE)
        self.assertIn("Math.ceil(lengthMeters / 0.55)", APP_SOURCE)
        self.assertIn("new three.PointLight", APP_SOURCE)
        self.assertIn("source.brightnessLumens / count", APP_SOURCE)

    def test_lighting_products_receive_attached_point_lights(self):
        self.assertIn('product.category !== "lighting"', APP_SOURCE)
        self.assertIn("ownerProductId: product.id", APP_SOURCE)
        self.assertIn("product.lightSourceId = source.id", APP_SOURCE)
        self.assertIn("removeLightSourcesForProduct(product.id)", APP_SOURCE)

    def test_project_archive_persists_lights(self):
        self.assertIn("version: 3", APP_SOURCE)
        self.assertIn("lightSources: state.lightSources.map(cloneLightSource)", APP_SOURCE)
        self.assertIn("archive.lightSources.map(normalizeLightSource)", APP_SOURCE)

    def test_public_lighting_api_is_available(self):
        self.assertIn("window.GewuLighting = Object.freeze", APP_SOURCE)
        self.assertIn('addPoint: () => addManualLightSource("point")', APP_SOURCE)
        self.assertIn('addLine: () => addManualLightSource("line")', APP_SOURCE)


if __name__ == "__main__":
    unittest.main()
