(function (root) {
    "use strict";

    var WRS = root.WRS;
    var state = {
        mode: "rem",
        selection: [],
        lastEdited: "width",
        originalWidth: 0,
        originalHeight: 0,
        initialized: false
    };

    function $(id) { return document.getElementById(id); }

    function i18n(key) {
        return WRS.i18n.t(key);
    }

    function parseByMode(input, kind) {
        var engine = WRS.conversionEngine;
        if (!input || String(input).trim() === "") return null;

        if (state.mode === "rem") {
            var rem = String(input).trim().replace(/\s*rem$/i, "");
            var value = parseFloat(rem);
            if (isNaN(value)) return null;
            return engine.remToPx(value);
        }

        if (state.mode === "tailwind") {
            var token = String(input).trim();
            if (kind === "font") {
                var fontPx = engine.fontToPx(token.indexOf("text-") === 0 ? token : "text-" + token);
                if (fontPx === null && WRS.presetEngine && !WRS.presetEngine.isDefault()) {
                    return WRS.presetEngine.pxForFontToken(token);
                }
                return fontPx;
            }
            var dimPx = engine.toPx(token.indexOf("w-") === 0 || token.indexOf("h-") === 0 ? token : "w-" + token);
            if (dimPx === null && WRS.presetEngine && !WRS.presetEngine.isDefault()) {
                return WRS.presetEngine.pxForSpacingToken(token);
            }
            return dimPx;
        }

        return engine.toPx(input);
    }

    function updateNotes() {
        var engine = WRS.conversionEngine;
        var tw = WRS.tailwindData;

        var widthPx = parseByMode($("input-width").value, "dimension");
        var heightPx = parseByMode($("input-height").value, "dimension");
        var fontPx = parseByMode($("input-font").value, "font");

        $("width-note").innerHTML = widthPx === null ? "" : noteHtml(widthPx, "width");
        $("height-note").innerHTML = heightPx === null ? "" : noteHtml(heightPx, "height");

        if (fontPx !== null && fontPx > 0) {
            $("font-note").innerHTML = "<strong>" + tw.fontSizeClass(fontPx) + "</strong> = " +
                round(fontPx, 2) + "px = " + round(engine.pxToPt(fontPx), 2) + "pt";
        } else {
            $("font-note").innerHTML = "";
        }

        markValidity("width-shell", $("input-width").value, widthPx);
        markValidity("height-shell", $("input-height").value, heightPx);
        markValidity("font-shell", $("input-font").value, fontPx);

        function noteHtml(pxValue, kind) {
            var cls = kind === "font" ? tw.fontSizeClass(pxValue) : tw.widthClass(pxValue);
            var label = kind === "font" ? tw.fontSizeClass(pxValue) : tw.heightClass(pxValue);
            return "<strong>" + cls + "</strong> = " + round(pxValue, 2) + "px = " +
                round(engine.pxToRem(pxValue), 3) + "rem" +
                (kind === "font" ? "" : " &middot; " + label);
        }

        function markValidity(shellId, raw, parsed) {
            var shell = $(shellId);
            if (!shell) return;
            var hasValue = raw && String(raw).trim() !== "";
            if (hasValue && parsed === null) shell.classList.add("invalid");
            else shell.classList.remove("invalid");
        }
    }

    function round(value, decimals) {
        var mult = Math.pow(10, decimals || 0);
        return Math.round(value * mult) / mult;
    }

    function syncFromSelection() {
        var items = state.selection;
        var hasSelection = items && items.length > 0;

        $("sizer-empty").classList.toggle("hidden", !!hasSelection);
        $("btn-apply-sizer").disabled = !hasSelection;
        $("btn-reset-sizer").disabled = !hasSelection;

        if (!hasSelection) {
            $("input-width").value = "";
            $("input-height").value = "";
            $("input-font").value = "";
            $("font-field").classList.add("hidden");
            updateNotes();
            return;
        }

        var primary = items[0];
        state.originalWidth = primary.width || 0;
        state.originalHeight = primary.height || 0;

        var mixedW = false;
        var mixedH = false;
        for (var i = 1; i < items.length; i++) {
            if (Math.abs((items[i].width || 0) - (primary.width || 0)) > 0.01) mixedW = true;
            if (Math.abs((items[i].height || 0) - (primary.height || 0)) > 0.01) mixedH = true;
        }

        $("input-width").value = mixedW ? "" : toModeValue(primary.width, "dimension");
        $("input-height").value = mixedH ? "" : toModeValue(primary.height, "dimension");

        var fontField = $("font-field");
        if (primary.type === "TextFrame" && primary.text) {
            fontField.classList.remove("hidden");
            $("input-font").value = toModeValue(
                WRS.conversionEngine.ptToPx(primary.text.sizePt),
                "font"
            );
        } else {
            fontField.classList.add("hidden");
        }

        updateNotes();
    }

    function toModeValue(pxValue, kind) {
        if (pxValue === null || pxValue === undefined) return "";
        if (state.mode === "rem") {
            return String(round(WRS.conversionEngine.pxToRem(pxValue), 3)) + "rem";
        }
        if (state.mode === "tailwind") {
            if (kind === "font") return WRS.tailwindData.fontSizeClass(pxValue);
            return WRS.tailwindData.widthClass(pxValue);
        }
        return String(round(pxValue, 2));
    }

    function renderQuickPicks() {
        var container = $("quick-picks");
        if (!container) return;
        var engine = WRS.presetEngine;
        var custom = engine && !engine.isDefault();
        var source = (custom ? engine.spacingList() : WRS.tailwindData.spacingList());
        var list = state.mode === "tailwind" ? source : source.slice(0, 18);

        var html = "";
        for (var i = 0; i < list.length; i++) {
            var token = list[i].token;
            var label = state.mode === "tailwind" ? "w-" + token : (round(list[i].px, 2) + "px");
            var value = state.mode === "tailwind"
                ? "w-" + token
                : String(round(list[i].px / WRS.conversionEngine.config.baseline, 3)) + "rem";
            html += '<button class="chip" data-value="' + value + '">' + label + "</button>";
        }
        container.innerHTML = html;

        $("quick-picks-caption").textContent = state.mode === "tailwind" ? "w-* classes" : "rem values";
    }

    function applySizing() {
        if (!state.selection || state.selection.length === 0) {
            toast(i18n("sizer.empty"), "warn");
            return;
        }

        var engine = WRS.conversionEngine;
        var snap = WRS.snapEngine;
        var snapEnabled = $("opt-snap").checked;
        var keepRatio = $("opt-ratio").checked;
        var applyAll = $("opt-all").checked;
        var anchor = $("opt-anchor").checked;

        var widthPx = parseByMode($("input-width").value, "dimension");
        var heightPx = parseByMode($("input-height").value, "dimension");
        var fontPx = parseByMode($("input-font").value, "font");

        if (widthPx === null && heightPx === null && fontPx === null) {
            toast(i18n("sizer.invalid"), "error");
            return;
        }

        if (snapEnabled) {
            if (widthPx !== null) widthPx = snap.snapToTailwind(widthPx, "dimension");
            if (heightPx !== null) heightPx = snap.snapToTailwind(heightPx, "dimension");
            if (fontPx !== null) fontPx = snap.snapToTailwind(fontPx, "font");
        }

        if (keepRatio && widthPx !== null && heightPx !== null) {
            if (state.originalWidth > 0 && state.originalHeight > 0) {
                var ratio = state.originalWidth / state.originalHeight;
                if (state.lastEdited === "height") {
                    widthPx = round(heightPx * ratio, 2);
                } else {
                    heightPx = round(widthPx / ratio, 2);
                }
            }
        }

        if (widthPx !== null) widthPx = snap.clampDimension(widthPx);
        if (heightPx !== null) heightPx = snap.clampDimension(heightPx);
        if (fontPx !== null) fontPx = snap.clampDimension(fontPx);

        var items = applyAll ? state.selection.slice() : [state.selection[0]];
        var tasks = [];

        items.forEach(function (item) {
            if (item.locked) return;
            if (widthPx !== null || heightPx !== null) {
                tasks.push(WRS.hostBridge.resizeItem(item.index, widthPx, heightPx));
            }
            if (fontPx !== null && item.type === "TextFrame") {
                tasks.push(WRS.hostBridge.setFontSizePx(item.index, fontPx));
            }
        });

        Promise.all(tasks).then(function (results) {
            var failures = results.filter(function (r) { return r && r.ok === false; });
            if (failures.length) {
                var detail = failures[0].error || "unknown";
                if (detail === "LOCKED") toast(i18n("sizer.failed") + ": locked", "error");
                else toast(i18n("sizer.failed") + ": " + detail, "error");
            } else {
                toast(i18n("sizer.applied"), "success");
            }
            WRS.eventBus.emit("refreshRequested");
        });
    }

    var tabSizer = {
        init: function () {
            if (state.initialized) return;
            state.initialized = true;

            var modeSwitch = $("mode-switch");
            modeSwitch.addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-mode]");
                if (!btn) return;
                state.mode = btn.getAttribute("data-mode");
                modeSwitch.querySelectorAll("button").forEach(function (b) {
                    b.classList.toggle("active", b === btn);
                });
                WRS.settingsStore.set("conversion.preferredMode", state.mode);
                renderQuickPicks();
                syncFromSelection();
            });

            ["width", "height", "font"].forEach(function (field) {
                var input = $("input-" + field);
                if (!input) return;
                input.addEventListener("input", function () {
                    state.lastEdited = field;
                    updateNotes();
                });
                input.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        applySizing();
                    }
                });
            });

            document.querySelectorAll(".stepper button").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    var field = btn.getAttribute("data-step");
                    var dir = Number(btn.getAttribute("data-dir"));
                    var input = $("input-" + field);
                    var current = parseByMode(input.value, field === "font" ? "font" : "dimension");
                    if (current === null) current = 0;
                    var stepPx = state.mode === "rem" ? 4 : 4;
                    var next = Math.max(0, current + dir * stepPx);
                    input.value = toModeValue(next, field === "font" ? "font" : "dimension");
                    state.lastEdited = field;
                    updateNotes();
                });
            });

            $("quick-picks").addEventListener("click", function (event) {
                var chip = event.target.closest(".chip");
                if (!chip) return;
                var value = chip.getAttribute("data-value");
                var target = state.lastEdited === "height" ? $("input-height") : $("input-width");
                target.value = value;
                updateNotes();
            });

            $("btn-apply-sizer").addEventListener("click", applySizing);
            $("btn-reset-sizer").addEventListener("click", function () {
                syncFromSelection();
            });

            $("opt-snap").checked = WRS.settingsStore.get("features.snapToGrid") !== false;
            $("opt-ratio").checked = WRS.settingsStore.get("sizer.keepRatio") === true;
            $("opt-all").checked = WRS.settingsStore.get("sizer.applyAll") === true;
            $("opt-anchor").checked = WRS.settingsStore.get("sizer.anchorTopLeft") !== false;

            $("opt-snap").addEventListener("change", function (e) {
                WRS.settingsStore.set("features.snapToGrid", e.target.checked);
            });
            $("opt-ratio").addEventListener("change", function (e) {
                WRS.settingsStore.set("sizer.keepRatio", e.target.checked);
            });
            $("opt-all").addEventListener("change", function (e) {
                WRS.settingsStore.set("sizer.applyAll", e.target.checked);
            });
            $("opt-anchor").addEventListener("change", function (e) {
                WRS.settingsStore.set("sizer.anchorTopLeft", e.target.checked);
            });

            state.mode = WRS.settingsStore.get("conversion.preferredMode") || "rem";
            modeSwitch.querySelectorAll("button").forEach(function (b) {
                b.classList.toggle("active", b.getAttribute("data-mode") === state.mode);
            });

            renderQuickPicks();
            syncFromSelection();
        },

        onSelectionChanged: function (selection) {
            state.selection = selection || [];
            syncFromSelection();
        },

        setMode: function (mode) {
            state.mode = mode;
            renderQuickPicks();
            syncFromSelection();
        },

        refresh: function () {
            renderQuickPicks();
            syncFromSelection();
        },

        apply: applySizing,

        getState: function () { return state; }
    };

    function toast(message, kind) {
        if (WRS.ui && WRS.ui.toast) WRS.ui.toast(message, kind);
        else if (root.console) root.console.log("[toast] " + message);
    }

    root.WRS = root.WRS || {};
    root.WRS.tabSizer = tabSizer;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = tabSizer;
    }
}(typeof window !== "undefined" ? window : globalThis));
