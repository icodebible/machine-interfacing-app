"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardenSecurity = hardenSecurity;
const electron_1 = require("electron");
async function hardenSecurity() {
    // Block permission requests by default
    electron_1.session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => {
        callback(false);
    });
    // Optional: enforce CSP-like restrictions for prod
    if (electron_1.app.isPackaged) {
        electron_1.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            const csp = [
                "default-src 'self'",
                "script-src 'self'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "connect-src 'self' https:",
                "object-src 'none'",
                "frame-ancestors 'none'",
            ].join('; ');
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [csp],
                },
            });
        });
    }
}
