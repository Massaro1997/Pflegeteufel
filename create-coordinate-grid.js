// Crea PDF con griglia che mostra COORDINATE X,Y invece di settori
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createCoordinateGrid() {
  console.log('📐 Creazione griglia con coordinate X,Y...');

  // Carica il template
  const templatePath = 'Bestellformular_Pflegebox_Schmidt campione.pdf';
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  console.log(`📏 Dimensioni PDF: ${width} x ${height}`);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 6;

  // Griglia ogni 20 pixel per non sovraffollare
  const gridStep = 20;

  // Linee verticali con coordinate X
  for (let x = 0; x <= width; x += gridStep) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.5
    });

    // Scrivi coordinata X ogni 40 pixel
    if (x % 40 === 0) {
      page.drawText(`X:${Math.round(x)}`, {
        x: x + 2,
        y: height - 10,
        size: fontSize,
        font,
        color: rgb(1, 0, 0) // Rosso per X
      });

      page.drawText(`X:${Math.round(x)}`, {
        x: x + 2,
        y: 5,
        size: fontSize,
        font,
        color: rgb(1, 0, 0)
      });
    }
  }

  // Linee orizzontali con coordinate Y
  for (let y = 0; y <= height; y += gridStep) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.3,
      color: rgb(0.8, 0.8, 0.8),
      opacity: 0.5
    });

    // Scrivi coordinata Y ogni 40 pixel
    if (y % 40 === 0) {
      page.drawText(`Y:${Math.round(y)}`, {
        x: 2,
        y: y + 2,
        size: fontSize,
        font,
        color: rgb(0, 0, 1) // Blu per Y
      });

      page.drawText(`Y:${Math.round(y)}`, {
        x: width - 30,
        y: y + 2,
        size: fontSize,
        font,
        color: rgb(0, 0, 1)
      });
    }
  }

  // Aggiungi legenda
  page.drawRectangle({
    x: 10,
    y: height - 80,
    width: 150,
    height: 60,
    color: rgb(1, 1, 1),
    opacity: 0.9,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  page.drawText('GRIGLIA COORDINATE', {
    x: 15,
    y: height - 30,
    size: 8,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText('Linee ogni 20 pixel', {
    x: 15,
    y: height - 45,
    size: 7,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });

  page.drawText('X: Rosso (orizzontale)', {
    x: 15,
    y: height - 58,
    size: 7,
    font,
    color: rgb(1, 0, 0)
  });

  page.drawText('Y: Blu (verticale)', {
    x: 15,
    y: height - 71,
    size: 7,
    font,
    color: rgb(0, 0, 1)
  });

  // Salva
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('PDF_COORDINATE_GRID.pdf', pdfBytes);

  console.log('✅ PDF creato: PDF_COORDINATE_GRID.pdf');
  console.log('');
  console.log('📝 Come usarlo:');
  console.log('   1. Apri PDF_COORDINATE_GRID.pdf');
  console.log('   2. Trova il punto dove vuoi il testo/checkbox');
  console.log('   3. Leggi le coordinate X (rosso) e Y (blu) più vicine');
  console.log('   4. Scrivi: x: 120, y: 650 (esempio)');
  console.log('');
  console.log('   IMPORTANTE: Y parte dal BASSO (0 = fondo pagina, 841 = top)');
}

createCoordinateGrid().catch(console.error);
