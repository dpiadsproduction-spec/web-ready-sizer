(function (root) {
    "use strict";

    var WRS = root.WRS;
    var state = {
        artboards: [],
        activeIndex: 0,
        custom: [],
        layout: "horizontal",
        initialized: false
    };

    function $(id) { return document.getElementById(id); }

    function round(value, decimals) {
        var mult = Math.pow(10, decimals || 0);
        return Math.round(value * mult) / mult;
    }

    function allBreakpoints() {
        return WRS.tailwindData.breakpoints.concat(state.custom);
    }

    function toast(message, kind) {
        if (WRS.ui && WRS.ui.toast) WRS.ui.toast(message, kind);
        else if (root.console) root.console.log("[toast] " + message);
    }

    function renderBreakpoints() {
        var container = $("breakpoint-list");
        if (!container) return;

        var list = allBreakpoints();
        var html = "";
        for (var i = 0; i < list.length; i++) {
            var bp = list[i];
            var isCustom = i >= WRS.tailwindData.breakpoints.length;
            html += '<div class="breakpoint-row" style="margin-bottom:6px" data-bp="' + bp.name + '">' +
                '<span class="breakpoint-badge">' + bp.name + "</span>" +
                '<span class="breakpoint-size">' + bp.width + "px</span>" +
                '<span class="breakpoint-label">' + (bp.label || (isCustom ? "custom" : "")) + "</span>" +
                '<button class="btn btn-sm" data-create="' + bp.name + '">' + WRS.i18n.t("artboard.create") + "</button>" +
                "</div>";
        }
        container.innerHTML = html;
    }

    function renderCustom() {
        var container = $("custom-breakpoint-list");
        if (!container) return;

        if (!state.custom.length) {
            container.innerHTML = '<div class="card-subtitle">' + WRS.i18n.t("artboard.noArtboards") + "</div>";
            return;
        }

        var html = "";
        for (var i = 0; i < state.custom.length; i++) {
            var bp = state.custom[i];
            html += '<div class="artboard-row" style="margin-bottom:6px">' +
                '<span class="breakpoint-badge">' + escapeHtml(bp.name) + "</span>" +
                '<span class="artboard-size">' + bp.width + "px</span>" +
                '<span class="artboard-name"></span>' +
                '<button class="copy-btn" data-remove-custom="' + i + '">' + WRS.i18n.t("artboard.remove") + "</button>" +
                "</div>";
        }
        container.innerHTML = html;
    }

    function renderArtboards() {
        var container = $("artboard-list");
        if (!container) return;

        if (!state.artboards.length) {
            container.innerHTML = '<div class="card-subtitle">' + WRS.i18n.t("artboard.noArtboards") + "</div>";
            $("closest-breakpoint").textContent = "-";
            return;
        }

        var html = "";
        for (var i = 0; i < state.artboards.length; i++) {
            var ab = state.artboards[i];
            html += '<div class="artboard-row' + (ab.active ? " active" : "") + '" style="margin-bottom:6px">' +
                '<span class="artboard-name">' + escapeHtml(ab.name) + "</span>" +
                '<span class="artboard-size">' + round(ab.width, 0) + " &times; " + round(ab.height, 0) + "</span>" +
                "</div>";
        }
        container.innerHTML = html;

        var active = state.artboards[state.activeIndex];
        if (active) {
            var closest = WRS.tailwindData.breakpointForWidth(active.width);
            $("closest-breakpoint").textContent = closest
                ? closest.name + " (" + closest.width + "px)"
                : "-";
        }
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function refreshArtboards() {
        return WRS.hostBridge.getArtboards().then(function (res) {
            if (res && res.ok) {
                state.artboards = res.artboards || [];
                state.activeIndex = res.activeIndex || 0;
            } else {
                state.artboards = [];
                state.activeIndex = 0;
            }
            renderArtboards();
        });
    }

    function nextArtboardPosition(width, height) {
        var spacing = Number($("artboard-spacing").value) || 80;
        if (!state.artboards.length) {
            return { left: 0, top: height };
        }

        if (state.layout === "vertical") {
            var lowest = null;
            for (var i = 0; i < state.artboards.length; i++) {
                if (lowest === null || state.artboards[i].bottom < lowest) {
                    lowest = state.artboards[i].bottom;
                }
            }
            var first = state.artboards[0];
            return { left: first.left, top: (lowest === null ? 0 : lowest) - spacing };
        }

        var rightMost = null;
        var topMost = null;
        for (var j = 0; j < state.artboards.length; j++) {
            if (rightMost === null || state.artboards[j].right > rightMost) {
                rightMost = state.artboards[j].right;
            }
            if (topMost === null || state.artboards[j].top > topMost) {
                topMost = state.artboards[j].top;
            }
        }
        return {
            left: (rightMost === null ? 0 : rightMost) + spacing,
            top: topMost === null ? height : topMost
        };
    }

    function createBreakpoint(name) {
        var bp = null;
        var list = allBreakpoints();
        for (var i = 0; i < list.length; i++) {
            if (list[i].name === name) { bp = list[i]; break; }
        }
        if (!bp) {
            toast(WRS.i18n.t("common.error") + ": " + name, "error");
            return Promise.resolve();
        }

        var height = Number($("artboard-height").value) || 900;
        var pos = nextArtboardPosition(bp.width, height);

        return WRS.hostBridge.createArtboard({
            name: "Tailwind " + bp.name + " (" + bp.width + "px)",
            left: pos.left,
            top: pos.top,
            width: bp.width,
            height: height
        }).then(function (res) {
            if (res && res.ok) {
                toast(WRS.i18n.t("artboard.created") + ": " + bp.name, "success");
                return refreshArtboards();
            }
            toast(WRS.i18n.t("common.error") + ": " + ((res && res.error) || "create failed"), "error");
        });
    }

    function createAll() {
        var list = WRS.tailwindData.breakpoints;
        var height = Number($("artboard-height").value) || 900;
        var spacing = Number($("artboard-spacing").value) || 80;

        var pos = nextArtboardPosition(list[0].width, height);
        var configs = [];
        var x = pos.left;
        var y = pos.top;

        for (var i = 0; i < list.length; i++) {
            var bp = list[i];
            var top = state.layout === "vertical"
                ? y - (i === 0 ? 0 : sumHeights(0, i) + spacing * i)
                : y;
            var left = state.layout === "vertical" ? x : x + sumWidths(0, i) + spacing * i;
            configs.push({
                name: "Tailwind " + bp.name + " (" + bp.width + "px)",
                left: left,
                top: top,
                width: bp.width,
                height: height
            });
        }

        function sumWidths(from, to) {
            var total = 0;
            for (var k = from; k < to; k++) total += list[k].width;
            return total;
        }

        function sumHeights(from, to) {
            return (to - from) * height;
        }

        return WRS.hostBridge.createArtboards(configs).then(function (res) {
            if (res && res.ok) {
                toast(WRS.i18n.t("artboard.createdAll"), "success");
            } else if (res && res.count > 0) {
                toast(WRS.i18n.t("artboard.createdAll") + " (" + res.count + ")", "warn");
            } else {
                toast(WRS.i18n.t("common.error") + ": " + ((res && res.error) || "create failed"), "error");
            }
            return refreshArtboards();
        });
    }

    function resizeCurrent() {
        var active = state.artboards[state.activeIndex];
        if (!active) {
            toast(WRS.i18n.t("artboard.noArtboards"), "warn");
            return;
        }

        var closest = WRS.tailwindData.breakpointForWidth(active.width);
        if (!closest) return;

        WRS.hostBridge.resizeArtboard(state.activeIndex, closest.width, null).then(function (res) {
            if (res && res.ok) {
                toast(WRS.i18n.t("common.success") + ": " + closest.name, "success");
                refreshArtboards();
            } else {
                toast(WRS.i18n.t("common.error") + ": " + ((res && res.error) || "resize failed"), "error");
            }
        });
    }

    var tabArtboard = {
        init: function () {
            if (state.initialized) return;
            state.initialized = true;

            state.custom = WRS.settingsStore.loadCustomBreakpoints();
            state.layout = WRS.settingsStore.get("artboards.layout") || "horizontal";

            $("artboard-height").value = WRS.settingsStore.get("artboards.height") || 900;
            $("artboard-spacing").value = WRS.settingsStore.get("artboards.spacing") || 80;

            $("layout-switch").querySelectorAll("button").forEach(function (btn) {
                btn.classList.toggle("active", btn.getAttribute("data-layout") === state.layout);
            });

            $("layout-switch").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-layout]");
                if (!btn) return;
                state.layout = btn.getAttribute("data-layout");
                WRS.settingsStore.set("artboards.layout", state.layout);
                $("layout-switch").querySelectorAll("button").forEach(function (b) {
                    b.classList.toggle("active", b === btn);
                });
            });

            $("artboard-height").addEventListener("change", function (e) {
                WRS.settingsStore.set("artboards.height", Number(e.target.value) || 900);
            });
            $("artboard-spacing").addEventListener("change", function (e) {
                WRS.settingsStore.set("artboards.spacing", Number(e.target.value) || 0);
            });

            $("breakpoint-list").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-create]");
                if (!btn) return;
                createBreakpoint(btn.getAttribute("data-create"));
            });

            $("custom-breakpoint-list").addEventListener("click", function (event) {
                var btn = event.target.closest("button[data-remove-custom]");
                if (!btn) return;
                var index = Number(btn.getAttribute("data-remove-custom"));
                state.custom.splice(index, 1);
                WRS.settingsStore.saveCustomBreakpoints(state.custom);
                renderBreakpoints();
                renderCustom();
            });

            $("btn-create-all").addEventListener("click", createAll);
            $("btn-resize-current").addEventListener("click", resizeCurrent);
            $("btn-refresh-artboards").addEventListener("click", refreshArtboards);

            $("btn-add-custom").addEventListener("click", function () {
                $("custom-bp-name").value = "";
                $("custom-bp-width").value = "";
                WRS.ui.openModal("modal-custom-breakpoint");
            });

            $("btn-save-custom-bp").addEventListener("click", function () {
                var name = $("custom-bp-name").value.trim();
                var width = Number($("custom-bp-width").value);

                if (!name || !width || width < 100) {
                    toast(WRS.i18n.t("sizer.invalid"), "error");
                    return;
                }

                var list = allBreakpoints();
                for (var i = 0; i < list.length; i++) {
                    if (list[i].name === name) {
                        toast(WRS.i18n.t("common.error") + ": duplicate name", "error");
                        return;
                    }
                }

                state.custom.push({ name: name, width: width, label: "custom", custom: true });
                WRS.settingsStore.saveCustomBreakpoints(state.custom);
                WRS.ui.closeModal("modal-custom-breakpoint");
                renderBreakpoints();
                renderCustom();
            });

            renderBreakpoints();
            renderCustom();
        },

        onSelectionChanged: function () { },

        refresh: function () {
            refreshArtboards();
        },

        getCustom: function () { return state.custom; }
    };

    root.WRS = root.WRS || {};
    root.WRS.tabArtboard = tabArtboard;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = tabArtboard;
    }
}(typeof window !== "undefined" ? window : globalThis));
