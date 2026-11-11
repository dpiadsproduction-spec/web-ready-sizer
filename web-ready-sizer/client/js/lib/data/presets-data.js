(function (root) {
    "use strict";

    var PRESETS = [
        {
            id: "tailwind-default",
            name: { ar: "Tailwind الافتراضي", en: "Tailwind Default" },
            description: {
                ar: "سلسلة Tailwind الافتراضية",
                en: "The stock Tailwind spacing and type scale"
            },
            builtIn: true,
            baseline: 16,
            spacing: {
                "0": "0",
                "px": "1px",
                "0.5": "0.125rem",
                "1": "0.25rem",
                "2": "0.5rem",
                "3": "0.75rem",
                "4": "1rem",
                "5": "1.25rem",
                "6": "1.5rem",
                "8": "2rem",
                "10": "2.5rem",
                "12": "3rem",
                "16": "4rem",
                "20": "5rem",
                "24": "6rem",
                "32": "8rem",
                "40": "10rem",
                "48": "12rem",
                "56": "14rem",
                "64": "16rem",
                "80": "20rem",
                "96": "24rem"
            },
            fontSize: {
                "xs": "0.75rem",
                "sm": "0.875rem",
                "base": "1rem",
                "lg": "1.125rem",
                "xl": "1.25rem",
                "2xl": "1.5rem",
                "3xl": "1.875rem",
                "4xl": "2.25rem",
                "5xl": "3rem",
                "6xl": "3.75rem",
                "7xl": "4.5rem",
                "8xl": "6rem",
                "9xl": "8rem"
            }
        },
        {
            id: "golden-ratio",
            name: { ar: "النسبة الذهبية", en: "Golden Ratio Scale" },
            description: {
                ar: "سلسلة بمضاعفات φ ≈ 1.618",
                en: "A modular scale built on φ ≈ 1.618"
            },
            builtIn: true,
            baseline: 16,
            spacing: {
                "phi-1": "1.618rem",
                "phi-2": "2.618rem",
                "phi-3": "4.236rem",
                "phi-4": "6.854rem",
                "phi-5": "11.09rem"
            },
            fontSize: {
                "phi-sm": "1.618rem",
                "phi-md": "2.618rem",
                "phi-lg": "4.236rem"
            }
        },
        {
            id: "fibonacci",
            name: { ar: "فيبوناتشي", en: "Fibonacci Scale" },
            description: {
                ar: "سلسلة فيبوناتشي: 1, 1, 2, 3, 5, 8, 13, 21",
                en: "Fibonacci spacing steps: 1, 1, 2, 3, 5, 8, 13, 21"
            },
            builtIn: true,
            baseline: 16,
            spacing: {
                "fib-1": "1rem",
                "fib-2": "1rem",
                "fib-3": "2rem",
                "fib-4": "3rem",
                "fib-5": "5rem",
                "fib-6": "8rem",
                "fib-13": "13rem",
                "fib-21": "21rem"
            }
        },
        {
            id: "modular-scale",
            name: { ar: "Modular Scale 1.250", en: "Modular Scale 1.250" },
            description: {
                ar: "سلسلة طباعية Major Third",
                en: "Perfect Major Third typographic scale"
            },
            builtIn: true,
            baseline: 16,
            fontSize: {
                "ms-1": "1rem",
                "ms-2": "1.25rem",
                "ms-3": "1.563rem",
                "ms-4": "1.953rem",
                "ms-5": "2.441rem",
                "ms-6": "3.052rem",
                "ms-7": "3.815rem"
            }
        },
        {
            id: "sixty-two-five",
            name: { ar: "حيلة 62.5%", en: "62.5% Trick" },
            description: {
                ar: "حيلة المحترفين — 1rem = 10px",
                en: "The 62.5% trick — 1rem equals 10px"
            },
            builtIn: true,
            baseline: 10,
            htmlFontSize: "62.5%",
            spacing: {
                "1": "1rem",
                "1.4": "1.4rem",
                "1.8": "1.8rem",
                "2.4": "2.4rem",
                "3.2": "3.2rem",
                "4.8": "4.8rem",
                "10": "10rem"
            }
        }
    ];

    root.WRS = root.WRS || {};
    root.WRS.presetsData = PRESETS;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = PRESETS;
    }
}(typeof window !== "undefined" ? window : globalThis));
