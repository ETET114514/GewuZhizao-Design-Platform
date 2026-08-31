import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
APP_SOURCE = (ROOT / "app.js").read_text(encoding="utf-8")
HTML_SOURCE = (ROOT / "index.html").read_text(encoding="utf-8")
FEATURES_SOURCE = (ROOT / "FEATURES.md").read_text(encoding="utf-8")


class QuantityReportContractTests(unittest.TestCase):
    def test_quantity_report_controls_exist(self):
        for element_id in (
            "quantityReportButton",
            "quantityReportModal",
            "quantityProjectSummary",
            "quantityRoomTableBody",
            "quantityOpeningTableBody",
            "quantityRailingTableBody",
            "quantityFurnitureTableBody",
            "quantityLightingSummary",
            "quantityTracePanel",
            "quantityTraceFormula",
            "quantityTraceSourceList",
            "quantityTraceHistory",
            "quantityExportCsvButton",
            "quantityExportJsonButton",
        ):
            self.assertIn(f'id="{element_id}"', HTML_SOURCE)

    def test_room_quantities_use_polygon_area_perimeter_and_opening_deductions(self):
        self.assertIn("function buildQuantityReport", APP_SOURCE)
        self.assertIn("roomAreaSquareMeters(room, settings)", APP_SOURCE)
        self.assertIn("quantityRoomBoundarySegments(room, settings)", APP_SOURCE)
        self.assertIn("grossWallArea - openingArea", APP_SOURCE)
        self.assertIn('opening.kind === "door" || opening.kind === "opening"', APP_SOURCE)

    def test_ceiling_area_defaults_to_floor_and_can_be_adjusted(self):
        self.assertIn('ceilingAreaSource === "manual"', APP_SOURCE)
        self.assertIn('"floor-area-default"', APP_SOURCE)
        self.assertIn("function commitQuantityCeilingArea", APP_SOURCE)
        self.assertIn('pushUndoSnapshot("edit-ceiling-area")', APP_SOURCE)

    def test_components_are_grouped_and_exported(self):
        for function_name in (
            "buildQuantityOpeningItems",
            "buildQuantityRailingItems",
            "buildQuantityFurnitureItems",
            "buildQuantityLightItems",
            "quantityReportToCsv",
            "exportQuantityReportJson",
            "exportQuantityReportCsv",
        ):
            self.assertIn(f"function {function_name}", APP_SOURCE)
        self.assertIn('schemaVersion: "gewu-quantity-report-v1"', APP_SOURCE)
        self.assertIn("window.GewuQuantityReport", APP_SOURCE)

    def test_quantity_items_include_formula_and_source_traceability(self):
        for contract in (
            'QUANTITY_RULE_VERSION = "gewu-quantity-rules-2026-08-31"',
            "function resolveQuantityTrace",
            "function bindQuantityTraceTarget",
            "function drawQuantityTraceHighlight",
            "sourceIds",
            "segmentCalculations",
            "deductions",
        ):
            self.assertIn(contract, APP_SOURCE)

    def test_ceiling_adjustments_are_recorded_and_persisted(self):
        self.assertIn("ceilingAreaAdjustments", APP_SOURCE)
        self.assertIn('action: "manual-edit"', APP_SOURCE)
        self.assertIn('action: "reset-to-floor-area"', APP_SOURCE)
        self.assertIn("previousSquareMeters", APP_SOURCE)
        self.assertIn("nextSquareMeters", APP_SOURCE)
        self.assertIn(".slice(-20)", APP_SOURCE)

    def test_feature_list_documents_quantity_report(self):
        for phrase in ("地面面积", "吊顶面积", "墙面面积", "踢脚线", "门窗清单", "家具清单", "灯光清单", "导出 CSV", "计算追溯", "吊顶调整记录"):
            self.assertIn(phrase, FEATURES_SOURCE)


if __name__ == "__main__":
    unittest.main()
