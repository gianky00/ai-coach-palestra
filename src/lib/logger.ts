import log from 'loglevel';

// Configura il livello di logging di default in base all'ambiente
// In produzione mostriamo solo warn ed error per non sporcare la console dell'utente
// In sviluppo abilitiamo tutti i log informativi e di tracciamento
const isProduction = import.meta.env.PROD;

if (isProduction) {
  log.setLevel('WARN');
} else {
  log.setLevel('TRACE');
}

// Logger strutturato e pre-configurato pronto per l'import
export const logger = {
  trace: (message: string, ...args: unknown[]) => log.trace(`[TRACE] ${message}`, ...args),
  debug: (message: string, ...args: unknown[]) => log.debug(`[DEBUG] ${message}`, ...args),
  info: (message: string, ...args: unknown[]) => log.info(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => log.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => log.error(`[ERROR] ${message}`, ...args),
};

export default logger;
