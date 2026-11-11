"use strict";

const test = require("node:test");
const assert = require("node:assert");

global.WRS = {};

const colorData = require("../../client/js/lib/data/tailwind-colors.js");
const colorMatcher = require("../../client/js/lib/engine/color-matcher.js");

test("the palette exposes 22 color families with 11 shades each", () => {
    const families = Object.keys(colorData.palette);
    assert.strictEqual(families.length, 22);
    families.forEach((family) => {
        assert.strictEqual(Object.keys(colorData.palette[family]).length, 11, family);
    });
    assert.strictEqual(colorData.flat.length, 242);
});

test("hexToRgb parses long and short hex forms", () => {
    assert.deepStrictEqual(colorMatcher.hexToRgb("#1e293b"), { r: 30, g: 41, b: 59 });
    assert.deepStrictEqual(colorMatcher.hexToRgb("#fff"), { r: 255, g: 255, b: 255 });
    assert.strictEqual(colorMatcher.hexToRgb("nope"), null);
});

test("rgbToHex round-trips through hexToRgb", () => {
    const hex = colorMatcher.rgbToHex(30, 41, 59);
    assert.strictEqual(hex, "#1E293B");
    const rgb = colorMatcher.hexToRgb(hex);
    assert.deepStrictEqual(rgb, { r: 30, g: 41, b: 59 });
});

test("deltaE2000 returns zero for identical colors", () => {
    const lab = colorMatcher.hexToLab("#14B8A6");
    assert.ok(colorMatcher.deltaE2000(lab, lab) < 1e-9);
});

test("deltaE2000 is symmetric", () => {
    const a = colorMatcher.hexToLab("#ff0000");
    const b = colorMatcher.hexToLab("#0000ff");
    const ab = colorMatcher.deltaE2000(a, b);
    const ba = colorMatcher.deltaE2000(b, a);
    assert.ok(Math.abs(ab - ba) < 1e-9);
});

test("an exact Tailwind color matches its own class", () => {
    const match = colorMatcher.nearestTailwindColor("#1e293b", "bg");
    assert.strictEqual(match.className, "bg-slate-800");
    assert.strictEqual(match.confidence, "exact");
    assert.ok(match.deltaE < 0.01);
});

test("teal-500 is recognised exactly", () => {
    const match = colorMatcher.nearestTailwindColor("#14B8A6", "bg");
    assert.strictEqual(match.className, "bg-teal-500");
    assert.strictEqual(match.confidence, "exact");
});

test("an off-palette color resolves to the closest family and shade", () => {
    const match = colorMatcher.nearestTailwindColor("#30345F", "bg");
    assert.match(match.className, /^bg-[a-z]+-\d+$/);
    assert.strictEqual(match.className, "bg-blue-950");
    assert.strictEqual(match.confidence, "approximate");

    const exact = colorMatcher.nearestTailwindColor("#30345F", "bg");
    assert.ok(exact.deltaE < 10);
});

test("the border prefix is honoured", () => {
    const match = colorMatcher.nearestTailwindColor("#14B8A6", "border");
    assert.strictEqual(match.className, "border-teal-500");
});

test("luminance and contrast ratio behave for black and white", () => {
    assert.strictEqual(colorMatcher.luminance("#000000"), 0);
    assert.strictEqual(colorMatcher.luminance("#ffffff"), 1);
    assert.strictEqual(colorMatcher.contrastRatio("#000000", "#ffffff"), 21);
});

test("confidence buckets match the documented thresholds", () => {
    assert.strictEqual(colorMatcher.confidenceFor(0).level, "exact");
    assert.strictEqual(colorMatcher.confidenceFor(2).level, "exact");
    assert.strictEqual(colorMatcher.confidenceFor(3).level, "close");
    assert.strictEqual(colorMatcher.confidenceFor(8).level, "approximate");
    assert.strictEqual(colorMatcher.confidenceFor(20).level, "distant");
});
