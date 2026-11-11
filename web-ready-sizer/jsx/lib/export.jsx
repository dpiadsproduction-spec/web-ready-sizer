/*
 * export.jsx - collect full element trees for the export engine.
 */

function wrsCollectElements(scope) {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT", items: [] };

    var items = [];

    function readAll(container) {
        for (var i = 0; i < container.pageItems.length; i++) {
            var item = container.pageItems[i];
            items.push(wrsReadItem(item, items.length));
            if (item.typename === "GroupItem") {
                readAll(item);
            }
        }
    }

    if (scope === "selected") {
        for (var s = 0; s < doc.selection.length; s++) {
            var sel = doc.selection[s];
            items.push(wrsReadItem(sel, items.length));
            if (sel.typename === "GroupItem") readAll(sel);
        }
    } else if (scope === "artboard") {
        var res = wrsGetElementsOnActiveArtboard();
        items = res.items || [];
    } else {
        for (var l = 0; l < doc.layers.length; l++) {
            if (doc.layers[l].visible) readAll(doc.layers[l]);
        }
    }

    return { ok: true, items: items };
}

function wrsCollectDesignTokens() {
    var doc = wrsGetDocument();
    if (!doc) return { ok: false, error: "NO_DOCUMENT" };

    var colors = {};
    var fonts = {};

    function walk(container) {
        for (var i = 0; i < container.pageItems.length; i++) {
            var item = container.pageItems[i];

            try {
                if (item.filled && item.fillColor) {
                    var fill = wrsReadColor(item.fillColor);
                    if (fill.type === "rgb") {
                        var hex = wrsRgbToHex(fill.r, fill.g, fill.b);
                        colors[hex] = (colors[hex] || 0) + 1;
                    }
                }
            } catch (eF) { }

            try {
                if (item.stroked && item.strokeColor) {
                    var stroke = wrsReadColor(item.strokeColor);
                    if (stroke.type === "rgb") {
                        var shex = wrsRgbToHex(stroke.r, stroke.g, stroke.b);
                        colors[shex] = (colors[shex] || 0) + 1;
                    }
                }
            } catch (eS) { }

            try {
                if (item.typename === "TextFrame") {
                    var attrs = item.textRange.characterAttributes;
                    if (attrs.textFont) {
                        var key = attrs.textFont.name;
                        fonts[key] = fonts[key] || { family: attrs.textFont.family, name: attrs.textFont.name, sizes: {} };
                        fonts[key].sizes[wrsRound(attrs.size, 2)] = true;
                    }
                }
            } catch (eT) { }

            if (item.typename === "GroupItem") walk(item);
        }
    }

    for (var l = 0; l < doc.layers.length; l++) walk(doc.layers[l]);

    var colorList = [];
    for (var c in colors) {
        if (colors.hasOwnProperty(c)) colorList.push({ hex: c, usage: colors[c] });
    }

    var fontList = [];
    for (var f in fonts) {
        if (fonts.hasOwnProperty(f)) {
            var sizes = [];
            for (var sz in fonts[f].sizes) {
                if (fonts[f].sizes.hasOwnProperty(sz)) sizes.push(Number(sz));
            }
            sizes.sort(function (a, b) { return a - b; });
            fontList.push({ name: fonts[f].name, family: fonts[f].family, sizesPt: sizes });
        }
    }

    return { ok: true, colors: colorList, fonts: fontList };
}
