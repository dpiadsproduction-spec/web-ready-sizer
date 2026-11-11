(function (root) {
    "use strict";

    var WRS = root.WRS;
    var state = {
        selection: [],
        format: "tailwind",
        output: { tailwind: "", html: "", css: "", all: "" },
        initialized: false
    };

    function $(id) { return document.getElementById(id); }

    function round(value, decimals) {
        var mult = Math.pow(10, decimals || 0);
        return Math.round(value * mult) / mult;
    }

    function setText(id, text) {
        var el = $(id);
        if (el) el.textContent = text;
    }

    function shortType(type) {
        var map = {
            PathItem: "PI",
            TextFrame: "TX",
            GroupItem: "GR",
            CompoundPathItem: "CP",
            RasterItem: "IM",
            PlacedItem: "PL",
            SymbolItem: "SY"
        };
        return map[type] || String(type || "??").substring(0, 2).toUpperCase();
    }

    function renderEmpty() {
        $("inspector-body").classList.add("hidden");
        $("inspector-empty").classList.remove("hidden");
    }

    function renderElement(element) {
        $("inspector-empty").classList.add("hidden");
        $("inspector-body").classList.remove("hidden");

        var tw = WRS.tailwindData;
        var engine = WRS.conversionEngine;
        var colors = WRS.colorMatcher;

        setText("inspector-type-icon", shortType(element.type));
        setText("inspector-name", element.name || element.type);
        setText("inspector-path", element.path || "-");

        var mixed = state.selection.length > 1;

        setText("inspector-width", round(element.width, 2) + "px / " + round(engine.pxToRem(element.width), 3) + "rem");
        setText("inspector-width-class", tw.widthClass(element.width));
        setText("inspector-height", round(element.height, 2) + "px / " + round(engine.pxToRem(element.height), 3) + "rem");
        setText("inspector-height-class", tw.heightClass(element.height));

        setText("inspector-x", round(element.x, 2) + "px / " + round(engine.pxToRem(element.x), 3) + "rem");
        setText("inspector-y", round(element.y, 2) + "px / " + round(engine.pxToRem(element.y), 3) + "rem");

        renderColor(element, "fill");
        renderColor(element, "stroke");

        var typographyCard = $("inspector-typography-card");
        if (element.type === "TextFrame" && element.text) {
            typographyCard.classList.remove("hidden");
            renderTypography(element.text);
        } else {
            typographyCard.classList.add("hidden");
        }

        setText("inspector-stroke-width", element.stroke && element.stroke.width ? round(element.stroke.width, 2) + "px" : "-");
        setText("inspector-stroke-width-class",
            element.stroke && element.stroke.width > 0 ? tw.borderWidthClass(element.stroke.width) : "-");
        setText("inspector-radius", element.cornerRadius > 0 ? round(element.cornerRadius, 2) + "px" : "-");
        setText("inspector-radius-class", element.cornerRadius > 0 ? tw.radiusClass(element.cornerRadius) : "-");

        var opacity = typeof element.opacity === "number" ? element.opacity : 100;
        setText("inspector-opacity", round(opacity, 0) + "%");
        setText("inspector-opacity-class", opacity < 100 ? tw.opacityClass(opacity / 100) : "-");

        if (mixed) {
            $("inspector-path").textContent = element.path + " (" + state.selection.length + " items)";
        }

        buildOutput(element);
    }

    function renderColor(element, slot) {
        var colors = WRS.colorMatcher;
        var color = slot === "fill" ? element.fill : element.stroke;
        var hexEl = $(slot === "fill" ? "inspector-fill-hex" : "inspector-stroke-hex");
        var swatchEl = $(slot === "fill" ? "inspector-fill-swatch" : "inspector-stroke-swatch");
        var classEl = $(slot === "fill" ? "inspector-fill-class" : "inspector-stroke-class");
        var confidenceEl = $(slot === "fill" ? "inspector-fill-confidence" : "inspector-stroke-confidence");

        if (!color || color.type === "none" || color.type === "unknown") {
            hexEl.textContent = "none";
            swatchEl.style.background = "transparent";
            classEl.textContent = "-";
            confidenceEl.textContent = "";
            confidenceEl.className = "confidence";
            return;
        }

        var hex = WRS.cssGenerator.hexFromColor(color);
        hexEl.textContent = hex || color.type;
        swatchEl.style.background = hex || "transparent";

        if (!hex || !colors) {
            classEl.textContent = "-";
            confidenceEl.textContent = "";
            return;
        }

        var prefix = slot === "fill" ? "bg" : "border";
        var match = colors.nearestTailwindColor(hex, prefix);
        if (!match) {
            classEl.textContent = "-";
            confidenceEl.textContent = "";
            return;
        }

        classEl.textContent = match.className;
        confidenceEl.textContent = match.confidenceLabel + " (dE " + match.deltaE + ")";
        confidenceEl.className = "confidence " + match.confidence;
    }

    function renderTypography(text) {
        var tw = WRS.tailwindData;
        var engine = WRS.conversionEngine;
        var sizePx = engine.ptToPx(text.sizePt);

        setText("inspector-font", (text.font || "-") + (text.style ? " " + text.style : ""));
        setText("inspector-font-size", round(text.sizePt, 2) + "pt / " + round(sizePx, 2) + "px / " + round(engine.pxToRem(sizePx), 3) + "rem");
        setText("inspector-font-class", tw.fontSizeClass(sizePx));
        setText("inspector-weight-class", tw.weightClass(text.weightGuess || 400));
        setText("inspector-case-class", text.caseStyle && text.caseStyle !== "normal" ? "text-" + text.caseStyle : "-");

        var trackingEm = (text.tracking || 0) / 1000;
        setText("inspector-tracking", round(text.tracking || 0, 0));
        setText("inspector-tracking-class", trackingEm === 0 ? "-" : tw.trackingClass(trackingEm));

        var leadingPx = engine.ptToPx(text.leadingPt || 0);
        setText("inspector-leading", round(leadingPx, 2) + "px");
        setText("inspector-leading-class",
            sizePx > 0 && leadingPx > 0 ? tw.leadingClass(leadingPx / sizePx) : "-");
    }

    function buildOutput(element) {
        var generator = WRS.cssGenerator;
        var rtl = WRS.settingsStore.get("features.rtlAware") !== false && WRS.i18n.language === "ar";
        var options = { rtl: rtl, useRem: false, documentName: "Selection" };

        var classes = generator.generateClasses(element, options);
        var tailwindText = classes.join(" ");
        var htmlText = generator.generateHtml(element, { classes: classes, rtl: rtl });
        var cssText = generator.generateCssRule(element, null, options);
        var allText = tailwindText + "\n\n" + htmlText + "\n\n" + cssText;

        state.output = {
            tailwind: tailwindText,
            html: htmlText,
            css: cssText,
            all: allText
        };

        renderOutputTab(state.format);
    }

    function renderOutputTab(format) {
        state.format = format;
        var code = $("output-code");
        if (code) code.textContent = state.output[format] || "";

        $("output-tabs").querySelectorAll("button").forEach(function (btn) {
            btn.classList.toggle("active", btn.getAttribute("data-format") === format);
        });
    }

    function toast(message, kind) {
        if (WRS.ui && WRS.ui.toast) WRS.ui.toast(message, kind);
        else if (root.console) root.console.log("[toast] " + message);
    }

    function copyText(text) {
        var i18n = WRS.i18n;
        if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
            root.navigator.clipboard.writeText(text).then(function () {
                toast(i18n.t("inspector.copied"), "success");
            }).catch(function () {
                fallbackCopy(text);
            });
            return;
        }
        fallbackCopy(text);
    }

    function fallbackCopy(text) {
        try {
            var area = document.createElement("textarea");
            area.value = text;
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            document.body.removeChild(area);
            toast(WRS.i18n.t("inspector.copied"), "success");
        } catch (e) {
            toast(WRS.i18n.t("common.error"), "error");
        }
    }

    var tabInspector = {
        init: function () {
            if (state.initialized) return;
            state.initialized = true;

            $("output-tabs").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-format]");
                if (!btn) return;
                renderOutputTab(btn.getAttribute("data-format"));
            });

            document.querySelectorAll(".copy-btn[data-copy-target]").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    var target = $(btn.getAttribute("data-copy-target"));
                    if (target) copyText(target.textContent);
                });
            });

            $("btn-copy-output").addEventListener("click", function () {
                copyText(state.output[state.format] || "");
            });

            $("btn-save-output").addEventListener("click", function () {
                var extension = state.format === "css" ? ".css" : (state.format === "html" ? ".html" : ".txt");
                WRS.hostBridge.saveTextFile("web-ready-sizer" + extension, state.output[state.format] || "")
                    .then(function (res) {
                        if (res && res.ok) toast(WRS.i18n.t("export.saved") + " " + (res.path || ""), "success");
                        else toast(WRS.i18n.t("common.error") + ": " + ((res && res.error) || "save failed"), "error");
                    });
            });

            renderEmpty();
        },

        onSelectionChanged: function (selection) {
            state.selection = selection || [];
            if (!state.selection.length) {
                renderEmpty();
                return;
            }
            renderElement(state.selection[0]);
        },

        refresh: function () {
            if (!state.selection.length) {
                renderEmpty();
                return;
            }
            renderElement(state.selection[0]);
        },

        getOutput: function () { return state.output; },
        getSelection: function () { return state.selection; },
        copyText: copyText
    };

    root.WRS = root.WRS || {};
    root.WRS.tabInspector = tabInspector;
    root.WRS.clipboard = { copy: copyText };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = tabInspector;
    }
}(typeof window !== "undefined" ? window : globalThis));
