(function (root) {
    "use strict";

    var tailwindData = (root.WRS && root.WRS.tailwindData) ||
        (typeof require !== "undefined" ? require("../data/tailwind-data.js") : null);

    var snapEngine = {
        gridFor: function (px) {
            if (px < 64) return 4;
            if (px < 256) return 8;
            return 16;
        },

        snapToTailwind: function (px, kind) {
            var value = Number(px);
            if (!isFinite(value) || value <= 0) return 0;

            var preset = root.WRS && root.WRS.presetEngine;
            var usePreset = preset && !preset.isDefault();
            if (usePreset) {
                var presetList = (kind === "font") ? preset.fontSizeList() : preset.spacingList();
                if (presetList.length) {
                    var near = null;
                    var nearDelta = Infinity;
                    for (var p = 0; p < presetList.length; p++) {
                        var pd = Math.abs(presetList[p].px - value);
                        if (pd < nearDelta) {
                            nearDelta = pd;
                            near = presetList[p];
                        }
                    }
                    if (near && nearDelta <= 0.5) return near.px;
                }
            }

            if (!tailwindData) return value;

            var list = (kind === "font")
                ? tailwindData.fontSizeList()
                : tailwindData.spacingList();

            var nearest = null;
            var bestDelta = Infinity;
            for (var i = 0; i < list.length; i++) {
                var delta = Math.abs(list[i].px - value);
                if (delta < bestDelta) {
                    bestDelta = delta;
                    nearest = list[i];
                }
            }

            if (nearest && bestDelta <= 0.5) return nearest.px;

            var grid = this.gridFor(value);
            var gridSnapped = Math.round(value / grid) * grid;

            if (nearest && Math.abs(nearest.px - gridSnapped) <= grid) {
                return nearest.px;
            }
            return gridSnapped;
        },

        snapFontSize: function (ptValue, baseline) {
            var conversion = root.WRS && root.WRS.conversionEngine;
            var px = conversion ? conversion.ptToPx(Number(ptValue)) : Number(ptValue) * (96 / 72);
            if (!tailwindData) return px;

            var list = tailwindData.fontSizeList();
            var nearest = list[0];
            var bestDelta = Math.abs(list[0].px - px);
            for (var i = 1; i < list.length; i++) {
                var delta = Math.abs(list[i].px - px);
                if (delta < bestDelta) {
                    bestDelta = delta;
                    nearest = list[i];
                }
            }
            return nearest.px;
        },

        clampDimension: function (px) {
            if (px < 1) return 1;
            if (px > 10000) return 10000;
            return px;
        }
    };

    root.WRS = root.WRS || {};
    root.WRS.snapEngine = snapEngine;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = snapEngine;
    }
}(typeof window !== "undefined" ? window : globalThis));
