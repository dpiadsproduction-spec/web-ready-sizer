(function (root) {
    "use strict";

    var SPACING = {
        "0": 0, "px": 1, "0.5": 2, "1": 4, "1.5": 6, "2": 8, "2.5": 10,
        "3": 12, "3.5": 14, "4": 16, "5": 20, "6": 24, "7": 28, "8": 32,
        "9": 36, "10": 40, "11": 44, "12": 48, "14": 56, "16": 64, "20": 80,
        "24": 96, "28": 112, "32": 128, "36": 144, "40": 160, "44": 176,
        "48": 192, "52": 208, "56": 224, "60": 240, "64": 256, "72": 288,
        "80": 320, "96": 384
    };

    var FONT_SIZE = {
        "xs": 12, "sm": 14, "base": 16, "lg": 18, "xl": 20, "2xl": 24,
        "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60, "7xl": 72, "8xl": 96, "9xl": 128
    };

    var FONT_WEIGHT = {
        "thin": 100, "extralight": 200, "light": 300, "normal": 400,
        "medium": 500, "semibold": 600, "bold": 700, "extrabold": 800, "black": 900
    };

    var TRACKING = {
        "tighter": -0.05, "tight": -0.025, "normal": 0,
        "wide": 0.025, "wider": 0.05, "widest": 0.1
    };

    var LEADING = {
        "none": 1, "tight": 1.25, "snug": 1.375, "normal": 1.5,
        "relaxed": 1.625, "loose": 2
    };

    var RADIUS = {
        "none": 0, "sm": 2, "DEFAULT": 4, "md": 6, "lg": 8,
        "xl": 12, "2xl": 16, "3xl": 24, "full": 9999
    };

    var BORDER_WIDTH = { "0": 0, "DEFAULT": 1, "2": 2, "4": 4, "8": 8 };

    var OPACITY = {
        "0": 0, "5": 0.05, "10": 0.1, "15": 0.15, "20": 0.2, "25": 0.25,
        "30": 0.3, "35": 0.35, "40": 0.4, "45": 0.45, "50": 0.5,
        "55": 0.55, "60": 0.6, "65": 0.65, "70": 0.7, "75": 0.75,
        "80": 0.8, "85": 0.85, "90": 0.9, "95": 0.95, "100": 1
    };

    var BREAKPOINTS = [
        { name: "sm", width: 640, label: "Mobile landscape" },
        { name: "md", width: 768, label: "Tablet portrait" },
        { name: "lg", width: 1024, label: "Tablet landscape" },
        { name: "xl", width: 1280, label: "Desktop" },
        { name: "2xl", width: 1536, label: "Large desktop" }
    ];

    function entries(obj) {
        var out = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                out.push({ token: key, px: obj[key] });
            }
        }
        return out;
    }

    var SPACING_LIST = entries(SPACING).sort(function (a, b) { return a.px - b.px; });
    var FONT_SIZE_LIST = entries(FONT_SIZE).sort(function (a, b) { return a.px - b.px; });

    function nearestFromList(list, px) {
        if (!list.length) return null;
        var best = list[0];
        var bestDelta = Math.abs(best.px - px);
        for (var i = 1; i < list.length; i++) {
            var delta = Math.abs(list[i].px - px);
            if (delta < bestDelta) {
                best = list[i];
                bestDelta = delta;
            }
        }
        return { entry: best, delta: bestDelta };
    }

    function tokenForPx(map, px) {
        for (var key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key) && map[key] === px) {
                return key;
            }
        }
        return null;
    }

    var tailwindData = {
        spacing: SPACING,
        fontSize: FONT_SIZE,
        fontWeight: FONT_WEIGHT,
        tracking: TRACKING,
        leading: LEADING,
        radius: RADIUS,
        borderWidth: BORDER_WIDTH,
        opacity: OPACITY,
        breakpoints: BREAKPOINTS,

        spacingList: function () { return SPACING_LIST.slice(); },
        fontSizeList: function () { return FONT_SIZE_LIST.slice(); },

        spacingTokenForPx: function (px) { return tokenForPx(SPACING, px); },
        fontSizeTokenForPx: function (px) { return tokenForPx(FONT_SIZE, px); },
        radiusTokenForPx: function (px) { return tokenForPx(RADIUS, px); },
        borderTokenForPx: function (px) { return tokenForPx(BORDER_WIDTH, px); },
        weightTokenForValue: function (value) { return tokenForPx(FONT_WEIGHT, value); },

        nearestSpacing: function (px) {
            var r = nearestFromList(SPACING_LIST, px);
            return r ? r.entry : null;
        },

        nearestFontSize: function (px) {
            var r = nearestFromList(FONT_SIZE_LIST, px);
            return r ? r.entry : null;
        },

        widthClass: function (px, prefix) {
            var token = tokenForPx(SPACING, Math.round(px));
            var p = prefix || "w";
            if (token !== null) return p + "-" + token;
            return p + "-[" + Math.round(px) + "px]";
        },

        heightClass: function (px) {
            return this.widthClass(px, "h");
        },

        fontSizeClass: function (px) {
            var token = tokenForPx(FONT_SIZE, Math.round(px));
            if (token !== null) return "text-" + token;
            return "text-[" + Math.round(px) + "px]";
        },

        weightClass: function (value) {
            var token = tokenForPx(FONT_WEIGHT, value);
            return token !== null ? "font-" + token : "font-[" + value + "]";
        },

        radiusClass: function (px) {
            var token = tokenForPx(RADIUS, Math.round(px));
            if (token === null) return "rounded-[" + Math.round(px) + "px]";
            if (token === "DEFAULT") return "rounded";
            return "rounded-" + token;
        },

        borderWidthClass: function (px) {
            var token = tokenForPx(BORDER_WIDTH, Math.round(px));
            if (token === null) return "border-[" + Math.round(px) + "px]";
            if (token === "DEFAULT") return "border";
            return "border-" + token;
        },

        opacityClass: function (fraction) {
            var pct = Math.round(fraction * 100);
            var token = tokenForPx(OPACITY, pct / 100);
            return token !== null ? "opacity-" + token : "opacity-[" + pct + "]";
        },

        trackingClass: function (em) {
            var best = null;
            var bestDelta = Infinity;
            for (var key in TRACKING) {
                if (Object.prototype.hasOwnProperty.call(TRACKING, key)) {
                    var delta = Math.abs(TRACKING[key] - em);
                    if (delta < bestDelta) { bestDelta = delta; best = key; }
                }
            }
            return "tracking-" + best;
        },

        leadingClass: function (ratio) {
            var best = null;
            var bestDelta = Infinity;
            for (var key in LEADING) {
                if (Object.prototype.hasOwnProperty.call(LEADING, key)) {
                    var delta = Math.abs(LEADING[key] - ratio);
                    if (delta < bestDelta) { bestDelta = delta; best = key; }
                }
            }
            return "leading-" + best;
        },

        breakpointForWidth: function (width) {
            var sorted = BREAKPOINTS.slice().sort(function (a, b) { return a.width - b.width; });
            for (var i = 0; i < sorted.length; i++) {
                if (width <= sorted[i].width) return sorted[i];
            }
            return sorted[sorted.length - 1];
        },

        parseDimensionToken: function (token) {
            var clean = String(token).trim().replace(/^(w|h)-/, "");
            if (Object.prototype.hasOwnProperty.call(SPACING, clean)) {
                return SPACING[clean];
            }
            var arbitrary = clean.match(/^\[(\d+(?:\.\d+)?)px\]$/);
            if (arbitrary) return parseFloat(arbitrary[1]);
            return null;
        },

        parseFontSizeToken: function (token) {
            var clean = String(token).trim().replace(/^text-/, "");
            if (Object.prototype.hasOwnProperty.call(FONT_SIZE, clean)) {
                return FONT_SIZE[clean];
            }
            var arbitrary = clean.match(/^\[(\d+(?:\.\d+)?)px\]$/);
            if (arbitrary) return parseFloat(arbitrary[1]);
            return null;
        }
    };

    root.WRS = root.WRS || {};
    root.WRS.tailwindData = tailwindData;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = tailwindData;
    }
}(typeof window !== "undefined" ? window : globalThis));
