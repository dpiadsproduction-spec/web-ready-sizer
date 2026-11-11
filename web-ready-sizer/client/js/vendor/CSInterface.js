/*
 * CSInterface.js - minimal, dependency-free CSInterface implementation.
 *
 * This is a trimmed rewrite that exposes only the surface Web-Ready Sizer
 * needs. It talks to the CEP host through the `window.__adobe_cep__` bridge
 * that Adobe injects into every CEP panel. On a plain browser the bridge is
 * absent and evalScript() returns a friendly error string, which the host
 * bridge detects and switches to preview mode.
 */

(function (global) {
    "use strict";

    function CSInterface() {}

    CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";

    CSInterface.prototype.getHostEnvironment = function () {
        var env = {};
        try {
            env = JSON.parse(this.__bridge().getHostEnvironment());
        } catch (e) {
            env = {
                appName: "ILST",
                appVersion: "24.0.0",
                appLocale: "en_US",
                appUILocale: "en_US",
                isAppOnline: false
            };
        }
        return env;
    };

    CSInterface.prototype.getSystemPath = function (pathType) {
        try {
            return this.__bridge().getSystemPath(String(pathType));
        } catch (e) {
            return "";
        }
    };

    CSInterface.prototype.evalScript = function (script, callback) {
        var bridge;
        try {
            bridge = this.__bridge();
        } catch (e) {
            if (typeof callback === "function") {
                setTimeout(function () {
                    callback("EvalScript error: CEP bridge is unavailable");
                }, 0);
            }
            return;
        }

        if (!bridge || typeof bridge.evalScript !== "function") {
            if (typeof callback === "function") {
                setTimeout(function () {
                    callback("EvalScript error: CEP bridge is unavailable");
                }, 0);
            }
            return;
        }

        bridge.evalScript(String(script), function (result) {
            if (typeof callback === "function") callback(result);
        });
    };

    CSInterface.prototype.addEventListener = function (type, listener) {
        try {
            this.__bridge().addEventListener(String(type), listener);
        } catch (e) { }
    };

    CSInterface.prototype.removeEventListener = function (type, listener) {
        try {
            this.__bridge().removeEventListener(String(type), listener);
        } catch (e) { }
    };

    CSInterface.prototype.dispatchEvent = function (event) {
        try {
            this.__bridge().dispatchEvent(event);
        } catch (e) { }
    };

    CSInterface.prototype.getOSInformation = function () {
        try {
            return this.__bridge().getOSInformation();
        } catch (e) {
            return "Unknown";
        }
    };

    CSInterface.prototype.openURLInDefaultBrowser = function (url) {
        try {
            this.__bridge().invokeSync("cep.util.openURLInDefaultBrowser", "[" + JSON.stringify(String(url)) + "]");
            return true;
        } catch (e) {
            if (global.cep && global.cep.util && global.cep.util.openURLInDefaultBrowser) {
                global.cep.util.openURLInDefaultBrowser(String(url));
                return true;
            }
        }
        return false;
    };

    CSInterface.prototype.__bridge = function () {
        if (global.__adobe_cep__) return global.__adobe_cep__;
        if (global.cep && global.cep.__adobe_cep__) return global.cep.__adobe_cep__;
        throw new Error("CEP bridge is unavailable");
    };

    global.CSInterface = CSInterface;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = CSInterface;
    }
}(typeof window !== "undefined" ? window : globalThis));
