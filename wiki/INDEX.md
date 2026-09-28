# Wiki — Hub

Vault Obsidian e knowledge graph del repository, radicati su `wiki/`.

## Boot agenti

1. Leggere **`AGENTS.md`**
2. Aprire questo hub, poi il grafo della sezione pertinente
3. Per lavoro sul codice KineFit: **[`wiki/kinefit/INDEX.md`](kinefit/INDEX.md)**

## Albero

```
wiki/
├── INDEX.md                      questo hub
├── README.md                     alias di navigazione
└── kinefit/                      grafo codice (agenti)
    ├── architecture/
    ├── modules/
    └── workflows/
```

## Sezioni

| Sezione              | Path                                   | Contenuto                                                                 |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| **KineFit (codice)** | [`kinefit/INDEX.md`](kinefit/INDEX.md) | Architettura, offline/SQLite, moduli UI, Garmin, smoke, protocolli agente |

## Note

- Sync obbligatorio su modifiche rilevanti: aggiornare le pagine sotto **`wiki/kinefit/`** (protocollo: [`kinefit/workflows/pre_commit_wiki_protocol.md`](kinefit/workflows/pre_commit_wiki_protocol.md)).
- Ops/runbook umani: `docs/` (non la wiki codice). Diario parallelo: [`docs/AGENT_SYNC.md`](../docs/AGENT_SYNC.md).
