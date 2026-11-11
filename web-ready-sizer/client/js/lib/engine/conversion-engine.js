(function (root) {
    "use strict";

    var data = root.WRS && root.WRS.tailwindData;

    var DEFAULT_CONFIG = {
        baseline: 16,
        dpi: 96,
        use62Trick: false
    };

    var conversionEngine = {
        config: {
            baseline: DEFAULT_CONFIG.baseline,
            dpi: DEFAULT_CONFIG.dpi,
            use62Trick: false
        },

        setBaseline: function (px) {
            var value = Number(px);
            if (!value || value <= 0) return;
            this.config.baseline = value;
            this.config.use62Trick = (value === 10);
        },

        resetBaseline: function () {
            this.config.baseline = DEFAULT_CONFIG.baseline;
            this.config.use62Trick = false;
        },

        remToPx: function (rem) {
            return round(Number(rem) * this.config.baseline, 4);
        },

        pxToRem: function (px) {
            return round(Number(px) / this.config.baseline, 4);
        },

        ptToPx: function (pt) {
            return round(Number(pt) * (this.config.dpi / 72), 4);
        },

        pxToPt: function (px) {
            return round(Number(px) * (72 / this.config.dpi), 4);
        },

        remToPt: function (rem) {
            return round(this.pxToPt(this.remToPx(rem)), 4);
        },

        ptToRem: function (pt) {
            return round(this.pxToRem(this.ptToPx(pt)), 4);
        },

        emToPx: function (em, fontSizePx) {
            return round(Number(em) * (fontSizePx || this.config.baseline), 4);
        },

        parseValue: function (input) {
            if (input === null || input === undefined) return null;
            var text = String(input).trim().toLowerCase();
            if (text === "") return null;

            var twMatch = text.match(/^(w|h|text)-(.*)$/);
            if (twMatch && data) {
                var px;
                if (twMatch[1] === "text") {
                    px = data.parseFontSizeToken(text);
                } else {
                    px = data.parseDimensionToken(text);
                }
                if (px !== null && px !== undefined) {
                    return {
                        value: px,
                        unit: "px",
                        original: input,
                        source: "tailwind",
                        rem: this.pxToRem(px)
                    };
                }
                return null;
            }

            var remMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*rem$/);
            if (remMatch) {
                return { value: parseFloat(remMatch[1]), unit: "rem", original: input, source: "rem" };
            }

            var ptMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*pt$/);
            if (ptMatch) {
                return { value: parseFloat(ptMatch[1]), unit: "pt", original: input, source: "pt" };
            }

            var pxMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*(px)?$/);
            if (pxMatch) {
                return { value: parseFloat(pxMatch[1]), unit: "px", original: input, source: "px" };
            }

            return null;
        },

        toPx: function (input) {
            var parsed = this.parseValue(input);
            if (!parsed) return null;
            if (parsed.unit === "px") return parsed.value;
            if (parsed.unit === "rem") return this.remToPx(parsed.value);
            if (parsed.unit === "pt") return this.ptToPx(parsed.value);
            return null;
        },

        fontToPx: function (input) {
            if (input === null || input === undefined) return null;
            var text = String(input).trim().toLowerCase();
            if (text === "") return null;

            if (data && text.indexOf("text-") === 0) {
                var px = data.parseFontSizeToken(text);
                return (px === null || px === undefined) ? null : px;
            }

            var remMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*rem$/);
            if (remMatch) return this.remToPx(parseFloat(remMatch[1]));

            var ptMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*pt$/);
            if (ptMatch) return this.ptToPx(parseFloat(ptMatch[1]));

            var pxMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*(px)?$/);
            if (pxMatch) {
                var n = parseFloat(pxMatch[1]);
                return n;
            }

            return null;
        },

        formatDimension: function (px) {
            var rem = this.pxToRem(px);
            return {
                px: round(px, 2),
                rem: round(rem, 3),
                remLabel: round(rem, 3) + "rem",
                pxLabel: round(px, 2) + "px"
            };
        },

        isTailwindCompatible: function (px) {
            return Math.abs(Number(px) % 4) < 1e-6;
        },

        describe: function (px, kind) {
            if (!data) return String(px);
            var cls = kind === "font" ? data.fontSizeClass(px) : data.widthClass(px);
            var rem = this.pxToRem(px);
            return cls + " / " + round(px, 2) + "px / " + round(rem, 3) + "rem";
        }
    };

    function round(value, decimals) {
        var mult = Math.pow(10, decimals || 0);
        return Math.round(value * mult) / mult;
    }

    root.WRS = root.WRS || {};
    root.WRS.conversionEngine = conversionEngine;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = conversionEngine;
    }
}(typeof window !== "undefined" ? window : globalThis));
