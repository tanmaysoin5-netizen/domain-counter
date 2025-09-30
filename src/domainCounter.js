// src/domainCounter.js
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

/**
 * Basic CSV line parser that supports quoted fields with escaped double-quotes ("").
 * It's small but works for common CSVs. For complex CSVs use a proper CSV parser.
 */
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // handle escaped quotes ""
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

/**
 * Counts users per domain from CSV at `inputPath` and writes JSON array to `outputPath`.
 * logger is optional (an EventEmitter-like object with info/error methods).
 * Returns { totalLines, domains }.
 */
export async function countDomains(inputPath, outputPath, logger) {
  // ensure output folder exists
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  const rdStream = fs.createReadStream(inputPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: rdStream, crlfDelay: Infinity });

  const counts = new Map();
  let lineCount = 0;
  let headerFields = null;
  let emailIndex = -1;

  for await (const line of rl) {
    lineCount++;
    // skip empty lines
    if (!line) continue;

    // header
    if (lineCount === 1) {
      headerFields = parseCsvLine(line).map(s => s.trim().toLowerCase());
      emailIndex = headerFields.indexOf('email');
      logger?.info?.(`Detected headers: ${headerFields.join(', ')}`);
      continue;
    }

    const fields = parseCsvLine(line);
    let email;
    if (emailIndex >= 0) {
      email = fields[emailIndex];
    } else {
      // fallback: find the first field that contains '@'
      email = fields.find(f => f && f.includes('@'));
    }
    if (!email) continue;
    const at = email.indexOf('@');
    if (at === -1) continue;
    const domain = email.slice(at + 1).toLowerCase();

    counts.set(domain, (counts.get(domain) || 0) + 1);

    // periodic logging for big files
    if (lineCount % 100_000 === 0) {
      logger?.info?.(`Processed ${lineCount} lines so far`);
    }
  }

  // create a generator that yields the JSON array text in chunks
  async function *jsonGenerator() {
    yield '[';
    let first = true;
    for (const [domain, count] of counts) {
      if (!first) yield ',\n';
      yield JSON.stringify({ domain, count });
      first = false;
    }
    yield '\n]';
  }

  // write the generator to file using pipeline (handles backpressure)
  const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
  await pipeline(Readable.from(jsonGenerator()), writeStream);

  return { totalLines: lineCount, domains: counts.size };
}
