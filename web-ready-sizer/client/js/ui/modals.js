(function (root) {
    "use strict";

    var WRS = root.WRS;
    var exportState = {
        preview: "",
        initialized: false
    };

    function $(id) { return document.getElementById(id); }

    function toast(message, kind) {
        if (WRS.ui && WRS.ui.toast) WRS.ui.toast(message, kind);
    }

    function openModal(id) {
        var modal = $(id);
        if (!modal) return;
        modal.classList.add("open");
        var focusable = modal.querySelector("input, select, button");
        if (focusable) focusable.focus();
    }

    function closeModal(id) {
        var modal = $(id);
        if (!modal) return;
        modal.classList.remove("open");
    }

    function closeAll() {
        document.querySelectorAll(".modal-backdrop.open").forEach(function (modal) {
            modal.classList.remove("open");
        });
    }

    function toastStack(message, kind) {
        var stack = $("toast-stack");
        if (!stack) return;
        var el = document.createElement("div");
        el.className = "toast " + (kind || "");
        el.textContent = message;
        stack.appendChild(el);

        setTimeout(function () {
            el.style.opacity = "0";
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 200);
        }, 2400);
    }

    function buildExportPreview() {
        var generator = WRS.cssGenerator;
        var format = $("export-format").value;
        var scope = $("export-scope").value;
        var useRem = $("export-use-rem").checked;
        var rtl = $("export-rtl").checked;
        var minify = $("export-minify").checked;

        return WRS.hostBridge.collectElements(scope).then(function (res) {
            var items = (res && res.items) || [];
            if (!items.length) {
                exportState.preview = "";
                $("export-preview").textContent = WRS.i18n.t("export.empty");
                return;
            }

            var options = {
                rtl: rtl,
                useRem: useRem,
                minify: minify,
                documentName: WRS.ui.documentName || "Illustrator"
            };

            var output = "";

            if (format === "tailwind-html") {
                output = generator.generateHtmlDocument(items, options);
            } else if (format === "css") {
                output = generator.generateCssDocument(items, options);
            } else if (format === "tailwind-classes") {
                var lines = items.map(function (item) {
                    return generator.generateClasses(item, options).join(" ");
                });
                output = lines.join("\n");
            } else if (format === "tailwind-config") {
                var classes = [];
                items.forEach(function (item) {
                    classes = classes.concat(generator.generateClasses(item, options));
                });
                var colors = [];
                items.forEach(function (item) {
                    var hex = generator.hexFromColor(item.fill);
                    if (hex && colors.indexOf(hex) === -1) colors.push(hex);
                });
                var spacing = [];
                items.forEach(function (item) {
                    [item.width, item.height].forEach(function (v) {
                        if (v > 0 && spacing.indexOf(v) === -1) spacing.push(v);
                    });
                });
                output = generator.generateTailwindConfig({
                    colors: colors.map(function (c) { return { hex: c }; }),
                    spacing: spacing,
                    fontSizes: []
                });
            } else if (format === "design-tokens") {
                output = generator.generateDesignTokens(items, options);
            }

            exportState.preview = output;
            $("export-preview").textContent = output.length > 4000
                ? output.substring(0, 4000) + "\n\n..."
                : output;
        });
    }

    function openExport() {
        openModal("modal-export");
        buildExportPreview();
    }

    function copyExport() {
        if (!exportState.preview) {
            toast(WRS.i18n.t("export.empty"), "warn");
            return;
        }
        WRS.clipboard.copy(exportState.preview);
    }

    function saveExport() {
        if (!exportState.preview) {
            toast(WRS.i18n.t("export.empty"), "warn");
            return;
        }
        var format = $("export-format").value;
        var filename = "web-ready-sizer";
        var extension = ".txt";

        if (format === "tailwind-html") { filename += ".html"; extension = ".html"; }
        else if (format === "css") { filename += ".css"; extension = ".css"; }
        else if (format === "tailwind-config") { filename = "tailwind.config.js"; extension = ".js"; }
        else if (format === "design-tokens") { filename += ".tokens.json"; extension = ".json"; }
        else { filename += ".classes.txt"; }

        WRS.hostBridge.saveTextFile(filename + extension, exportState.preview).then(function (res) {
            if (res && res.ok) toast(WRS.i18n.t("export.saved") + " " + (res.path || ""), "success");
            else toast(WRS.i18n.t("common.error") + ": " + ((res && res.error) || "save failed"), "error");
        });
    }

    var modals = {
        init: function () {
            if (exportState.initialized) return;
            exportState.initialized = true;

            document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
                btn.addEventListener("click", function () {
                    closeModal(btn.getAttribute("data-close-modal"));
                });
            });

            document.querySelectorAll(".modal-backdrop").forEach(function (backdrop) {
                backdrop.addEventListener("click", function (event) {
                    if (event.target === backdrop) backdrop.classList.remove("open");
                });
            });

            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape") closeAll();
            });

            $("btn-open-export").addEventListener("click", openExport);
            $("btn-export-copy").addEventListener("click", copyExport);
            $("btn-export-save").addEventListener("click", saveExport);

            ["export-format", "export-scope", "export-use-rem", "export-rtl", "export-minify"].forEach(function (id) {
                var el = $(id);
                if (el) el.addEventListener("change", buildExportPreview);
            });

            $("btn-settings").addEventListener("click", function () {
                syncSettingsControls();
                openModal("modal-settings");
            });

            $("btn-help").addEventListener("click", function () {
                var doc = $("help-document");
                if (doc && WRS.ui && WRS.ui.documentName) doc.textContent = WRS.ui.documentName;
                openModal("modal-help");
            });

            $("btn-theme").addEventListener("click", function () {
                WRS.ui.toggleTheme();
            });

            this.initSettings();
        },

        initSettings: function () {
            var store = WRS.settingsStore;

            function activate(containerId, attr, value) {
                var container = $(containerId);
                if (!container) return;
                container.querySelectorAll("button").forEach(function (btn) {
                    btn.classList.toggle("active", btn.getAttribute(attr) === String(value));
                });
            }

            $("lang-switch").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-lang]");
                if (!btn) return;
                var lang = btn.getAttribute("data-lang");
                store.set("ui.language", lang);
                WRS.ui.applyLanguage(lang);
                activate("lang-switch", "data-lang", lang);
            });

            $("dir-switch").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-dir]");
                if (!btn) return;
                var dir = btn.getAttribute("data-dir");
                store.set("ui.direction", dir);
                WRS.ui.applyDirection(dir);
                activate("dir-switch", "data-dir", dir);
            });

            $("theme-switch").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-theme]");
                if (!btn) return;
                var theme = btn.getAttribute("data-theme");
                store.set("ui.theme", theme);
                WRS.ui.applyTheme(theme);
                activate("theme-switch", "data-theme", theme);
            });

            $("density-switch").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-density]");
                if (!btn) return;
                var density = btn.getAttribute("data-density");
                store.set("ui.density", density);
                WRS.ui.applyDensity(density);
                activate("density-switch", "data-density", density);
            });

            $("baseline-switch").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-baseline]");
                if (!btn) return;
                var baseline = Number(btn.getAttribute("data-baseline"));
                applyBaseline(baseline);
                activate("baseline-switch", "data-baseline", baseline);
                $("baseline-custom").value = baseline;
            });

            $("baseline-custom").addEventListener("change", function (event) {
                var value = Number(event.target.value);
                if (value >= 1 && value <= 64) {
                    applyBaseline(value);
                    activate("baseline-switch", "data-baseline", value);
                }
            });

            $("poll-interval").addEventListener("change", function (event) {
                var value = Math.max(200, Math.min(5000, Number(event.target.value) || 700));
                store.set("features.pollInterval", value);
                if (WRS.ui && WRS.ui.restartPolling) WRS.ui.restartPolling();
            });

            $("btn-export-settings").addEventListener("click", function () {
                WRS.hostBridge.saveTextFile("wrs-settings.json", store.exportJson()).then(function (res) {
                    if (res && res.ok) toast(WRS.i18n.t("export.saved"), "success");
                    else toast(WRS.i18n.t("common.error") + ": " + ((res && res.error) || "save failed"), "error");
                });
            });

            $("btn-import-settings").addEventListener("click", function () {
                var input = document.createElement("input");
                input.type = "file";
                input.accept = ".json,application/json";
                input.addEventListener("change", function () {
                    var file = input.files && input.files[0];
                    if (!file) return;
                    var reader = new FileReader();
                    reader.onload = function () {
                        try {
                            store.importJson(String(reader.result));
                            WRS.ui.applyAllSettings();
                            syncSettingsControls();
                            toast(WRS.i18n.t("common.success"), "success");
                        } catch (e) {
                            toast(WRS.i18n.t("common.error") + ": " + e.message, "error");
                        }
                    };
                    reader.readAsText(file);
                });
                input.click();
            });

            $("btn-reset-all").addEventListener("click", function () {
                store.reset();
                WRS.ui.applyAllSettings();
                syncSettingsControls();
                if (WRS.ui.restartPolling) WRS.ui.restartPolling();
                toast(WRS.i18n.t("common.success"), "success");
            });
        },

        syncSettings: syncSettingsControls,
        open: openModal,
        close: closeModal,
        openModal: openModal,
        closeModal: closeModal,
        closeAll: closeAll,
        toast: toastStack,
        openExport: openExport
    };

    function applyBaseline(value) {
        WRS.conversionEngine.setBaseline(value);
        WRS.settingsStore.set("conversion.baseline", value);
        WRS.eventBus.emit("baselineChanged", value);
        WRS.eventBus.emit("refreshRequested");
    }

    function syncSettingsControls() {
        var store = WRS.settingsStore;

        function activate(containerId, attr, value) {
            var container = $(containerId);
            if (!container) return;
            container.querySelectorAll("button").forEach(function (btn) {
                btn.classList.toggle("active", btn.getAttribute(attr) === String(value));
            });
        }

        activate("lang-switch", "data-lang", store.get("ui.language"));
        activate("dir-switch", "data-dir", store.get("ui.direction"));
        activate("theme-switch", "data-theme", store.get("ui.theme"));
        activate("density-switch", "data-density", store.get("ui.density"));
        activate("baseline-switch", "data-baseline", store.get("conversion.baseline"));

        $("baseline-custom").value = store.get("conversion.baseline") || 16;
        $("poll-interval").value = store.get("features.pollInterval") || 700;
    }

    root.WRS = root.WRS || {};
    root.WRS.ui = modals;
    root.WRS.toast = toastStack;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = modals;
    }
}(typeof window !== "undefined" ? window : globalThis));
