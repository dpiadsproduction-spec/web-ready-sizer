(function (root) {
    "use strict";

    var colorData = (root.WRS && root.WRS.tailwindColors) ||
        (typeof require !== "undefined" ? require("../data/tailwind-colors.js") : null);

    function clampChannel(value) {
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    function hexToRgb(hex) {
        var clean = String(hex).trim().replace(/^#/, "");
        if (clean.length === 3) {
            clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
        }
        if (clean.length !== 6 || /[^0-9a-fA-F]/.test(clean)) return null;
        return {
            r: parseInt(clean.substring(0, 2), 16),
            g: parseInt(clean.substring(2, 4), 16),
            b: parseInt(clean.substring(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(function (v) {
            var hex = Math.round(clampChannel(v / 255) * 255).toString(16).toUpperCase();
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    }

    function rgbToXyz(r, g, b) {
        var rl = srgbToLinear(r / 255);
        var gl = srgbToLinear(g / 255);
        var bl = srgbToLinear(b / 255);

        return {
            x: (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) * 100,
            y: (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) * 100,
            z: (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) * 100
        };
    }

    function srgbToLinear(value) {
        return value <= 0.04045
            ? value / 12.92
            : Math.pow((value + 0.055) / 1.055, 2.4);
    }

    function xyzToLab(xyz) {
        var refX = 95.047;
        var refY = 100.0;
        var refZ = 108.883;

        var fx = pivotXyz(xyz.x / refX);
        var fy = pivotXyz(xyz.y / refY);
        var fz = pivotXyz(xyz.z / refZ);

        return {
            l: 116 * fy - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }

    function pivotXyz(value) {
        var delta = 6 / 29;
        return value > Math.pow(delta, 3)
            ? Math.pow(value, 1 / 3)
            : (value / (3 * Math.pow(delta, 2)) + 4 / 29);
    }

    function hexToLab(hex) {
        var rgb = hexToRgb(hex);
        if (!rgb) return null;
        return xyzToLab(rgbToXyz(rgb.r, rgb.g, rgb.b));
    }

    function deltaE2000(lab1, lab2) {
        var L1 = lab1.l, a1 = lab1.a, b1 = lab1.b;
        var L2 = lab2.l, a2 = lab2.a, b2 = lab2.b;

        var kL = 1, kC = 1, kH = 1;

        var C1 = Math.sqrt(a1 * a1 + b1 * b1);
        var C2 = Math.sqrt(a2 * a2 + b2 * b2);
        var Cbar = (C1 + C2) / 2;

        var Cbar7 = Math.pow(Cbar, 7);
        var G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));

        var a1p = (1 + G) * a1;
        var a2p = (1 + G) * a2;

        var C1p = Math.sqrt(a1p * a1p + b1 * b1);
        var C2p = Math.sqrt(a2p * a2p + b2 * b2);

        var h1p = hueAngle(b1, a1p);
        var h2p = hueAngle(b2, a2p);

        var dLp = L2 - L1;
        var dCp = C2p - C1p;

        var dhp;
        if (C1p * C2p === 0) {
            dhp = 0;
        } else if (Math.abs(h2p - h1p) <= 180) {
            dhp = h2p - h1p;
        } else if (h2p - h1p > 180) {
            dhp = h2p - h1p - 360;
        } else {
            dhp = h2p - h1p + 360;
        }

        var dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(degToRad(dhp / 2));

        var Lbarp = (L1 + L2) / 2;
        var Cbarp = (C1p + C2p) / 2;

        var hbarp;
        if (C1p * C2p === 0) {
            hbarp = h1p + h2p;
        } else if (Math.abs(h1p - h2p) <= 180) {
            hbarp = (h1p + h2p) / 2;
        } else if (h1p + h2p < 360) {
            hbarp = (h1p + h2p + 360) / 2;
        } else {
            hbarp = (h1p + h2p - 360) / 2;
        }

        var T = 1
            - 0.17 * Math.cos(degToRad(hbarp - 30))
            + 0.24 * Math.cos(degToRad(2 * hbarp))
            + 0.32 * Math.cos(degToRad(3 * hbarp + 6))
            - 0.20 * Math.cos(degToRad(4 * hbarp - 63));

        var deltaTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));

        var Cbarp7 = Math.pow(Cbarp, 7);
        var RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
        var SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
        var SC = 1 + 0.045 * Cbarp;
        var SH = 1 + 0.015 * Cbarp * T;
        var RT = -Math.sin(degToRad(2 * deltaTheta)) * RC;

        var dL = dLp / (kL * SL);
        var dC = dCp / (kC * SC);
        var dH = dHp / (kH * SH);

        return Math.sqrt(dL * dL + dC * dC + dH * dH + RT * dC * dH);
    }

    function hueAngle(b, a) {
        if (a === 0 && b === 0) return 0;
        var angle = Math.atan2(b, a) * (180 / Math.PI);
        return angle >= 0 ? angle : angle + 360;
    }

    function degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    function confidenceFor(delta) {
        if (delta <= 2) return { level: "exact", label: "exact" };
        if (delta <= 5) return { level: "close", label: "close" };
        if (delta <= 10) return { level: "approximate", label: "approximate" };
        return { level: "distant", label: "distant" };
    }

    var colorMatcher = {
        hexToRgb: hexToRgb,
        rgbToHex: rgbToHex,
        hexToLab: hexToLab,
        deltaE2000: deltaE2000,
        confidenceFor: confidenceFor,

        nearestTailwindColor: function (hex, prefix) {
            var lab = hexToLab(hex);
            if (!lab || !colorData) return null;

            var best = null;
            var bestDelta = Infinity;

            for (var i = 0; i < colorData.flat.length; i++) {
                var candidate = colorData.flat[i];
                var candidateLab = hexToLab(candidate.hex);
                if (!candidateLab) continue;
                var delta = deltaE2000(lab, candidateLab);
                if (delta < bestDelta) {
                    bestDelta = delta;
                    best = candidate;
                }
            }

            if (!best) return null;

            var prefixOut = prefix || "bg";
            var confidence = confidenceFor(bestDelta);

            return {
                className: prefixOut + "-" + best.name + "-" + best.shade,
                name: best.name,
                shade: best.shade,
                hex: best.hex,
                deltaE: round(bestDelta, 3),
                confidence: confidence.level,
                confidenceLabel: confidence.label,
                exact: bestDelta <= 2
            };
        },

        allColorClasses: function () {
            if (!colorData) return [];
            return colorData.flat.map(function (c) {
                return { name: c.name, shade: c.shade, hex: c.hex };
            });
        },

        rgbString: function (rgb) {
            if (!rgb) return "transparent";
            return "rgb(" + rgb.r + " " + rgb.g + " " + rgb.b + ")";
        },

        luminance: function (hex) {
            var rgb = hexToRgb(hex);
            if (!rgb) return 0;
            var channels = [rgb.r, rgb.g, rgb.b].map(function (value) {
                var c = value / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        },

        contrastRatio: function (hexA, hexB) {
            var la = this.luminance(hexA);
            var lb = this.luminance(hexB);
            var lighter = Math.max(la, lb);
            var darker = Math.min(la, lb);
            return round((lighter + 0.05) / (darker + 0.05), 2);
        }
    };

    function round(value, decimals) {
        var mult = Math.pow(10, decimals || 0);
        return Math.round(value * mult) / mult;
    }

    root.WRS = root.WRS || {};
    root.WRS.colorMatcher = colorMatcher;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = colorMatcher;
    }
}(typeof window !== "undefined" ? window : globalThis));
