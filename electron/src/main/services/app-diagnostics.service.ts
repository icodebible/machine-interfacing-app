import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { getBackupDir, getDb, getDbPath, getAppDataDir } from '../db/db';

const nowIso = () => new Date().toISOString();

type WritableCheck = {
    key: string;
    label: string;
    path: string;
    ok: boolean;
    message: string;
};

function safeStatSize(filePath: string) {
    try {
        return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    } catch {
        return 0;
    }
}

function readJsonSafe(filePath: string): any | null {
    try {
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return null;
    }
}

function findPackageJson(): any | null {
    const candidates = [
        path.join(process.cwd(), 'package.json'),
        path.join(app.getAppPath(), 'package.json'),
        path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'package.json'),
        path.join(path.dirname(process.execPath), 'resources', 'app', 'package.json'),
    ];

    for (const candidate of candidates) {
        const parsed = readJsonSafe(candidate);
        if (parsed) return parsed;
    }

    return null;
}

function writableDirCheck(key: string, label: string, dirPath: string): WritableCheck {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        const probe = path.join(dirPath, `.write-check-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
        fs.writeFileSync(probe, 'ok');
        fs.unlinkSync(probe);
        return { key, label, path: dirPath, ok: true, message: 'Writable.' };
    } catch (error: any) {
        return {
            key,
            label,
            path: dirPath,
            ok: false,
            message: error?.message ? `Not writable: ${error.message}` : 'Not writable.',
        };
    }
}

function latestBackup(backupsPath: string) {
    try {
        if (!fs.existsSync(backupsPath)) return null;
        const files = fs.readdirSync(backupsPath)
            .filter((name) => name.endsWith('.sqlite'))
            .map((name) => {
                const filePath = path.join(backupsPath, name);
                const stat = fs.statSync(filePath);
                return { name, path: filePath, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
            })
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return files[0] ?? null;
    } catch {
        return null;
    }
}

export class AppDiagnosticsService {
    getDiagnostics() {
        const pkg = findPackageJson() ?? {};
        const dbPath = getDbPath();
        const dataPath = getAppDataDir();
        const backupsPath = getBackupDir();
        const logsPath = app.getPath('logs');
        const userDataPath = app.getPath('userData');
        const buildConfig = pkg.build ?? {};
        const scripts = pkg.scripts ?? {};
        const storage = [
            writableDirCheck('user-data', 'Application data directory', userDataPath),
            writableDirCheck('data', 'Database directory', dataPath),
            writableDirCheck('backups', 'Database backup directory', backupsPath),
            writableDirCheck('logs', 'Application logs directory', logsPath),
        ];
        const latest = latestBackup(backupsPath);

        return {
            generatedAt: nowIso(),
            app: {
                name: pkg.name ?? app.getName(),
                productName: buildConfig.productName ?? app.getName(),
                version: app.getVersion(),
                isPackaged: app.isPackaged,
                appPath: app.getAppPath(),
                executablePath: process.execPath,
            },
            runtime: {
                electron: process.versions.electron,
                chrome: process.versions.chrome,
                node: process.versions.node,
                v8: process.versions.v8,
                platform: process.platform,
                arch: process.arch,
            },
            paths: {
                userDataPath,
                dataPath,
                logsPath,
                backupsPath,
                databasePath: dbPath,
                releaseOutputPath: buildConfig?.directories?.output ?? 'release',
            },
            database: {
                path: dbPath,
                exists: fs.existsSync(dbPath),
                sizeBytes: safeStatSize(dbPath),
                walSizeBytes: safeStatSize(`${dbPath}-wal`),
                shmSizeBytes: safeStatSize(`${dbPath}-shm`),
                latestBackup: latest,
            },
            package: {
                appId: buildConfig.appId ?? null,
                productName: buildConfig.productName ?? null,
                artifactName: buildConfig.artifactName ?? null,
                outputDir: buildConfig?.directories?.output ?? null,
                asar: buildConfig.asar !== false,
                npmRebuild: buildConfig.npmRebuild !== false,
                electronBuilderConfigured: !!buildConfig.appId && !!buildConfig.productName,
                publishConfigured: Array.isArray(buildConfig.publish) || Array.isArray(pkg.publish),
                publishLooksPlaceholder: JSON.stringify(buildConfig.publish ?? pkg.publish ?? '').includes('YOUR_REPO'),
                targets: {
                    linux: buildConfig.linux?.target ?? [],
                    windows: buildConfig.win?.target ?? [],
                    mac: buildConfig.mac?.target ?? [],
                },
                scripts: {
                    buildWeb: scripts['build:web'] ?? scripts.build ?? null,
                    buildElectron: scripts['build:electron'] ?? null,
                    buildRelease: scripts['build:release'] ?? null,
                    electronBuild: scripts['electron:build'] ?? null,
                    electronPack: scripts['electron:pack'] ?? null,
                    electronDistLinux: scripts['electron:dist:linux'] ?? null,
                    rebuildNative: scripts['rebuild:native'] ?? null,
                },
            },
            storage,
        };
    }

    async createDatabaseBackup() {
        const dbPath = getDbPath();
        const backupsPath = getBackupDir();
        fs.mkdirSync(backupsPath, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const destination = path.join(backupsPath, `machine-interfacing-${stamp}.sqlite`);
        await getDb().backup(destination);
        const stat = fs.statSync(destination);
        return {
            ok: true,
            path: destination,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
            sourcePath: dbPath,
        };
    }
}
