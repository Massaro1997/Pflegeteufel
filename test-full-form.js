// Test completo del formulario Pflegebox con TUTTI i campi compilati

const testData = {
  versicherte: {
    anrede: 'Frau',
    vorname: 'Maria',
    name: 'Schmidt',
    strasse: 'Musterstraße 123',
    plzOrt: '51063 Köln',
    telefon: '+49 221 12345678',
    email: 'maria.schmidt@example.com',
    geburtsdatum: '15.03.1955',
    versichertennummer: 'A123456789',
    pflegegrad: '3',
    pflegekasse: 'AOK Rheinland/Hamburg',
    versicherteTyp: 'gesetzlich'
  },
  angehoerige: {
    isSamePerson: false,
    data: {
      anrede: 'Herr',
      vorname: 'Thomas',
      name: 'Schmidt',
      strasse: 'Beispielweg 45',
      plzOrt: '50667 Köln',
      telefon: '+49 221 98765432',
      email: 'thomas.schmidt@example.com'
    },
    pflegepersonTyp: 'familienangehoeriger'
  },
  pflegebox: {
    products: {
      bettschutzeinlagen: true,
      fingerlinge: true,
      ffp2: true,
      einmalhandschuhe: true,
      mundschutz: true,
      essslaetzchen: true
    },
    handschuhGroesse: 'M',
    handschuhMaterial: 'Nitril'
  },
  lieferadresse: 'versicherte',
  rechnungsempfaenger: 'versicherte',
  signatures: {
    versicherte: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  },
  bestelldatum: new Date().toLocaleDateString('de-DE'),
  bestellzeit: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
  timestamp: new Date().toISOString()
};

async function testFullForm() {
  console.log('🧪 TEST COMPLETO - Form Pflegebox con tutti i campi compilati\n');
  console.log('📋 Dati del test:');
  console.log(`   Versicherte: ${testData.versicherte.vorname} ${testData.versicherte.name}`);
  console.log(`   Email: ${testData.versicherte.email}`);
  console.log(`   Pflegegrad: ${testData.versicherte.pflegegrad}`);
  console.log(`   Angehörige: ${testData.angehoerige.data.vorname} ${testData.angehoerige.data.name}`);
  console.log(`   Prodotti selezionati: ${Object.keys(testData.pflegebox.products).filter(k => testData.pflegebox.products[k]).length}`);
  console.log(`   Handschuhgröße: ${testData.pflegebox.handschuhGroesse}`);
  console.log(`   Handschuhmaterial: ${testData.pflegebox.handschuhMaterial}\n`);

  try {
    const response = await fetch('https://shopify-backend.massarocalogero1997.workers.dev/api/pflegebox/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('\n📊 RISULTATO TEST:');
    console.log('='.repeat(60));
    console.log(`Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Message: ${result.message || result.error || 'N/A'}`);

    if (result.data) {
      console.log('\n📦 Dati elaborati:');
      console.log(`   - Nome: ${result.data.versicherte?.name || 'N/A'}`);
      console.log(`   - Email: ${result.data.versicherte?.email || 'N/A'}`);
      console.log(`   - PDF generato: ${result.data.pdfGenerated ? '✅' : '❌'}`);
      console.log(`   - Template usato: ${result.data.usingTemplate ? '✅' : '❌'}`);
    }

    if (response.ok && result.success) {
      console.log('\n✅ TEST SUPERATO!');
      console.log('📧 Email inviata con PDF compilato a: pflegeteufelagentur@gmail.com');
      console.log('📄 Il PDF dovrebbe contenere:');
      console.log('   ✓ Tutti i dati del Versicherte (Pagina 1, Sezione 1)');
      console.log('   ✓ Tutti i dati dell\'Angehörige (Pagina 1, Sezione 2)');
      console.log('   ✓ Prodotti Pflegebox selezionati (Pagina 1, Sezione 3)');
      console.log('   ✓ Handschuhgröße e Material (Pagina 1, Sezione 3)');
      console.log('   ✓ Lieferadresse selezionata (Pagina 1, Sezione 4)');
      console.log('   ✓ Firma del Versicherte (Pagina 1, Sezione 6)');
      console.log('   ✓ Dati personali (Pagina 2 - Anlage 2)');
      console.log('   ✓ Prodotti selezionati (Pagina 2 - Tabella)');
      console.log('   ✓ Beratungsdokumentation (Pagina 3)');
      console.log('   ✓ Firma sulla Pagina 3');
    } else {
      console.log('\n❌ TEST FALLITO!');
      console.log('Errore:', result.error || 'Unknown error');
      if (result.stack) {
        console.log('\nStack trace:');
        console.log(result.stack);
      }
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERRORE durante il test:', error);
    console.error(error.stack);
  }
}

testFullForm();
