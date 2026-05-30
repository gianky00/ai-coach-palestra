import pandas as pd
import json

import os

# Calcolo dinamico del percorso relativo della scheda palestra per garantire la portabilità
current_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(current_dir, '..', 'database', 'scheda palestra.xlsx')
df = pd.read_excel(file_path, sheet_name='Palestra')

# Tabella 1: Palestra (Righe 1-42 in pandas, che sono 2-43 in Excel)
gym = df.iloc[1:43, [0, 1, 2, 3, 4]]

# Tabella 2: Compex (Righe 45-51 in pandas, che sono 46-52 in Excel)
compex = df.iloc[45:52, [0, 1, 2, 3, 4]]

result = []

for i, r in gym.iterrows():
    if pd.isna(r.iloc[0]): continue
    result.append({
        'training_day': str(r.iloc[0]).upper().replace('MARTEDÌ', 'MARTEDI').strip(),
        'muscle_group': str(r.iloc[1]).strip(),
        'name': str(r.iloc[2]).strip(),
        'target_reps': str(r.iloc[3]).strip(),
        'target_sets': int(r.iloc[4]) if pd.notnull(r.iloc[4]) else 0,
        'notes': 'PALESTRA',
        'order_index': i
    })

for i, r in compex.iterrows():
    if pd.isna(r.iloc[0]): continue
    result.append({
        'training_day': str(r.iloc[0]).upper().replace('MARTEDÌ', 'MARTEDI').strip(),
        'muscle_group': str(r.iloc[3]).strip(), # Posizione
        'name': str(r.iloc[2]).strip(), # Programma
        'target_reps': '1',
        'target_sets': 1,
        'notes': 'COMPEX',
        'order_index': i
    })

import sys
import subprocess
import os
import re
import urllib.request
import urllib.error

if '--sync' in sys.argv:
    print("Avvio sincronizzazione automatica su Supabase...")
    # 1. Rilevamento user_id tramite find_user.cjs
    try:
        result_node = subprocess.run(['node', r'scripts\find_user.cjs'], capture_output=True, text=True, check=True)
        user_id_match = re.search(r'USER_ID:([a-fA-F0-9\-]+)', result_node.stdout)
        if not user_id_match:
            print("Errore: Impossibile rilevare l'USER_ID tramite find_user.cjs. Output:")
            print(result_node.stdout)
            sys.exit(1)
        user_id = user_id_match.group(1)
        print(f"Rilevato USER_ID reale: {user_id}")
    except Exception as e:
        print(f"Errore durante l'esecuzione di find_user.cjs: {e}")
        sys.exit(1)
        
    # 2. Caricamento .env
    env_path = r'.env'
    if not os.path.exists(env_path):
        print("Errore: File .env non trovato nella root del progetto.")
        sys.exit(1)
        
    supabase_url = None
    supabase_key = None
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'VITE_SUPABASE_URL' in line:
                supabase_url = line.split('=')[1].strip()
            elif 'VITE_SUPABASE_ANON_KEY' in line:
                supabase_key = line.split('=')[1].strip()
                
    if not supabase_url or not supabase_key:
        print("Errore: Chiavi Supabase non trovate nel file .env.")
        sys.exit(1)
        
    # Aggiungi user_id a tutti gli esercizi
    for ex in result:
        ex['user_id'] = user_id
        
    # 3. Invio a Supabase
    print("Sincronizzazione degli esercizi in corso su Supabase...")
    url = f"{supabase_url}/rest/v1/exercises"
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    
    req = urllib.request.Request(url, data=json.dumps(result).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            if status in [200, 201]:
                print(f"\nSincronizzazione completata con successo! {len(result)} esercizi caricati su Supabase per l'utente {user_id}.")
            else:
                print(f"Risposta inattesa da Supabase: {status}")
    except urllib.error.HTTPError as e:
        print(f"Errore HTTP durante l'invio a Supabase: {e.code} - {e.read().decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"Errore di connessione a Supabase: {e}")
        sys.exit(1)
else:
    print(json.dumps(result, indent=2))

