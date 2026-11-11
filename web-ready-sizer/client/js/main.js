(function (root) {
    "use strict";

    var WRS = root.WRS;
    var appState = {
        activeTab: "sizer",
        selection: [],
        pollTimer: null,
        documentName: "",
        lastSelectionSignature: ""
    };

    WRS.ui = WRS.ui || {};

    function $(id) { return document.getElementById(id); }

    function applyTheme(theme) {
        document.body.classList.toggle("theme-light", theme === "light");
        document.body.classList.toggle("theme-dark", theme !== "light");
    }

    function applyDensity(density) {
        document.body.classList.toggle("compact", density === "compact");
    }

    function applyDirection(dir) {
        document.documentElement.setAttribute("dir", dir === "ltr" ? "ltr" : "rtl");
    }

    function applyLanguage(lang) {
        WRS.i18n.setLanguage(lang);
        document.documentElement.setAttribute("lang", lang);
        translateDom();
        WRS.eventBus.emit("languageChanged", lang);
    }

    function translateDom() {
        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            var key = el.getAttribute("data-i18n");
            var text = WRS.i18n.t(key);
            if (text) el.textContent = text;
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
            var key = el.getAttribute("data-i18n-placeholder");
            var text = WRS.i18n.t(key);
            if (text) el.setAttribute("placeholder", text);
        });
        document.title = WRS.i18n.t("app.title");
    }

    function applyAllSettings() {
        var store = WRS.settingsStore;
        applyLanguage(store.get("ui.language") || "ar");
        applyDirection(store.get("ui.direction") || "rtl");
        applyTheme(store.get("ui.theme") || "dark");
        applyDensity(store.get("ui.density") || "comfortable");

        var baseline = store.get("conversion.baseline") || 16;
        WRS.conversionEngine.setBaseline(baseline);
    }

    function switchTab(tab) {
        appState.activeTab = tab;

        document.querySelectorAll(".tab-content").forEach(function (el) {
            el.classList.remove("active");
        });
        var content = $("tab-" + tab);
        if (content) content.classList.add("active");

        document.querySelectorAll(".tab-button").forEach(function (el) {
            el.classList.toggle("active", el.getAttribute("data-tab") === tab);
        });

        WRS.settingsStore.set("ui.activeTab", tab);

        if (tab === "sizer") WRS.tabSizer.refresh();
        if (tab === "inspector") WRS.tabInspector.refresh();
        if (tab === "artboards") WRS.tabArtboard.refresh();
    }

    function selectionSignature(items) {
        if (!items || !items.length) return "empty";
        return items.map(function (item) {
            return [item.type, item.name, item.width, item.height, item.x, item.y].join("|");
        }).join("#");
    }

    function updateStatus(items) {
        var dot = $("status-dot");
        var text = $("status-text");
        var meta = $("status-meta");

        var connected = WRS.hostBridge.isConnected();
        dot.classList.toggle("connected", connected);
        dot.classList.toggle("mock", !connected);

        if (!items || !items.length) {
            text.textContent = WRS.i18n.t("status.none");
        } else if (items.length === 1) {
            var item = items[0];
            text.textContent = item.name + " (" + item.type + ") " +
                Math.round(item.width) + " × " + Math.round(item.height) + " px";
        } else {
            text.textContent = WRS.i18n.t("status.multiple") + " (" + items.length + ")";
        }

        var parts = [];
        if (appState.documentName) parts.push(appState.documentName);
        if (!connected) parts.push("preview");
        else parts.push("v" + (WRS.hostBridge.state.hostVersion || "?"));
        meta.textContent = parts.join(" · ");
    }

    function applySelection(items) {
        appState.selection = items || [];

        var signature = selectionSignature(appState.selection);
        if (signature === appState.lastSelectionSignature) {
            updateStatus(appState.selection);
            return;
        }
        appState.lastSelectionSignature = signature;

        updateStatus(appState.selection);
        WRS.tabSizer.onSelectionChanged(appState.selection);
        WRS.tabInspector.onSelectionChanged(appState.selection);
        WRS.eventBus.emit("selectionChanged", appState.selection);
    }

    function fetchSelection() {
        return WRS.hostBridge.getSelection().then(function (res) {
            if (res && res.ok) {
                appState.documentName = res.documentName || appState.documentName;
                applySelection(res.items);
            } else {
                appState.documentName = "";
                applySelection([]);
            }
        });
    }

    function fetchDocumentInfo() {
        return WRS.hostBridge.getDocumentInfo().then(function (res) {
            if (res && res.ok) {
                appState.documentName = res.name || "";
                WRS.ui.documentName = appState.documentName;
                updateStatus(appState.selection);
            }
        });
    }

    function startPolling() {
        stopPolling();
        var interval = WRS.settingsStore.get("features.pollInterval") || 700;
        appState.pollTimer = setInterval(function () {
            fetchSelection();
        }, Math.max(200, interval));
    }

    function stopPolling() {
        if (appState.pollTimer) {
            clearInterval(appState.pollTimer);
            appState.pollTimer = null;
        }
    }

    function restartPolling() {
        startPolling();
    }

    function toggleTheme() {
        var current = WRS.settingsStore.get("ui.theme") || "dark";
        var next = current === "dark" ? "light" : "dark";
        WRS.settingsStore.set("ui.theme", next);
        applyTheme(next);
        var container = $("theme-switch");
        if (container) {
            container.querySelectorAll("button").forEach(function (btn) {
                btn.classList.toggle("active", btn.getAttribute("data-theme") === next);
            });
        }
    }

    function initKeybindings() {
        document.addEventListener("keydown", function (event) {
            var tag = (event.target && event.target.tagName) || "";
            var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

            if (event.key === "Enter" && appState.activeTab === "sizer" && !event.shiftKey) {
                var inSizerInput = event.target && event.target.closest && event.target.closest("#tab-sizer");
                if (inSizerInput) {
                    event.preventDefault();
                    WRS.tabSizer.apply();
                }
            }

            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && !typing) {
                if (appState.activeTab === "inspector") {
                    var output = WRS.tabInspector.getOutput();
                    var picked = root.getSelection ? String(root.getSelection()) : "";
                    if (!picked) {
                        event.preventDefault();
                        WRS.clipboard.copy(output.tailwind || "");
                    }
                }
            }
        });
    }

    function boot() {
        WRS.settingsStore.load();
        if (WRS.presets && WRS.presets.initActiveFromSettings) {
            WRS.presets.initActiveFromSettings();
        }
        applyAllSettings();

        WRS.tabSizer.init();
        WRS.tabInspector.init();
        WRS.tabArtboard.init();
        WRS.ui.init();
        if (WRS.presets) WRS.presets.init();

        document.querySelectorAll(".tab-button").forEach(function (btn) {
            btn.addEventListener("click", function () {
                switchTab(btn.getAttribute("data-tab"));
            });
        });

        var savedTab = WRS.settingsStore.get("ui.activeTab") || "sizer";
        switchTab(savedTab);

        WRS.eventBus.on("refreshRequested", function () {
            fetchSelection();
        });

        WRS.eventBus.on("baselineChanged", function () {
            WRS.tabSizer.refresh();
            WRS.tabInspector.refresh();
        });

        initKeybindings();

        WRS.hostBridge.connect().then(function () {
            fetchDocumentInfo().then(function () {
                fetchSelection().then(function () {
                    startPolling();
                    updateStatus(appState.selection);
                });
            });
        });

        WRS.ui.applyLanguage = applyLanguage;
        WRS.ui.applyDirection = applyDirection;
        WRS.ui.applyTheme = applyTheme;
        WRS.ui.applyDensity = applyDensity;
        WRS.ui.applyAllSettings = applyAllSettings;
        WRS.ui.toggleTheme = toggleTheme;
        WRS.ui.restartPolling = restartPolling;
        WRS.ui.fetchSelection = fetchSelection;
        WRS.ui.switchTab = switchTab;
        WRS.ui.state = appState;
    }

    WRS.ui.applyLanguage = applyLanguage;
    WRS.ui.applyDirection = applyDirection;
    WRS.ui.applyTheme = applyTheme;
    WRS.ui.applyDensity = applyDensity;
    WRS.ui.applyAllSettings = applyAllSettings;
    WRS.ui.toggleTheme = toggleTheme;
    WRS.ui.restartPolling = restartPolling;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

    root.WRS = WRS;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = { boot: boot };
    }
}(typeof window !== "undefined" ? window : globalThis));
