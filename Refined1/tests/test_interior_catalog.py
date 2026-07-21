import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = ROOT / "assets" / "interiors" / "catalog.json"
SCHEMA_PATH = ROOT / "assets" / "interiors" / "catalog.schema.json"


class InteriorCatalogTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))

    def test_catalog_contract(self):
        self.assertEqual(self.catalog["schemaVersion"], "gewu-interior-catalog-v1")
        self.assertEqual(self.catalog["units"], "millimeters")
        self.assertIsInstance(self.catalog["assets"], list)

    def test_json_schema_identifies_the_same_contract(self):
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        self.assertEqual(schema["properties"]["schemaVersion"]["const"], self.catalog["schemaVersion"])
        self.assertEqual(schema["properties"]["units"]["const"], self.catalog["units"])
        self.assertEqual(schema["$defs"]["asset"]["properties"]["collision"]["properties"]["type"]["const"], "box")

    def test_catalog_has_complete_extensible_category_set(self):
        categories = self.catalog["categories"]
        ids = [category["id"] for category in categories]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreaterEqual(len(ids), 20)
        for required in ("furniture", "storage", "kitchen", "sanitary", "appliance", "lighting", "decor", "hvac", "custom"):
            self.assertIn(required, ids)

    def test_registered_assets_use_supported_model_and_box_collision(self):
        for asset in self.catalog["assets"]:
            with self.subTest(asset=asset.get("id")):
                self.assertRegex(asset["id"], r"^[a-zA-Z0-9][a-zA-Z0-9._-]*$")
                model_uri = asset.get("model", {}).get("uri", "")
                if model_uri:
                    self.assertTrue(model_uri.lower().endswith((".glb", ".gltf")))
                self.assertEqual(asset.get("collision", {}).get("type", "box"), "box")


if __name__ == "__main__":
    unittest.main()
