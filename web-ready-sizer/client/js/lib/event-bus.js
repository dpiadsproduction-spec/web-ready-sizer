(function (root) {
    "use strict";

    var listeners = {};

    var eventBus = {
        on: function (event, handler) {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
            return function () { eventBus.off(event, handler); };
        },

        off: function (event, handler) {
            var list = listeners[event];
            if (!list) return;
            var index = list.indexOf(handler);
            if (index !== -1) list.splice(index, 1);
        },

        emit: function (event, payload) {
            var list = listeners[event];
            if (!list) return;
            var copy = list.slice();
            for (var i = 0; i < copy.length; i++) {
                try {
                    copy[i](payload);
                } catch (e) {
                    if (root.console && root.console.error) {
                        root.console.error("[event-bus] handler failed for " + event, e);
                    }
                }
            }
        },

        clear: function () {
            listeners = {};
        }
    };

    root.WRS = root.WRS || {};
    root.WRS.eventBus = eventBus;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = eventBus;
    }
}(typeof window !== "undefined" ? window : globalThis));
