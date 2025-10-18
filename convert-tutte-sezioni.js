// Conversione TUTTE LE SEZIONI con settori dalla lista aggiornata
const pdfWidth = 595.28;
const pdfHeight = 841.89;
const gridSize = 10;
const numCols = 60;

function settoreToCoordinate(settore, offsetY = 0) {
  const settoreNum = parseFloat(settore.toString().replace(',', '.'));
  const col = ((settoreNum - 1) % numCols);
  const row = Math.floor((settoreNum - 1) / numCols);
  const x = col * gridSize;
  const y = pdfHeight - (row + 1) * gridSize + offsetY;

  return {
    settore: settore,
    x: parseFloat(x.toFixed(1)),
    y: parseFloat(y.toFixed(1))
  };
}

console.log('\n📍 SEZIONE 2: ANGEHÖRIGE\n');
const sezione2 = {
  frau: settoreToCoordinate(1511),
  herr: settoreToCoordinate(1536),
  vorname: settoreToCoordinate(1633),
  name: settoreToCoordinate(1656),
  strasse: settoreToCoordinate(1753),
  plzOrt: settoreToCoordinate(1757),
  telefon: settoreToCoordinate(1873),
  email: settoreToCoordinate(1837),
  familienangehoeriger: settoreToCoordinate('1933.5'),
  private: settoreToCoordinate(1944),
  betreuer: settoreToCoordinate(1953)
};
console.log(JSON.stringify(sezione2, null, 2));

console.log('\n📍 SEZIONE 3: PFLEGEBOX\n');
const sezione3 = {
  bettschutzeinlagen: settoreToCoordinate(2288),
  fingerlinge: settoreToCoordinate(2235),
  ffp2: settoreToCoordinate('2322.5'),
  einmalhandschuhe: settoreToCoordinate(2408, 5), // 0.5 verso l'alto = +5px Y
  mundschutz: settoreToCoordinate(2365),
  essslaetzchen: settoreToCoordinate(2444, 5), // 0.5 verso l'alto = +5px Y
  schutzschuerzenEinmal: settoreToCoordinate(2468),
  schutzschuerzenWieder: settoreToCoordinate(2485),
  flaechendesinfektionsmittel: settoreToCoordinate(2528),
  haendedesinfektionsmittel: settoreToCoordinate(2587),
  handschuhS: settoreToCoordinate(2714),
  handschuhM: settoreToCoordinate(2716),
  handschuhL: settoreToCoordinate(2718),
  handschuhXL: settoreToCoordinate(2720),
  nitril: settoreToCoordinate(2737),
  vinyl: settoreToCoordinate(2741),
  latex: settoreToCoordinate(2745)
};
console.log(JSON.stringify(sezione3, null, 2));

console.log('\n📍 SEZIONE 4: LIEFERADRESSE\n');
const sezione4 = {
  versicherte: settoreToCoordinate(3127),
  angehoerige: settoreToCoordinate(3688)
};
console.log(JSON.stringify(sezione4, null, 2));

console.log('\n📍 SEZIONE 5: RECHNUNGSEMPFÄNGER\n');
const sezione5 = {
  versicherte: settoreToCoordinate(3667),
  angehoerige: settoreToCoordinate(3688)
};
console.log(JSON.stringify(sezione5, null, 2));

console.log('\n📍 SEZIONE 6: AGB/FIRMA\n');
const sezione6 = {
  agb: settoreToCoordinate(3787, -5), // 0.5 in basso = -5px Y
  privacy: settoreToCoordinate(3847, -5), // 0.5 in basso = -5px Y
  firmaVersicherte: settoreToCoordinate(4148),
  firmaBevollmaechtigte: settoreToCoordinate(4172)
};
console.log(JSON.stringify(sezione6, null, 2));

console.log('\n\n🎯 TUTTE LE COORDINATE PRONTE PER IL WORKER!\n');
