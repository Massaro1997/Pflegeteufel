// Conversione settori CORRETTI dalla lista aggiornata
// Griglia 10x10px: 60 colonne x 85 righe

const pdfWidth = 595.28;
const pdfHeight = 841.89;
const gridSize = 10;
const numCols = 60;

function settoreToCoordinate(settore) {
  const col = (settore - 1) % numCols;
  const row = Math.floor((settore - 1) / numCols);
  const x = col * gridSize;
  const y = pdfHeight - (row + 1) * gridSize;

  return {
    settore,
    x: Math.round(x),
    y: Math.round(y)
  };
}

console.log('\n📍 SEZIONE 1: COORDINATE CORRETTE\n');

// Checkbox Anrede (già corretti)
console.log('✅ Checkbox Frau (611):', settoreToCoordinate(611));
console.log('✅ Checkbox Herr (636):', settoreToCoordinate(636));

// Vorname / Name
console.log('\n📝 Vorname (673):', settoreToCoordinate(673));
console.log('📝 Name (696):', settoreToCoordinate(696));

// Straße / PLZ Ort
console.log('\n📝 Straße (793):', settoreToCoordinate(793));
console.log('📝 PLZ/Ort (815):', settoreToCoordinate(815));

// Telefon / Email
console.log('\n📝 Telefon (913):', settoreToCoordinate(913));
console.log('📝 Email (936):', settoreToCoordinate(936));

// Pflegegrad
console.log('\n☑️ Pflegegrad 1 (1041):', settoreToCoordinate(1041));
console.log('☑️ Pflegegrad 2 (1044):', settoreToCoordinate(1044));
console.log('☑️ Pflegegrad 3 (1046):', settoreToCoordinate(1046));
console.log('☑️ Pflegegrad 4 (1049):', settoreToCoordinate(1049));
console.log('☑️ Pflegegrad 5 (1052):', settoreToCoordinate(1052));
console.log('☑️ Pflegegrad beantragt (1055):', settoreToCoordinate(1055));

// Versicherungstyp
console.log('\n☑️ Gesetzlich (1154):', settoreToCoordinate(1154));
console.log('☑️ Privat (1164):', settoreToCoordinate(1164));
console.log('☑️ Beihilfeberechtigt (1174):', settoreToCoordinate(1174));

// Ortsamt
console.log('\n☑️ Ortsamt checkbox (1214):', settoreToCoordinate(1214));
console.log('📝 Ortsamt text (1141):', settoreToCoordinate(1141));

console.log('\n\n🎯 RIEPILOGO JSON:\n');

const coordinates = {
  // Anrede
  frau: settoreToCoordinate(611),
  herr: settoreToCoordinate(636),

  // Dati personali
  vorname: settoreToCoordinate(673),
  name: settoreToCoordinate(696),
  strasse: settoreToCoordinate(793),
  plzOrt: settoreToCoordinate(815),
  telefon: settoreToCoordinate(913),
  email: settoreToCoordinate(936),

  // Pflegegrad
  pflegegrad1: settoreToCoordinate(1041),
  pflegegrad2: settoreToCoordinate(1044),
  pflegegrad3: settoreToCoordinate(1046),
  pflegegrad4: settoreToCoordinate(1049),
  pflegegrad5: settoreToCoordinate(1052),
  pflegegradBeantragt: settoreToCoordinate(1055),

  // Versicherungstyp
  gesetzlich: settoreToCoordinate(1154),
  privat: settoreToCoordinate(1164),
  beihilfe: settoreToCoordinate(1174),

  // Ortsamt
  ortsamtCheck: settoreToCoordinate(1214),
  ortsamtText: settoreToCoordinate(1141)
};

console.log(JSON.stringify(coordinates, null, 2));
