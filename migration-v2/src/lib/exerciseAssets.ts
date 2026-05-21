// Dizionario di consigli posturali specifici e professionali in italiano per gli esercizi principali
const EXERCISE_GUIDES: Record<string, string[]> = {
  'panca piana': [
    'Mantieni le scapole addotte e depresse contro la panca per proteggere le spalle.',
    'Assicurati che i piedi siano ben piantati a terra per massimizzare la stabilità e la spinta.',
    'Scendi controllando il bilanciere fino al petto (linea dei capezzoli) e risali senza rimbalzare.'
  ],
  'pulley': [
    'Mantieni il busto eretto con una leggera inclinazione e non oscillare durante il movimento.',
    'Tira il cavo verso la parte bassa dell\'addome, concentrandoti sul portare indietro i gomiti.',
    'Mantieni le spalle basse e depresse, evitando di contrarre il trapezio superiore.'
  ],
  'plank': [
    'Mantieni il corpo in linea retta dai talloni alla testa, evitando di far cedere il bacino.',
    'Spingi attivamente i gomiti contro il pavimento per attivare il dentato anteriore.',
    'Contrai glutei e addome attivamente durante tutta la durata dell\'esercizio.'
  ],
  'lat machine avanti': [
    'Tira la sbarra verso la parte alta del petto, non dietro il collo.',
    'Pensa a guidare il movimento con i gomiti, stringendo i dorsali nella fase finale.',
    'Non dondolare all\'indietro con il busto per aiutarti a tirare il peso.'
  ],
  'lat machine presa inversa': [
    'Impugna la sbarra a larghezza spalle con i palmi rivolti verso di te (supinazione).',
    'Tira concentrandoti sul bicipite e sul grande dorsale, portando i gomiti aderenti ai fianchi.',
    'Mantieni il petto ben aperto verso l\'alto durante tutta la fase di trazione.'
  ],
  'bicipiti martello manubri': [
    'Mantieni i gomiti bloccati e aderenti ai fianchi senza farli oscillare in avanti.',
    'Mantieni le mani in posizione neutra (palmi che si guardano) durante tutto il movimento.',
    'Evita di dondolare con la schiena per sollevare il carico; usa solo i bicipiti.'
  ],
  'bicipiti manubri alternati': [
    'Inizia il movimento con presa neutra e ruota il palmo verso l\'alto (supinazione) durante la salita.',
    'Mantieni i gomiti fermi vicino al busto ed evita di sollevare le spalle.',
    'Scendi controllando il peso lentamente per massimizzare il lavoro eccentrico.'
  ],
  'bicipiti bilanciere ez presa ampia': [
    'Afferra il bilanciere EZ sulle curve esterne per ridurre lo stress sui polsi.',
    'Esegui una contrazione completa in alto senza far avanzare i gomiti oltre il busto.',
    'Mantieni le ginocchia leggermente flesse e il core attivo per stabilizzare la postura.'
  ],
  'bicipiti su panca scott con manubrio': [
    'Appoggia saldamente l\'ascella sul bordo della panca Scott per isolare completamente il bicipite.',
    'Esegui l\'estensione quasi completa del braccio controllando attentamente la fase di discesa.',
    'Evita di staccare il petto o le braccia dall\'imbottitura durante la salita.'
  ],
  'curl concentrato': [
    'Siediti sulla panca e appoggia il gomito contro l\'interno della coscia corrispondente.',
    'Solleva il manubrio verso la spalla concentrandoti sulla contrazione del bicipite.',
    'Mantieni il resto del corpo completamente immobile per isolare il movimento.'
  ],
  'kick back manubrio': [
    'Inclinati in avanti con il busto a circa 45° mantenendo la schiena piatta e allineata.',
    'Mantieni il braccio parallelo al terreno e il gomito bloccato aderente al fianco.',
    'Estendi completamente l\'avambraccio all\'indietro, contraendo al massimo il tricipite alla fine.'
  ],
  'tricipiti ercolina': [
    'Posizionati vicino al cavo con i gomiti stretti vicino ai fianchi e leggermente avanzati.',
    'Spingi la sbarra o la corda verso il basso fino ad estendere completamente le braccia.',
    'Evita di usare il peso del corpo per spingere; tieni il busto fermo e inclinato in avanti.'
  ],
  'french press': [
    'Sdraiati sulla panca piatta tenendo il bilanciere o i manubri con le braccia tese.',
    'Fletti i gomiti portando il carico verso la fronte, mantenendo le braccia stabili.',
    'Spingi il peso verso l\'alto contraendo i tricipiti, senza allargare i gomiti all\'esterno.'
  ],
  'dip tra panche': [
    'Posiziona le mani sul bordo di una panca dietro di te e i piedi appoggiati sulla panca di fronte.',
    'Scendi controllando il movimento fino a formare un angolo di 90° con i gomiti.',
    'Spingi verso l\'alto focalizzandoti sulla contrazione del tricipite ed evitando oscillazioni.'
  ],
  'leg press 45°': [
    'Posiziona i piedi sulla pedana a larghezza spalle, con le ginocchia allineate alle punte dei piedi.',
    'Scendi controllando la piattaforma senza staccare il bacino o la zona lombare dallo schienale.',
    'Spingi la pedana senza estendere completamente (non bloccare) le ginocchia alla fine.'
  ],
  'leg extension': [
    'Regola il rullo sopra le caviglie e mantieni la schiena ben aderente allo schienale.',
    'Afferra saldamente le maniglie laterali per evitare di sollevare il bacino durante l\'estensione.',
    'Estendi completamente le gambe contraendo i quadricipiti e tieni la posizione per un secondo.'
  ],
  'leg extension (richiamo)': [
    'Mantieni l\'esecuzione controllata con un focus particolare sul pompaggio e contrazione.',
    'Regola il macchinario in modo che il fulcro di rotazione coincida perfettamente con il ginocchio.',
    'Esegui ripetizioni fluide prestando attenzione a non dare strattoni all\'inizio della salita.'
  ],
  'leg curl': [
    'Sdraiati o siediti (a seconda del macchinario) posizionando il rullo sotto i polpacci.',
    'Fletti le gambe portando il rullo verso i glutei, mantenendo il bacino incollato al cuscino.',
    'Ritorna lentamente alla posizione di partenza controllando la fase di discesa.'
  ],
  'calf in piedi': [
    'Posiziona gli avampiedi sul blocco lasciando i talloni liberi di scendere sotto la linea d\'appoggio.',
    'Spingi verso l\'alto estendendo completamente la caviglia e contrai forte il polpaccio in cima.',
    'Scendi lentamente per allungare al massimo la fascia plantare e il tendine d\'Achille.'
  ],
  'calf seduto': [
    'Regola l\'imbottitura sopra le ginocchia e mantieni il busto leggermente inclinato in avanti.',
    'Esegui una spinta dinamica verso l\'alto sollevando i talloni al massimo.',
    'Ritorna nella posizione di massimo allungamento controllando la fase eccentrica.'
  ],
  'stacco rumeno (rdl)': [
    'Inizia in piedi con il bilanciere e sblocca leggermente le ginocchia mantenendole semiflesse.',
    'Spingi indietro il bacino facendo scivolare il carico lungo le cosce, mantenendo la schiena piatta.',
    'Scendi finché senti tensione nei femorali (solitamente sotto le ginocchia) e risali contraendo i glutei.'
  ],
  'affondi su posto monolaterali': [
    'Fai un passo avanti mantenendo il busto eretto e il core attivo per l\'equilibrio.',
    'Scendi verticalmente fino a sfiorare il terreno con il ginocchio posteriore.',
    'Spingi sul tallone anteriore per risalire, mantenendo il ginocchio in linea con il piede.'
  ],
  'alzate laterali': [
    'Mantieni le ginocchia leggermente flesse e inclina il busto leggermente in avanti.',
    'Solleva i manubri lateralmente guidando il movimento con i gomiti, fino all\'altezza delle spalle.',
    'Mantieni i polsi leggermente più bassi o in linea con i gomiti, evitando di ruotare i manubri all\'insù.'
  ],
  'alzate frontali': [
    'Solleva il manubrio o il bilanciere davanti a te fino all\'altezza degli occhi senza oscillare.',
    'Mantieni il braccio quasi completamente teso ma con il gomito leggermente sbloccato.',
    'Controlla la discesa rallentando il peso per stimolare il deltoide anteriore.'
  ],
  'croci a 90°': [
    'Fletti il busto in avanti quasi parallelamente al terreno, mantenendo la schiena piatta.',
    'Solleva i manubri lateralmente contraendo la parte posteriore delle spalle e le scapole.',
    'Evita di dare slanci con le gambe o con la parte superiore della schiena.'
  ],
  'revers fly 1 braccio per volta': [
    'Mantieni il braccio opposto saldo sul supporto per garantire stabilità assoluta.',
    'Esegui il movimento di apertura con il braccio leggermente flesso focalizzandoti sul deltoide posteriore.',
    'Ritorna lentamente al centro resistendo alla trazione del cavo o del manubrio.'
  ],
  'shoulder press presa ampia': [
    'Regola lo schienale quasi verticale e appoggia bene la schiena e la testa.',
    'Spingi i manubri o le maniglie verso l\'alto senza far scontrare i pesi a fine corsa.',
    'Scendi lentamente portando i gomiti leggermente sotto la linea delle spalle.'
  ],
  'military press manubri': [
    'Siediti dritto con il core compatto e i manubri all\'altezza delle clavicole.',
    'Spingi verticalmente sopra la testa contraendo i deltoidi, espirando durante lo sforzo.',
    'Evita di inarcare eccessivamente la zona lombare durante la fase di spinta.'
  ],
  'distensioni panca 30° manubri': [
    'Regola la panca a 30 gradi per focalizzare il lavoro sul fascio clavicolare del petto.',
    'Spingi i manubri verso l\'alto facendoli convergere al centro, senza farli toccare.',
    'Scendi lentamente aprendo bene il petto e sentendo l\'allungamento delle fibre muscolari.'
  ],
  'croci ai cavi alti': [
    'Fai un passo avanti tra i cavi per metterli in tensione, flettendo leggermente il busto.',
    'Porta le mani in avanti e verso il basso facendole convergere, simulando un abbraccio.',
    'Mantieni i gomiti fissi e leggermente flessi durante tutto il movimento.'
  ],
  'croci panca piana': [
    'Sdraiati sulla panca tenendo i manubri sopra il petto con i palmi che si guardano.',
    'Apri le braccia lateralmente disegnando un arco ampio, fino ad avvertire l\'allungamento del petto.',
    'Richiudi le braccia concentrandoti sulla contrazione del petto, senza piegare troppo i gomiti.'
  ],
  'pullover': [
    'Sdraiati sulla panca e afferra un manubrio con entrambe le mani a forma di coppa sopra il petto.',
    'Porta il manubrio dietro la testa mantenendo i gomiti semiflessi e fissi.',
    'Riporta il manubrio sopra il petto spingendo con i gran dentati e i pettorali.'
  ],
  'chest press orizzontale': [
    'Regola l\'altezza del sedile in modo che le maniglie si trovino all\'altezza della metà del petto.',
    'Spingi in avanti espirando, mantenendo le scapole incollate allo schienale.',
    'Ritorna lentamente controllando il peso fino ad avvertire l\'allungamento, senza far toccare le piastre.'
  ],
  'rematore manubrio singolo': [
    'Appoggia un ginocchio e la mano dello stesso lato sulla panca piatta per stabilizzarti.',
    'Tira il manubrio verso il fianco portando indietro il gomito e tenendolo vicino al busto.',
    'Distendi completamente il braccio in basso per allungare il dorsale prima della ripetizione successiva.'
  ],
  'face pull ai cavi': [
    'Afferra la corda collegata alla carrucola alta e fai un paio di passi indietro per metterla in tensione.',
    'Tira la corda verso il viso (altezza fronte/naso) allargando le mani all\'esterno alla fine del movimento.',
    'Mantieni i gomiti alti e concentrati sulla contrazione delle spalle posteriori e del trapezio.'
  ],
  'hiperextension': [
    'Regola il supporto in modo che il bordo superiore si trovi appena sotto le anche per consentire la flessione.',
    'Fletti il busto in avanti mantenendo la schiena piatta ed esegui l\'estensione contraendo glutei e lombari.',
    'Evita di iperestendere eccessivamente la schiena oltre la linea dritta del corpo.'
  ],
  'rowing machine': [
    'Appoggia saldamente il petto contro il cuscino di supporto e regola l\'altezza della seduta.',
    'Afferra le maniglie e tira portando indietro le spalle e i gomiti, stringendo la schiena.',
    'Ritorna lentamente nella posizione iniziale allungando i muscoli dorsali.'
  ],
  'pulldown': [
    'Afferra la sbarra a braccia tese inclinando leggermente il busto in avanti.',
    'Spingi la sbarra verso il basso fino a toccare le cosce, contraendo attivamente i gran dorsali.',
    'Controlla la risalita mantenendo la tensione muscolare costante e le spalle basse.'
  ]
};

// Consigli posturali generici di fallback calibrati sul gruppo muscolare
const MUSCLE_FALLBACK_GUIDES: Record<string, string[]> = {
  'petto': [
    'Adduci le scapole per proteggere le spalle e concentrare lo stimolo sul petto.',
    'Mantieni il petto ben aperto ed esegui contrazioni lente e controllate.',
    'Evita di estendere completamente i gomiti in modo violento per mantenere tensione costante.'
  ],
  'schiena': [
    'Conduci il movimento guidando con i gomiti anziché tirare solo con le mani.',
    'Mantieni la schiena piatta ed evita di curvare la colonna sotto carico.',
    'Mantieni le spalle basse e depresse per isolare i gran dorsali.'
  ],
  'lombari': [
    'Mantieni la colonna in posizione neutra durante tutto il movimento.',
    'Focalizzati sulla contrazione di glutei e femorali per estendere il bacino.',
    'Non forzare l\'angolo di estensione della schiena oltre l\'allineamento naturale.'
  ],
  'gambe': [
    'Spingi sempre attraverso il tallone o il centro del piede, non sulle punte.',
    'Mantieni le ginocchia in linea con le punte dei piedi, evitando che cedano all\'interno.',
    'Mantieni il core solido per stabilizzare la zona lombare.'
  ],
  'spalle': [
    'Evita di sollevare le spalle verso le orecchie durante il movimento (rilassa i trapezi).',
    'Mantieni i gomiti leggermente piegati ed esegui movimenti fluidi.',
    'Non utilizzare slanci del corpo per completare le ripetizioni pesanti.'
  ],
  'bicipiti': [
    'Mantieni i gomiti stretti lungo i fianchi ed evita di farli avanzare.',
    'Esegui una contrazione completa in cima ed estendi quasi del tutto in basso.',
    'Mantieni il core e i glutei contratti per evitare oscillazioni compensatorie.'
  ],
  'tricipiti': [
    'Mantieni i gomiti stabili e bloccati nella stessa posizione per tutto l\'esercizio.',
    'Estendi completamente l\'avambraccio focalizzandoti solo sul tricipite.',
    'Controlla attentamente la fase di ritorno per mantenere alta la tensione muscolare.'
  ],
  'core': [
    'Contrai attivamente l\'addome pensando ad avvicinare il costato al bacino.',
    'Non tirare con il collo; tieni la testa allineata e le mani solo come leggero appoggio.',
    'Mantieni la respirazione fluida espirando durante la fase di massimo sforzo.'
  ],
  'addominali': [
    'Contrai attivamente l\'addome pensando ad avvicinare il costato al bacino.',
    'Non tirare con il collo; tieni la testa allineata e le mani solo come leggero appoggio.',
    'Mantieni la respirazione fluida espirando durante la fase di massimo sforzo.'
  ],
  'default': [
    'Esegui il movimento in modo lento e controllato focalizzandoti sulla connessione mente-muscolo.',
    'Mantieni una postura stabile ed evita oscillazioni compensatorie con il corpo.',
    'Presta molta attenzione alla respirazione: espira sotto sforzo e inspira nella fase passiva.'
  ]
};

/**
 * Restituisce l'URL locale dell'immagine reale dell'esercizio
 */
export function getExerciseAsset(name: string): string {
  if (!name) return '/assets/exercises/groups/default.jpg';
  
  const cleanName = name.trim().toLowerCase();
  
  // Sostituiamo gli spazi con underscore per mappare il nome del file
  const filename = cleanName.replace(/\s+/g, '_') + '.jpg';
  
  // Mappatura semplificata per esercizi con piccoli suffissi o variazioni
  if (cleanName.includes('panca piana')) return '/assets/exercises/panca_piana.jpg';
  if (cleanName.includes('lat machine avanti')) return '/assets/exercises/lat_machine_avanti.jpg';
  if (cleanName.includes('lat machine presa inversa')) return '/assets/exercises/lat_machine_presa_inversa.jpg';
  if (cleanName.includes('leg extension')) return '/assets/exercises/leg_extension.jpg';
  if (cleanName.includes('leg press')) return '/assets/exercises/leg_press_45°.jpg';
  if (cleanName.includes('calf')) return cleanName.includes('seduto') ? '/assets/exercises/calf_seduto.jpg' : '/assets/exercises/calf_in-piedi.jpg';
  
  // Verifica se abbiamo scaricato l'immagine specifica
  // (La logica del frontend caricherà l'URL relativo. Se l'immagine non esiste,
  // il tag <img> utilizzerà l'evento onError per caricare il fallback del gruppo muscolare)
  return `/assets/exercises/${filename}`;
}

/**
 * Restituisce l'URL locale dell'immagine reale di fallback del gruppo muscolare
 */
export function getMuscleGroupFallback(muscleGroup: string): string {
  if (!muscleGroup) return '/assets/exercises/groups/default.jpg';
  
  const cleanGroup = muscleGroup.trim().toLowerCase();
  
  const validGroups = ['petto', 'schiena', 'lombari', 'gambe', 'spalle', 'bicipiti', 'tricipiti', 'core', 'addominali'];
  if (validGroups.includes(cleanGroup)) {
    return `/assets/exercises/groups/${cleanGroup}.jpg`;
  }
  
  return '/assets/exercises/groups/default.jpg';
}

/**
 * Restituisce i 3 consigli posturali ed esecutivi in italiano per l'esercizio
 */
export function getExerciseGuide(name: string, muscleGroup: string): string[] {
  if (!name) return MUSCLE_FALLBACK_GUIDES['default'];
  
  const cleanName = name.trim().toLowerCase();
  
  // Ricerca esatta o parziale nel dizionario delle guide
  for (const [key, guide] of Object.entries(EXERCISE_GUIDES)) {
    if (cleanName === key || cleanName.includes(key)) {
      return guide;
    }
  }
  
  // Se non troviamo una guida specifica, usiamo il fallback basato sul gruppo muscolare
  if (muscleGroup) {
    const cleanGroup = muscleGroup.trim().toLowerCase();
    
    // Gestione di gruppi muscolari sinonimi
    if (cleanGroup.includes('dorso') || cleanGroup.includes('schiena')) {
      return MUSCLE_FALLBACK_GUIDES['schiena'];
    }
    if (cleanGroup.includes('petto') || cleanGroup.includes('pettorali')) {
      return MUSCLE_FALLBACK_GUIDES['petto'];
    }
    if (cleanGroup.includes('gambe') || cleanGroup.includes('glutei') || cleanGroup.includes('cosce') || cleanGroup.includes('ipertrofia')) {
      return MUSCLE_FALLBACK_GUIDES['gambe'];
    }
    if (cleanGroup.includes('spalle') || cleanGroup.includes('deltoidi')) {
      return MUSCLE_FALLBACK_GUIDES['spalle'];
    }
    if (cleanGroup.includes('bicipiti')) {
      return MUSCLE_FALLBACK_GUIDES['bicipiti'];
    }
    if (cleanGroup.includes('tricipiti')) {
      return MUSCLE_FALLBACK_GUIDES['tricipiti'];
    }
    if (cleanGroup.includes('addominali') || cleanGroup.includes('core')) {
      return MUSCLE_FALLBACK_GUIDES['core'];
    }
    
    if (MUSCLE_FALLBACK_GUIDES[cleanGroup]) {
      return MUSCLE_FALLBACK_GUIDES[cleanGroup];
    }
  }
  
  return MUSCLE_FALLBACK_GUIDES['default'];
}
