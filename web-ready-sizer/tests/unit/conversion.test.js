"use strict";

const test = require("node:test");
const assert = require("node:assert");

global.WRS = {};

const tailwindData = require("../../client/js/lib/data/tailwind-data.js");
const conversionEngine = require("../../client/js/lib/engine/conversion-engine.js");
const snapEngine = require("../../client/js/lib/engine/snap-engine.js");

test("remToPx converts with the default 16px baseline", () => {
    conversionEngine.setBaseline(16);
    assert.strictEqual(conversionEngine.remToPx(5), 80);
    assert.strictEqual(conversionEngine.remToPx(1.5), 24);
    assert.strictEqual(conversionEngine.remToPx(0.25), 4);
});

test("pxToRem converts back to rem", () => {
    conversionEngine.setBaseline(16);
    assert.strictEqual(conversionEngine.pxToRem(80), 5);
    assert.strictEqual(conversionEngine.pxToRem(16), 1);
});

test("ptToPx uses the 96 DPI conversion", () => {
    conversionEngine.setBaseline(16);
    assert.ok(Math.abs(conversionEngine.ptToPx(12) - 16) < 0.001);
    assert.ok(Math.abs(conversionEngine.ptToPx(50) - 66.6667) < 0.001);
});

test("pxToPt is the inverse of ptToPx", () => {
    var px = conversionEngine.ptToPx(36);
    assert.ok(Math.abs(conversionEngine.pxToPt(px) - 36) < 0.001);
});

test("the 62.5% trick switches the baseline to 10px", () => {
    conversionEngine.setBaseline(10);
    assert.strictEqual(conversionEngine.remToPx(5), 50);
    assert.strictEqual(conversionEngine.config.use62Trick, true);
    conversionEngine.setBaseline(16);
    assert.strictEqual(conversionEngine.config.use62Trick, false);
});

test("invald baselines are ignored", () => {
    conversionEngine.setBaseline(16);
    conversionEngine.setBaseline(0);
    conversionEngine.setBaseline(-4);
    conversionEngine.setBaseline("abc");
    assert.strictEqual(conversionEngine.config.baseline, 16);
});

test("parseValue understands rem values", () => {
    var parsed = conversionEngine.parseValue("5rem");
    assert.strictEqual(parsed.value, 5);
    assert.strictEqual(parsed.unit, "rem");
});

test("parseValue understands Tailwind width tokens", () => {
    var parsed = conversionEngine.parseValue("w-20");
    assert.strictEqual(parsed.unit, "px");
    assert.strictEqual(parsed.value, 80);
    assert.strictEqual(parsed.source, "tailwind");
});

test("parseValue understands Tailwind font tokens", () => {
    var parsed = conversionEngine.parseValue("text-xl");
    assert.strictEqual(parsed.value, 20);
});

test("parseValue understands bare numbers as px", () => {
    var parsed = conversionEngine.parseValue("80");
    assert.strictEqual(parsed.unit, "px");
    assert.strictEqual(parsed.value, 80);
});

test("parseValue rejects garbage", () => {
    assert.strictEqual(conversionEngine.parseValue("hello"), null);
    assert.strictEqual(conversionEngine.parseValue(""), null);
    assert.strictEqual(conversionEngine.parseValue(null), null);
});

test("toPx normalizes all units", () => {
    conversionEngine.setBaseline(16);
    assert.strictEqual(conversionEngine.toPx("2rem"), 32);
    assert.strictEqual(conversionEngine.toPx("32px"), 32);
    assert.strictEqual(conversionEngine.toPx("w-8"), 32);
});

test("fontToPx resolves Tailwind text tokens and pt", () => {
    conversionEngine.setBaseline(16);
    assert.strictEqual(conversionEngine.fontToPx("text-base"), 16);
    assert.strictEqual(conversionEngine.fontToPx("text-3xl"), 30);
    assert.ok(Math.abs(conversionEngine.fontToPx("12pt") - 16) < 0.001);
});

test("tailwindData maps px back to spacing tokens", () => {
    assert.strictEqual(tailwindData.widthClass(80), "w-20");
    assert.strictEqual(tailwindData.heightClass(24), "h-6");
    assert.strictEqual(tailwindData.widthClass(14), "w-3.5");
});

test("tailwindData falls back to arbitrary values", () => {
    assert.strictEqual(tailwindData.widthClass(73), "w-[73px]");
    assert.strictEqual(tailwindData.fontSizeClass(33), "text-[33px]");
});

test("tailwindData maps font sizes", () => {
    assert.strictEqual(tailwindData.fontSizeClass(16), "text-base");
    assert.strictEqual(tailwindData.fontSizeClass(48), "text-5xl");
});

test("radius and border tokens resolve correctly", () => {
    assert.strictEqual(tailwindData.radiusClass(4), "rounded");
    assert.strictEqual(tailwindData.radiusClass(8), "rounded-lg");
    assert.strictEqual(tailwindData.borderWidthClass(1), "border");
    assert.strictEqual(tailwindData.borderWidthClass(2), "border-2");
});

test("breakpointForWidth returns the first breakpoint at or above the width", () => {
    assert.strictEqual(tailwindData.breakpointForWidth(500).name, "sm");
    assert.strictEqual(tailwindData.breakpointForWidth(640).name, "sm");
    assert.strictEqual(tailwindData.breakpointForWidth(641).name, "md");
    assert.strictEqual(tailwindData.breakpointForWidth(2000).name, "2xl");
});

test("snapToTailwind returns the nearest spacing value", () => {
    assert.strictEqual(snapEngine.snapToTailwind(23), 24);
    assert.strictEqual(snapEngine.snapToTailwind(17), 16);
    assert.strictEqual(snapEngine.snapToTailwind(100), 96);
});

test("snapToTailwind clamps non-positive input to zero", () => {
    assert.strictEqual(snapEngine.snapToTailwind(0), 0);
    assert.strictEqual(snapEngine.snapToTailwind(-5), 0);
});

test("snapFontSize snaps a pt size to the nearest Tailwind px size", () => {
    assert.strictEqual(snapEngine.snapFontSize(12), 16);
    assert.strictEqual(snapEngine.snapFontSize(36), 48);
});

test("clampDimension keeps values inside the supported range", () => {
    assert.strictEqual(snapEngine.clampDimension(0), 1);
    assert.strictEqual(snapEngine.clampDimension(99999), 10000);
    assert.strictEqual(snapEngine.clampDimension(320), 320);
});
