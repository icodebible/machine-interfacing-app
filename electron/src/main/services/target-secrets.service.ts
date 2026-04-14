// import { getDb } from '../db/db';
// import { decryptText, encryptText } from '../security/crypto.util';

// const nowIso = () => new Date().toISOString();

// export type TargetSecretInput = {
//     authType: 'none' | 'bearer' | 'basic' | 'api_key';
//     username?: string | null;
//     password?: string | null;
//     token?: string | null;
//     apiKeyName?: string | null;
//     apiKeyValue?: string | null;
//     allowInsecureTls?: boolean;
// };

// export class TargetSecretsService {
//     save(targetId: string, input: TargetSecretInput) {
//         const db = getDb();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_secrets (
//                     target_id,
//                     auth_type,
//                     username_enc,
//                     password_enc,
//                     token_enc,
//                     api_key_name,
//                     api_key_value_enc,
//                     allow_insecure_tls,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//                 ON CONFLICT(target_id) DO UPDATE SET
//                     auth_type = excluded.auth_type,
//                     username_enc = excluded.username_enc,
//                     password_enc = excluded.password_enc,
//                     token_enc = excluded.token_enc,
//                     api_key_name = excluded.api_key_name,
//                     api_key_value_enc = excluded.api_key_value_enc,
//                     allow_insecure_tls = excluded.allow_insecure_tls,
//                     updated_at = excluded.updated_at
//                 `,
//             ).run(
//                 targetId,
//                 input.authType,
//                 input.username ? encryptText(input.username) : null,
//                 input.password ? encryptText(input.password) : null,
//                 input.token ? encryptText(input.token) : null,
//                 input.apiKeyName ?? null,
//                 input.apiKeyValue ? encryptText(input.apiKeyValue) : null,
//                 input.allowInsecureTls ? 1 : 0,
//                 ts,
//                 ts,
//             );

//         return true;
//     }

//     get(targetId: string) {
//         const db = getDb();
//         const row = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_secrets
//                     WHERE target_id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(targetId) as any;

//         if (!row) return null;

//         return {
//             targetId: row.target_id,
//             authType: row.auth_type,
//             username: decryptText(row.username_enc),
//             password: decryptText(row.password_enc),
//             token: decryptText(row.token_enc),
//             apiKeyName: row.api_key_name ?? null,
//             apiKeyValue: decryptText(row.api_key_value_enc),
//             allowInsecureTls: row.allow_insecure_tls === 1,
//         };
//     }
// }

import { getDb } from '../db/db';
import { decryptText, encryptText } from '../security/crypto.util';

const nowIso = () => new Date().toISOString();

export type TargetSecretInput = {
    authType: 'none' | 'bearer' | 'basic' | 'api_key';
    username?: string | null;
    password?: string | null;
    token?: string | null;
    apiKeyName?: string | null;
    apiKeyValue?: string | null;
    allowInsecureTls?: boolean;
};

export class TargetSecretsService {
    save(targetId: string, input: TargetSecretInput) {
        const db = getDb();
        const ts = nowIso();

        db.prepare(
            `
                INSERT INTO target_secrets (
                    target_id,
                    auth_type,
                    username_enc,
                    password_enc,
                    token_enc,
                    api_key_name,
                    api_key_value_enc,
                    allow_insecure_tls,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(target_id) DO UPDATE SET
                    auth_type = excluded.auth_type,
                    username_enc = excluded.username_enc,
                    password_enc = excluded.password_enc,
                    token_enc = excluded.token_enc,
                    api_key_name = excluded.api_key_name,
                    api_key_value_enc = excluded.api_key_value_enc,
                    allow_insecure_tls = excluded.allow_insecure_tls,
                    updated_at = excluded.updated_at
            `,
        ).run(
            targetId,
            input.authType,
            input.username ? encryptText(input.username) : null,
            input.password ? encryptText(input.password) : null,
            input.token ? encryptText(input.token) : null,
            input.apiKeyName ?? null,
            input.apiKeyValue ? encryptText(input.apiKeyValue) : null,
            input.allowInsecureTls ? 1 : 0,
            ts,
            ts,
        );

        return true;
    }

    get(targetId: string) {
        const db = getDb();
        const row = db
            .prepare(
                `
                    SELECT *
                    FROM target_secrets
                    WHERE target_id = ?
                    LIMIT 1
                `,
            )
            .get(targetId) as any;

        if (!row) return null;

        return {
            targetId: row.target_id,
            authType: row.auth_type,
            username: decryptText(row.username_enc),
            password: decryptText(row.password_enc),
            token: decryptText(row.token_enc),
            apiKeyName: row.api_key_name ?? null,
            apiKeyValue: decryptText(row.api_key_value_enc),
            allowInsecureTls: row.allow_insecure_tls === 1,
        };
    }
}
