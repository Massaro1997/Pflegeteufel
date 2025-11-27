// Test script per inviare email ordine di test
const WORKER_URL = 'https://shopify-backend.massarocalogero1997.workers.dev/api/shopify/webhooks/orders/create';

// Ordine di test simulato
const testOrder = {
  id: 9999999999,
  order_number: 1001,
  created_at: new Date().toISOString(),
  customer: {
    id: 888888888,
    email: 'veddaalessandra@gmail.com',
    first_name: 'Alessandra',
    last_name: 'Vedda',
    phone: '+49 123 456789'
  },
  line_items: [
    {
      id: 111111111,
      name: 'Pflegebox Standard',
      quantity: 1,
      price: '40.00'
    },
    {
      id: 222222222,
      name: 'Einmalhandschuhe Nitril (Größe M)',
      quantity: 2,
      price: '15.00'
    }
  ],
  subtotal_price: '70.00',
  total_tax: '13.30',
  total_price: '83.30',
  total_shipping_price_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'EUR'
    }
  },
  shipping_address: {
    first_name: 'Alessandra',
    last_name: 'Vedda',
    address1: 'Teststraße 123',
    address2: '',
    city: 'Berlin',
    zip: '10115',
    country: 'Deutschland',
    country_code: 'DE'
  }
};

async function sendTestOrderEmail() {
  console.log('📧 Invio email ordine di test a veddaalessandra@gmail.com...');
  console.log('📦 Ordine simulato:', JSON.stringify(testOrder, null, 2));

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com',
        'X-Shopify-Hmac-Sha256': 'test-hmac'
      },
      body: JSON.stringify(testOrder)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Email inviata con successo!');
      console.log('📄 Risposta:', JSON.stringify(result, null, 2));
    } else {
      console.error('❌ Errore invio email:', response.status);
      console.error('📄 Errore:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

sendTestOrderEmail();
