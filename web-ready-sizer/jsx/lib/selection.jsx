/*
 * selection.jsx - read the current selection from Illustrator.
 * All functions are index-based against doc.selection so no state is
 * stored on the user's artwork (no notes / tags written to documents).
 */

function wrsGetDocument() {
    if (app.documents.length === 0) return null;
    return app.activeDocument;
}

function wrsGetSelectionItems() {
    var doc = wrsGetDocument();
    if (!doc) {
        return { ok: false, error: "NO_DOCUMENT", items: [] };
    }

    var items = [];
    var sel = doc.selection;
    for (var i = 0; i < sel.length; i++) {
        var item = sel[i];
        if (!item) continue;
        items.push(wrsReadItem(item, i));
    }

    return {
        ok: true,
        items: items,
        activeArtboardIndex: doc.artboards.getActiveArtboardIndex(),
        documentName: doc.name,
        colorSpace: doc.documentColorSpace
    };
}

function wrsReadItem(item, index) {
    var data = {
        index: index,
        type: item.typename,
        name: item.name || item.typename,
        path: wrsGetItemPath(item),
        locked: item.locked === true,
        hidden: item.hidden === true,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        opacity: 0,
        fill: { type: "none" },
        stroke: { type: "none", width: 0 },
        cornerRadius: 0
    };

    try {
        if (item.width !== undefined) data.width = wrsRound(item.width, 2);
        if (item.height !== undefined) data.height = wrsRound(item.height, 2);
    } catch (eW) { }

    try {
        if (item.position && item.position.length === 2) {
            data.x = wrsRound(item.position[0], 2);
            data.y = wrsRound(item.position[1], 2);
        }
    } catch (eP) { }

    try {
        if (item.opacity !== undefined) data.opacity = item.opacity;
    } catch (eO) { }

    try {
        if (item.filled === false) {
            data.fill = { type: "none" };
        } else if (item.fillColor !== undefined) {
            data.fill = wrsReadColor(item.fillColor);
        }
    } catch (eF) { }

    try {
        if (item.stroked === false) {
            data.stroke = { type: "none", width: 0 };
        } else {
            var stroke = wrsReadColor(item.strokeColor);
            stroke.width = item.strokeWidth;
            data.stroke = stroke;
        }
    } catch (eS) { }

    try {
        if (item.typename === "TextFrame") {
            data.text = wrsReadText(item);
            data.width = wrsRound(item.width, 2);
            data.height = wrsRound(item.height, 2);
        }
    } catch (eT) { }

    try {
        if (item.typename === "GroupItem") {
            data.childCount = item.pageItems.length;
        }
    } catch (eG) { }

    return data;
}

function wrsGetItemPath(item) {
    var parts = [item.name || item.typename];
    try {
        var parent = item.parent;
        while (parent && parent.typename !== "Document") {
            var label = parent.name;
            if (!label) {
                if (parent.typename === "Layer") label = "Layer";
                else if (parent.typename === "GroupItem") label = "Group";
                else label = parent.typename;
            }
            parts.unshift(label);
            parent = parent.parent;
        }
    } catch (e) { }
    return parts.join(" > ");
}

function wrsFindItemByIndex(index) {
    var doc = wrsGetDocument();
    if (!doc) return null;
    if (index < 0 || index >= doc.selection.length) return null;
    return doc.selection[index];
}
