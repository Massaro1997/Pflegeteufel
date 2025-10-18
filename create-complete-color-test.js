import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function createCompleteColorTest() {
  try {
    console.log('📄 Carico il PDF template...');
    const existingPdfBytes = fs.readFileSync('./Bestellformular_Pflegebox_senza_Vollmacht.pdf');
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const { width, height } = page1.getSize();

    console.log(`📐 Dimensioni PDF: ${width} x ${height}`);

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Definiamo 4 variazioni di coordinate per ogni campo
    // ROSSO, BLU, VERDE, VIOLA
    const colorTests = [
      { label: 'R', color: rgb(1, 0, 0), yOffset: 0, xOffset: 0 },       // ROSSO - baseline
      { label: 'B', color: rgb(0, 0, 1), yOffset: -3, xOffset: 0 },     // BLU - 3px giù
      { label: 'V', color: rgb(0, 0.6, 0), yOffset: -6, xOffset: 0 },   // VERDE - 6px giù
      { label: 'P', color: rgb(0.6, 0, 0.6), yOffset: -9, xOffset: 0 }  // VIOLA - 9px giù
    ];

    // Dati di test
    const testData = {
      vorname: 'Maria',
      name: 'Schmidt',
      strasse: 'Musterstr. 123',
      plz: '51063',
      ort: 'Köln',
      telefon: '+49221123456',
      email: 'test@example.com'
    };

    console.log('\n🎨 Creo test colori per SEZIONE 1 (Antragsteller)...\n');

    // ========== SEZIONE 1: ANTRAGSTELLER ==========

    // Riga 1: Checkbox Frau/Herr (Y=741 baseline)
    console.log('Riga 1 - Checkbox Frau/Herr:');
    const checkboxY = 741;
    colorTests.forEach(test => {
      const y = checkboxY + test.yOffset;
      const x = 130 + test.xOffset;
      page1.drawText(`${test.label}`, {
        x,
        y,
        size: 10,
        font: helveticaBold,
        color: test.color
      });
      console.log(`  ${test.label}: X=${x}, Y=${y}`);
    });

    // Riga 2: Vorname / Name (Y=718 baseline)
    console.log('\nRiga 2 - Vorname / Name:');
    const vornameY = 718;
    const vornameX = 150;
    const nameX = 435;

    colorTests.forEach(test => {
      const y = vornameY + test.yOffset;

      // Vorname (sinistra)
      page1.drawText(`${testData.vorname}(${test.label})`, {
        x: vornameX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      // Name (destra)
      page1.drawText(`${testData.name}(${test.label})`, {
        x: nameX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      console.log(`  ${test.label}: Vorname X=${vornameX + test.xOffset}, Name X=${nameX + test.xOffset}, Y=${y}`);
    });

    // Riga 3: Straße / PLZ Ort (Y=695 baseline)
    console.log('\nRiga 3 - Straße / PLZ Ort:');
    const strasseY = 695;
    const strasseX = 150;
    const plzOrtX = 435;

    colorTests.forEach(test => {
      const y = strasseY + test.yOffset;

      // Straße (sinistra)
      page1.drawText(`${testData.strasse}(${test.label})`, {
        x: strasseX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      // PLZ Ort (destra)
      page1.drawText(`${testData.plz} ${testData.ort}(${test.label})`, {
        x: plzOrtX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      console.log(`  ${test.label}: Straße X=${strasseX + test.xOffset}, PLZ/Ort X=${plzOrtX + test.xOffset}, Y=${y}`);
    });

    // Riga 4: Telefon / Email (Y=672 baseline)
    console.log('\nRiga 4 - Telefon / Email:');
    const telefonY = 672;
    const telefonX = 150;
    const emailX = 435;

    colorTests.forEach(test => {
      const y = telefonY + test.yOffset;

      // Telefon (sinistra)
      page1.drawText(`${testData.telefon}(${test.label})`, {
        x: telefonX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      // Email (destra)
      page1.drawText(`${testData.email}(${test.label})`, {
        x: emailX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      console.log(`  ${test.label}: Telefon X=${telefonX + test.xOffset}, Email X=${emailX + test.xOffset}, Y=${y}`);
    });

    // Riga 5: Pflegegrad checkbox (Y=649 baseline)
    console.log('\nRiga 5 - Pflegegrad checkbox:');
    const pflegegradY = 649;
    const pflegegradPositions = {
      '1': 292,
      '2': 335,
      '3': 378,
      '4': 421,
      '5': 464
    };

    colorTests.forEach(test => {
      const y = pflegegradY + test.yOffset;
      const x = pflegegradPositions['3']; // Test con Pflegegrad 3

      page1.drawText(`${test.label}`, {
        x,
        y,
        size: 10,
        font: helveticaBold,
        color: test.color
      });

      console.log(`  ${test.label}: X=${x}, Y=${y}`);
    });

    // Riga 6: Versicherungstyp checkbox (Y=626 baseline)
    console.log('\nRiga 6 - Versicherungstyp checkbox (gesetzlich):');
    const versicherungY = 626;
    const versicherungX = 292;

    colorTests.forEach(test => {
      const y = versicherungY + test.yOffset;

      page1.drawText(`${test.label}`, {
        x: versicherungX,
        y,
        size: 10,
        font: helveticaBold,
        color: test.color
      });

      console.log(`  ${test.label}: X=${versicherungX}, Y=${y}`);
    });

    // Riga 7: Ortsamt checkbox (Y=603 baseline)
    console.log('\nRiga 7 - Ortsamt checkbox:');
    const ortsamtY = 603;
    const ortsamtX = 292;

    colorTests.forEach(test => {
      const y = ortsamtY + test.yOffset;

      page1.drawText(`${test.label}`, {
        x: ortsamtX,
        y,
        size: 10,
        font: helveticaBold,
        color: test.color
      });

      console.log(`  ${test.label}: X=${ortsamtX}, Y=${y}`);
    });

    console.log('\n🎨 Creo test colori per SEZIONE 2 (Angehörige)...\n');

    // ========== SEZIONE 2: ANGEHÖRIGE ==========

    // Riga 1: Checkbox Frau/Herr (Y=580 baseline)
    console.log('Sezione 2 - Riga 1 - Checkbox Frau/Herr:');
    const angehorigeCheckboxY = 580;
    colorTests.forEach(test => {
      const y = angehorigeCheckboxY + test.yOffset;
      const x = 130 + test.xOffset;
      page1.drawText(`${test.label}`, {
        x,
        y,
        size: 10,
        font: helveticaBold,
        color: test.color
      });
      console.log(`  ${test.label}: X=${x}, Y=${y}`);
    });

    // Riga 2: Vorname / Name (Y=557 baseline)
    console.log('\nSezione 2 - Riga 2 - Vorname / Name:');
    const angehorigeVornameY = 557;

    colorTests.forEach(test => {
      const y = angehorigeVornameY + test.yOffset;

      // Vorname (sinistra)
      page1.drawText(`Thomas(${test.label})`, {
        x: vornameX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      // Name (destra)
      page1.drawText(`Schmidt(${test.label})`, {
        x: nameX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      console.log(`  ${test.label}: Vorname X=${vornameX + test.xOffset}, Name X=${nameX + test.xOffset}, Y=${y}`);
    });

    // Riga 3: Straße / PLZ Ort (Y=534 baseline)
    console.log('\nSezione 2 - Riga 3 - Straße / PLZ Ort:');
    const angehorigeStrasseY = 534;

    colorTests.forEach(test => {
      const y = angehorigeStrasseY + test.yOffset;

      // Straße (sinistra)
      page1.drawText(`${testData.strasse}(${test.label})`, {
        x: strasseX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      // PLZ Ort (destra)
      page1.drawText(`${testData.plz} ${testData.ort}(${test.label})`, {
        x: plzOrtX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      console.log(`  ${test.label}: Straße X=${strasseX + test.xOffset}, PLZ/Ort X=${plzOrtX + test.xOffset}, Y=${y}`);
    });

    // Riga 4: Telefon / Email (Y=511 baseline)
    console.log('\nSezione 2 - Riga 4 - Telefon / Email:');
    const angehorigeTelefonY = 511;

    colorTests.forEach(test => {
      const y = angehorigeTelefonY + test.yOffset;

      // Telefon (sinistra)
      page1.drawText(`${testData.telefon}(${test.label})`, {
        x: telefonX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      // Email (destra)
      page1.drawText(`${testData.email}(${test.label})`, {
        x: emailX + test.xOffset,
        y,
        size: 10,
        font: helveticaFont,
        color: test.color
      });

      console.log(`  ${test.label}: Telefon X=${telefonX + test.xOffset}, Email X=${emailX + test.xOffset}, Y=${y}`);
    });

    // Riga 5: Pflegeperson ist checkbox (Y=488 baseline)
    console.log('\nSezione 2 - Riga 5 - Pflegeperson ist checkbox:');
    const pflegepersonY = 488;
    const pflegepersonX = 292;

    colorTests.forEach(test => {
      const y = pflegepersonY + test.yOffset;

      page1.drawText(`${test.label}`, {
        x: pflegepersonX,
        y,
        size: 10,
        font: helveticaBold,
        color: test.color
      });

      console.log(`  ${test.label}: X=${pflegepersonX}, Y=${y}`);
    });

    // Salva il PDF
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('./TEST_COMPLETE_COLOR_CALIBRATION.pdf', pdfBytes);

    console.log('\n✅ PDF test creato: TEST_COMPLETE_COLOR_CALIBRATION.pdf');
    console.log('\n📋 LEGENDA COLORI:');
    console.log('   R = ROSSO (baseline)');
    console.log('   B = BLU (-3px giù)');
    console.log('   V = VERDE (-6px giù)');
    console.log('   P = VIOLA (-9px giù)');
    console.log('\n📝 Per ogni campo, indica quale colore (R/B/V/P) è perfetto!');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

createCompleteColorTest();
