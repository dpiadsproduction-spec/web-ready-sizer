/*
 * host.jsx - ExtendScript entry point for Web-Ready Sizer.
 *
 * The CEP panel talks to Illustrator exclusively through wrsDispatch(),
 * which takes an action name plus a JSON argument string and returns a
 * JSON string. Every payload is wrapped in { ok: boolean, ... }.
 *
 * ExtendScript is ES3: no arrow functions, no let/const, no template
 * literals. Keep this file defensive: Illustrator throws very unhelpful
 * errors for some property accesses on some object types.
 */

#include "json2.jsx"
#include "polyfills.jsx"
#include "lib/colors.jsx"
#include "lib/selection.jsx"
#include "lib/shapes.jsx"
#include "lib/text.jsx"
#include "lib/artboards.jsx"
#include "lib/files.jsx"
#include "lib/export.jsx"

function wrsDispatch(action, argsJson) {
    var args = {};
    try {
        if (argsJson) args = JSON.parse(argsJson);
    } catch (eParse) {
        return JSON.stringify({ ok: false, error: "BAD_ARGS", detail: String(eParse) });
    }

    try {
        if (action === "ping") {
            return JSON.stringify({
                ok: true,
                host: "Illustrator",
                version: String(app.version),
                name: app.name
            });
        }

        if (action === "getSelection") {
            return JSON.stringify(wrsGetSelectionItems());
        }

        if (action === "getArtboards") {
            return JSON.stringify(wrsGetArtboards());
        }

        if (action === "getDocumentInfo") {
            return JSON.stringify(wrsGetDocumentInfo());
        }

        if (action === "resizeItem") {
            return JSON.stringify(wrsResizeItem(args.index, args.width, args.height, args.anchorTopLeft !== false));
        }

        if (action === "resizeAll") {
            return JSON.stringify(wrsResizeAll(args.width, args.height, args.anchorTopLeft !== false));
        }

        if (action === "setFontSizePx") {
            return JSON.stringify(wrsSetFontSizePx(args.index, args.sizePx));
        }

        if (action === "setTracking") {
            return JSON.stringify(wrsSetTracking(args.index, args.trackingEm));
        }

        if (action === "setLeadingPx") {
            return JSON.stringify(wrsSetLeadingPx(args.index, args.leadingPx));
        }

        if (action === "setCase") {
            return JSON.stringify(wrsSetCase(args.index, args.caseStyle));
        }

        if (action === "setFontFamily") {
            return JSON.stringify(wrsSetFontFamily(args.index, args.family));
        }

        if (action === "setOpacity") {
            return JSON.stringify(wrsSetOpacity(args.index, args.opacity));
        }

        if (action === "applyStyles") {
            return JSON.stringify(wrsApplyStyles(args.index, args.style || {}));
        }

        if (action === "createArtboard") {
            return JSON.stringify(wrsCreateArtboard(args));
        }

        if (action === "createArtboards") {
            return JSON.stringify(wrsCreateArtboards(args.artboards || []));
        }

        if (action === "resizeArtboard") {
            return JSON.stringify(wrsResizeArtboard(args.index, args.width, args.height));
        }

        if (action === "resizeCurrentArtboard") {
            return JSON.stringify(wrsResizeCurrentArtboard(args.width, args.height));
        }

        if (action === "renameArtboard") {
            return JSON.stringify(wrsRenameArtboard(args.index, args.name));
        }

        if (action === "fitArtboardToContent") {
            return JSON.stringify(wrsFitArtboardToContent(args.index));
        }

        if (action === "getElementsOnActiveArtboard") {
            return JSON.stringify(wrsGetElementsOnActiveArtboard());
        }

        if (action === "collectElements") {
            return JSON.stringify(wrsCollectElements(args.scope || "selected"));
        }

        if (action === "collectDesignTokens") {
            return JSON.stringify(wrsCollectDesignTokens());
        }

        if (action === "saveTextFile") {
            return JSON.stringify(wrsSaveTextFile(args.defaultName, String(args.content)));
        }

        if (action === "pickColor") {
            return JSON.stringify(wrsSelectColorDialog(args.initialHex));
        }

        return JSON.stringify({ ok: false, error: "UNKNOWN_ACTION", detail: String(action) });
    } catch (e) {
        return JSON.stringify({
            ok: false,
            error: "HOST_EXCEPTION",
            detail: String(e),
            action: String(action)
        });
    }
}

function wrsPing() {
    return wrsDispatch("ping", "{}");
}

function wrsGetVersion() {
    return String(app.version);
}
