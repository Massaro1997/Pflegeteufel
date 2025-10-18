// 🎯 CONVERTITORE SETTORE → COORDINATE

// Configurazione griglia
const GRID = {
  cols: 60,      // colonne
  rows: 85,      // righe
  cellWidth: 10, // larghezza cella in pixel
  cellHeight: 10, // altezza cella in pixel
  pdfHeight: 841.89 // altezza PDF
};

function sectorToCoordinate(sector) {
  // Calcolo colonna e riga dal numero settore
  const col = (sector - 1) % GRID.cols;
  const row = Math.floor((sector - 1) / GRID.cols);

  // Calcolo coordinate X e Y
  const x = col * GRID.cellWidth;
  const y = GRID.pdfHeight - (row + 1) * GRID.cellHeight;

  return {
    sector: sector,
    col: col,
    row: row,
    x: Math.round(x),
    y: Math.round(y)
  };
}

// Se ricevi settore "tra 611 e 612" usa il punto medio
function sectorRangeToCoordinate(sector1, sector2) {
  const coord1 = sectorToCoordinate(sector1);
  const coord2 = sectorToCoordinate(sector2);

  return {
    sector: `${sector1}-${sector2}`,
    x: Math.round((coord1.x + coord2.x) / 2),
    y: Math.round((coord1.y + coord2.y) / 2)
  };
}

// ESEMPI CHE HAI DATO:
console.log('📋 ESEMPI DI CONVERSIONE:\n');

console.log('Esempio 1: X di Frau tra settore 611 e 612');
const frauCheckbox = sectorRangeToCoordinate(611, 612);
console.log(`  Settore medio tra 611-612:`);
console.log(`  ➡️  X=${frauCheckbox.x}, Y=${frauCheckbox.y}\n`);

console.log('Settore 611 da solo:');
console.log(sectorToCoordinate(611));
console.log('\nSettore 612 da solo:');
console.log(sectorToCoordinate(612));

console.log('\n' + '='.repeat(60));
console.log('🎯 DIMMI I SETTORI CHE VEDI E IO CALCOLO LE COORDINATE!');
console.log('='.repeat(60));

export { sectorToCoordinate, sectorRangeToCoordinate };
