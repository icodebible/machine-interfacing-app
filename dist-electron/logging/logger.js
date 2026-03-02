"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const electron_log_1 = __importDefault(require("electron-log"));
electron_log_1.default.transports.file.level = 'info';
exports.logger = electron_log_1.default;
