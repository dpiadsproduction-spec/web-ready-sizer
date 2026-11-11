/*
 * colors.jsx - normalize Illustrator colors to RGB for the panel.
 */

function wrsReadColor(color) {
    if (!color) return { type: "none" };

    var t = color.typename;

    if (t === "RGBColor") {
        return {
            type: "rgb",
            r: wrsRound(color.red, 0),
            g: wrsRound(color.green, 0),
            b: wrsRound(color.blue, 0)
        };
    }

    if (t === "CMYKColor") {
        var rgb = wrsCmykToRgb(color.cyan, color.magenta, color.yellow, color.black);
        return {
            type: "cmyk",
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            c: wrsRound(color.cyan, 1),
            m: wrsRound(color.magenta, 1),
            y: wrsRound(color.yellow, 1),
            k: wrsRound(color.black, 1)
        };
    }

    if (t === "SpotColor") {
        var spot = wrsReadColor(color.spot.color);
        spot.type = "spot";
        spot.spotName = color.spot.name;
        try { spot.tint = color.tint; } catch (e) { }
        return spot;
    }

    if (t === "GradientColor") {
        return {
            type: "gradient",
            stops: wrsReadGradientStops(color.gradient)
        };
    }

    if (t === "PatternColor") {
        return { type: "pattern" };
    }

    if (t === "GrayColor") {
        var level = 255 - wrsRound(color.gray * 2.55, 0);
        return { type: "rgb", r: level, g: level, b: level, gray: color.gray };
    }

    if (t === "NoColor") return { type: "none" };

    return { type: "unknown" };
}

function wrsReadGradientStops(gradient) {
    var stops = [];
    try {
        for (var i = 0; i < gradient.gradientStops.length; i++) {
            var gs = gradient.gradientStops[i];
            var c = wrsReadColor(gs.color);
            stops.push({ rampPoint: gs.rampPoint, opacity: gs.opacity, color: c });
        }
    } catch (e) { }
    return stops;
}

function wrsCmykToRgb(c, m, y, k) {
    var cc = c / 100, mm = m / 100, yy = y / 100, kk = k / 100;
    var r = 255 * (1 - cc) * (1 - kk);
    var g = 255 * (1 - mm) * (1 - kk);
    var b = 255 * (1 - yy) * (1 - kk);
    return {
        r: wrsRound(r, 0),
        g: wrsRound(g, 0),
        b: wrsRound(b, 0)
    };
}

function wrsHexToRgb(hex) {
    var clean = String(hex).replace("#", "").trim();
    if (clean.length === 3) {
        clean = clean.charAt(0) + clean.charAt(0) +
                clean.charAt(1) + clean.charAt(1) +
                clean.charAt(2) + clean.charAt(2);
    }
    return {
        r: parseInt(clean.substring(0, 2), 16),
        g: parseInt(clean.substring(2, 4), 16),
        b: parseInt(clean.substring(4, 6), 16)
    };
}

function wrsRgbToHex(r, g, b) {
    return "#" + wrsToHex(r) + wrsToHex(g) + wrsToHex(b);
}

function wrsToHex(n) {
    var v = Math.round(wrsClamp(n, 0, 255)).toString(16).toUpperCase();
    return v.length === 1 ? "0" + v : v;
}

function wrsMakeRgbColor(r, g, b) {
    var c = new RGBColor();
    c.red = wrsClamp(r, 0, 255);
    c.green = wrsClamp(g, 0, 255);
    c.blue = wrsClamp(b, 0, 255);
    return c;
}

function wrsApplyFill(item, hex) {
    if (!hex || hex === "none") {
        item.filled = false;
        return true;
    }
    var rgb = wrsHexToRgb(hex);
    item.filled = true;
    item.fillColor = wrsMakeRgbColor(rgb.r, rgb.g, rgb.b);
    return true;
}

function wrsApplyStroke(item, hex, widthPx) {
    if (!hex || hex === "none") {
        item.stroked = false;
        return true;
    }
    var rgb = wrsHexToRgb(hex);
    item.stroked = true;
    item.strokeColor = wrsMakeRgbColor(rgb.r, rgb.g, rgb.b);
    if (widthPx !== null && widthPx !== undefined) {
        item.strokeWidth = widthPx;
    }
    return true;
}
