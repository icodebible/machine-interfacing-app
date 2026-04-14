import { getDb } from './db';

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
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
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

        CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        lab_id TEXT,

        name TEXT NOT NULL,
        code TEXT,
        brand TEXT,
        model TEXT,
        version TEXT,
        manufacturer TEXT,

        connection_type TEXT NOT NULL,
        protocol TEXT NOT NULL,

        host TEXT,
        port INTEGER,

        serial_port TEXT,
        baud_rate INTEGER,
        data_bits INTEGER,
        stop_bits INTEGER,
        parity TEXT,

        ftp_host TEXT,
        ftp_port INTEGER,
        ftp_user TEXT,
        ftp_password TEXT,
        ftp_remote_dir TEXT,

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
        auto_retry_enabled INTEGER NOT NULL DEFAULT 1,
        max_retry_attempts INTEGER NOT NULL DEFAULT 4,
        retry_backoff_strategy TEXT NOT NULL DEFAULT 'EXPONENTIAL',
        initial_retry_delay_ms INTEGER NOT NULL DEFAULT 60000,
        max_retry_delay_ms INTEGER NOT NULL DEFAULT 3600000,
        request_timeout_ms INTEGER NOT NULL DEFAULT 15000,
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

        CREATE TABLE IF NOT EXISTS machine_traffic_logs (
            id TEXT PRIMARY KEY,
            machine_id TEXT NOT NULL,
            direction TEXT NOT NULL,
            transport TEXT NOT NULL,
            protocol TEXT NOT NULL,
            event_type TEXT NOT NULL,
            payload TEXT,
            payload_preview TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_machine_traffic_logs_machine_id
        ON machine_traffic_logs(machine_id);

        CREATE INDEX IF NOT EXISTS idx_machine_traffic_logs_created_at
        ON machine_traffic_logs(created_at);

        CREATE TABLE IF NOT EXISTS approval_policies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            applies_to_lab_id TEXT,
            applies_to_machine_id TEXT,
            applies_to_target_id TEXT,
            requires_approval INTEGER NOT NULL DEFAULT 0,
            min_approvals INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            created_by_user_id TEXT,
            created_by_username TEXT,
            updated_by_user_id TEXT,
            updated_by_username TEXT
        );

        CREATE TABLE IF NOT EXISTS approval_policy_steps (
            id TEXT PRIMARY KEY,
            policy_id TEXT NOT NULL,
            step_order INTEGER NOT NULL,
            role_code TEXT NOT NULL,
            min_approvers_at_step INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (policy_id) REFERENCES approval_policies(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS approval_policy_targets (
            policy_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            created_by_user_id TEXT,
            created_by_username TEXT,
            updated_by_user_id TEXT,
            updated_by_username TEXT,
            PRIMARY KEY (policy_id, target_id),
            FOREIGN KEY (policy_id) REFERENCES approval_policies(id) ON DELETE CASCADE,
            FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_approval_policy_targets_policy_id
        ON approval_policy_targets(policy_id);

        CREATE INDEX IF NOT EXISTS idx_approval_policy_targets_target_id
        ON approval_policy_targets(target_id);

        CREATE TABLE IF NOT EXISTS result_workflow_status (
            id TEXT PRIMARY KEY,
            normalized_result_id TEXT NOT NULL,
            status TEXT NOT NULL,
            approval_policy_id TEXT,
            approval_required INTEGER NOT NULL DEFAULT 0,
            approval_count_required INTEGER NOT NULL DEFAULT 0,
            approval_count_received INTEGER NOT NULL DEFAULT 0,
            queued_at TEXT,
            routed_at TEXT,
            failed_at TEXT,
            last_error TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            created_by_user_id TEXT,
            created_by_username TEXT,
            updated_by_user_id TEXT,
            updated_by_username TEXT
        );

        CREATE TABLE IF NOT EXISTS result_approvals (
            id TEXT PRIMARY KEY,
            normalized_result_id TEXT NOT NULL,
            policy_id TEXT NOT NULL,
            step_order INTEGER NOT NULL,
            approver_user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            comment TEXT,
            acted_at TEXT NOT NULL,
            created_by_user_id TEXT,
            created_by_username TEXT,
            updated_by_user_id TEXT,
            updated_by_username TEXT
        );

        CREATE TABLE IF NOT EXISTS outbound_queue (
            id TEXT PRIMARY KEY,
            normalized_result_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            delivery_status TEXT NOT NULL,
            retry_count INTEGER NOT NULL DEFAULT 0,
            next_retry_at TEXT,
            last_error TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            created_by_user_id TEXT,
            created_by_username TEXT,
            updated_by_user_id TEXT,
            updated_by_username TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_result_workflow_status_normalized_result_id
        ON result_workflow_status(normalized_result_id);

        CREATE INDEX IF NOT EXISTS idx_result_approvals_normalized_result_id
        ON result_approvals(normalized_result_id);

        CREATE INDEX IF NOT EXISTS idx_outbound_queue_status
        ON outbound_queue(delivery_status);

        CREATE INDEX IF NOT EXISTS idx_outbound_queue_target_id
        ON outbound_queue(target_id);

        CREATE TABLE IF NOT EXISTS target_secrets (
        target_id TEXT PRIMARY KEY,
        auth_type TEXT NOT NULL DEFAULT 'none',
        username_enc TEXT,
        password_enc TEXT,
        token_enc TEXT,
        api_key_name TEXT,
        api_key_value_enc TEXT,
        allow_insecure_tls INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS delivery_audit_logs (
        id TEXT PRIMARY KEY,
        queue_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        status TEXT NOT NULL,
        attempt_no INTEGER NOT NULL DEFAULT 0,
        http_status INTEGER,
        correlation_id TEXT,
        duration_ms INTEGER,
        error_message TEXT,
        created_at TEXT NOT NULL,
        created_by_user_id TEXT,
        created_by_username TEXT,
        updated_by_user_id TEXT,
        updated_by_username TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_delivery_audit_logs_queue_id
        ON delivery_audit_logs(queue_id);

        CREATE INDEX IF NOT EXISTS idx_delivery_audit_logs_target_id
        ON delivery_audit_logs(target_id);

        CREATE INDEX IF NOT EXISTS idx_delivery_audit_logs_created_at
        ON delivery_audit_logs(created_at);

        CREATE TABLE IF NOT EXISTS target_mappings (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        source_field TEXT NOT NULL,
        destination_field TEXT NOT NULL,
        transform_kind TEXT NOT NULL DEFAULT 'direct',
        constant_value TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by_user_id TEXT,
        created_by_username TEXT,
        updated_by_user_id TEXT,
        updated_by_username TEXT
        );

        CREATE TABLE IF NOT EXISTS target_mapping_value_translations (
        id TEXT PRIMARY KEY,
        mapping_rule_id TEXT NOT NULL,
        source_value TEXT NOT NULL,
        destination_value TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(mapping_rule_id) REFERENCES target_mappings(id) ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_target_mapping_value_translations_rule_source
        ON target_mapping_value_translations(mapping_rule_id, source_value);
    `);

    ensureColumn(db, 'roles', 'updated_at', 'TEXT');
    db.prepare(`UPDATE roles SET updated_at = COALESCE(updated_at, created_at)`).run();

    ensureColumn(db, 'targets', 'auto_retry_enabled', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'targets', 'max_retry_attempts', 'INTEGER NOT NULL DEFAULT 4');
    ensureColumn(db, 'targets', 'retry_backoff_strategy', "TEXT NOT NULL DEFAULT 'EXPONENTIAL'");
    ensureColumn(db, 'targets', 'initial_retry_delay_ms', 'INTEGER NOT NULL DEFAULT 60000');
    ensureColumn(db, 'targets', 'max_retry_delay_ms', 'INTEGER NOT NULL DEFAULT 3600000');
    ensureColumn(db, 'targets', 'request_timeout_ms', 'INTEGER NOT NULL DEFAULT 15000');

    ensureColumn(db, 'target_mappings', 'value_mapping_enabled', 'INTEGER NOT NULL DEFAULT 0');
    ensureColumn(db, 'target_mappings', 'unmapped_behavior', "TEXT NOT NULL DEFAULT 'PASSTHROUGH'");
    ensureColumn(db, 'target_mappings', 'default_destination_value', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'preview_name', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'source_snapshot_json', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'transform_warnings_json', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'transform_errors_json', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'transform_summary_json', 'TEXT');

    ensureColumn(db, 'targets', 'auto_retry_enabled', 'INTEGER NOT NULL DEFAULT 1');
    ensureColumn(db, 'targets', 'max_retry_attempts', 'INTEGER NOT NULL DEFAULT 4');
    ensureColumn(db, 'targets', 'retry_backoff_strategy', "TEXT NOT NULL DEFAULT 'EXPONENTIAL'");
    ensureColumn(db, 'targets', 'initial_retry_delay_ms', 'INTEGER NOT NULL DEFAULT 60000');
    ensureColumn(db, 'targets', 'max_retry_delay_ms', 'INTEGER NOT NULL DEFAULT 3600000');
    ensureColumn(db, 'targets', 'request_timeout_ms', 'INTEGER NOT NULL DEFAULT 15000');

    ensureColumn(db, 'result_approvals', 'created_by_user_id', 'TEXT');
    ensureColumn(db, 'result_approvals', 'created_by_username', 'TEXT');
    ensureColumn(db, 'result_approvals', 'updated_by_user_id', 'TEXT');
    ensureColumn(db, 'result_approvals', 'updated_by_username', 'TEXT');
    ensureColumn(db, 'result_approvals', 'approver_display_name', 'TEXT');
    ensureColumn(db, 'result_approvals', 'approver_username', 'TEXT');
    ensureColumn(db, 'result_approvals', 'approver_roles_json', 'TEXT');
    ensureColumn(db, 'result_approvals', 'snapshot_result_json', 'TEXT');
    ensureColumn(db, 'result_approvals', 'snapshot_policy_json', 'TEXT');
    ensureColumn(db, 'result_approvals', 'snapshot_route_targets_json', 'TEXT');

    backfillApprovalPolicyTargets(db);

    ensureActorColumns(db, 'labs');
    ensureActorColumns(db, 'machines');
    ensureActorColumns(db, 'targets');
    ensureActorColumns(db, 'approval_policies');
    ensureActorColumns(db, 'approval_policy_targets');
    ensureActorColumns(db, 'result_workflow_status');
    ensureActorColumns(db, 'result_approvals');
    ensureActorColumns(db, 'outbound_queue');
    ensureActorColumns(db, 'machine_traffic_logs', false);
    ensureActorColumns(db, 'delivery_audit_logs');
    ensureActorColumns(db, 'target_mappings');
    ensureActorColumns(db, 'target_mapping_value_translations');

    ensureColumn(db, 'outbound_queue', 'preview_name', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'source_snapshot_json', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'transform_warnings_json', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'transform_errors_json', 'TEXT');
    ensureColumn(db, 'outbound_queue', 'transform_summary_json', 'TEXT');
}

function backfillApprovalPolicyTargets(db: ReturnType<typeof getDb>) {
    if (!tableExists(db, 'approval_policies') || !tableExists(db, 'approval_policy_targets')) return;

    const rows = db
        .prepare(
            `
                SELECT p.id, p.applies_to_target_id
                FROM approval_policies p
                INNER JOIN targets t ON t.id = p.applies_to_target_id
                WHERE p.applies_to_target_id IS NOT NULL
                AND TRIM(p.applies_to_target_id) <> ''
            `,
        )
        .all() as Array<{ id: string; applies_to_target_id: string }>;

    const stmt = db.prepare(
        `
            INSERT OR IGNORE INTO approval_policy_targets (
                policy_id,
                target_id,
                created_at,
                updated_at,
                created_by_user_id,
                created_by_username,
                updated_by_user_id,
                updated_by_username
            ) VALUES (?, ?, ?, ?, NULL, NULL, NULL, NULL)
        `,
    );

    for (const row of rows) {
        const ts = new Date().toISOString();
        stmt.run(row.id, row.applies_to_target_id, ts, ts);
    }
}

function ensureActorColumns(db: ReturnType<typeof getDb>, table: string, includeUpdated = true) {
    if (!tableExists(db, table)) return;
    ensureColumn(db, table, 'created_by_user_id', 'TEXT');
    ensureColumn(db, table, 'created_by_username', 'TEXT');
    if (includeUpdated) {
        ensureColumn(db, table, 'updated_by_user_id', 'TEXT');
        ensureColumn(db, table, 'updated_by_username', 'TEXT');
    }
}

function tableExists(db: ReturnType<typeof getDb>, table: string) {
    const row = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
        .get(table) as { name?: string } | undefined;
    return !!row?.name;
}

function ensureColumn(
    db: ReturnType<typeof getDb>,
    table: string,
    column: string,
    definitionSql: string,
) {
    if (!tableExists(db, table)) return;
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}