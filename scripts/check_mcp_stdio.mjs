#!/usr/bin/env node
/**
 * Smoke: MCP kinefit-agent stdio handshake (initialize + tools/list).
 * Exit 0 OK, 1 fail. Used by Gate F.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SERVER = path.join(ROOT, '.cursor', 'mcp', 'kinefit_stdio.mjs');

function frame(obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'ascii'), body]);
}

function parseFrames(buf) {
  const messages = [];
  let offset = 0;
  while (offset < buf.length) {
    const slice = buf.slice(offset);
    let headerEnd = slice.indexOf('\r\n\r\n');
    let width = 4;
    if (headerEnd === -1) {
      headerEnd = slice.indexOf('\n\n');
      width = 2;
    }
    if (headerEnd === -1) break;
    const header = slice.slice(0, headerEnd).toString('utf8');
    const m = /Content-Length:\s*(\d+)/i.exec(header);
    if (!m) break;
    const len = parseInt(m[1], 10);
    const bodyStart = headerEnd + width;
    if (slice.length < bodyStart + len) break;
    const body = slice.slice(bodyStart, bodyStart + len).toString('utf8');
    messages.push(JSON.parse(body));
    offset += bodyStart + len;
  }
  return messages;
}

function main() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SERVER], {
      cwd: ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    });
    let out = Buffer.alloc(0);
    let err = '';
    let settled = false;
    const finish = (code, msg) => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch (_) {
        /* ignore */
      }
      if (code === 0) console.log(msg || 'OK: MCP kinefit-agent handshake');
      else console.error(msg || 'FAIL: MCP handshake');
      if (err.trim()) console.error(err.trim());
      resolve(code);
    };

    const timer = setTimeout(() => finish(1, 'FAIL: MCP handshake timeout (3s)'), 3000);

    child.stdout.on('data', (chunk) => {
      out = Buffer.concat([out, chunk]);
      const msgs = parseFrames(out);
      const initOk = msgs.some((m) => m.id === 1 && m.result && m.result.serverInfo);
      const toolsOk = msgs.some(
        (m) =>
          m.id === 2 &&
          m.result &&
          Array.isArray(m.result.tools) &&
          m.result.tools.some((t) => t.name === 'resolve_domain'),
      );
      if (initOk && toolsOk) {
        clearTimeout(timer);
        finish(0, 'OK: MCP kinefit-agent initialize + tools/list');
      }
    });
    child.stderr.on('data', (c) => {
      err += c.toString('utf8');
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      finish(1, `FAIL: spawn ${e.message}`);
    });
    child.on('exit', (code) => {
      if (!settled) {
        clearTimeout(timer);
        finish(1, `FAIL: MCP exited early code=${code}`);
      }
    });

    child.stdin.write(
      frame({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'quality-check', version: '1.0' },
        },
      }),
    );
    child.stdin.write(
      frame({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      }),
    );
    child.stdin.write(frame({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }));
  });
}

main().then((code) => process.exit(code));
