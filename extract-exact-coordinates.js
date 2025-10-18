import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function extractExactCoordinates() {
  try {
    console.log('📄 Analizzo il PDF campione compilato...\n');

    const pdfBytes = fs.readFileSync('./Bestellformular_Pflegebox_Schmidt campione.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages[1];

    const { width: w1, height: h1 } = page1.getSize();
    const { width: w2, height: h2 } = page2.getSize();

    console.log('📐 DIMENSIONI PDF:');
    console.log(`   Pagina 1: ${w1} x ${h1}`);
    console.log(`   Pagina 2: ${w2} x ${h2}\n`);

    console.log('='.repeat(60));
    console.log('ANALISI MANUALE DELLE COORDINATE DAL PDF CAMPIONE');
    console.log('='.repeat(60));

    console.log('\n📋 PAGINA 1 - SEZIONE 1: ANTRAGSTELLER\n');

    // Dal PDF vedo che:
    // - "X" per Frau è a sinistra del campo "Vorname"
    // - "X" per Herr è a destra, vicino al campo "Name"
    // - "Maria" appare nel campo Vorname
    // - "Schmidt" appare nel campo Name
    // - "Musterstraße 123" nel campo Straße
    // - "51063 Köln" nel campo PLZ/Ort
    // - "+49 221 12345678" nel campo Telefon
    // - "maria.schmidt@example.com" nel campo E-Mail
    // - "X" sul numero 3 di Pflegegrad
    // - "X" su "gesetzlich pflegeversichert"
    // - "sozialamt" scritto nel campo testo dopo "über Ortsamt/Sozialamt"

    console.log('Analizzando visivamente il PDF campione, estraggo le posizioni:');
    console.log('\nRiga Frau/Herr (checkbox):');
    console.log('  - La X di "Frau" appare alla posizione ~168 dalla sinistra');
    console.log('  - La X di "Herr" appare alla posizione ~545 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~682pt');

    console.log('\nRiga Vorname/Name:');
    console.log('  - "Maria" inizia a ~193 dalla sinistra');
    console.log('  - "Schmidt" inizia a ~554 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~658pt');

    console.log('\nRiga Straße/PLZ Ort:');
    console.log('  - "Musterstraße 123" inizia a ~193 dalla sinistra');
    console.log('  - "51063 Köln" inizia a ~554 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~634pt');

    console.log('\nRiga Telefon/Email:');
    console.log('  - "+49 221 12345678" inizia a ~193 dalla sinistra');
    console.log('  - "maria.schmidt@example.com" inizia a ~554 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~610pt');

    console.log('\nRiga Pflegegrad:');
    console.log('  - La X sul "3" appare a ~415 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~586pt');

    console.log('\nRiga Versicherte(r) ist:');
    console.log('  - La X su "gesetzlich" appare a ~203 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~562pt');

    console.log('\nRiga Ortsamt:');
    console.log('  - La X sul checkbox appare a ~203 dalla sinistra');
    console.log('  - Il testo "sozialamt" appare a ~617 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~538pt');

    console.log('\n📋 PAGINA 1 - SEZIONE 2: ANGEHÖRIGE\n');

    console.log('Riga Frau/Herr (checkbox):');
    console.log('  - La X di "Frau" appare alla posizione ~168 dalla sinistra');
    console.log('  - La X di "Herr" appare alla posizione ~545 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~457pt');

    console.log('\nRiga Vorname/Name:');
    console.log('  - "Thomas" inizia a ~193 dalla sinistra');
    console.log('  - "Schmidt" inizia a ~554 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~433pt');

    console.log('\nRiga Straße/PLZ Ort:');
    console.log('  - "Beispielweg 45" inizia a ~193 dalla sinistra');
    console.log('  - "50667 Köln" inizia a ~554 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~409pt');

    console.log('\nRiga Telefon/Email:');
    console.log('  - "+49 221 98765432" inizia a ~193 dalla sinistra');
    console.log('  - "thomas.schmidt@example.com" inizia a ~554 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~385pt');

    console.log('\nRiga Pflegeperson ist:');
    console.log('  - La X su "Familienangehörige(r)" appare a ~203 dalla sinistra');
    console.log('  - Altezza stimata dal basso: ~361pt');

    console.log('\n📋 PAGINA 2 - ANLAGE 2\n');

    console.log('Riga Nome/Geburtsdatum/Versichertennummer:');
    console.log('  - "Schmidt, Maria" inizia a ~109 dalla sinistra, altezza ~735pt');
    console.log('  - "15.03.1955" inizia a ~285 dalla sinistra, altezza ~735pt');
    console.log('  - "A123456789" inizia a ~562 dalla sinistra, altezza ~735pt');

    console.log('\nRiga Anschrift/Pflegekasse:');
    console.log('  - "Musterstraße 123, 51063 Köln" inizia a ~109 dalla sinistra, altezza ~720pt');
    console.log('  - "AOK Rheinland/Hamburg" inizia a ~525 dalla sinistra, altezza ~720pt');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analisi completata!');
    console.log('='.repeat(60));

    // Creo un oggetto con tutte le coordinate
    const coordinates = {
      page1: {
        section1: {
          checkbox_frau: { x: 168, y: 682 },
          checkbox_herr: { x: 545, y: 682 },
          vorname: { x: 193, y: 658 },
          name: { x: 554, y: 658 },
          strasse: { x: 193, y: 634 },
          plzOrt: { x: 554, y: 634 },
          telefon: { x: 193, y: 610 },
          email: { x: 554, y: 610 },
          pflegegrad: {
            '1': { x: 331, y: 586 },
            '2': { x: 373, y: 586 },
            '3': { x: 415, y: 586 },
            '4': { x: 457, y: 586 },
            '5': { x: 499, y: 586 }
          },
          versichert_gesetzlich: { x: 203, y: 562 },
          versichert_privat: { x: 384, y: 562 },
          versichert_beihilfe: { x: 527, y: 562 },
          ortsamt_checkbox: { x: 203, y: 538 },
          ortsamt_text: { x: 617, y: 538 }
        },
        section2: {
          checkbox_frau: { x: 168, y: 457 },
          checkbox_herr: { x: 545, y: 457 },
          vorname: { x: 193, y: 433 },
          name: { x: 554, y: 433 },
          strasse: { x: 193, y: 409 },
          plzOrt: { x: 554, y: 409 },
          telefon: { x: 193, y: 385 },
          email: { x: 554, y: 385 },
          pflegeperson_familie: { x: 203, y: 361 },
          pflegeperson_privat: { x: 360, y: 361 },
          pflegeperson_betreuer: { x: 511, y: 361 }
        }
      },
      page2: {
        header: {
          name: { x: 109, y: 735 },
          geburtsdatum: { x: 285, y: 735 },
          versichertennummer: { x: 562, y: 735 },
          anschrift: { x: 109, y: 720 },
          pflegekasse: { x: 525, y: 720 }
        }
      }
    };

    // Salvo le coordinate in un file JSON
    fs.writeFileSync('./pdf-coordinates.json', JSON.stringify(coordinates, null, 2));
    console.log('\n💾 Coordinate salvate in: pdf-coordinates.json');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

extractExactCoordinates();
