// Script per estrarre il layout esatto del PDF e creare una mappa delle coordinate

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function extractPDFLayout() {
  try {
    console.log('🔍 Analisi layout PDF template...\n');

    const pdfPath = './Bestellformular_Pflegebox_senza_Vollmacht.pdf';
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const page1 = pages[0];

    // Ottieni dimensioni pagina
    const { width, height } = page1.getSize();
    console.log(`📐 Dimensioni Pagina 1: ${width}x${height} punti\n`);

    // Analizza le tabelle nel PDF
    // La tabella parte dall'alto e scende verso il basso
    // Nel sistema PDF: y=0 è in BASSO, y=height è in ALTO

    console.log('📋 COORDINATE CORRETTE PER PAGINA 1:\n');
    console.log('Sistema coordinate PDF: origine (0,0) = angolo BASSO-SINISTRA');
    console.log(`Altezza totale: ${height} punti`);
    console.log(`Larghezza totale: ${width} punti\n`);

    // Calcola posizioni dalla TOP della pagina
    // Formula: yPDF = height - yFromTop

    const topMargin = 150; // Margine dall'alto dove inizia la tabella 1
    const rowHeight = 23; // Altezza di ogni riga della tabella
    const colLeft = 185; // Colonna sinistra per i testi
    const colRight = 470; // Colonna destra per i testi

    console.log('='.repeat(80));
    console.log('SEZIONE 1 - ANTRAGSTELLER (Versicherte/r)');
    console.log('='.repeat(80));

    // Riga 1: Checkbox Frau/Herr
    const row1Y = height - topMargin - (rowHeight * 1);
    console.log(`\nRiga 1 - Checkbox Frau/Herr:`);
    console.log(`  Y dal basso: ${row1Y.toFixed(0)}`);
    console.log(`  Checkbox Frau: x=165, y=${row1Y.toFixed(0)}`);
    console.log(`  Checkbox Herr: x=540, y=${row1Y.toFixed(0)}`);

    // Riga 2: Vorname / Name
    const row2Y = height - topMargin - (rowHeight * 2);
    console.log(`\nRiga 2 - Vorname / Name:`);
    console.log(`  Y dal basso: ${row2Y.toFixed(0)}`);
    console.log(`  Vorname: x=${colLeft}, y=${row2Y.toFixed(0)}`);
    console.log(`  Name: x=${colRight}, y=${row2Y.toFixed(0)}`);

    // Riga 3: Straße / PLZ/Ort
    const row3Y = height - topMargin - (rowHeight * 3);
    console.log(`\nRiga 3 - Straße / PLZ/Ort:`);
    console.log(`  Y dal basso: ${row3Y.toFixed(0)}`);
    console.log(`  Straße: x=${colLeft}, y=${row3Y.toFixed(0)}`);
    console.log(`  PLZ/Ort: x=${colRight}, y=${row3Y.toFixed(0)}`);

    // Riga 4: Telefon / Email
    const row4Y = height - topMargin - (rowHeight * 4);
    console.log(`\nRiga 4 - Telefon / Email:`);
    console.log(`  Y dal basso: ${row4Y.toFixed(0)}`);
    console.log(`  Telefon: x=${colLeft}, y=${row4Y.toFixed(0)}`);
    console.log(`  Email: x=${colRight}, y=${row4Y.toFixed(0)}`);

    // Riga 5: Pflegegrad
    const row5Y = height - topMargin - (rowHeight * 5);
    console.log(`\nRiga 5 - Pflegegrad (checkbox):`);
    console.log(`  Y dal basso: ${row5Y.toFixed(0)}`);
    console.log(`  Checkbox 1: x=327, y=${row5Y.toFixed(0)}`);
    console.log(`  Checkbox 2: x=370, y=${row5Y.toFixed(0)}`);
    console.log(`  Checkbox 3: x=413, y=${row5Y.toFixed(0)}`);
    console.log(`  Checkbox 4: x=456, y=${row5Y.toFixed(0)}`);
    console.log(`  Checkbox 5: x=499, y=${row5Y.toFixed(0)}`);

    // Riga 6: Versicherungstyp
    const row6Y = height - topMargin - (rowHeight * 6);
    console.log(`\nRiga 6 - Versicherungstyp:`);
    console.log(`  Y dal basso: ${row6Y.toFixed(0)}`);
    console.log(`  Gesetzlich: x=200, y=${row6Y.toFixed(0)}`);
    console.log(`  Privat: x=372, y=${row6Y.toFixed(0)}`);
    console.log(`  Beihilfeberechtigt: x=514, y=${row6Y.toFixed(0)}`);

    console.log('\n' + '='.repeat(80));
    console.log('SEZIONE 2 - ANGEHÖRIGE/PFLEGEPERSON');
    console.log('='.repeat(80));

    const section2Top = topMargin + 180; // Distanza dall'alto per sezione 2

    const row2_1Y = height - section2Top - (rowHeight * 1);
    console.log(`\nRiga 1 - Checkbox Frau/Herr Angehörige:`);
    console.log(`  Y dal basso: ${row2_1Y.toFixed(0)}`);
    console.log(`  Checkbox Frau: x=165, y=${row2_1Y.toFixed(0)}`);
    console.log(`  Checkbox Herr: x=540, y=${row2_1Y.toFixed(0)}`);

    const row2_2Y = height - section2Top - (rowHeight * 2);
    console.log(`\nRiga 2 - Vorname / Name:`);
    console.log(`  Y dal basso: ${row2_2Y.toFixed(0)}`);
    console.log(`  Vorname: x=${colLeft}, y=${row2_2Y.toFixed(0)}`);
    console.log(`  Name: x=${colRight}, y=${row2_2Y.toFixed(0)}`);

    const row2_3Y = height - section2Top - (rowHeight * 3);
    console.log(`\nRiga 3 - Straße / PLZ/Ort:`);
    console.log(`  Y dal basso: ${row2_3Y.toFixed(0)}`);
    console.log(`  Straße: x=${colLeft}, y=${row2_3Y.toFixed(0)}`);
    console.log(`  PLZ/Ort: x=${colRight}, y=${row2_3Y.toFixed(0)}`);

    const row2_4Y = height - section2Top - (rowHeight * 4);
    console.log(`\nRiga 4 - Telefon / Email:`);
    console.log(`  Y dal basso: ${row2_4Y.toFixed(0)}`);
    console.log(`  Telefon: x=${colLeft}, y=${row2_4Y.toFixed(0)}`);
    console.log(`  Email: x=${colRight}, y=${row2_4Y.toFixed(0)}`);

    const row2_5Y = height - section2Top - (rowHeight * 5);
    console.log(`\nRiga 5 - Pflegeperson ist:`);
    console.log(`  Y dal basso: ${row2_5Y.toFixed(0)}`);
    console.log(`  Familienangehörige: x=215, y=${row2_5Y.toFixed(0)}`);
    console.log(`  Private: x=358, y=${row2_5Y.toFixed(0)}`);
    console.log(`  Betreuer: x=510, y=${row2_5Y.toFixed(0)}`);

    // Crea file JSON con le coordinate
    const coordinates = {
      pageHeight: height,
      pageWidth: width,
      section1: {
        row1: { y: row1Y, checkboxFrau: { x: 165 }, checkboxHerr: { x: 540 } },
        row2: { y: row2Y, vorname: { x: colLeft }, name: { x: colRight } },
        row3: { y: row3Y, strasse: { x: colLeft }, plzOrt: { x: colRight } },
        row4: { y: row4Y, telefon: { x: colLeft }, email: { x: colRight } },
        row5: { y: row5Y, pflegegrad: [327, 370, 413, 456, 499] },
        row6: { y: row6Y, versicherung: { gesetzlich: 200, privat: 372, beihilfe: 514 } }
      },
      section2: {
        row1: { y: row2_1Y, checkboxFrau: { x: 165 }, checkboxHerr: { x: 540 } },
        row2: { y: row2_2Y, vorname: { x: colLeft }, name: { x: colRight } },
        row3: { y: row2_3Y, strasse: { x: colLeft }, plzOrt: { x: colRight } },
        row4: { y: row2_4Y, telefon: { x: colLeft }, email: { x: colRight } },
        row5: { y: row2_5Y, pflegeperson: { familie: 215, private: 358, betreuer: 510 } }
      }
    };

    fs.writeFileSync('pdf-coordinates.json', JSON.stringify(coordinates, null, 2));
    console.log('\n✅ File creato: pdf-coordinates.json\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

extractPDFLayout();
