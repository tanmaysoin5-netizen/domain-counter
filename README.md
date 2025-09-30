# Practical 6 

Domain Counter
A Node.js project that:
Generates a large CSV dataset of users (up to 1M rows)
Streams and processes the file to count users per email domain (without loading everything in memory)
Writes results to out/domains.json
Implements an EventEmitter-based logger with file & console transports
Supports log rotation (~50KB per file)

# domain-counter/
├── data/                # Input data (users.csv is generated here)
├── logs/                # Log files with rotation
├── out/                 # Output folder (domains.json is saved here)
├── src/                 # Source code
│   ├── generateUsers.js # Generates users.csv
│   ├── domainCounter.js # Counts domains from users.csv
│   ├── logger.js        # Logger with transports & rotation
│   ├── server.js        # Entry point with top-level await
│   └── transports/      # Logger transports (console, file)
├── package.json
└── README.md



1.Generate sample dataset
npm run generate

This creates data/users.csv with ~1M rows (configurable in generateUsers.js).

2. Run the domain counter
npm start
Output is written to out/domains.json:
[
  { "domain": "gmail.com", "count": 12345 },
  { "domain": "yahoo.com", "count": 8765 }
]
Logs are written to logs/app.log, rotated automatically after 50KB.

# Features
Streams + pipeline → memory-efficient processing of huge CSV files
Backpressure handling while writing large datasets
EventEmitter-based logger with pluggable transports (console & file)
Size-based log rotation (~50KB per file)

# Scripts
npm run generate → generate users.csv
npm start → process users.csv and count domains
# Requirements
Node.js >= 18