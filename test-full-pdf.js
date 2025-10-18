// Script per testare PDF completamente compilato
// Email sempre inviata a: pflegeteufelagentur@gmail.com

const testData = {
  versicherte: {
    anrede: 'Frau',
    vorname: 'Maria',
    name: 'Müller',
    strasse: 'Hauptstraße 123',
    plzOrt: '10115 Berlin',
    telefon: '+49 30 12345678',
    email: 'maria.mueller@example.com',
    pflegegrad: '5',
    versicherteTyp: 'sozialamt',  // TEST SOZIALAMT
    sozialamtName: 'Sozialamt Berlin Mitte',
    pflegekasse: 'AOK Rheinland/Hamburg',
    versichertennummer: 'A123456789',
    geburtsdatum: '15.03.1965'
  },
  angehoerige: {
    isSamePerson: false,
    data: {
      anrede: 'Herr',
      vorname: 'Thomas',
      name: 'Schmidt',
      strasse: 'Berliner Str. 45',
      plzOrt: '10117 Berlin',
      telefon: '+49 30 98765432',
      email: 'thomas.schmidt@example.com',
      typ: 'Familie'  // Familie, Privat, o Betreuer
    }
  },
  pflegebox: {
    products: {
      bettschutzeinlagen: true,
      fingerlinge: true,
      ffp2: true,
      einmalhandschuhe: true,
      mundschutz: true,
      essslaetzchen: true,
      schutzschuerzenEinmal: true,
      schutzschuerzenWieder: true,
      flaechendesinfektion: true,
      flaechendesinfektionstuecher: true,
      haendedesinfektion: true
    },
    handschuhGroesse: 'M',
    handschuhMaterial: 'Nitril'
  },
  lieferung: {
    an: 'versicherte'  // versicherte o angehoerige
  },
  rechnung: {
    an: 'angehoerige'  // versicherte o angehoerige
  },
  signatures: {
    versicherte: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC'
  },
  bestelldatum: '2025-01-18',
  bestellzeit: '14:30'
};

async function sendTestPDF() {
  const WORKER_URL = 'https://shopify-backend.massarocalogero1997.workers.dev/api/pflegebox/submit';

  console.log('📤 Invio richiesta TEST completa al worker...');
  console.log('📧 Email sarà inviata a: pflegeteufelagentur@gmail.com');
  console.log('');

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Errore:', response.status);
    console.error(errorText);
    return;
  }

  const result = await response.json();
  console.log('✅ Risposta worker:', JSON.stringify(result, null, 2));
  console.log('');
  console.log('📧 Controlla pflegeteufelagentur@gmail.com per il PDF di test completo!');
}

sendTestPDF().catch(console.error);
