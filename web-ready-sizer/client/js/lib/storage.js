(function (root) {
    "use strict";

    var STORAGE_KEY = "wrs.settings.v1";
    var PRESETS_KEY = "wrs.presets.v1";
    var BREAKPOINTS_KEY = "wrs.breakpoints.v1";

    var DEFAULTS = {
        version: "1.0.0",
        ui: {
            language: "ar",
            direction: "rtl",
            theme: "dark",
            density: "comfortable",
            activeTab: "sizer"
        },
        conversion: {
            baseline: 16,
            preferredMode: "rem",
            activePreset: "tailwind-default"
        },
        features: {
            snapToGrid: true,
            colorMatching: true,
            rtlAware: true,
            autoRefresh: true,
            pollInterval: 700
        },
        sizer: {
            keepRatio: false,
            applyAll: false,
            anchorTopLeft: true
        },
        artboards: {
            height: 900,
            layout: "horizontal",
            spacing: 80
        }
    };

    function deepMerge(base, patch) {
        var out = {};
        var key;
        for (key in base) {
            if (Object.prototype.hasOwnProperty.call(base, key)) {
                out[key] = clone(base[key]);
            }
        }
        for (key in patch) {
            if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
            var value = patch[key];
            if (value && typeof value === "object" && !Array.isArray(value) &&
                out[key] && typeof out[key] === "object" && !Array.isArray(out[key])) {
                out[key] = deepMerge(out[key], value);
            } else {
                out[key] = value;
            }
        }
        return out;
    }

    function clone(value) {
        if (value === null || typeof value !== "object") return value;
        return JSON.parse(JSON.stringify(value));
    }

    var memory = {};

    function storageGet(key) {
        try {
            if (root.localStorage) {
                var raw = root.localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            }
        } catch (e) {
            if (root.console) root.console.warn("[storage] read failed", e);
        }
        return memory[key] || null;
    }

    function storageSet(key, value) {
        var serialized = JSON.stringify(value);
        try {
            if (root.localStorage) {
                root.localStorage.setItem(key, serialized);
                return true;
            }
        } catch (e) {
            if (root.console) root.console.warn("[storage] write failed", e);
        }
        memory[key] = JSON.parse(serialized);
        return false;
    }

    var settingsStore = {
        DEFAULTS: DEFAULTS,
        state: clone(DEFAULTS),

        load: function () {
            var stored = storageGet(STORAGE_KEY);
            this.state = stored ? deepMerge(DEFAULTS, stored) : clone(DEFAULTS);
            return this.state;
        },

        save: function () {
            storageSet(STORAGE_KEY, this.state);
            return this.state;
        },

        get: function (path) {
            var parts = String(path).split(".");
            var node = this.state;
            for (var i = 0; i < parts.length; i++) {
                if (node === null || node === undefined) return undefined;
                node = node[parts[i]];
            }
            return node;
        },

        set: function (path, value) {
            var parts = String(path).split(".");
            var node = this.state;
            for (var i = 0; i < parts.length - 1; i++) {
                var key = parts[i];
                if (!node[key] || typeof node[key] !== "object") node[key] = {};
                node = node[key];
            }
            node[parts[parts.length - 1]] = value;
            this.save();
            return value;
        },

        reset: function () {
            this.state = clone(DEFAULTS);
            this.save();
            return this.state;
        },

        exportJson: function () {
            return JSON.stringify(this.state, null, 2);
        },

        importJson: function (text) {
            var parsed = JSON.parse(text);
            if (!parsed || typeof parsed !== "object") {
                throw new Error("Invalid settings JSON");
            }
            this.state = deepMerge(DEFAULTS, parsed);
            this.save();
            return this.state;
        },

        loadPresets: function () {
            return storageGet(PRESETS_KEY) || [];
        },

        savePresets: function (presets) {
            storageSet(PRESETS_KEY, presets);
            return presets;
        },

        loadCustomBreakpoints: function () {
            return storageGet(BREAKPOINTS_KEY) || [];
        },

        saveCustomBreakpoints: function (list) {
            storageSet(BREAKPOINTS_KEY, list);
            return list;
        },

        clearAll: function () {
            try {
                if (root.localStorage) {
                    root.localStorage.removeItem(STORAGE_KEY);
                    root.localStorage.removeItem(PRESETS_KEY);
                    root.localStorage.removeItem(BREAKPOINTS_KEY);
                }
            } catch (e) { }
            memory = {};
            this.state = clone(DEFAULTS);
        }
    };

    root.WRS = root.WRS || {};
    root.WRS.settingsStore = settingsStore;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = settingsStore;
    }
}(typeof window !== "undefined" ? window : globalThis));
