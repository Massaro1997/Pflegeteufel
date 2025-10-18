import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createGridCoordinates() {
  try {
    console.log('📄 Carico il PDF template...\n');

    const pdfBytes = fs.readFileSync('./Bestellformular_Pflegebox_senza_Vollmacht.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];

    const { width, height } = page1.getSize();
    console.log(`📐 Dimensioni PDF: ${width.toFixed(2)} x ${height.toFixed(2)}\n`);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Creo una griglia come una scacchiera
    // Divido il PDF in settori di 10x10 pixel (molto più precisi!)
    const gridSize = 10;
    const cellWidth = gridSize;
    const cellHeight = gridSize;

    console.log('🎯 Creo griglia con settori numerati...\n');

    // Calcolo quante celle ci sono
    const numCols = Math.ceil(width / cellWidth);
    const numRows = Math.ceil(height / cellHeight);

    console.log(`   Colonne: ${numCols}`);
    console.log(`   Righe: ${numRows}`);
    console.log(`   Totale settori: ${numCols * numRows}\n`);

    // Pagina 1: Disegno la griglia
    let sectorNumber = 1;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        const x = col * cellWidth;
        // Y parte dal basso, quindi inverto
        const y = height - (row + 1) * cellHeight;

        // Disegno il bordo del settore (grigio chiaro)
        page1.drawRectangle({
          x: x,
          y: y,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
          opacity: 0.3
        });

        // Scrivo il numero del settore solo ogni 5 settori per non sovraffollare
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
            opacity: 0.7
          });
        }

        sectorNumber++;
      }
    }

    console.log('✅ Griglia Pagina 1 creata!\n');

    // Pagina 2: Stessa griglia
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
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
          opacity: 0.3
        });

        const sectorText = `${sectorNumber}`;
        const textWidth = font.widthOfTextAtSize(sectorText, 8);
        const textX = x + (cellWidth - textWidth) / 2;
        const textY = y + cellHeight / 2 - 3;

        // Scrivo il numero solo ogni 5 settori
        if (sectorNumber % 5 === 0) {
          page2.drawText(sectorText, {
            x: textX,
            y: textY,
            size: 5,
            font: fontBold,
            color: rgb(1, 0, 0),
            opacity: 0.7
          });
        }

        sectorNumber++;
      }
    }

    console.log('✅ Griglia Pagina 2 creata!\n');

    // Salvo il PDF
    const gridPdfBytes = await pdfDoc.save();
    fs.writeFileSync('./PDF_GRID_COORDINATES.pdf', gridPdfBytes);

    console.log('='.repeat(60));
    console.log('✅ PDF GRIGLIA CREATO: PDF_GRID_COORDINATES.pdf');
    console.log('='.repeat(60));
    console.log('\n📋 COME USARLO:\n');
    console.log('1. Apri il PDF PDF_GRID_COORDINATES.pdf');
    console.log('2. Ogni settore è numerato (es. 1, 2, 3...)');
    console.log('3. Sotto ogni numero vedi le coordinate (X,Y) del settore');
    console.log('4. Dimmi in quale SETTORE va ogni campo, esempio:');
    console.log('   - "Vorname va nel settore 45"');
    console.log('   - "Name va nel settore 52"');
    console.log('   - "Checkbox Frau va nel settore 38"');
    console.log('   ecc...\n');
    console.log(`5. Griglia: ${numCols} colonne x ${numRows} righe = ${numCols * numRows} settori totali`);
    console.log(`6. Dimensione settore: ${cellWidth}x${cellHeight} pixel\n`);

    // Creo anche una mappa di riferimento
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

    fs.writeFileSync('./grid-map.json', JSON.stringify(gridMap, null, 2));
    console.log('💾 Mappa settori salvata in: grid-map.json\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createGridCoordinates();
