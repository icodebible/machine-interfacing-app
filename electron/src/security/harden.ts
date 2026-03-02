import { app, session } from 'electron';

export async function hardenSecurity() {
    // Block permission requests by default
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => {
        callback(false);
    });

    // Optional: enforce CSP-like restrictions for prod
    if (app.isPackaged) {
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
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