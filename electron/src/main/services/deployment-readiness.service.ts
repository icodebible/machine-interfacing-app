import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getBackupDir, getDb, getDbPath, getAppDataDir } from '../db/db';
import { AppDiagnosticsService } from './app-diagnostics.service';

const nowIso = () => new Date().toISOString();

type ReadinessSeverity = 'OK' | 'WARNING' | 'BLOCKER';

type ReadinessCheck = {
    key: string;
    label: string;
    severity: ReadinessSeverity;
    passed: boolean;
    message: string;
    details?: Record<string, unknown>;
};

function tableExists(table: string) {
    const row = getDb()
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
        .get(table) as { name?: string } | undefined;
    return !!row?.name;
}

function columnExists(table: string, column: string) {
    if (!tableExists(table)) return false;
    const cols = getDb().prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    return cols.some((item) => item.name === column);
}

function scalar(sql: string, ...args: unknown[]) {
    try {
        const row = getDb().prepare(sql).get(...args) as Record<string, unknown> | undefined;
        return Number(row?.value ?? 0);
    } catch {
        return 0;
    }
}


function canWriteDir(dirPath: string) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        const probe = path.join(dirPath, `.readiness-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
        fs.writeFileSync(probe, 'ok');
        fs.unlinkSync(probe);
        return true;
    } catch {
        return false;
    }
}

function check(key: string, label: string, passed: boolean, severity: ReadinessSeverity, message: string, details?: Record<string, unknown>): ReadinessCheck {
    return { key, label, passed, severity: passed ? 'OK' : severity, message, details };
}

export class DeploymentReadinessService {
    run() {
        const checks: ReadinessCheck[] = [];
        const requiredTables = [
            'machines',
            'targets',
            'target_secrets',
            'target_mappings',
            'lis_test_order_profiles',
            'lis_test_order_profile_parameters',
            'machine_runtime_sessions',
            'machine_traffic_logs',
            'parsed_messages',
            'normalized_lab_results',
            'outbound_queue',
            'audit_events',
        ];

        const missingTables = requiredTables.filter((table) => !tableExists(table));
        checks.push(check(
            'required-tables',
            'Required database tables',
            missingTables.length === 0,
            'BLOCKER',
            missingTables.length === 0 ? 'All required tables are present.' : `Missing table(s): ${missingTables.join(', ')}.`,
            { requiredTables, missingTables },
        ));

        const trafficTraceColumns = ['session_id', 'parsed_message_id', 'normalized_result_id', 'processing_status'];
        const missingTraceColumns = trafficTraceColumns.filter((column) => !columnExists('machine_traffic_logs', column));
        checks.push(check(
            'traffic-trace-columns',
            'Traffic trace linkage',
            missingTraceColumns.length === 0,
            'WARNING',
            missingTraceColumns.length === 0 ? 'Traffic logs can be linked to session, parsed, and normalized records.' : `Missing traffic linkage column(s): ${missingTraceColumns.join(', ')}.`,
            { missingTraceColumns },
        ));

        const totalMachines = scalar(`SELECT COUNT(*) AS value FROM machines`);
        const activeMachines = scalar(`SELECT COUNT(*) AS value FROM machines WHERE is_active = 1`);
        checks.push(check(
            'machines-configured',
            'Machine configuration',
            totalMachines > 0 && activeMachines > 0,
            'WARNING',
            totalMachines > 0 ? `${activeMachines} active machine(s) of ${totalMachines} registered.` : 'No machines have been registered yet.',
            { totalMachines, activeMachines },
        ));

        const totalTargets = scalar(`SELECT COUNT(*) AS value FROM targets`);
        const enabledTargets = scalar(`SELECT COUNT(*) AS value FROM targets WHERE enabled = 1`);
        checks.push(check(
            'targets-configured',
            'Target connectors',
            totalTargets > 0 && enabledTargets > 0,
            'WARNING',
            totalTargets > 0 ? `${enabledTargets} enabled target(s) of ${totalTargets} configured.` : 'No delivery target has been configured yet.',
            { totalTargets, enabledTargets },
        ));

        const protectedTargets = tableExists('target_secrets')
            ? scalar(`SELECT COUNT(*) AS value FROM target_secrets WHERE auth_type <> 'none'`)
            : 0;
        checks.push(check(
            'target-secrets',
            'Connector secret configuration',
            enabledTargets === 0 || protectedTargets > 0,
            'WARNING',
            protectedTargets > 0 ? `${protectedTargets} target secret configuration(s) stored.` : 'No target credentials/tokens are configured. Public/no-auth targets are allowed only when intentional.',
            { enabledTargets, protectedTargets },
        ));


        const enabledTargetsWithoutAuth = tableExists('targets') && tableExists('target_secrets')
            ? scalar(`
                SELECT COUNT(*) AS value
                FROM targets t
                LEFT JOIN target_secrets s ON s.target_id = t.id
                WHERE t.enabled = 1
                AND (s.target_id IS NULL OR COALESCE(s.auth_type, 'none') = 'none')
            `)
            : 0;
        checks.push(check(
            'enabled-target-auth-coverage',
            'Enabled target authentication coverage',
            enabledTargetsWithoutAuth === 0,
            'WARNING',
            enabledTargetsWithoutAuth === 0
                ? 'Every enabled target has an explicit security configuration or there are no enabled targets.'
                : `${enabledTargetsWithoutAuth} enabled target(s) have no authentication configured. Confirm they are intentionally public/no-auth before production.`,
            { enabledTargetsWithoutAuth },
        ));

        const unsafeTargetUrls = tableExists('targets')
            ? scalar(`
                SELECT COUNT(*) AS value
                FROM targets
                WHERE base_url LIKE '%password=%'
                   OR base_url LIKE '%passwd=%'
                   OR base_url LIKE '%token=%'
                   OR base_url LIKE '%api_key=%'
                   OR base_url LIKE '%apikey=%'
                   OR base_url LIKE '%authorization=%'
                   OR base_url LIKE '%://%@%'
            `)
            : 0;
        checks.push(check(
            'target-url-secret-leakage',
            'Target URL credential leakage',
            unsafeTargetUrls === 0,
            'BLOCKER',
            unsafeTargetUrls === 0
                ? 'No obvious credentials, tokens, or API keys were found in target base URLs.'
                : `${unsafeTargetUrls} target URL(s) appear to contain credentials or secret query parameters. Move them to Security & test before production.`,
            { unsafeTargetUrls },
        ));

        const insecureTlsTargets = tableExists('targets') && tableExists('target_secrets')
            ? scalar(`
                SELECT COUNT(*) AS value
                FROM targets t
                INNER JOIN target_secrets s ON s.target_id = t.id
                WHERE t.enabled = 1 AND COALESCE(s.allow_insecure_tls, 0) = 1
            `)
            : 0;
        checks.push(check(
            'insecure-tls-targets',
            'Insecure TLS mode',
            insecureTlsTargets === 0,
            'WARNING',
            insecureTlsTargets === 0
                ? 'No enabled target is configured to allow insecure TLS.'
                : `${insecureTlsTargets} enabled target(s) allow insecure TLS. Use only for local testing, not production.`,
            { insecureTlsTargets },
        ));

        const activeMachinesMissingConnection = tableExists('machines')
            ? scalar(`
                SELECT COUNT(*) AS value
                FROM machines
                WHERE is_active = 1
                AND (
                    ((connection_type = 'TCP' OR connection_type = 'HL7_MLLP') AND (port IS NULL OR port <= 0))
                    OR (connection_type = 'SERIAL' AND (serial_port IS NULL OR TRIM(serial_port) = ''))
                    OR ((connection_type = 'FTP' OR connection_type = 'SFTP') AND (ftp_host IS NULL OR TRIM(ftp_host) = '' OR ftp_port IS NULL OR ftp_port <= 0))
                    OR (connection_type = 'FILE_WATCHER' AND (watch_dir IS NULL OR TRIM(watch_dir) = ''))
                )
            `)
            : 0;
        checks.push(check(
            'machine-connection-details',
            'Enabled machine connection details',
            activeMachinesMissingConnection === 0,
            'WARNING',
            activeMachinesMissingConnection === 0
                ? 'Enabled machines have the required transport-specific connection details.'
                : `${activeMachinesMissingConnection} enabled machine(s) are missing required connection details.`,
            { activeMachinesMissingConnection },
        ));

        const mappingRules = scalar(`SELECT COUNT(*) AS value FROM target_mappings WHERE enabled = 1`);
        checks.push(check(
            'mapping-rules',
            'Mapping coverage foundation',
            mappingRules > 0,
            'WARNING',
            mappingRules > 0 ? `${mappingRules} enabled mapping rule(s) found.` : 'No enabled mapping rules found.',
            { mappingRules },
        ));

        const enabledLisProfiles = tableExists('lis_test_order_profiles')
            ? scalar(`SELECT COUNT(*) AS value FROM lis_test_order_profiles WHERE enabled = 1`)
            : 0;
        checks.push(check(
            'lis-profiles',
            'LIS test-order profiles',
            enabledLisProfiles > 0,
            'WARNING',
            enabledLisProfiles > 0 ? `${enabledLisProfiles} enabled LIS test-order profile(s) found.` : 'No enabled LIS test-order profiles found.',
            { enabledLisProfiles },
        ));


        const enabledLisProfileTablesReady = tableExists('lis_test_order_profiles') && tableExists('lis_test_order_profile_parameters');
        const enabledLisProfilesIncomplete = enabledLisProfileTablesReady
            ? scalar(`
                SELECT COUNT(*) AS value
                FROM lis_test_order_profiles p
                WHERE p.enabled = 1
                AND (
                    p.order_concept_uuid IS NULL
                    OR TRIM(p.order_concept_uuid) = ''
                    OR NOT EXISTS (
                        SELECT 1 FROM lis_test_order_profile_parameters pp WHERE pp.profile_id = p.id
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM lis_test_order_profile_parameters pp
                        WHERE pp.profile_id = p.id
                        AND pp.required = 1
                        AND (
                            pp.analyzer_code IS NULL OR TRIM(pp.analyzer_code) = ''
                            OR pp.concept_uuid IS NULL OR TRIM(pp.concept_uuid) = ''
                        )
                    )
                )
            `)
            : enabledLisProfiles;
        checks.push(check(
            'enabled-lis-profile-completeness',
            'Enabled LIS profile completeness',
            enabledLisProfilesIncomplete === 0,
            'WARNING',
            enabledLisProfilesIncomplete === 0
                ? 'Enabled LIS profiles have order UUIDs, parameters, and required analyzer/concept mappings.'
                : `${enabledLisProfilesIncomplete} enabled LIS profile(s) need metadata completion before production delivery.`,
            { enabledLisProfilesIncomplete, enabledLisProfileTablesReady },
        ));

        const blockedOutbound = scalar(`SELECT COUNT(*) AS value FROM outbound_queue WHERE delivery_status = 'BLOCKED'`);
        const failedOutbound = scalar(`SELECT COUNT(*) AS value FROM outbound_queue WHERE delivery_status = 'FAILED'`);
        checks.push(check(
            'outbound-queue-health',
            'Outbound queue health',
            blockedOutbound === 0,
            'WARNING',
            blockedOutbound === 0 ? `${failedOutbound} failed queue item(s), ${blockedOutbound} blocked.` : `${blockedOutbound} blocked queue item(s) need configuration review before production delivery.`,
            { blockedOutbound, failedOutbound },
        ));


        const diagnostics = new AppDiagnosticsService().getDiagnostics();
        const storageFailures = (diagnostics.storage ?? []).filter((item: any) => !item.ok);
        checks.push(check(
            'app-storage-writable',
            'Application storage permissions',
            storageFailures.length === 0,
            'BLOCKER',
            storageFailures.length === 0
                ? 'Application data, database, backup, and log directories are writable.'
                : `${storageFailures.length} application storage location(s) are not writable.`,
            { storageFailures, storage: diagnostics.storage },
        ));

        const dbPath = getDbPath();
        checks.push(check(
            'database-file-path',
            'Database file path',
            fs.existsSync(dbPath) && canWriteDir(path.dirname(dbPath)),
            'BLOCKER',
            fs.existsSync(dbPath)
                ? 'Local SQLite database exists and its directory is writable.'
                : 'Local SQLite database has not been created yet or the data directory is not writable.',
            { databasePath: dbPath, dataPath: getAppDataDir(), sizeBytes: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0 },
        ));

        const latestBackup = diagnostics.database?.latestBackup;
        checks.push(check(
            'database-backup-readiness',
            'Database backup readiness',
            canWriteDir(getBackupDir()),
            'WARNING',
            latestBackup
                ? `Backup directory is writable. Latest backup: ${latestBackup.name}.`
                : 'Backup directory is writable, but no database backup has been created yet from this workstation.',
            { backupsPath: getBackupDir(), latestBackup: latestBackup ?? null },
        ));

        const packageInfo = diagnostics.package ?? {};
        checks.push(check(
            'electron-builder-config',
            'Electron packaging configuration',
            !!packageInfo.electronBuilderConfigured && !!packageInfo.outputDir,
            'WARNING',
            packageInfo.electronBuilderConfigured
                ? `Electron builder is configured for ${packageInfo.productName || 'the application'} with output directory ${packageInfo.outputDir || 'release'}.`
                : 'Electron builder metadata is incomplete. Confirm appId, productName, output directory, and targets before packaging.',
            { package: packageInfo },
        ));

        checks.push(check(
            'release-scripts',
            'Release build scripts',
            !!packageInfo.scripts?.buildRelease && !!packageInfo.scripts?.electronBuild,
            'WARNING',
            packageInfo.scripts?.buildRelease && packageInfo.scripts?.electronBuild
                ? 'Release build and Electron packaging scripts are available.'
                : 'Release build scripts are missing. Add build:release and electron:build before production packaging.',
            { scripts: packageInfo.scripts ?? {} },
        ));

        checks.push(check(
            'publish-placeholder',
            'Auto-update publish configuration',
            !packageInfo.publishLooksPlaceholder,
            'WARNING',
            packageInfo.publishLooksPlaceholder
                ? 'Publish configuration still contains placeholder repository values. Update or remove publish config before production auto-update use.'
                : 'Publish configuration does not contain obvious placeholder repository values.',
            { publishConfigured: !!packageInfo.publishConfigured, publishLooksPlaceholder: !!packageInfo.publishLooksPlaceholder },
        ));

        const recentAuditEvents = tableExists('audit_events')
            ? scalar(`SELECT COUNT(*) AS value FROM audit_events WHERE event_time >= ?`, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            : 0;
        checks.push(check(
            'audit-events',
            'Audit event recording',
            tableExists('audit_events'),
            'BLOCKER',
            tableExists('audit_events') ? `${recentAuditEvents} audit event(s) recorded in the last 24 hours.` : 'Audit table is missing.',
            { recentAuditEvents },
        ));

        const blockers = checks.filter((item) => item.severity === 'BLOCKER' && !item.passed).length;
        const warnings = checks.filter((item) => item.severity === 'WARNING' && !item.passed).length;
        const passed = checks.filter((item) => item.passed).length;
        const score = Math.round((passed / Math.max(1, checks.length)) * 100);

        return {
            ok: blockers === 0,
            status: blockers > 0 ? 'BLOCKED' : warnings > 0 ? 'READY_WITH_WARNINGS' : 'READY',
            score,
            checkedAt: nowIso(),
            summary: { total: checks.length, passed, warnings, blockers },
            checks,
        };
    }
}
