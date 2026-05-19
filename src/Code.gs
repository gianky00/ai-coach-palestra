/** AI COACH - CORE ENGINE (Consolidated v19.1.1) Sistema unificato per massima stabilità. */

/**
 * @typedef {object} AppConfigType
 * @property {object} Sheets - Nomi dei fogli Google.
 * @property {object} Structure - Indici delle colonne e righe.
 * @property {string} Version - Versione attuale.
 * @property {number} CacheTTL - Time to live della cache in secondi.
 */
var AppConfig = {
  Sheets: {
    PALESTRA: 'Palestra',
    REGISTRO: 'Registro_Allenamenti',
    BIOMETRIA: 'Dati_Biometrici',
    SETTINGS: 'Settings',
  },
  Structure: {
    START_ROW: 3,
    NAME_COL: 4,
    DONE_COL: 13,
    VOLUME_COL: 14,
    E1RM_COL: 15,
    RPE_COL: 11,
    WEIGHT_START: 7,
    WEIGHT_END: 10,
  },
  Version: '19.1.1',
  CacheTTL: 600, // 10 minuti
};

/**
 * Punto di ingresso per la WebApp.
 *
 * @returns {object} L'interfaccia HTML.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('ui_mobile')
    .setTitle('AI Coach')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    );
}

/**
 * Recupera i dati iniziali per la dashboard, gestendo la cache.
 *
 * @returns {object} Dati per il frontend.
 */
function getInitialData() {
  var cache = CacheService.getUserCache();
  var cached = cache.get('initial_data');
  if (cached) return JSON.parse(cached);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var shPal = ss.getSheetByName(AppConfig.Sheets.PALESTRA);
    var data = shPal.getDataRange().getValues();

    var shReg = ss.getSheetByName(AppConfig.Sheets.REGISTRO);
    var reg = shReg ? shReg.getDataRange().getValues() : [];

    var shBio = ss.getSheetByName(AppConfig.Sheets.BIOMETRIA);
    var uPeso =
      shBio && shBio.getLastRow() > 1 ? shBio.getRange(shBio.getLastRow(), 2).getValue() : 0;

    var days = [
      'DOMENICA',
      'LUNEDI',
      'MARTEDI',
      'MARTEDÌ',
      'MERCOLEDI',
      'GIOVEDI',
      'VENERDI',
      'SABATO',
    ];
    var oggi = days[new Date().getDay()];

    var palestra = [],
      compex = [],
      volume = 0;

    data.forEach(function (r, i) {
      var rIdx = i + 1;
      if (rIdx < 3 || rIdx === 45 || rIdx === 46) return;

      var giorno = (r[0] || '').toString().toUpperCase().trim();
      var isOggi = giorno === oggi || (oggi.indexOf('MART') > -1 && giorno.indexOf('MART') > -1);

      if (isOggi && r[3]) {
        var nome = r[3];
        var stor = reg
          .filter(function (l) {
            return l[3] === nome;
          })
          .slice(-3)
          .reverse()
          .map(function (l) {
            var d = '??';
            try {
              d = Utilities.formatDate(new Date(l[0]), 'GMT+1', 'dd/MM');
            } catch (err) {
              console.warn('Errore data storico:', err);
            }
            return { data: d, setReps: l[4] + 'x' + l[5], peso: l[6] || 0 };
          });

        var ex = {
          id: rIdx,
          nome: nome,
          gruppo: r[2],
          target: r[5] + 'x' + r[4],
          comp: r[12] === true,
          last: r[9] || r[8] || r[7] || r[6] || 0,
          stor: stor,
        };

        if (ex.comp) volume += parseFloat(r[13]) || 0;
        if (rIdx < 45) palestra.push(ex);
        else compex.push(ex);
      }
    });

    var res = {
      giorno: oggi,
      palestra: palestra,
      compex: compex,
      uPeso: uPeso,
      prog:
        palestra.length + compex.length > 0
          ? ((palestra.filter(function (e) {
              return e.comp;
            }).length +
              compex.filter(function (e) {
                return e.comp;
              }).length) /
              (palestra.length + compex.length)) *
            100
          : 0,
      lVol: volume.toFixed(0),
    };

    cache.put('initial_data', JSON.stringify(res), AppConfig.CacheTTL);
    return res;
  } catch (e) {
    console.error('Errore getInitialData:', e);
    return { error: e.toString() };
  }
}

/** Pulisce la cache utente. */
function clearCache() {
  CacheService.getUserCache().remove('initial_data');
}

/**
 * Recupera i dati di documentazione tecnica.
 *
 * @returns {object} Oggetto con versione e documentazione.
 */
function getHelpData() {
  return {
    version: AppConfig.Version,
    docs: [
      {
        t: 'Architettura',
        d: 'Motore V8, logica server-side in Code.gs, UI reattiva in ui_mobile.html.',
      },
      { t: 'Calcoli', d: 'Volume = Peso * Reps * Sets. e1RM calcolato con formula Brzycki.' },
      { t: 'Cache', d: 'Attiva per 10 min. Si resetta automaticamente ad ogni salvataggio.' },
    ],
  };
}

/**
 * Registra un set avanzato nel foglio Palestra.
 *
 * @param {object} p Parametri del set (id, valore, rpe).
 * @returns {object} Dati iniziali aggiornati.
 */
function logSetAdvanced(p) {
  clearCache();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(AppConfig.Sheets.PALESTRA);
  var r = p.id;

  var col = 7;
  for (var c = 7; c <= 10; c++) {
    if (sh.getRange(r, c).getValue() === '') {
      col = c;
      break;
    }
    col = c;
  }

  sh.getRange(r, col).setValue("'" + p.valore);
  sh.getRange(r, 11).setValue(p.rpe);
  sh.getRange(r, 13).setValue(true);

  return getInitialData();
}

/**
 * Elimina l'ultimo set registrato per un esercizio.
 *
 * @param {number} id L'ID della riga dell'esercizio.
 * @returns {object} Dati iniziali aggiornati.
 */
function deleteSetAdvanced(id) {
  clearCache();
  var sh = SpreadsheetApp.getActiveSpreadsheetByName(AppConfig.Sheets.PALESTRA);
  for (var c = 10; c >= 7; c--) {
    if (sh.getRange(id, c).getValue() !== '') {
      sh.getRange(id, c).clearContent();
      break;
    }
  }
  sh.getRange(id, 13).setValue(false);
  return getInitialData();
}

/**
 * Salva il peso corporeo nel foglio Biometria.
 *
 * @param {number} p Il valore del peso corporeo.
 * @returns {object} Dati iniziali aggiornati.
 */
function saveBodyWeight(p) {
  clearCache();
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AppConfig.Sheets.BIOMETRIA);
  if (sh) sh.appendRow([new Date(), parseFloat(p)]);
  return getInitialData();
}

/** Archivia la sessione corrente nel registro allenamenti. */
function archiviaSessione() {
  clearCache();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shPal = ss.getSheetByName(AppConfig.Sheets.PALESTRA);
  var data = shPal.getDataRange().getValues();
  var log = [];
  data.forEach(function (r, i) {
    var row = i + 1;
    if (row < 3 || row === 45 || row === 46) return;
    if (r[12] === true) {
      log.push([
        new Date(),
        r[0],
        r[1],
        r[2],
        r[5],
        r[4],
        r[9] || r[8] || r[7] || r[6] || 0,
        r[11],
        r[13],
        r[14],
      ]);
      shPal.getRange(row, 13).setValue(false); // Reset M
    }
  });
  if (log.length > 0) {
    var shReg = ss.getSheetByName(AppConfig.Sheets.REGISTRO);
    if (shReg) shReg.getRange(shReg.getLastRow() + 1, 1, log.length, 10).setValues(log);
    ss.toast('Archiviato!');
  }
}
