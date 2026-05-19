import pandas as pd
import json

file_path = r'C:\Users\Coemi\Desktop\SCRIPT\appPalestra\migration-v2\scheda palestra.xlsx'
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

print(json.dumps(result, indent=2))
