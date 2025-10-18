// Script per creare griglia 10x10 pixel per PAGINA 3 del PDF
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createGridPage3() {
  // Carica il PDF template
  const existingPdfBytes = fs.readFileSync('Bestellformular_Pflegebox_senza_Vollmacht.pdf');
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();
  const page3 = pages[2]; // Pagina 3 (indice 2)

  if (!page3) {
    console.error('❌ Pagina 3 non trovata nel PDF!');
    return;
  }

  const { width, height } = page3.getSize();
  console.log(`📐 Dimensioni Pagina 3: ${width} x ${height}`);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Griglia 10x10 pixel
  const cellSize = 10;
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);

  console.log(`📊 Griglia: ${cols} colonne x ${rows} righe = ${cols * rows} settori`);

  // Disegna linee verticali (colonne)
  for (let col = 0; col <= cols; col++) {
    const x = col * cellSize;
    page3.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.2,
      color: rgb(1, 0, 1), // Fucsia
      opacity: 0.3
    });
  }

  // Disegna linee orizzontali (righe)
  for (let row = 0; row <= rows; row++) {
    const y = row * cellSize;
    page3.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.2,
      color: rgb(1, 0, 1), // Fucsia
      opacity: 0.3
    });
  }

  // Numera TUTTI i settori
  let settoreNum = 1;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cellSize + 1;
      const y = height - (row * cellSize) - 8;

      page3.drawText(String(settoreNum), {
        x,
        y,
        size: 6,
        font,
        color: rgb(1, 0, 1),
        opacity: 0.9
      });
      settoreNum++;
    }
  }

  // Salva il PDF con griglia
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('PDF_COORDINATE_GRID_PAGE3_10x10_FUCSIA.pdf', pdfBytes);

  console.log('✅ Griglia Pagina 3 creata: PDF_COORDINATE_GRID_PAGE3_10x10_FUCSIA.pdf');
  console.log(`📍 Usa questa griglia per identificare i settori dei campi nella Pagina 3`);
}

createGridPage3().catch(console.error);
