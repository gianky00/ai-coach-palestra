# 📱 KineFit Mobile (Elite)

Questa cartella contiene il progetto nativo React Native (Expo) dell'applicazione KineFit.

## 🚀 Come iniziare (su un nuovo PC)

1.  Assicurati di avere **Node.js** (v20+) installato.
2.  Entra in questa cartella: `cd mobile`
3.  Installa le dipendenze:
    ```bash
    npm install --force
    ```
4.  Avvia l'ambiente di sviluppo:
    ```bash
    npx expo start --clear
    ```
5.  Inquadra il QR Code con l'app **Expo Go** sul tuo smartphone.

## 📁 Struttura

- `src/lib/sqlite.ts`: Gestione database locale per l'uso offline.
- `src/lib/offlineSync.ts`: Sincronizzazione automatica con Supabase.
- `src/components/views`: Tutte le schermate native (Oggi, Storico, Analisi, Profilo).

## 🔑 Configurazione Supabase

Le chiavi di Supabase sono attualmente pre-configurate in `src/lib/supabase.ts`. Se desideri cambiarle, modifica quel file.

---

_KineFit - Elite Training Mobile_
