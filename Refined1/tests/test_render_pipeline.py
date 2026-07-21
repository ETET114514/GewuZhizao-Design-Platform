import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
APP_PATH = ROOT / "app.js"


class RenderPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = APP_PATH.read_text(encoding="utf-8")

    def test_renderer_uses_color_management_and_filmic_tone_mapping(self):
        self.assertIn("renderer.outputColorSpace = three.SRGBColorSpace", self.source)
        self.assertIn("renderer.toneMapping = three.ACESFilmicToneMapping", self.source)
        self.assertIn("renderer.toneMappingExposure = THREE_RENDER_DEFAULTS.exposure", self.source)

    def test_renderer_uses_environment_and_soft_shadows(self):
        self.assertIn("three.EquirectangularReflectionMapping", self.source)
        self.assertIn("scene.environment = texture", self.source)
        self.assertIn("renderer.shadowMap.type = three.PCFSoftShadowMap", self.source)
        self.assertIn("updateThreeLightingBounds(floorWidth, floorDepth)", self.source)

    def test_export_is_high_resolution_and_bounded(self):
        self.assertIn("THREE_RENDER_DEFAULTS.exportScale", self.source)
        self.assertIn("THREE_RENDER_DEFAULTS.maxExportDimension", self.source)
        self.assertIn("renderer.setSize(outputWidth, outputHeight, false)", self.source)

    def test_export_hides_editor_helpers(self):
        self.assertIn("function setThreePresentationMode(enabled)", self.source)
        self.assertIn("object.userData.renderHelper", self.source)
        self.assertIn("const restoreSelection = snapshotThreeSelection()", self.source)


if __name__ == "__main__":
    unittest.main()
