import { getDb } from './db';

// // export async function runMigrations() {
// //     const db = getDb();

// //     db.exec(`
// //         CREATE TABLE IF NOT EXISTS meta (
// //         key TEXT PRIMARY KEY,
// //         value TEXT NOT NULL
// //         );

// //         CREATE TABLE IF NOT EXISTS users (
// //         id TEXT PRIMARY KEY,
// //         username TEXT NOT NULL UNIQUE,
// //         password_hash TEXT NOT NULL,
// //         must_change_password INTEGER NOT NULL DEFAULT 0,
// //         is_active INTEGER NOT NULL DEFAULT 1,
// //         created_at TEXT NOT NULL,
// //         updated_at TEXT NOT NULL
// //         );

// //         CREATE TABLE IF NOT EXISTS roles (
// //         id TEXT PRIMARY KEY,
// //         name TEXT NOT NULL UNIQUE,
// //         description TEXT,
// //         created_at TEXT NOT NULL
// //         );

// //         CREATE TABLE IF NOT EXISTS role_authorities (
// //         role_id TEXT NOT NULL,
// //         authority_code TEXT NOT NULL,
// //         PRIMARY KEY (role_id, authority_code),
// //         FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
// //         );

// //         CREATE TABLE IF NOT EXISTS user_roles (
// //         user_id TEXT NOT NULL,
// //         role_id TEXT NOT NULL,
// //         PRIMARY KEY (user_id, role_id),
// //         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
// //         FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
// //         );
// //   `);
// // }

// import { getDb } from './db';

// export async function runMigrations() {
//     const db = getDb();

//     // MIGRATION: labs table
//     db.exec(`
//         CREATE TABLE IF NOT EXISTS meta (
//         key TEXT PRIMARY KEY,
//         value TEXT NOT NULL
//         );

//         CREATE TABLE IF NOT EXISTS users (
//         id TEXT PRIMARY KEY,
//         username TEXT NOT NULL UNIQUE,
//         password_hash TEXT NOT NULL,
//         must_change_password INTEGER NOT NULL DEFAULT 0,
//         is_active INTEGER NOT NULL DEFAULT 1,
//         created_at TEXT NOT NULL,
//         updated_at TEXT NOT NULL
//         );

//         CREATE TABLE IF NOT EXISTS roles (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL UNIQUE,
//         description TEXT,
//         created_at TEXT NOT NULL
//         );

//         CREATE TABLE IF NOT EXISTS role_authorities (
//         role_id TEXT NOT NULL,
//         authority_code TEXT NOT NULL,
//         PRIMARY KEY (role_id, authority_code),
//         FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
//         );

//         CREATE TABLE IF NOT EXISTS user_roles (
//         user_id TEXT NOT NULL,
//         role_id TEXT NOT NULL,
//         PRIMARY KEY (user_id, role_id),
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//         FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
//         );

//         -- ✅ Labs
//         CREATE TABLE IF NOT EXISTS labs (
//         id TEXT PRIMARY KEY,
//         code TEXT UNIQUE,
//         name TEXT NOT NULL,
//         location TEXT,
//         description TEXT,
//         is_active INTEGER NOT NULL DEFAULT 1,
//         created_at TEXT NOT NULL,
//         updated_at TEXT NOT NULL
//         );

//         -- ✅ Machines
//         -- CREATE TABLE IF NOT EXISTS machines (
//         -- id TEXT PRIMARY KEY,
//         -- lab_id TEXT,
//         -- name TEXT NOT NULL,
//         -- brand TEXT,
//         -- model TEXT,
//         -- version TEXT,
//         -- connection_type TEXT NOT NULL, -- TCP | SERIAL | FTP | SFTP
//         -- protocol TEXT NOT NULL,        -- HL7 | ASTM
//         -- tcp_host TEXT,
//         -- tcp_port INTEGER,
//         -- serial_path TEXT,
//         -- serial_baud_rate INTEGER,
//         -- enabled INTEGER NOT NULL DEFAULT 1,
//         -- auto_connect INTEGER NOT NULL DEFAULT 0,
//         -- created_at TEXT NOT NULL,
//         -- updated_at TEXT NOT NULL,
//         -- FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE SET NULL
//         -- );

//         CREATE TABLE IF NOT EXISTS machines (
//         id TEXT PRIMARY KEY,
//         lab_id TEXT NOT NULL,

//         name TEXT NOT NULL,
//         code TEXT,
//         manufacturer TEXT,
//         model TEXT,

//         connection_type TEXT NOT NULL,  -- TCP | SERIAL | HL7_MLLP | FTP | SFTP | FILE_WATCHER

//         -- TCP / HL7_MLLP / ASTM_TCP
//         host TEXT,
//         port INTEGER,

//         -- SERIAL / ASTM_SERIAL
//         serial_port TEXT,
//         baud_rate INTEGER,
//         data_bits INTEGER,
//         stop_bits INTEGER,
//         parity TEXT,

//         -- FTP/SFTP
//         ftp_host TEXT,
//         ftp_port INTEGER,
//         ftp_user TEXT,
//         ftp_password TEXT,
//         ftp_remote_dir TEXT,

//         -- FILE WATCHER
//         watch_dir TEXT,
//         watch_pattern TEXT,

//         protocol TEXT,  -- ASTM | HL7 | RAW (helps future parsing pipeline)

//         is_active INTEGER DEFAULT 1,
//         created_at TEXT NOT NULL,
//         updated_at TEXT NOT NULL,

//         FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE RESTRICT
//         );

//         CREATE INDEX IF NOT EXISTS idx_machines_lab_id ON machines(lab_id);

//         -- ✅ Targets (DHIS2 + OpenMRS)
//         CREATE TABLE IF NOT EXISTS targets (
//         id TEXT PRIMARY KEY,
//         type TEXT NOT NULL,      -- DHIS2 | OPENMRS
//         name TEXT NOT NULL,
//         base_url TEXT NOT NULL,
//         token TEXT,
//         enabled INTEGER NOT NULL DEFAULT 1,
//         created_at TEXT NOT NULL,
//         updated_at TEXT NOT NULL
//         );

//         -- ✅ Logs
//         CREATE TABLE IF NOT EXISTS logs (
//         id TEXT PRIMARY KEY,
//         level TEXT NOT NULL,        -- info|warn|error
//         source TEXT NOT NULL,       -- APP|MACHINE|TARGET|AUTH
//         entity_type TEXT,
//         entity_id TEXT,
//         message TEXT NOT NULL,
//         payload_json TEXT,
//         created_at TEXT NOT NULL
//         );

//         CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
//         CREATE INDEX IF NOT EXISTS idx_logs_entity ON logs(entity_type, entity_id);
//     `);
// }

export async function runMigrations() {
  const db = getDb();

  db.exec(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        must_change_password INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS role_authorities (
        role_id TEXT NOT NULL,
        authority_code TEXT NOT NULL,
        PRIMARY KEY (role_id, authority_code),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_roles (
        user_id TEXT NOT NULL,
        role_id TEXT NOT NULL,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS labs (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        location TEXT,
        description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
        );

        -- ✅ Machines (unified schema: TCP, HL7_MLLP, SERIAL, FTP, SFTP, FILE_WATCHER)
        CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        lab_id TEXT,

        name TEXT NOT NULL,
        code TEXT,
        brand TEXT,
        model TEXT,
        version TEXT,
        manufacturer TEXT,

        connection_type TEXT NOT NULL, -- TCP | SERIAL | HL7_MLLP | FTP | SFTP | FILE_WATCHER
        protocol TEXT NOT NULL,        -- ASTM | HL7 | RAW

        -- TCP / HL7
        host TEXT,
        port INTEGER,

        -- SERIAL
        serial_port TEXT,
        baud_rate INTEGER,
        data_bits INTEGER,
        stop_bits INTEGER,
        parity TEXT, -- none|even|odd|mark|space

        -- FTP / SFTP
        ftp_host TEXT,
        ftp_port INTEGER,
        ftp_user TEXT,
        ftp_password TEXT,
        ftp_remote_dir TEXT,

        -- FILE WATCHER
        watch_dir TEXT,
        watch_pattern TEXT,

        is_active INTEGER NOT NULL DEFAULT 1,
        auto_connect INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,

        FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_machines_lab_id ON machines(lab_id);

        CREATE TABLE IF NOT EXISTS targets (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        base_url TEXT NOT NULL,
        token TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        level TEXT NOT NULL,
        source TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        message TEXT NOT NULL,
        payload_json TEXT,
        created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_logs_entity ON logs(entity_type, entity_id);
    `);
}
