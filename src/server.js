// src/server.js
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dynamic imports with top-level await
const { Logger } = await import('./logger.js');
const { attachConsoleTransport } = await import('./transports/consoleTransport.js');
const { FileTransport } = await import('./transports/fileTransport.js');
const { countDomains } = await import('./domainCounter.js');

const logger = new Logger();

// attach transports
attachConsoleTransport(logger);
const fileTransport = new FileTransport({
  logDir: path.join(__dirname, '..', 'logs'),
  filename: 'app.log',
  maxSize: 50 * 1024 // 50 KB rotation threshold for demo purposes
});
fileTransport.attach(logger);

// paths (assumes data/users.csv exists)
const input = path.resolve(process.cwd(), 'data', 'users.csv');
const output = path.resolve(process.cwd(), 'out', 'domains.json');

try {
  logger.info(`Starting domain counting: ${input} -> ${output}`);
  const result = await countDomains(input, output, logger);
  logger.info(`Done. Processed ${result.totalLines} lines; unique domains: ${result.domains}`);
} catch (err) {
  logger.error(`Fatal error: ${err && err.stack ? err.stack : String(err)}`);
  process.exitCode = 1;
}
