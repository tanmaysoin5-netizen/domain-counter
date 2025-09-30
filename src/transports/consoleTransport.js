// src/transports/consoleTransport.js
export function attachConsoleTransport(logger) {
    logger.on('log', ({ level, message, timestamp }) => {
      const time = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
      console.log(`[${level.toUpperCase()}] ${time} ${message}`);
    });
  }
  