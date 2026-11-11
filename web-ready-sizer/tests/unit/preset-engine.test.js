"use strict";

const test = require("node:test");
const assert = require("node:assert");

const store = new Map();
global.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
};
global.WRS = {};

const presetsData = require("../../client/js/lib/data/presets-data.js");
const tailwindData = require("../../client/js/lib/data/tailwind-data.js");
const settingsStore = require("../../client/js/lib/storage.js");
const conversionEngine = require("../../client/js/lib/engine/conversion-engine.js");
const presetEngine = require("../../client/js/lib/engine/preset-engine.js");

test("ships the five built-in presets from the blueprint", () => {
    assert.strictEqual(presetsData.length, 5);
    const ids = presetsData.map((p) => p.id);
    assert.deepStrictEqual(ids, [
        "tailwind-default",
        "golden-ratio",
        "fibonacci",
        "modular-scale",
        "sixty-two-five"
    ]);
    presetsData.forEach((preset) => {
        assert.ok(preset.name.ar, preset.id + " has an Arabic name");
        assert.ok(preset.name.en, preset.id + " has an English name");
        assert.ok(preset.description, preset.id + " has a description");
    });
});

test("default preset delegates to the Tailwind tables", () => {
    presetEngine.activeId = "tailwind-default";
    assert.strictEqual(presetEngine.isDefault(), true);
    assert.deepStrictEqual(
        presetEngine.spacingList().map((e) => e.px),
        tailwindData.spacingList().map((e) => e.px)
    );
});

test("golden ratio spacing resolves with the 16px baseline", () => {
    const preset = presetEngine.get("golden-ratio");
    assert.ok(preset);
    assert.strictEqual(presetEngine.toPx(preset.spacing["phi-1"], 16), 25.888);
    assert.strictEqual(presetEngine.toPx(preset.spacing["phi-2"], 16), 41.888);
});

test("fibonacci preset exposes the spacing ladder in ascending order", () => {
    presetEngine.apply("fibonacci");
    const list = presetEngine.spacingList();
    assert.strictEqual(list.length, 8);
    assert.strictEqual(list[0].token, "fib-1");
    assert.strictEqual(list[0].px, 16);
    assert.strictEqual(list[list.length - 1].token, "fib-21");
    assert.strictEqual(list[list.length - 1].px, 336);
    for (let i = 1; i < list.length; i++) {
        assert.ok(list[i].px >= list[i - 1].px, "ascending order");
    }
});

test("modular scale preset carries only a font scale", () => {
    const preset = presetEngine.get("modular-scale");
    assert.strictEqual(preset.spacing, undefined);
    presetEngine.apply("modular-scale");
    assert.strictEqual(presetEngine.spacingList().length, 0);
    const fonts = presetEngine.fontSizeList();
    assert.strictEqual(fonts.length, 7);
    assert.strictEqual(fonts[1].token, "ms-2");
    assert.strictEqual(fonts[1].px, 20);
});

test("62.5% trick switches the baseline to 10px", () => {
    const preset = presetEngine.apply("sixty-two-five");
    assert.strictEqual(preset.htmlFontSize, "62.5%");
    assert.strictEqual(conversionEngine.config.baseline, 10);
    assert.strictEqual(conversionEngine.remToPx(1), 10);
    assert.strictEqual(conversionEngine.remToPx(5), 50);
    const list = presetEngine.spacingList();
    assert.strictEqual(list[0].px, 10);
    assert.strictEqual(list[list.length - 1].px, 100);
});

test("applying a preset updates baseline and persists the id", () => {
    conversionEngine.setBaseline(16);
    presetEngine.apply("golden-ratio");
    assert.strictEqual(conversionEngine.config.baseline, 16);
    assert.strictEqual(presetEngine.activeId, "golden-ratio");
    presetEngine.apply("tailwind-default");
});

test("pxForSpacingToken resolves preset tokens and strips prefixes", () => {
    presetEngine.apply("fibonacci");
    assert.strictEqual(presetEngine.pxForSpacingToken("fib-5"), 80);
    assert.strictEqual(presetEngine.pxForSpacingToken("w-fib-5"), 80);
    assert.strictEqual(presetEngine.pxForSpacingToken("nope"), null);
    presetEngine.apply("tailwind-default");
});

test("pxForFontToken resolves preset font tokens", () => {
    presetEngine.apply("modular-scale");
    assert.strictEqual(presetEngine.pxForFontToken("ms-3"), 25.008);
    assert.strictEqual(presetEngine.pxForFontToken("text-ms-3"), 25.008);
    assert.strictEqual(presetEngine.pxForFontToken("unknown"), null);
    presetEngine.apply("tailwind-default");
});

test("custom presets round-trip through the settings store", () => {
    store.clear();
    settingsStore.savePresets([
        {
            id: "custom-test",
            name: "Test scale",
            description: "unit test",
            spacing: { small: "0.5rem", large: "2rem" }
        }
    ]);
    const all = presetEngine.all();
    assert.strictEqual(all.length, presetsData.length + 1);
    const custom = all[all.length - 1];
    assert.strictEqual(custom.id, "custom-test");
    assert.strictEqual(custom.builtIn, false);
    presetEngine.apply("custom-test");
    const list = presetEngine.spacingList();
    assert.strictEqual(list.length, 2);
    assert.strictEqual(list[0].px, 8);
    assert.strictEqual(list[1].px, 32);
    presetEngine.apply("tailwind-default");
});

test("validate rejects presets without a name or spacing", () => {
    assert.ok(presetEngine.validate(null).length > 0);
    assert.ok(presetEngine.validate({}).length > 0);
    assert.ok(presetEngine.validate({ name: "x" }).length > 0);
    assert.deepStrictEqual(
        presetEngine.validate({ name: "ok", spacing: { "4": "1rem" } }),
        []
    );
    assert.ok(
        presetEngine.validate({ name: "bad", spacing: { "4": "nope" } }).length > 0
    );
});

test("name and description resolve per language", () => {
    const preset = presetEngine.get("golden-ratio");
    assert.strictEqual(presetEngine.name(preset, "ar"), "النسبة الذهبية");
    assert.strictEqual(presetEngine.name(preset, "en"), "Golden Ratio Scale");
    assert.ok(presetEngine.description(preset, "en").indexOf("1.618") !== -1);
});
