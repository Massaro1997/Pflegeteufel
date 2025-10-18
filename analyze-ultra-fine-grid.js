import fs from 'fs';

// Griglia ULTRA FINE: 5x5 pixel
const GRID = {
  cols: 120,
  rows: 169,
  cellWidth: 5,
  cellHeight: 5,
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
console.log('🎯 ANALISI ULTRA FINE DAGLI SCREENSHOT');
console.log('='.repeat(70));

// LEGGENDO DAGLI SCREENSHOT CON GRIGLIA 5x5

const section1 = [
  // Screenshot 1
  { campo: 'Checkbox Frau (X)', settore: 2420 },  // Vedo settore 2420 vicino alla X
  { campo: 'Checkbox Herr (X)', settore: 2490 },  // Vedo settore 2490 vicino alla X
  { campo: 'Vorname: Maria', settore: 2780 },     // Vedo "Maria" vicino a settore 2780
  { campo: 'Name: Schmidt', settore: 2830 },      // Vedo "Schmidt" vicino a settore 2830
  { campo: 'Straße: Musterstraße 123', settore: 3250 }, // Vedo testo vicino a 3250
  { campo: 'PLZ/Ort: 51063 Köln', settore: 3330 },      // Vedo testo vicino a 3330
  { campo: 'Telefon: +49 221 12345678', settore: 3620 }, // Vedo telefono vicino a 3620
  { campo: 'E-Mail: maria.schmidt@example.com', settore: 3670 }, // Vedo email vicino a 3670
  { campo: 'Checkbox Pflegegrad 1 (X)', settore: 4130 },
  { campo: 'Checkbox Pflegegrad 2 (X)', settore: 4140 },
  { campo: 'Checkbox Pflegegrad 3 (X)', settore: 4150 },
  { campo: 'Checkbox Pflegegrad 4 (X)', settore: 4260 },
  { campo: 'Checkbox Pflegegrad 5 (X)', settore: 4270 },
  { campo: 'Checkbox gesetzlich (X)', settore: 4370 },  // Vedo X vicino a 4370
  { campo: 'Checkbox privat (X)', settore: 4400 },
  { campo: 'Checkbox beihilfeberechtigt (X)', settore: 4530 },
  { campo: 'Checkbox Ortsamt (X)', settore: 4970 },     // Vedo X e "über Ortsamt" vicino a 4970
  { campo: 'Ortsamt text: sozialamt', settore: 5020 }   // Vedo "sozialamt" vicino a 5020
];

const section2 = [
  // Screenshot 1
  { campo: 'Checkbox Frau (X)', settore: 6020 },  // Sezione 2, vedo settore 6020
  { campo: 'Checkbox Herr (X)', settore: 6080 },
  { campo: 'Vorname: Thomas', settore: 6380 },    // Vedo "Thomas" vicino a 6380
  { campo: 'Name: Schmidt', settore: 6430 },      // Vedo "Schmidt" vicino a 6430
  { campo: 'Straße: Beispielweg 45', settore: 6860 },
  { campo: 'PLZ/Ort: 50667 Köln', settore: 6910 },
  { campo: 'Telefon: +49 221 98765432', settore: 7240 }, // Vedo telefono vicino a 7240
  { campo: 'E-Mail: thomas.schmidt@example.com', settore: 7260 },
  { campo: 'Checkbox Familienangehörige (X)', settore: 7690 },
  { campo: 'Checkbox Private Pflegeperson (X)', settore: 7720 },
  { campo: 'Checkbox Betreuer (X)', settore: 7960 }
];

const section3 = [
  // Screenshot 2
  { campo: 'Checkbox Bettschutzeinlagen (X)', settore: 9150 },
  { campo: 'Checkbox Fingerlinge (X)', settore: 9300 },
  { campo: 'Checkbox FFP2 Masken (X)', settore: 9450 },
  { campo: 'Checkbox Einmalhandschuhe (X)', settore: 9530 },
  { campo: 'Checkbox Mundschutz (X)', settore: 9640 },
  { campo: 'Checkbox Esslätzchen (X)', settore: 9800 },
  { campo: 'Checkbox Schutzschürzen einmal (X)', settore: 9850 },
  { campo: 'Checkbox Schutzschürzen wieder (X)', settore: 9920 },
  { campo: 'Checkbox Flächendesinfektionsmittel (X)', settore: 10120 },
  { campo: 'Checkbox Händedesinfektionsmittel (X)', settore: 10350 },
  { campo: 'Handschuhgröße S (X)', settore: 10830 },
  { campo: 'Handschuhgröße M (X)', settore: 10840 },
  { campo: 'Handschuhgröße L (X)', settore: 10850 },
  { campo: 'Handschuhgröße XL (X)', settore: 10860 },
  { campo: 'Handschuhmaterial Nitril (X)', settore: 10890 },
  { campo: 'Handschuhmaterial Vinyl (X)', settore: 10900 },
  { campo: 'Handschuhmaterial Latex (X)', settore: 10910 }
];

const section4 = [
  // Screenshot 2
  { campo: 'Checkbox Versicherte (X)', settore: 12610 },
  { campo: 'Checkbox Angehörige (X)', settore: 12680 }
];

const section5 = [
  // Screenshot 3
  { campo: 'Checkbox Versicherte (X)', settore: 14540 },
  { campo: 'Checkbox Angehörige (X)', settore: 14690 }
];

const section6 = [
  // Screenshot 3
  { campo: 'Checkbox AGB (X)', settore: 15280 },
  { campo: 'Checkbox Privacy (X)', settore: 15400 }
];

console.log('\n📋 SEZIONE 1: ANTRAGSTELLER\n');
section1.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

console.log('\n📋 SEZIONE 2: ANGEHÖRIGE\n');
section2.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

console.log('\n📋 SEZIONE 3: PFLEGEBOX\n');
section3.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

console.log('\n📋 SEZIONE 4: LIEFERADRESSE\n');
section4.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

console.log('\n📋 SEZIONE 5: RECHNUNGSEMPFÄNGER\n');
section5.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

console.log('\n📋 SEZIONE 6: AGB\n');
section6.forEach(item => {
  const coord = sectorToCoordinate(item.settore);
  console.log(`${item.campo}`);
  console.log(`  Settore: ${item.settore} → X=${coord.x}, Y=${coord.y}\n`);
});

// Salvo tutto
const finalCoordinates = {
  gridInfo: {
    precision: 'ULTRA_FINE_5x5',
    cellSize: '5x5 pixels',
    totalSectors: GRID.cols * GRID.rows
  },
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

fs.writeFileSync('./coordinate-ultra-fine.json', JSON.stringify(finalCoordinates, null, 2));

console.log('\n' + '='.repeat(70));
console.log('✅ COORDINATE ULTRA FINE ESTRATTE E SALVATE!');
console.log('='.repeat(70));
console.log('\n💾 File: coordinate-ultra-fine.json');
console.log('🎯 Precisione: 5x5 pixel (MASSIMA PRECISIONE!)');
console.log('\n📌 Prossimo step: Aggiorno il worker con queste coordinate!\n');
