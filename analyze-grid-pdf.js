import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function analyzeGridPDF() {
  try {
    console.log('📄 Analizzo il PDF campione con griglia...\n');

    // Carico il PDF campione originale (senza griglia) per analizzare il contenuto
    const pdfBytes = fs.readFileSync('./Bestellformular_Pflegebox_Schmidt campione.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Carico anche la mappa dei settori
    const gridMap = JSON.parse(fs.readFileSync('./grid-map-sample.json', 'utf8'));

    console.log('📊 INFO GRIGLIA:');
    console.log(`   Dimensioni PDF: ${gridMap.info.width.toFixed(2)} x ${gridMap.info.height.toFixed(2)}`);
    console.log(`   Settori: ${gridMap.info.numCols} colonne x ${gridMap.info.numRows} righe`);
    console.log(`   Totale: ${gridMap.info.totalSectors} settori`);
    console.log(`   Dimensione cella: ${gridMap.info.cellWidth}x${gridMap.info.cellHeight} px\n`);

    // Funzione per trovare il settore da coordinate X,Y
    function findSector(x, y) {
      const col = Math.floor(x / gridMap.info.cellWidth);
      const row = Math.floor((gridMap.info.height - y) / gridMap.info.cellHeight);
      const sectorNumber = row * gridMap.info.numCols + col + 1;

      return {
        sector: sectorNumber,
        col: col,
        row: row,
        x: col * gridMap.info.cellWidth,
        y: gridMap.info.height - (row + 1) * gridMap.info.cellHeight
      };
    }

    console.log('='.repeat(70));
    console.log('🎯 ANALISI COORDINATE DAL PDF CAMPIONE');
    console.log('='.repeat(70));
    console.log('\n📋 PAGINA 1 - SEZIONE 1: ANTRAGSTELLER\n');

    // Dati noti dal PDF campione che ho visto
    const page1Data = {
      section1: [
        { field: 'Checkbox Frau (X)', x: 168, y: 682 },
        { field: 'Vorname: Maria', x: 193, y: 658 },
        { field: 'Name: Schmidt', x: 554, y: 658 },
        { field: 'Straße: Musterstraße 123', x: 193, y: 634 },
        { field: 'PLZ/Ort: 51063 Köln', x: 554, y: 634 },
        { field: 'Telefon: +49 221 12345678', x: 193, y: 610 },
        { field: 'E-Mail: maria.schmidt@example.com', x: 554, y: 610 },
        { field: 'Checkbox Pflegegrad 3 (X)', x: 415, y: 586 },
        { field: 'Checkbox gesetzlich (X)', x: 203, y: 562 },
        { field: 'Checkbox Ortsamt (X)', x: 203, y: 538 },
        { field: 'Ortsamt text: sozialamt', x: 617, y: 538 }
      ],
      section2: [
        { field: 'Checkbox Frau (X)', x: 168, y: 457 },
        { field: 'Vorname: Thomas', x: 193, y: 433 },
        { field: 'Name: Schmidt', x: 554, y: 433 },
        { field: 'Straße: Beispielweg 45', x: 193, y: 409 },
        { field: 'PLZ/Ort: 50667 Köln', x: 554, y: 409 },
        { field: 'Telefon: +49 221 98765432', x: 193, y: 385 },
        { field: 'E-Mail: thomas.schmidt@example.com', x: 554, y: 385 },
        { field: 'Checkbox Familienangehörige (X)', x: 203, y: 361 }
      ]
    };

    // Analizzo Sezione 1
    console.log('SEZIONE 1: ANTRAGSTELLER (Versicherte/r)\n');
    console.log('-'.repeat(70));
    page1Data.section1.forEach(item => {
      const sector = findSector(item.x, item.y);
      console.log(`Campo: ${item.field}`);
      console.log(`  Coordinate: X=${item.x}, Y=${item.y}`);
      console.log(`  ➡️  SETTORE: ${sector.sector}`);
      console.log(`  (Colonna ${sector.col}, Riga ${sector.row})`);
      console.log('');
    });

    console.log('\n📋 PAGINA 1 - SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON\n');
    console.log('-'.repeat(70));
    page1Data.section2.forEach(item => {
      const sector = findSector(item.x, item.y);
      console.log(`Campo: ${item.field}`);
      console.log(`  Coordinate: X=${item.x}, Y=${item.y}`);
      console.log(`  ➡️  SETTORE: ${sector.sector}`);
      console.log(`  (Colonna ${sector.col}, Riga ${sector.row})`);
      console.log('');
    });

    // Pagina 2
    const page2Data = [
      { field: 'Name, Vorname: Schmidt, Maria', x: 109, y: 735 },
      { field: 'Geburtsdatum: 15.03.1955', x: 285, y: 735 },
      { field: 'Versichertennummer: A123456789', x: 562, y: 735 },
      { field: 'Anschrift: Musterstraße 123, 51063 Köln', x: 109, y: 720 },
      { field: 'Pflegekasse: AOK Rheinland/Hamburg', x: 525, y: 720 }
    ];

    console.log('\n📋 PAGINA 2: ANLAGE 2 - HEADER\n');
    console.log('-'.repeat(70));
    page2Data.forEach(item => {
      const sector = findSector(item.x, item.y);
      console.log(`Campo: ${item.field}`);
      console.log(`  Coordinate: X=${item.x}, Y=${item.y}`);
      console.log(`  ➡️  SETTORE: ${sector.sector}`);
      console.log(`  (Colonna ${sector.col}, Riga ${sector.row})`);
      console.log('');
    });

    // Creo un file di riepilogo
    const summary = {
      page1: {
        section1: page1Data.section1.map(item => ({
          field: item.field,
          coordinates: { x: item.x, y: item.y },
          sector: findSector(item.x, item.y).sector
        })),
        section2: page1Data.section2.map(item => ({
          field: item.field,
          coordinates: { x: item.x, y: item.y },
          sector: findSector(item.x, item.y).sector
        }))
      },
      page2: {
        header: page2Data.map(item => ({
          field: item.field,
          coordinates: { x: item.x, y: item.y },
          sector: findSector(item.x, item.y).sector
        }))
      }
    };

    fs.writeFileSync('./coordinate-to-sector-mapping.json', JSON.stringify(summary, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('✅ ANALISI COMPLETATA!');
    console.log('='.repeat(70));
    console.log('\n💾 File salvati:');
    console.log('   - coordinate-to-sector-mapping.json (mappatura completa)\n');

    console.log('🎯 PROSSIMO PASSO:');
    console.log('   Ora so esattamente quale SETTORE corrisponde a quale COORDINATE!');
    console.log('   Posso usare questi settori per creare il mapping finale!\n');

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

analyzeGridPDF();
