(function (root) {
    "use strict";

    var tailwindData = (root.WRS && root.WRS.tailwindData) ||
        (typeof require !== "undefined" ? require("../data/tailwind-data.js") : null);
    var colorMatcher = (root.WRS && root.WRS.colorMatcher) ||
        (typeof require !== "undefined" ? require("./color-matcher.js") : null);
    var conversionEngine = (root.WRS && root.WRS.conversionEngine) ||
        (typeof require !== "undefined" ? require("./conversion-engine.js") : null);

    function round(value, decimals) {
        var mult = Math.pow(10, decimals || 0);
        return Math.round(value * mult) / mult;
    }

    function px(value) {
        return round(value, 2);
    }

    function cssPx(value) {
        return round(value, 2) + "px";
    }

    function cssRem(value) {
        var engine = conversionEngine || { pxToRem: function (v, b) { return v / (b || 16); } };
        return round(engine.pxToRem(value, 16), 4) + "rem";
    }

    function hexFromColor(color) {
        if (!color || color.type === "none" || color.type === "unknown") return null;
        if (color.type === "rgb" || color.type === "cmyk" || color.type === "spot") {
            if (colorMatcher) return colorMatcher.rgbToHex(color.r, color.g, color.b);
            return "#" + [color.r, color.g, color.b].map(function (c) {
                var h = Math.round(c).toString(16).toUpperCase();
                return h.length === 1 ? "0" + h : h;
            }).join("");
        }
        return null;
    }

    var cssGenerator = {
        hexFromColor: hexFromColor,

        generateClasses: function (element, options) {
            var opts = options || {};
            var rtl = opts.rtl === true;
            if (!tailwindData) return [];

            var classes = [];

            if (element.width > 0) classes.push(tailwindData.widthClass(element.width));
            if (element.height > 0) classes.push(tailwindData.heightClass(element.height));

            var fillHex = hexFromColor(element.fill);
            if (fillHex && colorMatcher) {
                var fillMatch = colorMatcher.nearestTailwindColor(fillHex, "bg");
                if (fillMatch) classes.push(fillMatch.className);
            }

            if (element.stroke && element.stroke.width > 0) {
                classes.push(tailwindData.borderWidthClass(element.stroke.width));
                var strokeHex = hexFromColor(element.stroke);
                if (strokeHex && colorMatcher) {
                    var strokeMatch = colorMatcher.nearestTailwindColor(strokeHex, "border");
                    if (strokeMatch) classes.push(strokeMatch.className);
                }
            }

            if (element.cornerRadius > 0) {
                classes.push(tailwindData.radiusClass(element.cornerRadius));
            }

            if (typeof element.opacity === "number" && element.opacity < 100) {
                classes.push(tailwindData.opacityClass(element.opacity / 100));
            }

            if (element.text) {
                var sizePx = conversionEngine ? conversionEngine.ptToPx(element.text.sizePt) : element.text.sizePt * (96 / 72);
                if (sizePx > 0) classes.push(tailwindData.fontSizeClass(sizePx));
                if (element.text.weightGuess) classes.push(tailwindData.weightClass(element.text.weightGuess));
                if (element.text.caseStyle && element.text.caseStyle !== "normal") {
                    classes.push("text-" + element.text.caseStyle);
                }
                if (typeof element.text.tracking === "number" && element.text.tracking !== 0) {
                    classes.push(tailwindData.trackingClass(element.text.tracking / 1000));
                }
                if (typeof element.text.leadingPt === "number" && element.text.leadingPt > 0 && sizePx > 0) {
                    var leadingPx = conversionEngine ? conversionEngine.ptToPx(element.text.leadingPt) : element.text.leadingPt * (96 / 72);
                    classes.push(tailwindData.leadingClass(leadingPx / sizePx));
                }
                if (element.text.justification) {
                    var just = element.text.justification;
                    if (just === "center") classes.push("text-center");
                    else if (just === "right") classes.push(rtl ? "text-start" : "text-end");
                    else if (just === "justify") classes.push("text-justify");
                    else classes.push(rtl ? "text-end" : "text-start");
                }
            }

            return unique(classes.filter(Boolean));
        },

        generateCssDeclaration: function (element, options) {
            var opts = options || {};
            var useRem = opts.useRem === true;
            var dimension = useRem ? cssRem : cssPx;
            var lines = [];

            if (element.width > 0) lines.push("  width: " + dimension(element.width) + ";");
            if (element.height > 0) lines.push("  height: " + dimension(element.height) + ";");

            var fillHex = hexFromColor(element.fill);
            if (fillHex) {
                lines.push("  background-color: " + fillHex + ";");
            }

            if (element.stroke && element.stroke.width > 0) {
                var strokeHex = hexFromColor(element.stroke) || "#000000";
                lines.push("  border: " + px(element.stroke.width) + "px solid " + strokeHex + ";");
            }

            if (element.cornerRadius > 0) {
                lines.push("  border-radius: " + dimension(element.cornerRadius) + ";");
            }

            if (typeof element.opacity === "number" && element.opacity < 100) {
                lines.push("  opacity: " + round(element.opacity / 100, 2) + ";");
            }

            if (element.text) {
                var sizePx = conversionEngine ? conversionEngine.ptToPx(element.text.sizePt) : element.text.sizePt * (96 / 72);
                if (sizePx > 0) lines.push("  font-size: " + dimension(sizePx) + ";");
                if (element.text.weightGuess) lines.push("  font-weight: " + element.text.weightGuess + ";");
                if (element.text.caseStyle && element.text.caseStyle !== "normal") {
                    lines.push("  text-transform: " + element.text.caseStyle + ";");
                }
                if (typeof element.text.tracking === "number" && element.text.tracking !== 0) {
                    lines.push("  letter-spacing: " + round((element.text.tracking / 1000) * sizePx, 3) + "px;");
                }
                if (element.text.leadingPt > 0) {
                    var leadingPxValue = conversionEngine ? conversionEngine.ptToPx(element.text.leadingPt) : element.text.leadingPt * (96 / 72);
                    lines.push("  line-height: " + dimension(leadingPxValue) + ";");
                }
            }

            return lines.join("\n");
        },

        generateCssRule: function (element, selectorName, options) {
            var selector = selectorName || ("." + this.safeSelector(element));
            var body = this.generateCssDeclaration(element, options);
            if (!body) return "";
            return selector + " {\n" + body + "\n}";
        },

        safeSelector: function (element) {
            var type = String(element.type || "element").toLowerCase()
                .replace(/item$/, "")
                .replace(/frame$/, "-text");
            var name = String(element.name || "el")
                .toLowerCase()
                .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
                .replace(/^-+|-+$/g, "");
            if (!name) name = "el";
            return type + "-" + name + "-" + (element.index !== undefined ? element.index : 0);
        },

        generateHtml: function (element, options) {
            var classes = (options && options.classes) || this.generateClasses(element, options);
            var isText = !!element.text;
            var content = isText ? escapeHtml(String(element.text.contents || "Text")) : "";
            var tag = isText ? "p" : "div";
            var attrs = ' class="' + classes.join(" ") + '"';

            if (options && options.rtl) attrs += ' dir="rtl"';

            if (element.width > 0) attrs += ' data-w="' + px(element.width) + '"';
            if (element.height > 0) attrs += ' data-h="' + px(element.height) + '"';

            var name = element.name ? '<!-- ' + escapeHtml(element.name) + ' -->\n' : "";
            return name + "<" + tag + attrs + ">" + content + "</" + tag + ">";
        },

        generateHtmlDocument: function (elements, options) {
            var opts = options || {};
            var body = elements.map(function (el) {
                return "  " + cssGenerator.generateHtml(el, opts).split("\n").join("\n  ");
            }).join("\n");

            return [
                "<!DOCTYPE html>",
                '<html lang="ar" dir="' + (opts.rtl ? "rtl" : "ltr") + '">',
                "<head>",
                '  <meta charset="UTF-8" />',
                '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
                "  <title>Web-Ready Sizer Export</title>",
                '  <script src="https://cdn.tailwindcss.com"></script>',
                "</head>",
                '<body class="bg-white">',
                body,
                "</body>",
                "</html>"
            ].join("\n");
        },

        generateCssDocument: function (elements, options) {
            var opts = options || {};
            var header = [
                "/* Generated by Web-Ready Sizer v1.0 */",
                "/* Source document: " + (opts.documentName || "Untitled") + " */",
                "/* Baseline: 1rem = " + (opts.baseline || 16) + "px */",
                ""
            ].join("\n");

            var rules = elements.map(function (el) {
                return cssGenerator.generateCssRule(el, null, opts);
            }).filter(Boolean);

            return header + (opts.minify ? rules.join("").replace(/\s+/g, " ") : rules.join("\n\n"));
        },

        generateTailwindConfig: function (tokens) {
            var config = {
                theme: {
                    extend: {
                        colors: {},
                        spacing: {},
                        fontSize: {}
                    }
                }
            };

            (tokens.colors || []).forEach(function (color) {
                var key = String(color.hex || "").replace("#", "").toLowerCase();
                if (!key) return;
                config.theme.extend.colors["brand-" + key] = color.hex;
            });

            (tokens.spacing || []).forEach(function (value, index) {
                config.theme.extend.spacing["ds-" + index] = cssPx(value);
            });

            (tokens.fontSizes || []).forEach(function (value) {
                config.theme.extend.fontSize["ds-" + value] = cssPx(value);
            });

            return "module.exports = " + JSON.stringify(config, null, 2) + ";\n";
        },

        generateDesignTokens: function (elements, options) {
            var tokens = {
                $schema: "https://design-tokens.github.io/community-group/format/",
                generated: new Date().toISOString(),
                source: (options && options.documentName) || "Illustrator",
                color: {},
                dimension: {},
                typography: {}
            };

            var seenColors = {};
            var seenSizes = {};

            elements.forEach(function (el) {
                var fillHex = hexFromColor(el.fill);
                if (fillHex) {
                    var key = "color-" + fillHex.replace("#", "").toLowerCase();
                    if (!seenColors[key]) {
                        seenColors[key] = true;
                        var match = colorMatcher ? colorMatcher.nearestTailwindColor(fillHex, "bg") : null;
                        tokens.color[key] = {
                            $type: "color",
                            $value: fillHex,
                            $description: match ? match.className + " (dE " + match.deltaE + ")" : undefined
                        };
                    }
                }

                [el.width, el.height].forEach(function (value, i) {
                    if (!value || value <= 0) return;
                    var name = "size-" + px(value).toString().replace(".", "-");
                    if (!tokens.dimension[name]) {
                        tokens.dimension[name] = {
                            $type: "dimension",
                            $value: cssPx(value),
                            $description: round(value / 16, 4) + "rem"
                        };
                    }
                });

                if (el.text) {
                    var sizePx = conversionEngine ? conversionEngine.ptToPx(el.text.sizePt) : el.text.sizePt * (96 / 72);
                    var sizeKey = "font-" + px(sizePx).toString().replace(".", "-");
                    if (!seenSizes[sizeKey] && sizePx > 0) {
                        seenSizes[sizeKey] = true;
                        tokens.typography[sizeKey] = {
                            $type: "typography",
                            $value: {
                                fontSize: cssPx(sizePx),
                                fontWeight: el.text.weightGuess || 400,
                                fontFamily: el.text.font || "sans-serif"
                            }
                        };
                    }
                }
            });

            return JSON.stringify(tokens, null, 2);
        },

        generateAll: function (elements, options) {
            var opts = options || {};
            return [
                "<!-- Tailwind HTML -->",
                this.generateHtmlDocument(elements, opts),
                "",
                "<!-- CSS -->",
                this.generateCssDocument(elements, opts)
            ].join("\n");
        }
    };

    function unique(list) {
        var out = [];
        var seen = {};
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item || seen[item]) continue;
            seen[item] = true;
            out.push(item);
        }
        return out;
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    root.WRS = root.WRS || {};
    root.WRS.cssGenerator = cssGenerator;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = cssGenerator;
    }
}(typeof window !== "undefined" ? window : globalThis));
