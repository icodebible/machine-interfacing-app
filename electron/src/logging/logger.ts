import log from 'electron-log';

log.transports.file.level = 'info';

export const logger = log;