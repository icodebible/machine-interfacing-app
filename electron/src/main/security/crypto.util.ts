import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function getKey(): Buffer {
    const raw = process.env.CONNECTOR_SECRET_KEY?.trim();

    if (!raw) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('CONNECTOR_SECRET_KEY is required in production');
        }

        return createHash('sha256')
            .update('machine-interfacing-dev-secret')
            .digest();
    }

    return createHash('sha256').update(raw).digest();
}

export function encryptText(value: string): string {
    const iv = randomBytes(12);
    const key = getKey();
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptText(value: string | null | undefined): string | null {
    if (!value) return null;

    const raw = Buffer.from(value, 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);

    const key = getKey();
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString('utf8');
}