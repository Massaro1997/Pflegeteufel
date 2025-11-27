// Script per triggere l'aumento prezzi tramite Cloudflare Worker
// Richiede WORKER_SHARED_KEY come variabile d'ambiente

const WORKER_URL = 'https://shopify-backend.massarocalogero1997.workers.dev/api/admin/increase-prices';
const WORKER_KEY = process.env.WORKER_SHARED_KEY;
const PRICE_INCREASE = 1.00;

if (!WORKER_KEY) {
    console.error('❌ Errore: WORKER_SHARED_KEY non configurato');
    console.error('Esegui: set WORKER_SHARED_KEY=your_key');
    process.exit(1);
}

async function triggerPriceIncrease() {
    console.log('🚀 Triggering price increase...');
    console.log(`💰 Aumento: +${PRICE_INCREASE}€`);
    console.log('');

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Worker-Key': WORKER_KEY
            },
            body: JSON.stringify({
                increase: PRICE_INCREASE
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ Prezzi aggiornati con successo!');
            console.log('');
            console.log('📊 Riepilogo:');
            console.log(`   Prodotti: ${result.totalProducts}`);
            console.log(`   Varianti totali: ${result.totalVariants}`);
            console.log(`   Varianti aggiornate: ${result.updatedVariants}`);
            console.log(`   Aumento: ${result.priceIncrease}€`);
            console.log('');
            console.log('📋 Dettagli aggiornamenti:');
            result.updates.forEach(update => {
                console.log(`   • ${update.product} - ${update.variant}: ${update.oldPrice}€ → ${update.newPrice}€`);
            });
        } else {
            console.error('❌ Errore:', result.error || 'Errore sconosciuto');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Errore chiamata API:', error.message);
        process.exit(1);
    }
}

triggerPriceIncrease();
