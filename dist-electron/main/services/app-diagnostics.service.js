"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDiagnosticsService = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../db/db");
const nowIso = () => new Date().toISOString();
function safeStatSize(filePath) {
    try {
        return fs_1.default.existsSync(filePath) ? fs_1.default.statSync(filePath).size : 0;
    }
    catch {
        return 0;
    }
}
function readJsonSafe(filePath) {
    try {
        if (!fs_1.default.existsSync(filePath))
            return null;
        return JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
    }
    catch {
        return null;
    }
}
function findPackageJson() {
    const candidates = [
        path_1.default.join(process.cwd(), 'package.json'),
        path_1.default.join(electron_1.app.getAppPath(), 'package.json'),
        path_1.default.join(path_1.default.dirname(process.execPath), 'resources', 'app.asar', 'package.json'),
        path_1.default.join(path_1.default.dirname(process.execPath), 'resources', 'app', 'package.json'),
    ];
    for (const candidate of candidates) {
        const parsed = readJsonSafe(candidate);
        if (parsed)
            return parsed;
    }
    return null;
}
function writableDirCheck(key, label, dirPath) {
    try {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        const probe = path_1.default.join(dirPath, `.write-check-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
        fs_1.default.writeFileSync(probe, 'ok');
        fs_1.default.unlinkSync(probe);
        return { key, label, path: dirPath, ok: true, message: 'Writable.' };
    }
    catch (error) {
        return {
            key,
            label,
            path: dirPath,
            ok: false,
            message: error?.message ? `Not writable: ${error.message}` : 'Not writable.',
        };
    }
}
function latestBackup(backupsPath) {
    try {
        if (!fs_1.default.existsSync(backupsPath))
            return null;
        const files = fs_1.default.readdirSync(backupsPath)
            .filter((name) => name.endsWith('.sqlite'))
            .map((name) => {
            const filePath = path_1.default.join(backupsPath, name);
            const stat = fs_1.default.statSync(filePath);
            return { name, path: filePath, sizeBytes: stat.size, createdAt: stat.mtime.toISOString() };
        })
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return files[0] ?? null;
    }
    catch {
        return null;
    }
}
class AppDiagnosticsService {
    getDiagnostics() {
        const pkg = findPackageJson() ?? {};
        const dbPath = (0, db_1.getDbPath)();
        const dataPath = (0, db_1.getAppDataDir)();
        const backupsPath = (0, db_1.getBackupDir)();
        const logsPath = electron_1.app.getPath('logs');
        const userDataPath = electron_1.app.getPath('userData');
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
                name: pkg.name ?? electron_1.app.getName(),
                productName: buildConfig.productName ?? electron_1.app.getName(),
                version: electron_1.app.getVersion(),
                isPackaged: electron_1.app.isPackaged,
                appPath: electron_1.app.getAppPath(),
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
                exists: fs_1.default.existsSync(dbPath),
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
        const dbPath = (0, db_1.getDbPath)();
        const backupsPath = (0, db_1.getBackupDir)();
        fs_1.default.mkdirSync(backupsPath, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const destination = path_1.default.join(backupsPath, `machine-interfacing-${stamp}.sqlite`);
        await (0, db_1.getDb)().backup(destination);
        const stat = fs_1.default.statSync(destination);
        return {
            ok: true,
            path: destination,
            sizeBytes: stat.size,
            createdAt: stat.mtime.toISOString(),
            sourcePath: dbPath,
        };
    }
}
exports.AppDiagnosticsService = AppDiagnosticsService;
