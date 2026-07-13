# Maestro E2E — KineFit

## Prerequisiti

1. [Maestro CLI](https://maestro.mobile.dev/) installato
2. App buildata su emulatore/device (`com.coemi.kinefit.elite`)
3. Credenziali di test Supabase

## Variabili ambiente

```bash
export MAESTRO_TEST_EMAIL="test@example.com"
export MAESTRO_TEST_PASSWORD="your-test-password"
```

## Eseguire i flow

```bash
# Dalla root del progetto
cd mobile && npm run e2e

# Singolo flow
maestro test ../.maestro/flows/login.yaml
maestro test ../.maestro/flows/navigation.yaml
```

## Flow disponibili

| Flow              | Descrizione                              |
| ----------------- | ---------------------------------------- |
| `login.yaml`      | Login email/password → tab Oggi visibile |
| `navigation.yaml` | Navigazione tra le 4 tab principali      |

## testID usati

| testID                 | Schermata        |
| ---------------------- | ---------------- |
| `auth-email-input`     | AuthView         |
| `auth-password-input`  | AuthView         |
| `auth-submit-button`   | AuthView         |
| `tab-oggi`             | Bottom tab       |
| `tab-storico`          | Bottom tab       |
| `tab-analisi`          | Bottom tab       |
| `tab-profilo`          | Bottom tab       |
| `workout-start-button` | OggiView         |
| `log-save-set-button`  | LogExerciseModal |

## CI / Maestro Cloud

I flow E2E non girano in CI GitHub (richiedono emulatore). Per pipeline automatizzata usa [Maestro Cloud](https://cloud.mobile.dev/) con build EAS e secret `MAESTRO_TEST_EMAIL` / `MAESTRO_TEST_PASSWORD`.
