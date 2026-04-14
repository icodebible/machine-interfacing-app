"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRecorderService = void 0;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const nowIso = () => new Date().toISOString();
function safeName(value) {
    return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}
class SessionRecorderService {
    baseDir;
    constructor() {
        this.baseDir = path_1.default.join(electron_1.app.getPath('userData'), 'sessions');
        fs_1.default.mkdirSync(this.baseDir, { recursive: true });
    }
    getMachineDir(machineId, machineName) {
        const name = safeName(machineName || machineId);
        const dir = path_1.default.join(this.baseDir, `${name}_${machineId}`);
        fs_1.default.mkdirSync(dir, { recursive: true });
        return dir;
    }
    getSessionFile(machineId, machineName) {
        const dir = this.getMachineDir(machineId, machineName);
        const day = nowIso().slice(0, 10);
        return path_1.default.join(dir, `${day}.log`);
    }
    record(params) {
        const file = this.getSessionFile(params.machineId, params.machineName);
        const block = [
            `--- ${nowIso()} ---`,
            `direction: ${params.direction}`,
            ...(params.meta ? [`meta: ${JSON.stringify(params.meta)}`] : []),
            `payload:`,
            params.payload,
            '',
        ].join('\n');
        fs_1.default.appendFileSync(file, block, 'utf8');
        return file;
    }
}
exports.SessionRecorderService = SessionRecorderService;
