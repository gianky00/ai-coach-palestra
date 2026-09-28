# Protocollo di Mantenimento Wiki per Agenti IA

Obbligatorio per qualsiasi agente sul codebase KineFit.

---

## 0. Boot di sessione (ogni prompt)

1. Leggere **`AGENTS.md`** (entrypoint).
2. Aprire **`wiki/INDEX.md`** (hub), poi **`wiki/kinefit/INDEX.md`** e i nodi del grafo pertinenti.
3. Solo dopo: codice, test, consegna.

Ops/runbook: `docs/` (vedi [[kinefit/workflows/docs_vs_wiki]]). Non aggiornare la wiki con env/comandi: quelli stanno in `docs/GEMINI.md`.

---

## 1. Wiki-Sync Mandatory Check

PRIMA di considerare completato un task, verificare se le modifiche impattano:

1. Architettura (stack, composition root, store pubblici).
2. Schema SQLite locale o migration Supabase rilevanti.
3. API pubbliche di service/hook (`saveLogSafely`, facade Garmin, …).
4. TestID usati da Maestro o `verify:ui`.
5. Env `KINEFIT_*` / dual-read in `platform/constants.ts`.
6. Edge Garmin (`supabase/functions/garmin/`).
7. Protocolli agente (`AGENTS.md`, `.cursor/rules/`, domain map).

Se sì: **obbligatorio** aggiornare la pagina in `/wiki/kinefit` (e `wiki/kinefit/INDEX.md` se nasce un nuovo nodo; hub `wiki/INDEX.md` solo se cambia il layout sezioni).

Gate meccanico: `scripts/check_wiki_sync.py` (contract_globs in `.cursor/kinefit-domain-map.json`). Inventario auto: `npm run wiki:inventory`.

---

## 2. Checklist Operativa

- [ ] Boot: `AGENTS.md` → `wiki/INDEX.md` → `wiki/kinefit/INDEX.md`
- [ ] Modifiche al codice
- [ ] Test esistenti sul perimetro (Vitest mirato se presente)
- [ ] Aggiornare `/wiki/kinefit/` allo stato reale del codice
- [ ] `npm run wiki:inventory` se cambiano file sotto `mobile/src` o `supabase/functions`
- [ ] Non chiudere se manca il wiki-sync richiesto

### Test obbligatori se esistono

```powershell
npm --prefix mobile run test -- <pattern>
```

Fallimento → correggere codice appena modificato oppure il test. Non chiudere con quel test rosso.
