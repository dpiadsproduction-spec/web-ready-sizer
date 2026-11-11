/*
 * text.jsx - TextFrame helpers.
 *
 * Web design works in CSS px; Illustrator font sizes are points.
 * 1pt = 96/72 px, so sizePt = sizePx * 0.75.
 */

function wrsReadText(textFrame) {
    var result = {
        contents: "",
        font: "",
        style: "",
        sizePt: 0,
        weightGuess: 400,
        tracking: 0,
        leadingPt: 0,
        horizontalScale: 100,
        justification: "",
        caseStyle: "normal",
        mixedStyles: false
    };

    try { result.contents = textFrame.contents; } catch (eC) { }

    try {
        var attrs = textFrame.textRange.characterAttributes;
        result.sizePt = wrsRound(attrs.size, 2);
        result.tracking = wrsRound(attrs.tracking, 0);
        result.leadingPt = wrsRound(attrs.leading, 2);
        result.horizontalScale = wrsRound(attrs.horizontalScale, 0);
        result.caseStyle = wrsDescribeCase(attrs.capitalization);
        if (attrs.textFont) {
            result.font = attrs.textFont.name;
            result.style = attrs.textFont.style;
            result.weightGuess = wrsGuessWeight(attrs.textFont.name, attrs.textFont.style);
        }
    } catch (eA) { }

    try {
        result.justification = wrsDescribeJustification(textFrame.paragraphs[0].justification);
    } catch (eJ) { }

    try {
        if (textFrame.textRange.characterAttributes !== textFrame.characters[0].characterAttributes) {
            result.mixedStyles = wrsHasMixedStyles(textFrame);
        }
    } catch (eM) { }

    return result;
}

function wrsHasMixedStyles(textFrame) {
    try {
        var chars = textFrame.characters;
        if (chars.length < 2) return false;
        var first = chars[0].characterAttributes.size;
        for (var i = 1; i < chars.length; i++) {
            if (Math.abs(chars[i].characterAttributes.size - first) > 0.01) return true;
        }
    } catch (e) { }
    return false;
}

function wrsDescribeCase(cap) {
    try {
        if (cap === Capitalization.ALLUPPERCASE) return "uppercase";
        if (cap === Capitalization.ALLCAPITALIZE) return "capitalize";
        if (cap === Capitalization.ALLLOWERCASE) return "lowercase";
        if (cap === Capitalization.SMALLCAPS) return "small-caps";
    } catch (e) { }
    return "normal";
}

function wrsDescribeJustification(j) {
    try {
        if (j === Justification.LEFT) return "left";
        if (j === Justification.RIGHT) return "right";
        if (j === Justification.CENTER) return "center";
        if (j === Justification.FULLJUSTIFYLASTLINELEFT) return "justify";
    } catch (e) { }
    return "left";
}

function wrsGuessWeight(fontName, style) {
    var probe = (String(fontName) + " " + String(style)).toLowerCase();
    if (probe.indexOf("thin") !== -1 || probe.indexOf("hairline") !== -1) return 100;
    if (probe.indexOf("extralight") !== -1 || probe.indexOf("ultralight") !== -1) return 200;
    if (probe.indexOf("semibold") !== -1 || probe.indexOf("demibold") !== -1) return 600;
    if (probe.indexOf("extrabold") !== -1 || probe.indexOf("ultrabold") !== -1) return 800;
    if (probe.indexOf("black") !== -1 || probe.indexOf("heavy") !== -1) return 900;
    if (probe.indexOf("bold") !== -1) return 700;
    if (probe.indexOf("medium") !== -1) return 500;
    if (probe.indexOf("light") !== -1) return 300;
    if (probe.indexOf("italic") !== -1 || probe.indexOf("oblique") !== -1) return 400;
    return 400;
}

function wrsSetFontSizePx(index, sizePx) {
    var item = wrsFindItemByIndex(index);
    if (!item || item.typename !== "TextFrame") return { ok: false, error: "NOT_TEXT" };
    if (item.locked) return { ok: false, error: "LOCKED" };

    try {
        var sizePt = sizePx * 0.75;
        item.textRange.characterAttributes.size = sizePt;
        return { ok: true, sizePt: wrsRound(sizePt, 2), sizePx: wrsRound(sizePx, 2) };
    } catch (e) {
        return { ok: false, error: "FONT_SIZE_FAILED", detail: String(e) };
    }
}

function wrsSetTracking(index, trackingEm) {
    var item = wrsFindItemByIndex(index);
    if (!item || item.typename !== "TextFrame") return { ok: false, error: "NOT_TEXT" };
    try {
        item.textRange.characterAttributes.tracking = trackingEm * 1000;
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "TRACKING_FAILED", detail: String(e) };
    }
}

function wrsSetLeadingPx(index, leadingPx) {
    var item = wrsFindItemByIndex(index);
    if (!item || item.typename !== "TextFrame") return { ok: false, error: "NOT_TEXT" };
    try {
        item.textRange.characterAttributes.leading = leadingPx * 0.75;
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "LEADING_FAILED", detail: String(e) };
    }
}

function wrsSetCase(index, caseStyle) {
    var item = wrsFindItemByIndex(index);
    if (!item || item.typename !== "TextFrame") return { ok: false, error: "NOT_TEXT" };
    try {
        var cap = Capitalization.NORMAL;
        if (caseStyle === "uppercase") cap = Capitalization.ALLUPPERCASE;
        else if (caseStyle === "lowercase") cap = Capitalization.ALLLOWERCASE;
        else if (caseStyle === "capitalize") cap = Capitalization.ALLCAPITALIZE;
        else if (caseStyle === "small-caps") cap = Capitalization.SMALLCAPS;
        item.textRange.characterAttributes.capitalization = cap;
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "CASE_FAILED", detail: String(e) };
    }
}

function wrsApplyTextFill(textFrame, hex) {
    if (!hex || hex === "none") {
        textFrame.filled = false;
        return;
    }
    var rgb = wrsHexToRgb(hex);
    textFrame.filled = true;
    var attrs = textFrame.textRange.characterAttributes;
    attrs.fillColor = wrsMakeRgbColor(rgb.r, rgb.g, rgb.b);
}

function wrsSetFontFamily(index, familyName) {
    var item = wrsFindItemByIndex(index);
    if (!item || item.typename !== "TextFrame") return { ok: false, error: "NOT_TEXT" };

    var wanted = String(familyName).toLowerCase();
    try {
        for (var i = 0; i < app.textFonts.length; i++) {
            var font = app.textFonts[i];
            if (String(font.name).toLowerCase() === wanted ||
                String(font.family).toLowerCase() === wanted ||
                String(font.postScriptName).toLowerCase() === wanted) {
                item.textRange.characterAttributes.textFont = font;
                return { ok: true, applied: font.name };
            }
        }
    } catch (e) {
        return { ok: false, error: "FONT_FAILED", detail: String(e) };
    }
    return { ok: false, error: "FONT_NOT_FOUND", detail: familyName };
}
