"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const clientDir = path.join(root, "client", "js");

const files = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".js")) files.push(full);
    }
})(clientDir);

let failures = 0;

for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    try {
        new vm.Script(source, { filename: file });
        console.log("ok    " + path.relative(root, file));
    } catch (error) {
        failures++;
        console.error("FAIL  " + path.relative(root, file));
        console.error("      " + error.message);
    }
}

const jsxDir = path.join(root, "jsx");
const jsxFiles = [];
(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith(".jsx")) jsxFiles.push(full);
    }
})(jsxDir);

const es3Banned = [
    { pattern: /\b(?:let|const)\s+[A-Za-z_$]/, label: "let/const declaration" },
    { pattern: /=>/, label: "arrow function" },
    { pattern: /`[\s\S]*?`/, label: "template literal" },
    { pattern: /\.\.\./, label: "spread/rest operator" }
];

for (const file of jsxFiles) {
    const raw = fs.readFileSync(file, "utf8");
    const source = raw.replace(/^\s*#include\s+.*$/gm, "");
    try {
        new vm.Script(source, { filename: file });
    } catch (error) {
        failures++;
        console.error("FAIL  " + path.relative(root, file));
        console.error("      " + error.message);
        continue;
    }

    const stripped = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");

    const violations = es3Banned
        .filter((rule) => rule.pattern.test(stripped))
        .map((rule) => rule.label);

    if (violations.length) {
        failures++;
        console.error("FAIL  " + path.relative(root, file));
        console.error("      ES3 violations: " + violations.join(", "));
    } else {
        console.log("ok    " + path.relative(root, file) + " (ES3)");
    }
}

if (failures > 0) {
    console.error("\n" + failures + " file(s) failed.");
    process.exit(1);
}

console.log("\nAll " + (files.length + jsxFiles.length) + " files passed.");
