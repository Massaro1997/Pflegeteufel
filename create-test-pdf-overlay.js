// Crea un PDF di TEST con il template + overlay di coordinate e testi di prova
// Questo permette di vedere ESATTAMENTE dove posizionare ogni campo

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createTestPDFOverlay() {
  try {
    console.log('🎨 Creazione PDF di TEST con overlay coordinate...\n');

    // Carica il template originale
    const templateBytes = fs.readFileSync('./Bestellformular_Pflegebox_senza_Vollmacht.pdf');
    const pdfDoc = await PDFDocument.load(templateBytes);

    const page1 = pdfDoc.getPages()[0];
    const { width, height } = page1.getSize();

    // Font per scrivere
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    console.log(`📐 Dimensioni: ${width.toFixed(0)}x${height.toFixed(0)}pt\n`);

    // Dati di test
    const testData = {
      vorname: 'Maria',
      name: 'Schmidt',
      strasse: 'Musterstraße 123',
      plzOrt: '51063 Köln',
      telefon: '+49 221 12345678',
      email: 'maria.schmidt@example.com'
    };

    // Provo diverse coordinate Y per vedere quale funziona
    const testYPositions = [727, 720, 710, 700];
    const testXPositions = [150, 160, 170];

    console.log('📝 Scrivendo testi di test a diverse coordinate...\n');

    // Testo di riferimento con coordinate visibili
    testYPositions.forEach((y, index) => {
      const color = index === 0 ? rgb(1, 0, 0) : // Rosso per la prima
                    index === 1 ? rgb(0, 0, 1) : // Blu per la seconda
                    index === 2 ? rgb(0, 0.5, 0) : // Verde per la terza
                    rgb(0.5, 0, 0.5); // Viola per la quarta

      page1.drawText(`TEST_Y=${y}`, {
        x: 50,
        y: y,
        size: 8,
        font: font,
        color: color
      });
    });

    // Scrivo il nome "Maria" a diverse Y per confronto
    console.log('Testando posizioni Y per campo "Vorname":\n');

    const vornameTests = [
      { y: 727, label: 'Y=727', color: rgb(1, 0, 0) },
      { y: 720, label: 'Y=720', color: rgb(0, 0, 1) },
      { y: 710, label: 'Y=710', color: rgb(0, 0.5, 0) },
      { y: 701, label: 'Y=701', color: rgb(0.5, 0, 0.5) }
    ];

    vornameTests.forEach((test) => {
      page1.drawText(testData.vorname, {
        x: 150,
        y: test.y,
        size: 10,
        font: font,
        color: test.color
      });
      console.log(`  ${test.label} - Colore: ${test.color === rgb(1,0,0) ? 'ROSSO' : test.color === rgb(0,0,1) ? 'BLU' : test.color === rgb(0,0.5,0) ? 'VERDE' : 'VIOLA'}`);
    });

    // Scrivo il cognome "Schmidt" a diverse Y
    console.log('\nTestando posizioni Y per campo "Name":\n');

    vornameTests.forEach((test) => {
      page1.drawText(testData.name, {
        x: 435,
        y: test.y,
        size: 10,
        font: font,
        color: test.color
      });
    });

    // Aggiungo griglia di riferimento (ogni 50pt)
    console.log('\n📏 Aggiungendo griglia di riferimento...\n');

    for (let y = 0; y < height; y += 50) {
      page1.drawText(`${y}`, {
        x: 10,
        y: y,
        size: 6,
        font: font,
        color: rgb(0.7, 0.7, 0.7)
      });
    }

    // Salva il PDF di test
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('TEST_PDF_OVERLAY.pdf', pdfBytes);

    console.log('✅ PDF di TEST creato: TEST_PDF_OVERLAY.pdf\n');
    console.log('📋 ISTRUZIONI:\n');
    console.log('1. Apri il file TEST_PDF_OVERLAY.pdf');
    console.log('2. Guarda dove sono posizionati i testi "Maria" e "Schmidt"');
    console.log('3. Confronta con i campi originali del template');
    console.log('4. Il colore che si allinea meglio ti dice la Y corretta:');
    console.log('   - ROSSO = Y:727');
    console.log('   - BLU = Y:720');
    console.log('   - VERDE = Y:710');
    console.log('   - VIOLA = Y:701');
    console.log('\n5. Dimmi quale colore si allinea PERFETTAMENTE!\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createTestPDFOverlay();
