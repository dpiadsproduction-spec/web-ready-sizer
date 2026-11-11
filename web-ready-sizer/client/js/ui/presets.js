(function (root) {
    "use strict";

    var WRS = root.WRS;

    var state = {
        initialized: false,
        lastPreviewId: null
    };

    function $(id) { return document.getElementById(id); }

    function t(key) { return WRS.i18n.t(key); }

    function lang() { return WRS.i18n.language || "ar"; }

    function round(v, d) {
        var p = Math.pow(10, d === undefined ? 2 : d);
        return Math.round(v * p) / p;
    }

    function activeName(preset) {
        return WRS.presetEngine.name(preset, lang());
    }

    function renderList() {
        var engine = WRS.presetEngine;
        var container = $("preset-list");
        if (!container) return;

        var presets = engine.all();
        var html = "";
        for (var i = 0; i < presets.length; i++) {
            var preset = presets[i];
            var isActive = engine.isActive(preset.id);
            var tag = preset.builtIn ? t("preset.builtIn") : t("preset.custom");
            html += '<div class="preset-item' + (isActive ? " is-active" : "") + '" data-preset-id="' + preset.id + '">';
            html += '<div class="preset-item-info">';
            html += '<span class="preset-item-name">' + activeName(preset) + "</span>";
            html += '<span class="preset-item-desc">' + (WRS.presetEngine.description(preset, lang()) || "") + "</span>";
            html += "</div>";
            html += '<span class="preset-item-tag">' + tag + "</span>";
            html += '<div class="preset-item-actions">';
            if (isActive) {
                html += '<span class="badge">' + t("preset.activeBadge") + "</span>";
            } else {
                html += '<button class="btn btn-sm" data-preset-action="activate" data-preset-id="' + preset.id + '">' + t("preset.activate") + "</button>";
            }
            if (!preset.builtIn) {
                html += '<button class="btn btn-sm btn-ghost" data-preset-action="delete" data-preset-id="' + preset.id + '" aria-label="' + t("preset.delete") + '">&#x2715;</button>';
            }
            html += "</div>";
            html += "</div>";
        }
        container.innerHTML = html;

        var active = engine.active();
        $("preset-active-name").textContent = active ? activeName(active) : "-";
        $("settings-active-preset").textContent = active ? activeName(active) : "-";

        renderPreview(engine.active());
    }

    function renderPreview(preset) {
        var container = $("preset-preview");
        if (!container) return;
        if (!preset) {
            container.innerHTML = '<span class="preset-preview-empty">' + t("preset.empty") + "</span>";
            return;
        }

        var engine = WRS.presetEngine;
        var baseline = (WRS.conversionEngine && WRS.conversionEngine.config.baseline) || 16;
        var values = engine.spacingList();
        if (!values.length) values = engine.fontSizeList();
        if (!values.length) {
            container.innerHTML = '<span class="preset-preview-empty">' + t("preset.empty") + "</span>";
            return;
        }

        var max = values[values.length - 1].px || 1;
        var html = "";
        for (var i = 0; i < values.length; i++) {
            var row = values[i];
            var rem = round(row.px / baseline, 3);
            var widthPct = Math.max(4, Math.round((row.px / max) * 100));
            html += '<div class="preset-preview-row">';
            html += "<span>" + row.token + "</span>";
            html += '<span class="preset-preview-bar" style="width:' + widthPct + '%"></span>';
            html += "<span>" + rem + "rem / " + round(row.px, 1) + "px</span>";
            html += "</div>";
        }
        container.innerHTML = html;
    }

    function activatePreset(id) {
        var preset = WRS.presetEngine.apply(id);
        if (!preset) return;
        if (WRS.ui && WRS.ui.applyAllSettings) WRS.ui.applyAllSettings();
        if (WRS.ui && WRS.ui.restartPolling) WRS.ui.restartPolling();
        WRS.eventBus.emit("baselineChanged", Number(preset.baseline) || 16);
        WRS.eventBus.emit("presetChanged", id);
        WRS.eventBus.emit("refreshRequested");
        WRS.toast(t("preset.activated"), "success");
        renderList();
    }

    function deletePreset(id) {
        var preset = WRS.presetEngine.get(id);
        if (!preset) return;
        if (preset.builtIn) {
            WRS.toast(t("preset.cannotDeleteBuiltIn"), "warn");
            return;
        }
        var custom = (WRS.settingsStore.loadPresets() || []).filter(function (item) {
            return item.id !== id;
        });
        WRS.settingsStore.savePresets(custom);
        if (WRS.presetEngine.activeId === id) {
            WRS.presetEngine.apply("tailwind-default");
        }
        WRS.toast(t("preset.deleted"), "success");
        renderList();
    }

    function parseSpacingText(text) {
        var spacing = {};
        var lines = String(text || "").split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line.charAt(0) === "#") continue;
            var eq = line.indexOf("=");
            if (eq <= 0) continue;
            var token = line.slice(0, eq).trim();
            var value = line.slice(eq + 1).trim();
            if (token && value) spacing[token] = value;
        }
        return spacing;
    }

    function openEditor() {
        var editor = $("preset-editor");
        if (!editor) return;
        editor.hidden = false;
        $("preset-name").value = "";
        $("preset-desc").value = "";
        $("preset-spacing").value = "4=1rem\n8=2rem\n12=3rem";
        $("preset-name").focus();
    }

    function closeEditor() {
        var editor = $("preset-editor");
        if (editor) editor.hidden = true;
    }

    function savePreset() {
        var name = String($("preset-name").value || "").trim();
        var desc = String($("preset-desc").value || "").trim();
        var spacing = parseSpacingText($("preset-spacing").value);

        var preset = {
            id: "custom-" + Date.now().toString(36),
            name: name,
            description: desc,
            builtIn: false,
            baseline: (WRS.conversionEngine && WRS.conversionEngine.config.baseline) || 16,
            spacing: spacing
        };

        var errors = WRS.presetEngine.validate(preset);
        if (errors.length) {
            WRS.toast(t("preset.invalid") + ": " + errors[0], "error");
            return;
        }

        var custom = WRS.settingsStore.loadPresets() || [];
        custom.push(preset);
        WRS.settingsStore.savePresets(custom);
        closeEditor();
        WRS.toast(t("preset.created"), "success");
        renderList();
    }

    function importPreset() {
        var input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,application/json";
        input.addEventListener("change", function () {
            var file = input.files && input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                try {
                    var parsed = JSON.parse(String(reader.result));
                    var list = Array.isArray(parsed) ? parsed : [parsed];
                    var custom = WRS.settingsStore.loadPresets() || [];
                    var added = 0;
                    for (var i = 0; i < list.length; i++) {
                        var item = list[i];
                        if (WRS.presetEngine.validate(item).length) continue;
                        item.id = item.id || "custom-" + Date.now().toString(36) + "-" + i;
                        item.builtIn = false;
                        custom.push(item);
                        added++;
                    }
                    if (!added) {
                        WRS.toast(t("preset.invalid"), "error");
                        return;
                    }
                    WRS.settingsStore.savePresets(custom);
                    WRS.toast(t("preset.imported"), "success");
                    renderList();
                } catch (e) {
                    WRS.toast(t("preset.invalid"), "error");
                }
            };
            reader.readAsText(file);
        });
        input.click();
    }

    function exportPreset() {
        var preset = WRS.presetEngine.active();
        if (!preset) return;
        var payload = {
            name: activeName(preset),
            description: WRS.presetEngine.description(preset, lang()),
            baseline: preset.baseline || 16,
            htmlFontSize: preset.htmlFontSize || undefined,
            spacing: preset.spacing,
            fontSize: preset.fontSize
        };
        var json = JSON.stringify(payload, null, 2);
        WRS.hostBridge.saveTextFile("wrs-preset-" + preset.id + ".json", json).then(function (res) {
            if (res && res.ok) WRS.toast(t("export.saved"), "success");
            else WRS.toast(t("common.error"), "error");
        });
    }

    var presets = {
        init: function () {
            if (state.initialized) return;
            state.initialized = true;

            var openBtn = $("btn-open-presets");
            if (openBtn) {
                openBtn.addEventListener("click", function () {
                    WRS.ui.closeModal("modal-settings");
                    WRS.ui.openModal("modal-presets");
                    renderList();
                });
            }

            var list = $("preset-list");
            if (list) {
                list.addEventListener("click", function (event) {
                    var btn = event.target.closest("button[data-preset-action]");
                    if (!btn) return;
                    var action = btn.getAttribute("data-preset-action");
                    var id = btn.getAttribute("data-preset-id");
                    if (action === "activate") activatePreset(id);
                    else if (action === "delete") deletePreset(id);
                });
            }

            if ($("btn-preset-new")) $("btn-preset-new").addEventListener("click", openEditor);
            if ($("btn-preset-save")) $("btn-preset-save").addEventListener("click", savePreset);
            if ($("btn-preset-import")) $("btn-preset-import").addEventListener("click", importPreset);
            if ($("btn-preset-export")) $("btn-preset-export").addEventListener("click", exportPreset);

            document.querySelectorAll('#modal-presets [data-close-modal]').forEach(function (btn) {
                btn.addEventListener("click", closeEditor);
            });

            WRS.eventBus.on("languageChanged", renderList);
            WRS.eventBus.on("baselineChanged", function () {
                if ($("modal-presets") && $("modal-presets").classList.contains("open")) renderList();
            });

            renderList();
        },

        refresh: renderList,
        activate: activatePreset,
        open: function () {
            WRS.ui.openModal("modal-presets");
            renderList();
        },

        initActiveFromSettings: function () {
            var id = WRS.settingsStore.get("conversion.activePreset") || "tailwind-default";
            if (!WRS.presetEngine.get(id)) id = "tailwind-default";
            WRS.presetEngine.activeId = id;
            var preset = WRS.presetEngine.get(id);
            if (preset && WRS.conversionEngine) {
                WRS.conversionEngine.setBaseline(Number(preset.baseline) || 16);
            }
        }
    };

    root.WRS = root.WRS || {};
    root.WRS.presets = presets;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = presets;
    }
}(typeof window !== "undefined" ? window : globalThis));
