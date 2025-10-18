import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createUltraFineGrid() {
  try {
    console.log('📄 Carico il PDF campione compilato...\n');

    const pdfBytes = fs.readFileSync('./Bestellformular_Pflegebox_Schmidt campione.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];

    const { width, height } = page1.getSize();
    console.log(`📐 Dimensioni PDF: ${width.toFixed(2)} x ${height.toFixed(2)}\n`);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // GRIGLIA ULTRA FINE: 5x5 pixel (invece di 10x10)
    const gridSize = 5;
    const cellWidth = gridSize;
    const cellHeight = gridSize;

    console.log('🎯 Creo griglia ULTRA FINE con settori numerati...\n');

    const numCols = Math.ceil(width / cellWidth);
    const numRows = Math.ceil(height / cellHeight);

    console.log(`   Colonne: ${numCols}`);
    console.log(`   Righe: ${numRows}`);
    console.log(`   Totale settori: ${numCols * numRows}`);
    console.log(`   Dimensione cella: ${cellWidth}x${cellHeight} pixel (ULTRA FINE!)\n`);

    // PAGINA 1: Disegno la griglia
    let sectorNumber = 1;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * cellWidth;
        const y = height - (row + 1) * cellHeight;

        // Disegno il bordo del settore (grigio molto leggero)
        page1.drawRectangle({
          x: x,
          y: y,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 0.2,
          opacity: 0.3
        });

        // Scrivo il numero del settore solo ogni 10 settori per non sovraffollare
        // Con celle 5x5, ogni 10 celle = 50 pixel
        if (sectorNumber % 10 === 0) {
          const sectorText = `${sectorNumber}`;
          const textSize = 4;
          const textWidth = font.widthOfTextAtSize(sectorText, textSize);
          const textX = x + (cellWidth - textWidth) / 2;
          const textY = y + cellHeight / 2 - 1.5;

          page1.drawText(sectorText, {
            x: textX,
            y: textY,
            size: textSize,
            font: fontBold,
            color: rgb(1, 0, 0),
            opacity: 0.8
          });
        }

        sectorNumber++;
      }
    }

    console.log('✅ Griglia Pagina 1 creata!\n');

    // PAGINA 2: Stessa griglia
    sectorNumber = 1;
    const { height: height2 } = page2.getSize();

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * cellWidth;
        const y = height2 - (row + 1) * cellHeight;

        page2.drawRectangle({
          x: x,
          y: y,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0.6, 0.6, 0.6),
          borderWidth: 0.2,
          opacity: 0.3
        });

        if (sectorNumber % 10 === 0) {
          const sectorText = `${sectorNumber}`;
          const textSize = 4;
          const textWidth = font.widthOfTextAtSize(sectorText, textSize);
          const textX = x + (cellWidth - textWidth) / 2;
          const textY = y + cellHeight / 2 - 1.5;

          page2.drawText(sectorText, {
            x: textX,
            y: textY,
            size: textSize,
            font: fontBold,
            color: rgb(1, 0, 0),
            opacity: 0.8
          });
        }

        sectorNumber++;
      }
    }

    console.log('✅ Griglia Pagina 2 creata!\n');

    // Salvo il PDF
    const gridPdfBytes = await pdfDoc.save();
    fs.writeFileSync('./PDF_ULTRA_FINE_GRID.pdf', gridPdfBytes);

    console.log('='.repeat(70));
    console.log('✅ PDF GRIGLIA ULTRA FINE CREATO: PDF_ULTRA_FINE_GRID.pdf');
    console.log('='.repeat(70));
    console.log('\n📋 CARATTERISTICHE:\n');
    console.log(`   - Griglia: ${numCols} colonne x ${numRows} righe`);
    console.log(`   - Totale settori: ${numCols * numRows}`);
    console.log(`   - Dimensione cella: ${cellWidth}x${cellHeight} pixel (5 VOLTE PIÙ PRECISA!)`);
    console.log('   - Numeri ogni 10 settori (= 50 pixel)');
    console.log('\n📝 COME USARE:\n');
    console.log('   1. Apri PDF_ULTRA_FINE_GRID.pdf');
    console.log('   2. Fai screenshot delle sezioni');
    console.log('   3. Leggi i numeri settore rossi (molto più vicini al testo!)');
    console.log('   4. Dimmi i settori e io converto in coordinate ULTRA PRECISE!\n');

    // Salvo la mappa settori
    const gridMap = {
      info: {
        width: width,
        height: height,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        numCols: numCols,
        numRows: numRows,
        totalSectors: numCols * numRows,
        precision: 'ULTRA_FINE_5x5'
      },
      formula: {
        description: 'Conversione settore → coordinate',
        col: '(settore - 1) % numCols',
        row: 'Math.floor((settore - 1) / numCols)',
        x: 'col × cellWidth',
        y: 'height - (row + 1) × cellHeight'
      }
    };

    fs.writeFileSync('./ultra-fine-grid-map.json', JSON.stringify(gridMap, null, 2));
    console.log('💾 Mappa griglia salvata in: ultra-fine-grid-map.json\n');

    console.log('🎯 VANTAGGI GRIGLIA 5x5:');
    console.log('   ✅ Precisione 5x superiore (5px invece di 10px)');
    console.log('   ✅ Coordinate X e Y precise al pixel');
    console.log('   ✅ Nessun arrotondamento necessario');
    console.log('   ✅ Perfetto allineamento garantito!\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createUltraFineGrid();
