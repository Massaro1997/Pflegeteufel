// Test Worker Endpoint
const WORKER_URL = 'https://shopify-backend.massarocalogero1997.workers.dev';
const WORKER_KEY = 'felix_backend_2025';

const testData = {
    versicherte: {
        anrede: "Herr",
        vorname: "Max",
        name: "Mustermann",
        strasse: "Musterstraße 123",
        plzOrt: "51063 Köln",
        telefon: "+49 221 1234567",
        email: "max.mustermann@example.com",
        geburtsdatum: "1950-05-15",
        versichertennummer: "M123456789",
        pflegegrad: "3",
        versicherteTyp: "gesetzlich",
        sozialamt: "",
        pflegekasse: "AOK Rheinland/Hamburg"
    },
    angehoerige: {
        isSamePerson: false,
        data: {
            anrede: "Frau",
            vorname: "Maria",
            name: "Mustermann",
            strasse: "Musterstraße 123",
            plzOrt: "51063 Köln",
            telefon: "+49 221 7654321",
            email: "maria.mustermann@example.com",
            typ: "Familie"
        }
    },
    pflegebox: {
        products: {
            bettschutzeinlagen: true,
            fingerlinge: false,
            ffp2: true,
            einmalhandschuhe: true,
            mundschutz: true,
            essslaetzchen: false,
            schutzschuerzenEinmal: false,
            schutzschuerzenWieder: false,
            flaechendesinfektion: true,
            flaechendesinfektionstuecher: false,
            haendedesinfektion: true
        },
        handschuhGroesse: "M",
        handschuhMaterial: "Nitril"
    },
    lieferung: {
        an: "versicherte"
    },
    rechnung: {
        an: "versicherte"
    },
    signatures: {
        versicherte: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    consents: {
        agb: true,
        privacy: true
    },
    timestamp: new Date().toISOString(),
    bestelldatum: new Date().toLocaleDateString('de-DE'),
    bestellzeit: new Date().toLocaleTimeString('de-DE')
};

async function testWorker() {
    console.log('🧪 Testing Worker endpoint...');
    console.log(`📍 URL: ${WORKER_URL}/api/pflegebox/submit`);
    console.log(`📧 Email will be sent to: pflegeteufelagentur@gmail.com`);
    console.log('');
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    console.log('');

    try {
        const response = await fetch(`${WORKER_URL}/api/pflegebox/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Worker-Key': WORKER_KEY
            },
            body: JSON.stringify(testData)
        });

        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        console.log('');

        const result = await response.json();
        console.log('📥 Response data:', JSON.stringify(result, null, 2));
        console.log('');

        if (response.ok) {
            console.log('✅ TEST PASSED - Worker is working correctly!');
        } else {
            console.log('❌ TEST FAILED - Worker returned error');
        }

    } catch (error) {
        console.error('❌ TEST FAILED - Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Test with angehoerige same as person
async function testWorkerSamePerson() {
    console.log('\n\n🧪 Testing Worker with SAME PERSON (angehoerige = versicherte)...');

    const testData2 = { ...testData };
    testData2.angehoerige = {
        isSamePerson: true,
        data: { ...testData.versicherte }
    };

    try {
        const response = await fetch(`${WORKER_URL}/api/pflegebox/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Worker-Key': WORKER_KEY
            },
            body: JSON.stringify(testData2)
        });

        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        const result = await response.json();
        console.log('📥 Response data:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('✅ TEST PASSED - Same person logic works!');
        } else {
            console.log('❌ TEST FAILED - Same person logic error');
        }

    } catch (error) {
        console.error('❌ TEST FAILED - Error:', error.message);
    }
}

// Run tests
(async () => {
    await testWorker();
    await testWorkerSamePerson();
})();
