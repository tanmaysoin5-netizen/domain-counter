// src/transports/fileTransport.js
import fs from 'fs';
import path from 'path';
import { once } from 'events';

export class FileTransport {
  /**
   * opts:
   *  - logDir: folder for logs (default 'logs')
   *  - filename: base log file name (default 'app.log')
   *  - maxSize: rotate when file grows beyond this (bytes) (default 50*1024)
   */
  constructor(opts = {}) {
    this.logDir = opts.logDir ?? 'logs';
    this.filename = opts.filename ?? 'app.log';
    this.filePath = path.join(this.logDir, this.filename);
    this.maxSize = opts.maxSize ?? 50 * 1024;
    this.currentSize = 0;
    this.stream = null;
    // initialize async (not awaited here)
    this._init();
  }

  async _init() {
    await fs.promises.mkdir(this.logDir, { recursive: true });
    try {
      const st = await fs.promises.stat(this.filePath);
      this.currentSize = st.size;
    } catch (err) {
      this.currentSize = 0;
    }
    this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
  }

  attach(logger) {
    logger.on('log', (entry) => {
      // don't block logger; handle errors inside
      this._handle(entry).catch(err => {
        // fallback: print to console if file transport fails
        console.error('FileTransport error:', err);
      });
    });
  }

  async _handle(entry) {
    const line = `[${entry.level.toUpperCase()}] ${entry.timestamp.toISOString()} ${entry.message}\n`;
    await this._write(line);
  }

  async _write(chunk) {
    if (!this.stream) await this._init();

    const size = Buffer.byteLength(chunk);
    // rotate before writing if it would overflow
    if (this.currentSize + size > this.maxSize) {
      await this._rotate();
    }

    if (!this.stream.write(chunk)) {
      // backpressure: wait for 'drain'
      await once(this.stream, 'drain');
    }
    this.currentSize += size;
  }

  async _rotate() {
    // finish current stream
    this.stream.end();
    // wait for underlying fd flush
    await once(this.stream, 'finish');

    // rename with timestamp suffix to keep rotation simple
    const ts = Date.now();
    const rotated = `${this.filePath}.${ts}`;
    try {
      await fs.promises.rename(this.filePath, rotated);
    } catch (err) {
      // rename might fail if file not present - ignore
    }

    // create a new stream
    this.stream = fs.createWriteStream(this.filePath, { flags: 'a' });
    this.currentSize = 0;
  }
}
