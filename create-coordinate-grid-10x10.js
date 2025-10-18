// Crea PDF con griglia 10x10 e coordinate FUCSIA in ogni casella
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createCoordinateGrid10x10() {
  console.log('📐 Creazione griglia 10x10 con coordinate FUCSIA...');

  // Carica il template
  const templatePath = 'Bestellformular_Pflegebox_Schmidt campione.pdf';
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  console.log(`📏 Dimensioni PDF: ${width} x ${height}`);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 5;

  // GRIGLIA 10x10 PIXEL
  const gridSize = 10;

  // FUCSIA ACCESO
  const fuchsia = rgb(1, 0, 1); // Magenta/Fucsia pieno

  // Disegna griglia
  for (let x = 0; x <= width; x += gridSize) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.2,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.3
    });
  }

  for (let y = 0; y <= height; y += gridSize) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.2,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.3
    });
  }

  // Scrivi coordinate X,Y in OGNI CASELLA 10x10
  console.log('✍️ Scrivo coordinate in ogni casella...');

  let count = 0;
  for (let x = 0; x <= width; x += gridSize) {
    for (let y = 0; y <= height; y += gridSize) {
      // Coordinate al centro della casella
      const centerX = x + gridSize / 2 - 8;
      const centerY = y + gridSize / 2 - 2;

      // Scrivi X,Y in FUCSIA ACCESO
      const coordText = `${Math.round(x)},${Math.round(y)}`;

      page.drawText(coordText, {
        x: centerX,
        y: centerY,
        size: fontSize,
        font,
        color: fuchsia, // FUCSIA ACCESO!
        opacity: 1
      });

      count++;
    }
  }

  console.log(`✅ Scritte ${count} coordinate in fucsia`);

  // Aggiungi legenda grande e visibile
  page.drawRectangle({
    x: 10,
    y: height - 100,
    width: 180,
    height: 85,
    color: rgb(1, 1, 1),
    opacity: 0.95,
    borderColor: fuchsia,
    borderWidth: 2
  });

  page.drawText('GRIGLIA COORDINATE 10x10', {
    x: 20,
    y: height - 30,
    size: 10,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText('Coordinate in FUCSIA:', {
    x: 20,
    y: height - 48,
    size: 8,
    font,
    color: fuchsia
  });

  page.drawText('Formato: X,Y', {
    x: 20,
    y: height - 62,
    size: 8,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText('X = orizzontale (da sinistra)', {
    x: 20,
    y: height - 76,
    size: 7,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText('Y = verticale (dal BASSO)', {
    x: 20,
    y: height - 89,
    size: 7,
    font,
    color: rgb(0, 0, 0)
  });

  // Salva
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('PDF_COORDINATE_GRID_10x10_FUCSIA.pdf', pdfBytes);

  console.log('✅ PDF creato: PDF_COORDINATE_GRID_10x10_FUCSIA.pdf');
  console.log('');
  console.log('📸 ORA:');
  console.log('   1. Apri PDF_COORDINATE_GRID_10x10_FUCSIA.pdf');
  console.log('   2. Fai SCREENSHOT delle sezioni che ti interessano');
  console.log('   3. Mandami gli screenshot');
  console.log('   4. Leggerò io stesso le coordinate FUCSIA!');
  console.log('');
  console.log('   Ogni casella 10x10 ha le sue coordinate X,Y in fucsia');
}

createCoordinateGrid10x10().catch(console.error);
