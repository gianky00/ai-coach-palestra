#!/usr/bin/env node
/**
 * MCP Cursor kinefit-agent via stdio (JSON-RPC + Content-Length).
 * Tools: resolve_domain, list_domains.
 */
import { resolveDomain, listDomains } from './domain_resolve.mjs';

const PROTOCOL = '2024-11-05';

function sendMessage(msg) {
  const body = Buffer.from(JSON.stringify(msg), 'utf8');
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
  const { id, method, params } = msg;
  if (method === 'initialize') {
    sendMessage({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: (params && params.protocolVersion) || PROTOCOL,
        capabilities: { tools: {} },
        serverInfo: { name: 'kinefit-agent', version: '1.0.0' },
      },
    });
    return;
  }
  if (method === 'notifications/initialized' || method === 'initialized') {
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
      console.error(err);
      toolResult(id, { ok: false, error: String(err && err.message ? err.message : err) }, true);
    }
    return;
  }
  if (id !== undefined && id !== null) {
    sendMessage({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    });
  }
}

let buffer = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;
    const header = buffer.slice(0, headerEnd).toString('utf8');
    const match = /Content-Length:\s*(\d+)/i.exec(header);
    if (!match) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }
    const len = parseInt(match[1], 10);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break;
    const body = buffer.slice(bodyStart, bodyStart + len).toString('utf8');
    buffer = buffer.slice(bodyStart + len);
    try {
      const msg = JSON.parse(body);
      handleRequest(msg);
    } catch (err) {
      console.error('parse error', err);
    }
  }
});

process.stdin.on('end', () => process.exit(0));
