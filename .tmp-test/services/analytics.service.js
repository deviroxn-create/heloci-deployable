"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEvent = trackEvent;
function trackEvent(event, metadata = {}) {
    console.log("[Analytics]", event, metadata);
}
