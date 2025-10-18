// Conversione settori con supporto DECIMALI
// Esempio: 1049,5 = metà tra 1049 e 1050

const pdfWidth = 595.28;
const pdfHeight = 841.89;
const gridSize = 10;
const numCols = 60;

function settoreToCoordinate(settore) {
  // Supporta sia interi che decimali
  const settoreNum = parseFloat(settore.toString().replace(',', '.'));

  const col = ((settoreNum - 1) % numCols);
  const row = Math.floor((settoreNum - 1) / numCols);

  const x = col * gridSize;
  const y = pdfHeight - (row + 1) * gridSize;

  return {
    settore: settore,
    x: parseFloat(x.toFixed(1)),
    y: parseFloat(y.toFixed(1))
  };
}

console.log('\n📍 TEST COORDINATE CON DECIMALI\n');

// Test con settori interi
console.log('Settore 1049 (intero):', settoreToCoordinate(1049));
console.log('Settore 1050 (intero):', settoreToCoordinate(1050));

// Test con settore decimale
console.log('\nSettore 1049,5 (decimale):', settoreToCoordinate('1049,5'));
console.log('   ↳ Dovrebbe essere a METÀ tra 1049 e 1050');

console.log('\nSettore 1049,25 (un quarto):', settoreToCoordinate('1049,25'));
console.log('Settore 1049,75 (tre quarti):', settoreToCoordinate('1049,75'));

console.log('\n\n✅ SÌ, posso usare i decimali!');
console.log('   Scrivi: 1049,5 oppure 1049.5');
console.log('   Significa: metà strada tra settore 1049 e 1050');
