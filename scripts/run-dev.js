#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseDotEnv(filePath) {
  const env = {};
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    for (const line of data.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      env[key] = val;
    }
  } catch (e) {
    // ignore
  }
  return env;
}

const repoRoot = path.resolve(__dirname, '..');
const envFile = path.join(repoRoot, '.env');
const fileEnv = parseDotEnv(envFile);

const NEXT_PORT = process.env.NEXT_PORT || fileEnv.NEXT_PORT || process.env.PORT || '3003';
const TERMINAL_PORT = process.env.TERMINAL_PORT || fileEnv.TERMINAL_PORT || '3004';

// Ensure NEXTAUTH_URL is set for next-auth; prefer existing env or .env value
if (!process.env.NEXTAUTH_URL && fileEnv.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = fileEnv.NEXTAUTH_URL;
}
if (!process.env.NEXTAUTH_URL) {
  const host = fileEnv.NEXTAUTH_HOST || fileEnv.NEXT_PUBLIC_HOST || 'http://127.0.0.1';
  process.env.NEXTAUTH_URL = `${host}:${NEXT_PORT}`;
}

console.log('Starting dev environment with:');
console.log(`  NEXT_PORT=${NEXT_PORT}`);
console.log(`  TERMINAL_PORT=${TERMINAL_PORT}`);
console.log(`  NEXTAUTH_URL=${process.env.NEXTAUTH_URL}`);

// Build the concurrently command to run both processes and pass TERMINAL_PORT
const concurrentlyCmd = 'npx';
const concurrentlyArgs = [
  'concurrently',
  '-c', '"cyan.bold,magenta.bold"',
  '-n', '"NEXT,TERM"',
  `"next dev -p ${NEXT_PORT}"`,
  `"TERMINAL_PORT=${TERMINAL_PORT} node terminal-server.mjs"`,
];

// Spawn via a single shell so the quoted args work as expected
const shellCmd = `${concurrentlyCmd} ${concurrentlyArgs.join(' ')} `;

const child = spawn(shellCmd, { shell: true, stdio: 'inherit', env: Object.assign({}, process.env, { NEXT_PORT, TERMINAL_PORT }) });

child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code);
});
