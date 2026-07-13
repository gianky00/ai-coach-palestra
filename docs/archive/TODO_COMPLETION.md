# 🔍 Funzionalità Mancanti Rilevate - KineFit Mobile

Dopo un'analisi approfondita delle interazioni e del codice, ecco l'elenco delle parti "vuote" o non ancora migrate che devono essere completate:

## 1. Profilo & Impostazioni

- [ ] **Pannello Impostazioni:** Attualmente i tasti "Impostazioni" e "Notifiche" non fanno nulla.
  - Implementare `SettingsModal.tsx` per cambiare unità di misura (kg/lb) e lingua.
  - Gestire la persistenza di queste preferenze nello store Zustand.
- [ ] **Gestione Notifiche:** Interfaccia per attivare/disattivare gli avvisi di recupero e i suoni.

## 2. Vista "Oggi" (Miglioramenti)

- [ ] **Aggiungi Esercizio:** Manca il tasto "+" globale per aggiungere un esercizio non previsto per oggi (presente nel web).
  - Creare `AddExerciseModal.tsx`.
- [ ] **Modifica Esercizio:** Possibilità di cambiare il target reps/sets direttamente dal cellulare.
- [ ] **Info Profilo:** Il tasto "i" in alto a destra deve aprire un riepilogo rapido del profilo o le FAQ.

## 3. Storico (Approfondimento)

- [ ] **Dettagli Sessione:** Attualmente puoi solo vedere la lista degli allenamenti passati.
  - Implementare `SessionDetailsModal.tsx` che si apre cliccando su una sessione dello storico per vedere ogni singolo set fatto quel giorno.
- [ ] **Eliminazione Sessione:** Tasto per cancellare un allenamento errato direttamente dallo storico.

## 4. Log Esercizio (Rifiniture)

- [ ] **Guida Esercizio:** Il web mostra come fare l'esercizio. Dobbiamo aggiungere un tasto "Guida" nel modale di log.
- [ ] **Timer Dinamico:** Permettere di modificare il tempo di recupero direttamente mentre il timer scorre.

## 5. Analisi (Dettaglio)

- [ ] **Filtri Temporali:** Attualmente mostra solo gli ultimi 7 giorni. Aggiungere opzioni per "Ultimo Mese" o "Sempre".
- [ ] **Dettaglio Muscoli:** Grafico a torta per vedere la distribuzione del lavoro sui vari gruppi muscolari.

---

**Obiettivo Immediato:** Inizierò dai **Dettagli dello Storico** e dalle **Impostazioni del Profilo**, dato che sono le mancanze più evidenti segnalate.
