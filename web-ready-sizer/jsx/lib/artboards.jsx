/*
 * artboards.jsx - create, resize and query artboards.
 *
 * Illustrator artboardRect format: [left, top, right, bottom]
 *   width  = right - left
 *   height = top - bottom      (top is numerically greater near the top)
 */

function wrsGetArtboards() {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };

    var list = [];
    var activeIndex = doc.artboards.getActiveArtboardIndex();

    for (var i = 0; i < doc.artboards.length; i++) {
        var ab = doc.artboards[i];
        var rect = ab.artboardRect;
        list.push({
            index: i,
            name: ab.name,
            left: wrsRound(rect[0], 2),
            top: wrsRound(rect[1], 2),
            right: wrsRound(rect[2], 2),
            bottom: wrsRound(rect[3], 2),
            width: wrsRound(rect[2] - rect[0], 2),
            height: wrsRound(rect[1] - rect[3], 2),
            active: (i === activeIndex)
        });
    }

    return { ok: true, artboards: list, activeIndex: activeIndex };
}

function wrsGetDocumentInfo() {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };

    return {
        ok: true,
        name: doc.name,
        colorSpace: String(doc.documentColorSpace),
        width: wrsRound(doc.width, 2),
        height: wrsRound(doc.height, 2),
        artboardCount: doc.artboards.length,
        activeArtboardIndex: doc.artboards.getActiveArtboardIndex()
    };
}

function wrsCreateArtboard(config) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };

    var width = Number(config.width);
    var height = Number(config.height);
    if (!width || !height || width <= 0 || height <= 0) {
        return { ok: false, error: "INVALID_SIZE" };
    }

    var left = Number(config.left);
    var top = Number(config.top);
    if (isNaN(left)) left = 0;
    if (isNaN(top)) top = 0;

    var rect = [left, top, left + width, top - height];

    try {
        var ab = doc.artboards.add(rect);
        if (config.name) {
            try { ab.name = String(config.name); } catch (eName) { }
        }
        return {
            ok: true,
            index: doc.artboards.length - 1,
            name: ab.name,
            width: width,
            height: height
        };
    } catch (e) {
        return { ok: false, error: "CREATE_FAILED", detail: String(e) };
    }
}

function wrsCreateArtboards(configList) {
    var created = [];
    var errors = [];
    for (var i = 0; i < configList.length; i++) {
        var res = wrsCreateArtboard(configList[i]);
        if (res.ok) created.push(res);
        else errors.push({ config: configList[i], error: res.error });
    }
    return { ok: errors.length === 0, created: created, count: created.length, errors: errors };
}

function wrsResizeArtboard(index, width, height) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };
    if (index < 0 || index >= doc.artboards.length) return { ok: false, error: "NO_ARTBOARD" };

    var ab = doc.artboards[index];
    var rect = ab.artboardRect;

    var newWidth = (width === null || width === undefined || isNaN(width)) ? (rect[2] - rect[0]) : Number(width);
    var newHeight = (height === null || height === undefined || isNaN(height)) ? (rect[1] - rect[3]) : Number(height);

    if (newWidth <= 0 || newHeight <= 0) return { ok: false, error: "INVALID_SIZE" };

    try {
        ab.artboardRect = [rect[0], rect[1], rect[0] + newWidth, rect[1] - newHeight];
        return {
            ok: true,
            width: newWidth,
            height: newHeight,
            name: ab.name,
            index: index
        };
    } catch (e) {
        return { ok: false, error: "RESIZE_FAILED", detail: String(e) };
    }
}

function wrsResizeCurrentArtboard(width, height) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };
    return wrsResizeArtboard(doc.artboards.getActiveArtboardIndex(), width, height);
}

function wrsRenameArtboard(index, name) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };
    if (index < 0 || index >= doc.artboards.length) return { ok: false, error: "NO_ARTBOARD" };
    try {
        doc.artboards[index].name = String(name);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: "RENAME_FAILED", detail: String(e) };
    }
}

function wrsFitArtboardToContent(index) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };
    try {
        if (doc.artboards[index].artboardRect) {
            doc.artboards.setActiveArtboardIndex(index);
            doc.fitArtboardToSelectedArt(index);
            return { ok: true };
        }
    } catch (e) {
        return { ok: false, error: "FIT_FAILED", detail: String(e) };
    }
    return { ok: false, error: "NO_ARTBOARD" };
}

function wrsGetElementsOnActiveArtboard() {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT", items: [] };

    var activeIndex = doc.artboards.getActiveArtboardIndex();
    var abRect = doc.artboards[activeIndex].artboardRect;
    var items = [];

    function walk(container) {
        for (var i = 0; i < container.pageItems.length; i++) {
            var item = container.pageItems[i];
            if (item.typename === "GroupItem") {
                items.push(item);
            } else {
                try {
                    var b = item.geometricBounds;
                    var cx = (b[0] + b[2]) / 2;
                    var cy = (b[1] + b[3]) / 2;
                    if (cx >= abRect[0] && cx <= abRect[2] && cy <= abRect[1] && cy >= abRect[3]) {
                        items.push(item);
                    }
                } catch (e) { }
            }
        }
    }

    for (var l = 0; l < doc.layers.length; l++) {
        if (doc.layers[l].visible) walk(doc.layers[l]);
    }

    var result = [];
    for (var j = 0; j < items.length; j++) {
        result.push(wrsReadItem(items[j], j));
    }
    return { ok: true, items: result };
}
