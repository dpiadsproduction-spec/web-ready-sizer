/*
 * shapes.jsx - resize and style PageItems.
 *
 * Sizing strategy:
 *   - If the item can be resized proportionally (PathItem, GroupItem...),
 *     use resize() with percentage scaling computed from the target size.
 *   - If it is a TextFrame we resize the frame box, not the glyphs, by
 *     adjusting the geometric bounds when possible.
 */

function wrsResizeItem(index, widthPx, heightPx, anchorTopLeft) {
    var item = wrsFindItemByIndex(index);
    if (!item) return { ok: false, error: "NO_ITEM" };
    if (item.locked) return { ok: false, error: "LOCKED" };

    var targetW = (widthPx === null || widthPx === undefined || isNaN(widthPx)) ? null : widthPx;
    var targetH = (heightPx === null || heightPx === undefined || isNaN(heightPx)) ? null : heightPx;

    if (targetW === null && targetH === null) {
        return { ok: false, error: "NO_TARGET" };
    }
    if (targetW !== null && targetW <= 0) return { ok: false, error: "INVALID_WIDTH" };
    if (targetH !== null && targetH <= 0) return { ok: false, error: "INVALID_HEIGHT" };

    try {
        if (targetW === null) targetW = item.width;
        if (targetH === null) targetH = item.height;

        var oldW = item.width;
        var oldH = item.height;
        if (oldW <= 0 || oldH <= 0) return { ok: false, error: "DEGENERATE_GEOMETRY" };

        var bounds = null;
        try { bounds = item.geometricBounds; } catch (eB) { }

        var left = bounds ? bounds[0] : null;
        var top = bounds ? bounds[1] : null;

        var sx = (targetW / oldW) * 100;
        var sy = (targetH / oldH) * 100;

        item.resize(sx, sy);

        if (anchorTopLeft && bounds) {
            var newBounds = item.geometricBounds;
            var dx = left - newBounds[0];
            var dy = top - newBounds[1];
            if (dx !== 0 || dy !== 0) item.translate(dx, dy);
        }

        return {
            ok: true,
            width: wrsRound(item.width, 2),
            height: wrsRound(item.height, 2)
        };
    } catch (e) {
        return { ok: false, error: "RESIZE_FAILED", detail: String(e) };
    }
}

function wrsResizeAll(widthPx, heightPx, anchorTopLeft) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };

    var results = [];
    for (var i = 0; i < doc.selection.length; i++) {
        results.push(wrsResizeItem(i, widthPx, heightPx, anchorTopLeft));
    }
    return { ok: true, results: results };
}

function wrsSetOpacity(index, opacityPercent) {
    var item = wrsFindItemByIndex(index);
    if (!item) return { ok: false, error: "NO_ITEM" };
    try {
        item.opacity = wrsClamp(opacityPercent, 0, 100);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "OPACITY_FAILED", detail: String(e) };
    }
}

function wrsApplyStyles(index, style) {
    var item = wrsFindItemByIndex(index);
    if (!item) return { ok: false, error: "NO_ITEM" };
    if (item.locked) return { ok: false, error: "LOCKED" };

    try {
        if (style.fill !== undefined) {
            if (item.typename === "TextFrame") {
                wrsApplyTextFill(item, style.fill);
            } else {
                wrsApplyFill(item, style.fill);
            }
        }
        if (style.stroke !== undefined) {
            wrsApplyStroke(item, style.stroke, style.strokeWidth);
        } else if (style.strokeWidth !== undefined && item.stroked) {
            item.strokeWidth = style.strokeWidth;
        }
        if (style.opacity !== undefined) {
            item.opacity = wrsClamp(style.opacity, 0, 100);
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "STYLE_FAILED", detail: String(e) };
    }
}
