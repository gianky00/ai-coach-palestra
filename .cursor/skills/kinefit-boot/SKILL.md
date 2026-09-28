---
name: kinefit-boot
description: >-
  Bootstrap operativo per lavorare sul repository KineFit (ai-coach-palestra).
  Carica su qualsiasi task: impone il boot verso wiki/AGENTS (fonte di verità)
  e il wiki-sync; non duplica architettura né freeze del repo.
---

# KineFit — skill agente (bootstrap)

Questa skill **non** è la knowledge base. Le regole di progetto, l’architettura e i freeze vivono **nel repository**, soprattutto in `/wiki` e `AGENTS.md`. Qui restano solo: come entrare nel contesto, cosa non inventare, e come consegnare.

## Boot obbligatorio (prima di agire)

1. `AGENTS.md`
2. `wiki/INDEX.md` → `wiki/kinefit/INDEX.md`
3. Nodi wiki del dominio toccato
4. `docs/GEMINI.md` — solo ops
5. `mobile/GEMINI.md` se il dominio è mobile

Protocollo: `wiki/kinefit/workflows/pre_commit_wiki_protocol.md`.  
Router: MCP `kinefit-agent` → `resolve_domain`.

**Se wiki e skill divergono, vince il repo.**

## Consegna

1. Codice allineato alle regole lette da `AGENTS.md` + wiki.
2. Vitest mirato se esiste sul perimetro.
3. Se modifica rilevante: aggiornare `/wiki/kinefit` + `npm run wiki:inventory` se tocca TS inventariati.
4. Gate: `npm run wiki:check` / quality Gate F.

## Anti-pattern

- Duplicare qui architettura, elenchi testID, o mappe Garmin — vanno nella wiki.
- Trattare `docs/GEMINI.md` o root `GEMINI.md` come fonte architetturale.
- Chiudere un task senza wiki-sync quando il protocollo lo richiede.
