"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptText = encryptText;
exports.decryptText = decryptText;
const crypto_1 = require("crypto");
function getKey() {
    const raw = process.env.CONNECTOR_SECRET_KEY?.trim();
    if (!raw) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CONNECTOR_SECRET_KEY is required in production');
        }
        return (0, crypto_1.createHash)('sha256')
            .update('machine-interfacing-dev-secret')
            .digest();
    }
    return (0, crypto_1.createHash)('sha256').update(raw).digest();
}
function encryptText(value) {
    const iv = (0, crypto_1.randomBytes)(12);
    const key = getKey();
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}
function decryptText(value) {
    if (!value)
        return null;
    const raw = Buffer.from(value, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);
    const key = getKey();
    const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString('utf8');
}
