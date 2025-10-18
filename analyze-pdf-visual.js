// Script per analizzare VISIVAMENTE il PDF e estrarre coordinate PRECISE
// guardando la struttura delle tabelle e delle righe

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function analyzePDFVisual() {
  try {
    console.log('🔍 ANALISI VISUALE PDF - Estrazione coordinate PRECISE\n');

    const pdfPath = './Bestellformular_Pflegebox_senza_Vollmacht.pdf';
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const page1 = pdfDoc.getPages()[0];
    const { width, height } = page1.getSize();

    console.log(`📐 Dimensioni Pagina: ${width.toFixed(2)}pt x ${height.toFixed(2)}pt\n`);
    console.log('Sistema coordinate: (0,0) = angolo BASSO-SINISTRA\n');
    console.log('='.repeat(80));

    // Strategia: guardando il PDF visivamente, annoto le posizioni REALI
    // basandomi sulle righe delle tabelle

    console.log('\n📋 METODO: Misurazione Visuale dalle Tabelle\n');

    // Il PDF ha delle tabelle con righe. Ogni riga ha circa 20-23pt di altezza.
    // La prima tabella (Antragsteller) inizia circa a 150pt dall'alto.

    const topMargin = 110; // Distanza dall'alto alla prima riga della tabella
    const rowHeight = 23;   // Altezza approssimativa di ogni riga

    // Calcolo Y partendo dall'ALTO della pagina
    function yFromTop(pixelsFromTop) {
      return height - pixelsFromTop;
    }

    console.log('📊 SEZIONE 1: ANTRAGSTELLER (Name der/des Antragstellers)\n');
    console.log('Posizione stimata: 110pt dall\'alto, altezza righe: 23pt\n');

    const section1Start = topMargin;

    // Riga "Frau/Herr" - è la prima riga della tabella
    const row1_checkbox_y = yFromTop(section1Start + 5);
    console.log(`Riga 1 - Checkbox Frau/Herr:`);
    console.log(`  Y stimata: ${row1_checkbox_y.toFixed(0)} (${section1Start + 5}pt dall'alto)`);
    console.log(`  X Frau checkbox: ~165`);
    console.log(`  X Herr checkbox: ~505\n`);

    // Riga "Vorname / Name"
    const row2_text_y = yFromTop(section1Start + rowHeight * 1 + 8);
    console.log(`Riga 2 - Vorname / Name:`);
    console.log(`  Y stimata: ${row2_text_y.toFixed(0)} (${(section1Start + rowHeight * 1 + 8).toFixed(0)}pt dall'alto)`);
    console.log(`  X Vorname: ~150`);
    console.log(`  X Name: ~435\n`);

    // Riga "Straße / PLZ/Ort"
    const row3_text_y = yFromTop(section1Start + rowHeight * 2 + 8);
    console.log(`Riga 3 - Straße / PLZ/Ort:`);
    console.log(`  Y stimata: ${row3_text_y.toFixed(0)} (${(section1Start + rowHeight * 2 + 8).toFixed(0)}pt dall'alto)`);
    console.log(`  X Straße: ~150`);
    console.log(`  X PLZ/Ort: ~435\n`);

    // Riga "Telefon / E-Mail"
    const row4_text_y = yFromTop(section1Start + rowHeight * 3 + 8);
    console.log(`Riga 4 - Telefon / E-Mail:`);
    console.log(`  Y stimata: ${row4_text_y.toFixed(0)} (${(section1Start + rowHeight * 3 + 8).toFixed(0)}pt dall'alto)`);
    console.log(`  X Telefon: ~150`);
    console.log(`  X E-Mail: ~435\n`);

    // Riga "Pflegegrad"
    const row5_checkbox_y = yFromTop(section1Start + rowHeight * 4 + 5);
    console.log(`Riga 5 - Pflegegrad (checkbox):`);
    console.log(`  Y stimata: ${row5_checkbox_y.toFixed(0)} (${(section1Start + rowHeight * 4 + 5).toFixed(0)}pt dall'alto)`);
    console.log(`  X checkbox 1: ~320, 2: ~363, 3: ~406, 4: ~449, 5: ~492\n`);

    // Riga "Versicherte(r) ist"
    const row6_checkbox_y = yFromTop(section1Start + rowHeight * 5 + 5);
    console.log(`Riga 6 - Versicherte(r) ist (checkbox):`);
    console.log(`  Y stimata: ${row6_checkbox_y.toFixed(0)} (${(section1Start + rowHeight * 5 + 5).toFixed(0)}pt dall'alto)`);
    console.log(`  X gesetzlich: ~200, privat: ~372, beihilfe: ~514\n`);

    console.log('='.repeat(80));
    console.log('\n📊 SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON\n');

    const section2Start = section1Start + (rowHeight * 7); // 7 righe dopo sezione 1

    const row2_1_y = yFromTop(section2Start + 5);
    console.log(`Riga 1 - Checkbox Frau/Herr:`);
    console.log(`  Y stimata: ${row2_1_y.toFixed(0)} (${(section2Start + 5).toFixed(0)}pt dall'alto)\n`);

    const row2_2_y = yFromTop(section2Start + rowHeight * 1 + 8);
    console.log(`Riga 2 - Vorname / Name:`);
    console.log(`  Y stimata: ${row2_2_y.toFixed(0)} (${(section2Start + rowHeight * 1 + 8).toFixed(0)}pt dall'alto)\n`);

    const row2_3_y = yFromTop(section2Start + rowHeight * 2 + 8);
    console.log(`Riga 3 - Straße / PLZ/Ort:`);
    console.log(`  Y stimata: ${row2_3_y.toFixed(0)} (${(section2Start + rowHeight * 2 + 8).toFixed(0)}pt dall'alto)\n`);

    const row2_4_y = yFromTop(section2Start + rowHeight * 3 + 8);
    console.log(`Riga 4 - Telefon / E-Mail:`);
    console.log(`  Y stimata: ${row2_4_y.toFixed(0)} (${(section2Start + rowHeight * 3 + 8).toFixed(0)}pt dall'alto)\n`);

    const row2_5_y = yFromTop(section2Start + rowHeight * 4 + 5);
    console.log(`Riga 5 - Pflegeperson ist:`);
    console.log(`  Y stimata: ${row2_5_y.toFixed(0)} (${(section2Start + rowHeight * 4 + 5).toFixed(0)}pt dall'alto)\n`);

    console.log('='.repeat(80));
    console.log('\n💡 SUGGERIMENTO:\n');
    console.log('Il metodo migliore è creare un PDF di TEST con coordinate VISIBILI');
    console.log('per calibrare esattamente dove posizionare i testi.');
    console.log('\nVuoi che crei un PDF di TEST con griglie e coordinate?');
    console.log('Questo ti permetterà di vedere ESATTAMENTE dove vanno i testi!\n');

    // Salva coordinate stimate
    const estimatedCoords = {
      pageHeight: height,
      pageWidth: width,
      topMargin: topMargin,
      rowHeight: rowHeight,
      section1: {
        start: section1Start,
        rows: {
          1: { y: row1_checkbox_y, type: 'checkbox' },
          2: { y: row2_text_y, type: 'text' },
          3: { y: row3_text_y, type: 'text' },
          4: { y: row4_text_y, type: 'text' },
          5: { y: row5_checkbox_y, type: 'checkbox' },
          6: { y: row6_checkbox_y, type: 'checkbox' }
        }
      },
      section2: {
        start: section2Start,
        rows: {
          1: { y: row2_1_y, type: 'checkbox' },
          2: { y: row2_2_y, type: 'text' },
          3: { y: row2_3_y, type: 'text' },
          4: { y: row2_4_y, type: 'text' },
          5: { y: row2_5_y, type: 'checkbox' }
        }
      }
    };

    fs.writeFileSync('estimated-coordinates.json', JSON.stringify(estimatedCoords, null, 2));
    console.log('✅ File salvato: estimated-coordinates.json\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

analyzePDFVisual();
