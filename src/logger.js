// src/logger.js
import { EventEmitter } from 'events';

export class Logger extends EventEmitter {
  info(message) { this.emit('log', { level: 'info', message, timestamp: new Date() }); }
  warn(message) { this.emit('log', { level: 'warn', message, timestamp: new Date() }); }
  error(message) { this.emit('log', { level: 'error', message, timestamp: new Date() }); }
}
