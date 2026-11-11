(function (root) {
    "use strict";

    var state = {
        connected: false,
        hostVersion: null,
        lastError: null,
        useMock: false
    };

    var MOCK_DOC = {
        name: "Preview-Document.ai",
        colorSpace: "RGB",
        artboards: [
            { index: 0, name: "Artboard 1", left: 0, top: 900, right: 1440, bottom: 0, width: 1440, height: 900, active: true }
        ],
        activeIndex: 0,
        selection: []
    };

    function mockSelection() {
        return {
            ok: true,
            items: MOCK_DOC.selection.slice(),
            activeArtboardIndex: MOCK_DOC.activeIndex,
            documentName: MOCK_DOC.name,
            colorSpace: MOCK_DOC.colorSpace
        };
    }

    function makeMockElement(overrides) {
        var base = {
            index: 0,
            type: "PathItem",
            name: "Rectangle",
            path: "Layer 1 > Rectangle",
            locked: false,
            hidden: false,
            width: 80,
            height: 24,
            x: 120,
            y: 240,
            opacity: 100,
            fill: { type: "rgb", r: 30, g: 41, b: 59 },
            stroke: { type: "rgb", r: 20, g: 184, b: 166, width: 2 },
            cornerRadius: 8
        };
        var merged = {};
        for (var key in base) {
            if (Object.prototype.hasOwnProperty.call(base, key)) merged[key] = base[key];
        }
        for (var o in overrides || {}) {
            if (Object.prototype.hasOwnProperty.call(overrides, o)) merged[o] = overrides[o];
        }
        return merged;
    }

    function seedMockSelection() {
        if (MOCK_DOC.selection.length) return;
        MOCK_DOC.selection = [
            makeMockElement({ index: 0 }),
            makeMockElement({
                index: 1,
                type: "TextFrame",
                name: "Heading",
                path: "Layer 1 > Heading",
                width: 260,
                height: 48,
                fill: { type: "rgb", r: 226, g: 232, b: 240 },
                stroke: { type: "none", width: 0 },
                cornerRadius: 0,
                text: {
                    contents: "معاينة خارج Illustrator",
                    font: "Alexandria",
                    style: "Regular",
                    sizePt: 36,
                    weightGuess: 400,
                    tracking: 0,
                    leadingPt: 48,
                    horizontalScale: 100,
                    justification: "right",
                    caseStyle: "normal",
                    mixedStyles: false
                }
            })
        ];
    }

    function mockDispatch(action, args) {
        var a = args || {};
        seedMockSelection();

        switch (action) {
        case "ping":
            return { ok: true, host: "Illustrator (mock)", version: "24.0.0", name: "Illustrator" };
        case "getSelection":
            return mockSelection();
        case "getDocumentInfo":
            return {
                ok: true,
                name: MOCK_DOC.name,
                colorSpace: MOCK_DOC.colorSpace,
                width: 1440,
                height: 900,
                artboardCount: MOCK_DOC.artboards.length,
                activeArtboardIndex: MOCK_DOC.activeIndex
            };
        case "getArtboards":
            return { ok: true, artboards: MOCK_DOC.artboards.slice(), activeIndex: MOCK_DOC.activeIndex };
        case "resizeItem": {
            var item = MOCK_DOC.selection[a.index || 0];
            if (!item) return { ok: false, error: "NO_ITEM" };
            if (a.width) item.width = a.width;
            if (a.height) item.height = a.height;
            return { ok: true, width: item.width, height: item.height };
        }
        case "resizeAll": {
            for (var i = 0; i < MOCK_DOC.selection.length; i++) {
                if (a.width) MOCK_DOC.selection[i].width = a.width;
                if (a.height) MOCK_DOC.selection[i].height = a.height;
            }
            return { ok: true, results: [{ ok: true }] };
        }
        case "setFontSizePx": {
            var textItem = MOCK_DOC.selection[a.index || 0];
            if (textItem && textItem.text) textItem.text.sizePt = (a.sizePx || 16) * 0.75;
            return { ok: true, sizePx: a.sizePx };
        }
        case "applyStyles": {
            var target = MOCK_DOC.selection[a.index || 0];
            if (!target) return { ok: false, error: "NO_ITEM" };
            if (a.style && a.style.fill) {
                var c = a.style.fill.replace("#", "");
                target.fill = {
                    type: "rgb",
                    r: parseInt(c.substring(0, 2), 16),
                    g: parseInt(c.substring(2, 4), 16),
                    b: parseInt(c.substring(4, 6), 16)
                };
            }
            return { ok: true };
        }
        case "createArtboard": {
            var left = a.left === undefined ? MOCK_DOC.artboards.length * (a.width + 80) : a.left;
            var top = a.top === undefined ? 900 : a.top;
            var ab = {
                index: MOCK_DOC.artboards.length,
                name: a.name || ("Artboard " + (MOCK_DOC.artboards.length + 1)),
                left: left,
                top: top,
                right: left + a.width,
                bottom: top - a.height,
                width: a.width,
                height: a.height,
                active: false
            };
            MOCK_DOC.artboards.push(ab);
            return { ok: true, index: ab.index, name: ab.name, width: ab.width, height: ab.height };
        }
        case "createArtboards": {
            var created = [];
            for (var c2 = 0; c2 < (a.artboards || []).length; c2++) {
                created.push(mockDispatch("createArtboard", a.artboards[c2]));
            }
            return { ok: true, created: created, count: created.length, errors: [] };
        }
        case "resizeArtboard": {
            var board = MOCK_DOC.artboards[a.index];
            if (!board) return { ok: false, error: "NO_ARTBOARD" };
            if (a.width) { board.width = a.width; board.right = board.left + a.width; }
            if (a.height) { board.height = a.height; board.bottom = board.top - a.height; }
            return { ok: true, width: board.width, height: board.height };
        }
        case "resizeCurrentArtboard":
            return mockDispatch("resizeArtboard", {
                index: MOCK_DOC.activeIndex,
                width: a.width,
                height: a.height
            });
        case "collectElements": {
            seedMockSelection();
            return { ok: true, items: MOCK_DOC.selection.slice() };
        }
        case "collectDesignTokens":
            return {
                ok: true,
                colors: [{ hex: "#1E293B", usage: 3 }, { hex: "#14B8A6", usage: 2 }],
                fonts: [{ name: "Alexandria", family: "Alexandria", sizesPt: [36, 18] }]
            };
        case "saveTextFile":
        case "saveTextFileToPath":
            return { ok: false, error: "NO_FILESYSTEM_IN_PREVIEW" };
        case "pickColor":
            return { ok: false, error: "NO_PICKER_IN_PREVIEW" };
        default:
            return { ok: false, error: "UNKNOWN_ACTION", detail: action };
        }
    }

    var hostBridge = {
        state: state,

        isConnected: function () { return state.connected; },
        isMock: function () { return state.useMock; },

        connect: function () {
            return new Promise(function (resolve) {
                var cs = root.CSInterface;
                if (!cs) {
                    state.useMock = true;
                    state.connected = false;
                    resolve({ ok: false, mock: true, reason: "CSInterface not found" });
                    return;
                }
                try {
                    var csi = new cs();
                    root.__csi = csi;
                    csi.evalScript("wrsPing()", function (result) {
                        var parsed = safeParse(result);
                        if (parsed && parsed.ok) {
                            state.connected = true;
                            state.useMock = false;
                            state.hostVersion = parsed.version;
                            resolve({ ok: true, version: parsed.version });
                        } else {
                            state.connected = false;
                            state.useMock = true;
                            resolve({ ok: false, mock: true, reason: "evalScript failed", raw: result });
                        }
                    });
                } catch (e) {
                    state.connected = false;
                    state.useMock = true;
                    resolve({ ok: false, mock: true, reason: String(e) });
                }
            });
        },

        dispatch: function (action, args) {
            return new Promise(function (resolve) {
                if (state.useMock || !root.__csi) {
                    var mockResult;
                    try {
                        mockResult = mockDispatch(action, args);
                    } catch (e) {
                        mockResult = { ok: false, error: "MOCK_FAILED", detail: String(e) };
                    }
                    setTimeout(function () { resolve(mockResult); }, 30);
                    return;
                }

                var payload = JSON.stringify(args || {});
                var script = "wrsDispatch(" + JSON.stringify(action) + "," + JSON.stringify(payload) + ")";

                try {
                    root.__csi.evalScript(script, function (result) {
                        var parsed = safeParse(result);
                        if (!parsed) {
                            state.lastError = "Invalid host response";
                            resolve({ ok: false, error: "BAD_RESPONSE", raw: result });
                            return;
                        }
                        if (parsed.ok === false) {
                            state.lastError = parsed.error;
                        }
                        resolve(parsed);
                    });
                } catch (e) {
                    state.lastError = String(e);
                    resolve({ ok: false, error: "EVAL_FAILED", detail: String(e) });
                }
            });
        },

        ping: function () { return this.dispatch("ping"); },
        getSelection: function () { return this.dispatch("getSelection"); },
        getDocumentInfo: function () { return this.dispatch("getDocumentInfo"); },
        getArtboards: function () { return this.dispatch("getArtboards"); },
        resizeItem: function (index, width, height) {
            return this.dispatch("resizeItem", { index: index, width: width, height: height });
        },
        resizeAll: function (width, height) {
            return this.dispatch("resizeAll", { width: width, height: height });
        },
        setFontSizePx: function (index, sizePx) {
            return this.dispatch("setFontSizePx", { index: index, sizePx: sizePx });
        },
        setTracking: function (index, trackingEm) {
            return this.dispatch("setTracking", { index: index, trackingEm: trackingEm });
        },
        setLeadingPx: function (index, leadingPx) {
            return this.dispatch("setLeadingPx", { index: index, leadingPx: leadingPx });
        },
        setCase: function (index, caseStyle) {
            return this.dispatch("setCase", { index: index, caseStyle: caseStyle });
        },
        setFontFamily: function (index, family) {
            return this.dispatch("setFontFamily", { index: index, family: family });
        },
        setOpacity: function (index, opacity) {
            return this.dispatch("setOpacity", { index: index, opacity: opacity });
        },
        applyStyles: function (index, style) {
            return this.dispatch("applyStyles", { index: index, style: style });
        },
        createArtboard: function (config) { return this.dispatch("createArtboard", config); },
        createArtboards: function (list) { return this.dispatch("createArtboards", { artboards: list }); },
        resizeArtboard: function (index, width, height) {
            return this.dispatch("resizeArtboard", { index: index, width: width, height: height });
        },
        resizeCurrentArtboard: function (width, height) {
            return this.dispatch("resizeCurrentArtboard", { width: width, height: height });
        },
        renameArtboard: function (index, name) {
            return this.dispatch("renameArtboard", { index: index, name: name });
        },
        collectElements: function (scope) {
            return this.dispatch("collectElements", { scope: scope });
        },
        collectDesignTokens: function () { return this.dispatch("collectDesignTokens"); },
        saveTextFile: function (defaultName, content) {
            return this.dispatch("saveTextFile", { defaultName: defaultName, content: content });
        },
        pickColor: function (initialHex) {
            return this.dispatch("pickColor", { initialHex: initialHex });
        }
    };

    function safeParse(text) {
        if (text === null || text === undefined) return null;
        if (typeof text === "object") return text;
        try {
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    }

    root.WRS = root.WRS || {};
    root.WRS.hostBridge = hostBridge;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = hostBridge;
    }
}(typeof window !== "undefined" ? window : globalThis));
