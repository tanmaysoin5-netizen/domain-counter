// src/generateUsers.js
import fs from "fs";
import path from "path";

const OUTPUT = path.resolve("data/users.csv");
const ROWS = 1_000_000; // change to smaller (e.g., 1000) if you just want to test

// some sample domains to make it realistic
const domains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "example.com",
  "test.org"
];

// write stream
await fs.promises.mkdir("data", { recursive: true });
const stream = fs.createWriteStream(OUTPUT, { encoding: "utf8" });

// write header
stream.write("name,email,age\n");

function randomName(i) {
  return "User" + i;
}

function randomEmail(i) {
  const name = "user" + i;
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${name}@${domain}`;
}

function randomAge() {
  return Math.floor(Math.random() * 60) + 18; // between 18–77
}

// generator
for (let i = 1; i <= ROWS; i++) {
  const row = `${randomName(i)},${randomEmail(i)},${randomAge()}\n`;
  if (!stream.write(row)) {
    // backpressure: wait if buffer is full
    await new Promise(res => stream.once("drain", res));
  }
}

stream.end();

console.log(`✅ Generated ${ROWS} rows into ${OUTPUT}`);
