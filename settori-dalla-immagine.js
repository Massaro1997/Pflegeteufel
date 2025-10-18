// 🎯 SETTORI LETTI DALLO SCREENSHOT

// Configurazione griglia
const GRID = {
  cols: 60,
  rows: 85,
  cellWidth: 10,
  cellHeight: 10,
  pdfHeight: 841.89
};

function sectorToCoordinate(sector) {
  const col = (sector - 1) % GRID.cols;
  const row = Math.floor((sector - 1) / GRID.cols);
  const x = col * GRID.cellWidth;
  const y = GRID.pdfHeight - (row + 1) * GRID.cellHeight;

  return {
    sector: sector,
    x: Math.round(x),
    y: Math.round(y)
  };
}

console.log('='.repeat(70));
console.log('🎯 ANALISI SETTORI DALLO SCREENSHOT');
console.log('='.repeat(70));

// SEZIONE 1: ANTRAGSTELLER
console.log('\n📋 SEZIONE 1: ANTRAGSTELLER\n');

const section1 = [
  { campo: 'Checkbox Frau (X)', settore: 611 },
  { campo: 'Checkbox Herr (X)', settore: 636 },
  { campo: 'Vorname: Maria', settore: 673 },
  { campo: 'Name: Schmidt', settore: 696 },
  { campo: 'Straße: Musterstraße 123', settore: 793 },
  { campo: 'PLZ/Ort: 51063 Köln', settore: 815 },
  { campo: 'Telefon: +49 221 12345678', settore: 910 },
  { campo: 'E-Mail: maria.schmidt@example.com', settore: 935 },
  { campo: 'Checkbox Pflegegrad 1', settore: 1032 },
  { campo: 'Checkbox Pflegegrad 2 (X)', settore: 1034 },
  { campo: 'Checkbox Pflegegrad 3 (X)', settore: 1036 },
  { campo: 'Checkbox Pflegegrad 4 (X)', settore: 1038 },
  { campo: 'Checkbox Pflegegrad 5 (X)', settore: 1040 },
  { campo: 'Checkbox Pflegegrad beantragt (X)', settore: 1045 },
  { campo: 'Checkbox gesetzlich (X)', settore: 1097 },
  { campo: 'Checkbox privat (X)', settore: 1104 },
  { campo: 'Checkbox beihilfeberechtigt (X)', settore: 1113 },
  { campo: 'Checkbox über Ortsamt (X)', settore: 1217 },
  { campo: 'Ortsamt text: sozialamt', settore: 1245 }
];

section1.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// SEZIONE 2: ANGEHÖRIGE
console.log('\n📋 SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON\n');

const section2 = [
  { campo: 'Checkbox Frau (X)', settore: 1511 },
  { campo: 'Checkbox Herr (X)', settore: 1536 },
  { campo: 'Vorname: Thomas', settore: 1573 },
  { campo: 'Name: Schmidt', settore: 1596 },
  { campo: 'Straße: Beispielweg 45', settore: 1693 },
  { campo: 'PLZ/Ort: 50667 Köln', settore: 1715 },
  { campo: 'Telefon: +49 221 98765432', settore: 1810 },
  { campo: 'E-Mail: thomas.schmidt@example.com', settore: 1835 },
  { campo: 'Checkbox Familienangehörige (X)', settore: 1933 },
  { campo: 'Checkbox Private Pflegeperson (X)', settore: 1937 },
  { campo: 'Checkbox Betreuer (X)', settore: 1972 }
];

section2.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// SEZIONE 3: PFLEGEBOX
console.log('\n📋 SEZIONE 3: PFLEGEBOX\n');

const section3 = [
  { campo: 'Checkbox Bettschutzeinlagen (X)', settore: 2293 },
  { campo: 'Checkbox Fingerlinge (X)', settore: 2310 },
  { campo: 'Checkbox FFP2 Masken (X)', settore: 2330 },
  { campo: 'Checkbox Einmalhandschuhe (X)', settore: 2353 },
  { campo: 'Checkbox Mundschutz (X)', settore: 2370 },
  { campo: 'Checkbox Esslätzchen (X)', settore: 2390 },
  { campo: 'Checkbox Schutzschürzen einmal (X)', settore: 2413 },
  { campo: 'Checkbox Schutzschürzen wieder (X)', settore: 2430 },
  { campo: 'Checkbox Flächendesinfektionsmittel (X)', settore: 2533 },
  { campo: 'Checkbox Händedesinfektionsmittel (X)', settore: 2595 },
  { campo: 'Handschuhgröße S (X)', settore: 2715 },
  { campo: 'Handschuhgröße M (X)', settore: 2718 },
  { campo: 'Handschuhgröße L (X)', settore: 2721 },
  { campo: 'Handschuhgröße XL (X)', settore: 2724 },
  { campo: 'Handschuhmaterial Nitril (X)', settore: 2740 },
  { campo: 'Handschuhmaterial Vinyl (X)', settore: 2744 },
  { campo: 'Handschuhmaterial Latex (X)', settore: 2748 }
];

section3.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// SEZIONE 4: LIEFERADRESSE
console.log('\n📋 SEZIONE 4: LIEFERADRESSE\n');

const section4 = [
  { campo: 'Checkbox Versicherte (X)', settore: 3127 },
  { campo: 'Checkbox Angehörige (X)', settore: 3150 }
];

section4.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// SEZIONE 5: RECHNUNGSEMPFÄNGER
console.log('\n📋 SEZIONE 5: RECHNUNGSEMPFÄNGER\n');

const section5 = [
  { campo: 'Checkbox Versicherte (X)', settore: 3607 },
  { campo: 'Checkbox Angehörige (X)', settore: 3630 }
];

section5.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// SEZIONE 6: AGB
console.log('\n📋 SEZIONE 6: AGB\n');

const section6 = [
  { campo: 'Checkbox AGB (X)', settore: 3793 },
  { campo: 'Checkbox Privacy (X)', settore: 3853 }
];

section6.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// Salvo tutto in JSON
const allCoordinates = {
  page1: {
    section1: section1.map(item => ({
      field: item.campo,
      sector: item.settore,
      ...sectorToCoordinate(item.settore)
    })),
    section2: section2.map(item => ({
      field: item.campo,
      sector: item.settore,
      ...sectorToCoordinate(item.settore)
    })),
    section3: section3.map(item => ({
      field: item.campo,
      sector: item.settore,
      ...sectorToCoordinate(item.settore)
    })),
    section4: section4.map(item => ({
      field: item.campo,
      sector: item.settore,
      ...sectorToCoordinate(item.settore)
    })),
    section5: section5.map(item => ({
      field: item.campo,
      sector: item.settore,
      ...sectorToCoordinate(item.settore)
    })),
    section6: section6.map(item => ({
      field: item.campo,
      sector: item.settore,
      ...sectorToCoordinate(item.settore)
    }))
  }
};

import fs from 'fs';
fs.writeFileSync('./coordinate-finali.json', JSON.stringify(allCoordinates, null, 2));

console.log('\n' + '='.repeat(70));
console.log('✅ COORDINATE ESTRATTE E SALVATE!');
console.log('='.repeat(70));
console.log('\n💾 File: coordinate-finali.json\n');
