// Conversione settori SEZIONE 1 in coordinate X,Y
// Griglia 10x10px: 60 colonne x 85 righe

const pdfWidth = 595.28;
const pdfHeight = 841.89;
const gridSize = 10;
const numCols = 60;

function settoreToCoordinate(settore, note = '') {
  const col = (settore - 1) % numCols;
  const row = Math.floor((settore - 1) / numCols);
  const x = col * gridSize;
  const y = pdfHeight - (row + 1) * gridSize;

  return {
    settore,
    x: Math.round(x),
    y: Math.round(y),
    note
  };
}

console.log('\n📍 SEZIONE 1: ANTRAGSTELLER - COORDINATE CALCOLATE\n');

// Checkbox Anrede (già corretti)
console.log('✅ Checkbox Frau (settore 611):', settoreToCoordinate(611, 'GIÀ CORRETTO'));
console.log('✅ Checkbox Herr (settore 636):', settoreToCoordinate(636, 'GIÀ CORRETTO'));

// Vorname / Name - "a cavallo tra" = calcolo la media
console.log('\n📝 Vorname (a cavallo tra 673 e 733):');
const vornameSettore = Math.floor((673 + 733) / 2);
console.log('   Settore medio:', vornameSettore);
console.log('   Coordinate:', settoreToCoordinate(vornameSettore, 'NUOVO'));

console.log('\n📝 Name (a cavallo tra 696 e 756):');
const nameSettore = Math.floor((696 + 756) / 2);
console.log('   Settore medio:', nameSettore);
console.log('   Coordinate:', settoreToCoordinate(nameSettore, 'NUOVO'));

// Straße / PLZ Ort
console.log('\n📝 Straße (a cavallo tra 793 e 853):');
const strasseSettore = Math.floor((793 + 853) / 2);
console.log('   Settore medio:', strasseSettore);
console.log('   Coordinate:', settoreToCoordinate(strasseSettore, 'NUOVO'));

console.log('\n📝 PLZ/Ort (a cavallo tra 815 e 875):');
const plzOrtSettore = Math.floor((815 + 875) / 2);
console.log('   Settore medio:', plzOrtSettore);
console.log('   Coordinate:', settoreToCoordinate(plzOrtSettore, 'NUOVO'));

// Telefon / Email
console.log('\n📝 Telefon (settore 913):', settoreToCoordinate(913, 'NUOVO'));
console.log('📝 Email (settore 936):', settoreToCoordinate(936, 'NUOVO'));

// Pflegegrad
console.log('\n☑️ Pflegegrad 1 (settore 1041):', settoreToCoordinate(1041, 'NUOVO'));
console.log('☑️ Pflegegrad 2 (settore 1044):', settoreToCoordinate(1044, 'NUOVO'));

const pflegegrad3Settore = Math.floor((1046 + 1047) / 2);
console.log('☑️ Pflegegrad 3 (tra 1046 e 1047):');
console.log('   Settore medio:', pflegegrad3Settore);
console.log('   Coordinate:', settoreToCoordinate(pflegegrad3Settore, 'NUOVO'));

console.log('☑️ Pflegegrad 4 (settore 1049):', settoreToCoordinate(1049, 'NUOVO'));
console.log('☑️ Pflegegrad 5 (settore 1052):', settoreToCoordinate(1052, 'NUOVO'));
console.log('☑️ Pflegegrad beantragt (settore 1055):', settoreToCoordinate(1055, 'NUOVO'));

// Versicherungstyp
console.log('\n☑️ Gesetzlich (settore 1154 - alto a sinistra):');
const gesetzlichCoord = settoreToCoordinate(1154, 'NUOVO');
console.log('   Coordinate:', gesetzlichCoord);
console.log('   Aggiusto Y in alto:', { ...gesetzlichCoord, y: gesetzlichCoord.y + 5 });

console.log('☑️ Privat (settore 1164 - alto a destra):');
const privatCoord = settoreToCoordinate(1164, 'NUOVO');
console.log('   Coordinate:', privatCoord);
console.log('   Aggiusto Y in alto + X a destra:', { ...privatCoord, x: privatCoord.x + 5, y: privatCoord.y + 5 });

console.log('☑️ Beihilfeberechtigt (settore 1174 - alto a sinistra):');
const beihilfeCoord = settoreToCoordinate(1174, 'NUOVO');
console.log('   Coordinate:', beihilfeCoord);
console.log('   Aggiusto Y in alto:', { ...beihilfeCoord, y: beihilfeCoord.y + 5 });

// Ortsamt
console.log('\n☑️ Ortsamt checkbox (settore 1214 - basso a sinistra):');
const ortsamtCoord = settoreToCoordinate(1214, 'NUOVO');
console.log('   Coordinate:', ortsamtCoord);
console.log('   Aggiusto Y in basso:', { ...ortsamtCoord, y: ortsamtCoord.y - 5 });

console.log('\n📝 Ortsamt text (settore 1141):', settoreToCoordinate(1141, 'NUOVO'));

console.log('\n\n🎯 COORDINATE FINALI PER IL WORKER:\n');

// Riassunto finale con coordinate aggiustate
const coordinates = {
  // Anrede (già corretti)
  frau: { x: 100, y: 732 },
  herr: { x: 350, y: 732 },

  // Dati personali (NUOVI)
  vorname: settoreToCoordinate(Math.floor((673 + 733) / 2)),
  name: settoreToCoordinate(Math.floor((696 + 756) / 2)),
  strasse: settoreToCoordinate(Math.floor((793 + 853) / 2)),
  plzOrt: settoreToCoordinate(Math.floor((815 + 875) / 2)),
  telefon: settoreToCoordinate(913),
  email: settoreToCoordinate(936),

  // Pflegegrad (NUOVI)
  pflegegrad1: settoreToCoordinate(1041),
  pflegegrad2: settoreToCoordinate(1044),
  pflegegrad3: settoreToCoordinate(Math.floor((1046 + 1047) / 2)),
  pflegegrad4: settoreToCoordinate(1049),
  pflegegrad5: settoreToCoordinate(1052),
  pflegegradBeantragt: settoreToCoordinate(1055),

  // Versicherungstyp (NUOVI - con aggiustamenti)
  gesetzlich: { ...settoreToCoordinate(1154), y: settoreToCoordinate(1154).y + 5 },
  privat: { ...settoreToCoordinate(1164), x: settoreToCoordinate(1164).x + 5, y: settoreToCoordinate(1164).y + 5 },
  beihilfe: { ...settoreToCoordinate(1174), y: settoreToCoordinate(1174).y + 5 },

  // Ortsamt (NUOVI - con aggiustamenti)
  ortsamtCheck: { ...settoreToCoordinate(1214), y: settoreToCoordinate(1214).y - 5 },
  ortsamtText: settoreToCoordinate(1141)
};

console.log(JSON.stringify(coordinates, null, 2));
