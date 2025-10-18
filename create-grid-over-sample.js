import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createGridOverSample() {
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

    // Griglia molto fine: 10x10 pixel
    const gridSize = 10;
    const cellWidth = gridSize;
    const cellHeight = gridSize;

    console.log('🎯 Sovrappongo griglia sul PDF campione...\n');

    const numCols = Math.ceil(width / cellWidth);
    const numRows = Math.ceil(height / cellHeight);

    console.log(`   Colonne: ${numCols}`);
    console.log(`   Righe: ${numRows}`);
    console.log(`   Totale settori: ${numCols * numRows}\n`);

    // PAGINA 1: Disegno la griglia sopra il contenuto esistente
    let sectorNumber = 1;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * cellWidth;
        // Y parte dal basso, quindi inverto
        const y = height - (row + 1) * cellHeight;

        // Disegno il bordo del settore (grigio molto leggero)
        page1.drawRectangle({
          x: x,
          y: y,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 0.3,
          opacity: 0.4
        });

        // Scrivo il numero del settore solo ogni 5 settori
        if (sectorNumber % 5 === 0) {
          const sectorText = `${sectorNumber}`;
          const textWidth = font.widthOfTextAtSize(sectorText, 5);
          const textX = x + (cellWidth - textWidth) / 2;
          const textY = y + cellHeight / 2 - 2;

          page1.drawText(sectorText, {
            x: textX,
            y: textY,
            size: 5,
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
          borderColor: rgb(0.5, 0.5, 0.5),
          borderWidth: 0.3,
          opacity: 0.4
        });

        if (sectorNumber % 5 === 0) {
          const sectorText = `${sectorNumber}`;
          const textWidth = font.widthOfTextAtSize(sectorText, 5);
          const textX = x + (cellWidth - textWidth) / 2;
          const textY = y + cellHeight / 2 - 2;

          page2.drawText(sectorText, {
            x: textX,
            y: textY,
            size: 5,
            font: fontBold,
            color: rgb(1, 0, 0),
            opacity: 0.8
          });
        }

        sectorNumber++;
      }
    }

    console.log('✅ Griglia Pagina 2 creata!\n');

    // Salvo il PDF con griglia sovrapposta
    const gridPdfBytes = await pdfDoc.save();
    fs.writeFileSync('./PDF_CAMPIONE_CON_GRIGLIA.pdf', gridPdfBytes);

    console.log('='.repeat(70));
    console.log('✅ PDF CON GRIGLIA CREATO: PDF_CAMPIONE_CON_GRIGLIA.pdf');
    console.log('='.repeat(70));
    console.log('\n📋 COME USARLO:\n');
    console.log('1. Apri il PDF PDF_CAMPIONE_CON_GRIGLIA.pdf');
    console.log('2. Vedi il PDF già compilato con la griglia numerata sopra');
    console.log('3. Per ogni testo/campo compilato, leggi il numero del settore rosso');
    console.log('4. I numeri rossi appaiono ogni 5 settori (5, 10, 15, 20, 25...)');
    console.log('5. Usa i numeri per interpolare i settori intermedi\n');
    console.log('ESEMPIO:');
    console.log('   - Vedi "Maria" tra settore 1160 e 1165?');
    console.log('   - Puoi dire "Vorname Maria: settore 1162" (stima visiva)\n');
    console.log(`Griglia: ${numCols} colonne x ${numRows} righe = ${numCols * numRows} settori`);
    console.log(`Dimensione settore: ${cellWidth}x${cellHeight} pixel\n`);

    // Creo la mappa
    const gridMap = {
      info: {
        width: width,
        height: height,
        cellWidth: cellWidth,
        cellHeight: cellHeight,
        numCols: numCols,
        numRows: numRows,
        totalSectors: numCols * numRows
      },
      sectors: []
    };

    sectorNumber = 1;
    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * cellWidth;
        const y = height - (row + 1) * cellHeight;

        gridMap.sectors.push({
          sector: sectorNumber,
          col: col,
          row: row,
          x: x,
          y: y,
          centerX: x + cellWidth / 2,
          centerY: y + cellHeight / 2
        });

        sectorNumber++;
      }
    }

    fs.writeFileSync('./grid-map-sample.json', JSON.stringify(gridMap, null, 2));
    console.log('💾 Mappa settori salvata in: grid-map-sample.json\n');

    console.log('🎯 PROSSIMI PASSI:\n');
    console.log('1. Apri PDF_CAMPIONE_CON_GRIGLIA.pdf');
    console.log('2. Guarda dove appare "Maria" e leggi il settore vicino');
    console.log('3. Guarda dove appare "Schmidt" (cognome) e leggi il settore');
    console.log('4. Fai lo stesso per TUTTI i campi della LISTA_CAMPI_PDF.md');
    console.log('5. Dimmi i numeri settore e io calcolo le coordinate esatte!\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createGridOverSample();
