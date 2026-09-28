#!/usr/bin/env node
/**
 * MCP Cursor kinefit-agent via stdio (JSON-RPC + Content-Length).
 * Tools: resolve_domain, list_domains.
 *
 * Framing: accepts CRLF or LF header terminators (Cursor / Windows).
 */
import { resolveDomain, listDomains } from './domain_resolve.mjs';

const PROTOCOL = '2024-11-05';

function sendMessage(msg) {
  const body = Buffer.from(JSON.stringify(msg), 'utf8');
  // Always CRLF in headers (MCP / LSP style).
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function toolResult(id, data, isError = false) {
  sendMessage({
    jsonrpc: '2.0',
    id,
    result: {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      isError,
    },
  });
}

function handleRequest(msg) {
  if (!msg || typeof msg !== 'object') return;
  const { id, method, params } = msg;

  // Notifications (no id) — ignore safely.
  if (id === undefined || id === null) {
    return;
  }

  if (method === 'initialize') {
    sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: (params && params.protocolVersion) || PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: 'kinefit-agent', version: '1.0.1' },
      },
    });
    return;
  }

  if (method === 'ping') {
    sendMessage({ jsonrpc: '2.0', id, result: {} });
    return;
  }

  if (method === 'tools/list') {
    sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'resolve_domain',
            description:
              'Risolve path o alias KineFit (oggi, garmin, smoke, …) verso wiki/GEMINI da leggere.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Path file o alias dominio' },
              },
              required: ['query'],
            },
          },
          {
            name: 'list_domains',
            description: 'Elenca id e alias dei domini KineFit noti al router.',
            inputSchema: { type: 'object', properties: {} },
          },
        ],
      },
    });
    return;
  }

  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    try {
      if (name === 'resolve_domain') {
        toolResult(id, resolveDomain(args.query || ''));
        return;
      }
      if (name === 'list_domains') {
        toolResult(id, { domains: listDomains() });
        return;
      }
      toolResult(id, { ok: false, error: 'unknown_tool', name }, true);
    } catch (err) {
      process.stderr.write(String(err && err.stack ? err.stack : err) + '\n');
      toolResult(id, { ok: false, error: String(err && err.message ? err.message : err) }, true);
    }
    return;
  }

  sendMessage({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  });
}

function findHeaderEnd(buf) {
  const crlf = buf.indexOf('\r\n\r\n');
  if (crlf !== -1) return { index: crlf, width: 4 };
  const lf = buf.indexOf('\n\n');
  if (lf !== -1) return { index: lf, width: 2 };
  return null;
}

let buffer = Buffer.alloc(0);

function onChunk(chunk) {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const end = findHeaderEnd(buffer);
    if (!end) break;
    const header = buffer.slice(0, end.index).toString('utf8');
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      buffer = buffer.slice(end.index + end.width);
      continue;
    }
    const len = parseInt(match[1], 10);
    const bodyStart = end.index + end.width;
    if (buffer.length < bodyStart + len) break;
    const body = buffer.slice(bodyStart, bodyStart + len).toString('utf8');
    buffer = buffer.slice(bodyStart + len);
    try {
      handleRequest(JSON.parse(body));
    } catch (err) {
      process.stderr.write(`parse error: ${err}\n`);
    }
  }
}

process.stdin.on('data', onChunk);
process.stdin.on('end', () => process.exit(0));
process.stdin.resume();

// Fail-fast if domain map missing (helps Cursor show Error instead of endless Connecting).
try {
  resolveDomain('oggi');
} catch (err) {
  process.stderr.write(`kinefit-agent boot failed: ${err}\n`);
  process.exit(1);
}
