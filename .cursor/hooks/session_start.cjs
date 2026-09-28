/**
 * sessionStart hook (Node CommonJS — portable Win/Linux).
 * Injeta boot KineFit — non duplica la wiki.
 */
const fs = require('fs');

const CONTEXT = `# KineFit — contesto sessione (hook)

Boot obbligatorio: \`AGENTS.md\` → \`wiki/INDEX.md\` → \`wiki/kinefit/INDEX.md\`, poi wiki/GEMINI del dominio.

**MCP \`kinefit-agent\`** (se abilitato in Cursor):
1. Prima di editare un modulo: tool \`resolve_domain\` con path o alias (\`oggi\`, \`garmin\`, \`smoke\`, \`offline\`, …).
2. Freeze: non cancellare \`syncFeedback.ts\` / \`SyncFailBanner\`; non rinominare testID smoke/Maestro; no Expo.
3. Emulator default: Pixel_9a. Env: preferire \`KINEFIT_*\`.

Conoscenza = wiki + \`mobile/GEMINI.md\`. Regole \`.cursor/rules\` = solo vincoli. Se divergono → vince la wiki.
`;

try {
  const input = fs.readFileSync(0, 'utf8');
  if (input) JSON.parse(input);
} catch (_) {
  /* fail-open */
}

process.stdout.write(JSON.stringify({ additional_context: CONTEXT }));
