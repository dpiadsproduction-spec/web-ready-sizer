(function (root) {
    "use strict";

    var presetsData = (root.WRS && root.WRS.presetsData) ||
        (typeof require !== "undefined" ? require("../data/presets-data.js") : []);

    var DEFAULT_ID = "tailwind-default";

    function toNumber(value) {
        var n = parseFloat(String(value));
        return isFinite(n) ? n : null;
    }

    function unitOf(value) {
        var match = String(value).trim().match(/(rem|px|em|%)$/);
        return match ? match[1] : "px";
    }

    function toPx(value, baseline) {
        var n = toNumber(value);
        if (n === null) return null;
        var unit = unitOf(value);
        if (unit === "px") return n;
        if (unit === "rem" || unit === "em") return n * (baseline || 16);
        if (unit === "%") return n / 100 * (baseline || 16);
        return n;
    }

    function nameOf(preset, lang) {
        if (!preset) return "";
        if (preset.name && typeof preset.name === "object") {
            return preset.name[lang] || preset.name.en || preset.name.ar || preset.id;
        }
        return preset.name || preset.id;
    }

    function describe(preset, lang) {
        if (!preset || !preset.description) return "";
        if (typeof preset.description === "object") {
            return preset.description[lang] || preset.description.en || preset.description.ar || "";
        }
        return preset.description;
    }

    function normalize(preset, baseline) {
        var base = Number(preset.baseline) || baseline || 16;
        var out = {
            id: preset.id,
            builtIn: !!preset.builtIn,
            baseline: base,
            htmlFontSize: preset.htmlFontSize || null,
            spacing: [],
            fontSize: []
        };
        var key;
        for (key in preset.spacing || {}) {
            if (!Object.prototype.hasOwnProperty.call(preset.spacing, key)) continue;
            var px = toPx(preset.spacing[key], base);
            if (px !== null) out.spacing.push({ token: key, px: px, value: preset.spacing[key] });
        }
        for (key in preset.fontSize || {}) {
            if (!Object.prototype.hasOwnProperty.call(preset.fontSize, key)) continue;
            var fpx = toPx(preset.fontSize[key], base);
            if (fpx !== null) out.fontSize.push({ token: key, px: fpx, value: preset.fontSize[key] });
        }
        out.spacing.sort(function (a, b) { return a.px - b.px; });
        out.fontSize.sort(function (a, b) { return a.px - b.px; });
        return out;
    }

    var presetEngine = {
        activeId: DEFAULT_ID,

        builtIns: function () {
            return presetsData.slice();
        },

        all: function () {
            var custom = [];
            if (root.WRS && root.WRS.settingsStore && root.WRS.settingsStore.loadPresets) {
                custom = root.WRS.settingsStore.loadPresets() || [];
            }
            return presetsData.concat(custom.map(function (preset) {
                preset.builtIn = false;
                if (!preset.id) preset.id = "custom-" + String(preset.name || "preset").toLowerCase().replace(/\s+/g, "-");
                return preset;
            }));
        },

        get: function (id) {
            var list = this.all();
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === id) return list[i];
            }
            return null;
        },

        name: nameOf,
        description: describe,

        isActive: function (id) {
            return this.activeId === id;
        },

        active: function () {
            return this.get(this.activeId) || this.get(DEFAULT_ID);
        },

        isDefault: function () {
            return this.activeId === DEFAULT_ID;
        },

        apply: function (id) {
            var preset = this.get(id);
            if (!preset) return null;
            this.activeId = id;

            var baseline = Number(preset.baseline) || 16;
            if (root.WRS && root.WRS.conversionEngine) {
                root.WRS.conversionEngine.setBaseline(baseline);
            }
            if (root.WRS && root.WRS.settingsStore) {
                root.WRS.settingsStore.set("conversion.baseline", baseline);
                root.WRS.settingsStore.set("conversion.activePreset", id);
            }
            return preset;
        },

        spacingList: function (lang) {
            if (this.isDefault()) {
                var tw = root.WRS && root.WRS.tailwindData;
                return tw ? tw.spacingList() : [];
            }
            var preset = this.active();
            if (!preset) return [];
            return normalize(preset, (root.WRS.conversionEngine && root.WRS.conversionEngine.config.baseline) || 16).spacing;
        },

        fontSizeList: function () {
            if (this.isDefault()) {
                var tw = root.WRS && root.WRS.tailwindData;
                return tw ? tw.fontSizeList() : [];
            }
            var preset = this.active();
            if (!preset) return [];
            return normalize(preset, (root.WRS.conversionEngine && root.WRS.conversionEngine.config.baseline) || 16).fontSize;
        },

        toPx: toPx,

        pxForSpacingToken: function (token) {
            var clean = String(token == null ? "" : token).trim()
                .replace(/^[wh]-/, "")
                .toLowerCase();
            if (clean === "") return null;
            var list = this.spacingList();
            for (var i = 0; i < list.length; i++) {
                if (String(list[i].token).toLowerCase() === clean) return list[i].px;
            }
            var asNumber = parseFloat(clean);
            if (!isFinite(asNumber)) return null;
            for (var j = 0; j < list.length; j++) {
                if (String(list[j].token) === String(asNumber)) return list[j].px;
            }
            return null;
        },

        pxForFontToken: function (token) {
            var clean = String(token == null ? "" : token).trim()
                .replace(/^text-/, "")
                .toLowerCase();
            if (clean === "") return null;
            var list = this.fontSizeList();
            for (var i = 0; i < list.length; i++) {
                if (String(list[i].token).toLowerCase() === clean) return list[i].px;
            }
            return null;
        },

        validate: function (preset) {
            var errors = [];
            if (!preset || typeof preset !== "object") {
                return ["Preset must be an object"];
            }
            if (!preset.name || String(preset.name).trim() === "") {
                errors.push("Preset needs a name");
            }
            if (!preset.spacing || typeof preset.spacing !== "object") {
                errors.push("Preset needs a spacing object");
            } else {
                for (var key in preset.spacing) {
                    if (!Object.prototype.hasOwnProperty.call(preset.spacing, key)) continue;
                    if (toPx(preset.spacing[key], 16) === null) {
                        errors.push("Invalid spacing value for " + key);
                    }
                }
            }
            return errors;
        }
    };

    root.WRS = root.WRS || {};
    root.WRS.presetEngine = presetEngine;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = presetEngine;
    }
}(typeof window !== "undefined" ? window : globalThis));
