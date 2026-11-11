"use strict";

/*
 * smoke-test.js - loads the panel into jsdom, boots it in preview mode and
 * exercises the three tabs. Requires jsdom installed globally:
 *   NODE_PATH=$(npm root -g) node tools/smoke-test.js
 */

const { JSDOM } = require("jsdom");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "client", "index.html"), "utf8");

const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
const { window } = dom;

const scripts = [
    "client/js/vendor/CSInterface.js",
    "client/js/lib/event-bus.js",
    "client/js/lib/storage.js",
    "client/js/lib/i18n.js",
    "client/js/lib/data/tailwind-data.js",
    "client/js/lib/data/tailwind-colors.js",
    "client/js/lib/data/presets-data.js",
    "client/js/lib/engine/conversion-engine.js",
    "client/js/lib/engine/snap-engine.js",
    "client/js/lib/engine/color-matcher.js",
    "client/js/lib/engine/css-generator.js",
    "client/js/lib/engine/preset-engine.js",
    "client/js/lib/host-bridge.js",
    "client/js/ui/tab-sizer.js",
    "client/js/ui/tab-inspector.js",
    "client/js/ui/tab-artboard.js",
    "client/js/ui/modals.js",
    "client/js/ui/presets.js",
    "client/js/main.js"
];

const scriptErrors = [];
for (const rel of scripts) {
    try {
        window.eval(fs.readFileSync(path.join(root, rel), "utf8"));
    } catch (error) {
        scriptErrors.push(rel + ": " + error.message);
    }
}

let failures = 0;

function check(label, condition, detail) {
    if (condition) {
        console.log("ok    " + label);
    } else {
        failures++;
        console.error("FAIL  " + label + (detail ? " -> " + detail : ""));
    }
}

check("all scripts evaluated without throwing", scriptErrors.length === 0, scriptErrors.join("; "));

const WRS = window.WRS;
check("WRS namespace is populated", !!WRS && !!WRS.tabSizer && !!WRS.tabInspector && !!WRS.tabArtboard);
check("no CSInterface bridge in preview", WRS.hostBridge.isMock() || !WRS.hostBridge.isConnected());

const doc = window.document;

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

(async function run() {
    await wait(600);

    check("preview mode populates the status bar", doc.getElementById("status-text").textContent.length > 0,
        doc.getElementById("status-text").textContent);
    check("status meta shows preview", /preview/.test(doc.getElementById("status-meta").textContent));
    check("sizer empty state is hidden when mock has a selection",
        doc.getElementById("sizer-empty").classList.contains("hidden"));

    const bpRows = doc.querySelectorAll("#breakpoint-list .breakpoint-row");
    check("all five Tailwind breakpoints render", bpRows.length === 5, String(bpRows.length));

    WRS.ui.switchTab("inspector");
    await wait(50);
    check("inspector body visible", !doc.getElementById("inspector-body").classList.contains("hidden"));
    check("inspector shows type badge", doc.getElementById("inspector-type-icon").textContent.length === 2,
        doc.getElementById("inspector-type-icon").textContent);
    check("inspector width class is a w-* token", /^w-/.test(doc.getElementById("inspector-width-class").textContent),
        doc.getElementById("inspector-width-class").textContent);
    check("inspector produces Tailwind output",
        /w-/.test(doc.getElementById("output-code").textContent),
        doc.getElementById("output-code").textContent.slice(0, 40));

    const fillClass = doc.getElementById("inspector-fill-class").textContent;
    check("fill colour maps to a bg-* class", /^bg-/.test(fillClass), fillClass);

    WRS.ui.switchTab("artboards");
    await wait(100);
    const abRows = doc.querySelectorAll("#artboard-list .artboard-row");
    check("mock artboard is listed", abRows.length >= 1, String(abRows.length));
    check("closest breakpoint is resolved", doc.getElementById("closest-breakpoint").textContent !== "-",
        doc.getElementById("closest-breakpoint").textContent);

    const beforeCreate = doc.querySelectorAll("#artboard-list .artboard-row").length;
    doc.querySelector('#breakpoint-list button[data-create="md"]').click();
    await wait(150);
    const afterCreate = doc.querySelectorAll("#artboard-list .artboard-row").length;
    check("creating a breakpoint artboard adds a row", afterCreate === beforeCreate + 1,
        beforeCreate + " -> " + afterCreate);

    WRS.ui.switchTab("sizer");
    await wait(50);
    const widthInput = doc.getElementById("input-width");
    widthInput.value = "5rem";
    widthInput.dispatchEvent(new window.Event("input", { bubbles: true }));
    check("typing rem updates the conversion note",
        /80px/.test(doc.getElementById("width-note").textContent),
        doc.getElementById("width-note").textContent);

    const noteBefore = doc.getElementById("width-note").textContent;
    doc.getElementById("btn-apply-sizer").click();
    await wait(120);
    check("apply completes without an error toast",
        !doc.querySelector(".toast.error"),
        doc.querySelector(".toast.error") ? doc.querySelector(".toast.error").textContent : "no error");

    doc.querySelector('#mode-switch button[data-mode="tailwind"]').click();
    await wait(30);
    const chips = doc.querySelectorAll("#quick-picks .chip");
    check("quick picks render Tailwind chips", chips.length > 10, String(chips.length));
    check("quick picks use w-* labels in Tailwind mode",
        chips.length > 0 && /^w-/.test(chips[0].textContent), chips[0] && chips[0].textContent);

    WRS.ui.applyLanguage("en");
    check("English translation applies to the tab strip",
        doc.querySelector('#btn-sizer span').textContent === "Sizer",
        doc.querySelector('#btn-sizer span').textContent);
    WRS.ui.applyLanguage("ar");

    WRS.ui.applyDirection("ltr");
    check("direction switch updates html[dir]",
        doc.documentElement.getAttribute("dir") === "ltr",
        doc.documentElement.getAttribute("dir"));
    WRS.ui.applyDirection("rtl");

    WRS.ui.applyTheme("light");
    check("light theme class toggles", doc.body.classList.contains("theme-light"));
    WRS.ui.applyTheme("dark");

    WRS.conversionEngine.setBaseline(10);
    check("62.5% baseline converts 5rem to 50px", WRS.conversionEngine.remToPx(5) === 50);
    WRS.conversionEngine.setBaseline(16);

    await wait(30);
    check("design tokens modal exists", !!doc.getElementById("modal-presets"));

    WRS.presets.open();
    await wait(50);
    const presetRows = doc.querySelectorAll("#preset-list .preset-item");
    check("all five built-in presets are listed", presetRows.length === 5, String(presetRows.length));
    check("active preset name is rendered",
        doc.getElementById("preset-active-name").textContent.length > 0,
        doc.getElementById("preset-active-name").textContent);
    check("preview bars render for the active preset",
        doc.querySelectorAll("#preset-preview .preset-preview-row").length > 0);

    WRS.presets.activate("fibonacci");
    await wait(60);
    const fibChips = doc.querySelectorAll("#quick-picks .chip");
    const fibLabels = Array.from(fibChips).map((c) => c.textContent);
    check("activating fibonacci swaps the quick picks",
        fibLabels.indexOf("w-fib-5") !== -1, fibLabels.slice(0, 6).join(","));
    check("fibonacci preset is marked active",
        WRS.presetEngine.isActive("fibonacci") &&
            doc.querySelector('#preset-list .preset-item.is-active').getAttribute("data-preset-id") === "fibonacci");

    WRS.presets.activate("tailwind-default");
    await wait(60);
    check("returning to default restores Tailwind chips",
        WRS.presetEngine.isDefault() &&
            doc.querySelectorAll("#quick-picks .chip").length > 10);

    WRS.ui.closeAll();

    console.log("");
    if (failures) {
        console.error(failures + " check(s) failed.");
        process.exit(1);
    }
    console.log("All smoke checks passed.");
    process.exit(0);
})();
