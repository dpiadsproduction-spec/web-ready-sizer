/*
 * polyfills.jsx - small helpers that ExtendScript (ES3) is missing.
 */

if (typeof Array.prototype.indexOf !== "function") {
    Array.prototype.indexOf = function (item, from) {
        var start = from || 0;
        for (var i = start; i < this.length; i++) {
            if (this[i] === item) return i;
        }
        return -1;
    };
}

if (typeof Array.prototype.map !== "function") {
    Array.prototype.map = function (fn) {
        var out = [];
        for (var i = 0; i < this.length; i++) out.push(fn(this[i], i));
        return out;
    };
}

if (typeof Array.prototype.filter !== "function") {
    Array.prototype.filter = function (fn) {
        var out = [];
        for (var i = 0; i < this.length; i++) if (fn(this[i], i)) out.push(this[i]);
        return out;
    };
}

if (typeof String.prototype.trim !== "function") {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, "");
    };
}

function wrsRound(value, decimals) {
    var mult = Math.pow(10, decimals || 0);
    return Math.round(value * mult) / mult;
}

function wrsClamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

function wrsIsArray(value) {
    return Object.prototype.toString.apply(value) === "[object Array]";
}
