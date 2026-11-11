"use strict";

/*
 * preview-server.js - serves the CEP panel folder in a browser so the UI can
 * be reviewed without Illustrator. The panel detects the missing CEP bridge
 * and switches to preview mode with mock data.
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "client");
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || "0.0.0.0";

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf"
};

const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    const target = path.join(ROOT, relative);
    const resolved = path.resolve(target);

    if (!resolved.startsWith(ROOT)) {
        res.writeHead(403, { "Content-Type": "text/plain" });
        res.end("Forbidden");
        return;
    }

    fs.readFile(resolved, (error, data) => {
        if (error) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found: " + relative);
            return;
        }

        const type = MIME[path.extname(resolved)] || "application/octet-stream";
        res.writeHead(200, {
            "Content-Type": type,
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(data);
    });
});

server.listen(PORT, HOST, () => {
    console.log("Web-Ready Sizer preview running at http://localhost:" + PORT);
    console.log("Serving: " + ROOT);
    console.log("Press Ctrl+C to stop.");
});
