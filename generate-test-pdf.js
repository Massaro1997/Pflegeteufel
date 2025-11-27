// Script per generare un PDF di test in locale
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

// Ordine di test
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
      name: 'Pflegebox Standard - Monatliche Lieferung',
      quantity: 1,
      price: '40.00'
    },
    {
      id: 222222222,
      name: 'Einmalhandschuhe Nitril (Größe M) - 100 Stück',
      quantity: 2,
      price: '15.00'
    },
    {
      id: 333333333,
      name: 'Flächendesinfektionsmittel 500ml',
      quantity: 1,
      price: '8.50'
    }
  ],
  subtotal_price: '78.50',
  total_tax: '14.92',
  total_price: '93.42',
  total_shipping_price_set: {
    shop_money: {
      amount: '0.00',
      currency_code: 'EUR'
    }
  },
  shipping_address: {
    first_name: 'Alessandra',
    last_name: 'Vedda',
    address1: 'Hauptstraße 123',
    address2: 'Wohnung 4B',
    city: 'Berlin',
    zip: '10115',
    country: 'Deutschland',
    country_code: 'DE'
  }
};

async function generateTestPDF() {
  console.log('📄 Generazione PDF di test...');

  const orderData = testOrder;

  // Crea un nuovo documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  // Font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Header
  page.drawText('BESTELLBESTÄTIGUNG', {
    x: 50,
    y: yPosition,
    size: 24,
    font: helveticaBold,
    color: rgb(0.75, 0.15, 0.14) // #C12624
  });

  yPosition -= 30;
  page.drawText(`Bestellnummer: #${orderData.order_number}`, {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 20;
  const orderDate = new Date(orderData.created_at);
  page.drawText(`Datum: ${orderDate.toLocaleDateString('de-DE')} um ${orderDate.toLocaleTimeString('de-DE')}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });

  yPosition -= 40;

  // Customer info
  page.drawText('KUNDE', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 20;
  const customer = orderData.customer;
  if (customer) {
    page.drawText(`${customer.first_name || ''} ${customer.last_name || ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;
    page.drawText(customer.email || '', {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;
    if (customer.phone) {
      page.drawText(customer.phone, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont
      });
      yPosition -= 15;
    }
  }

  yPosition -= 25;

  // Shipping address
  const shippingAddress = orderData.shipping_address;
  if (shippingAddress) {
    page.drawText('LIEFERADRESSE', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold
    });
    yPosition -= 20;

    page.drawText(`${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;

    page.drawText(`${shippingAddress.address1 || ''}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;

    page.drawText(`${shippingAddress.zip || ''} ${shippingAddress.city || ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;

    page.drawText(shippingAddress.country || '', {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 25;
  }

  yPosition -= 10;

  // Order items
  page.drawText('BESTELLTE ARTIKEL', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 25;

  // Table header
  page.drawText('Artikel', {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });
  page.drawText('Menge', {
    x: 350,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });
  page.drawText('Preis', {
    x: 450,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  yPosition -= 20;

  // Line items
  for (const item of orderData.line_items) {
    if (yPosition < 100) {
      // Nuova pagina se necessario
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    // Nome prodotto (con word wrap se troppo lungo)
    const productName = item.name || '';
    const maxWidth = 280;
    let displayName = productName;

    if (helveticaFont.widthOfTextAtSize(productName, 11) > maxWidth) {
      displayName = productName.substring(0, 40) + '...';
    }

    page.drawText(displayName, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });

    page.drawText(`${item.quantity}`, {
      x: 350,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });

    const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
    page.drawText(`${itemTotal} €`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });

    yPosition -= 20;
  }

  yPosition -= 10;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  yPosition -= 25;

  // Totals
  page.drawText('Zwischensumme:', {
    x: 350,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  page.drawText(`${parseFloat(orderData.subtotal_price || 0).toFixed(2)} €`, {
    x: 450,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });

  yPosition -= 20;

  if (orderData.total_tax && parseFloat(orderData.total_tax) > 0) {
    page.drawText('MwSt.:', {
      x: 350,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    page.drawText(`${parseFloat(orderData.total_tax).toFixed(2)} €`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;
  }

  if (orderData.total_shipping_price_set?.shop_money?.amount && parseFloat(orderData.total_shipping_price_set.shop_money.amount) > 0) {
    page.drawText('Versand:', {
      x: 350,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    page.drawText(`${parseFloat(orderData.total_shipping_price_set.shop_money.amount).toFixed(2)} €`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;
  }

  yPosition -= 5;
  page.drawLine({
    start: { x: 350, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 2,
    color: rgb(0, 0, 0)
  });

  yPosition -= 25;

  page.drawText('GESAMT:', {
    x: 350,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });
  page.drawText(`${parseFloat(orderData.total_price || 0).toFixed(2)} €`, {
    x: 450,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: rgb(0.16, 0.65, 0.27) // #28a745
  });

  // Footer
  yPosition = 50;
  page.drawText('Vielen Dank für Ihre Bestellung bei Pflege Teufel!', {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4)
  });

  yPosition -= 15;
  page.drawText('www.pflegeteufel.de | pflegeteufelagentur@gmail.com', {
    x: 50,
    y: yPosition,
    size: 9,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4)
  });

  const pdfBytes = await pdfDoc.save();

  // Salva il PDF
  const filename = 'test-order-bestellung-1001.pdf';
  fs.writeFileSync(filename, pdfBytes);

  console.log(`✅ PDF generato: ${filename} (${pdfBytes.length} bytes)`);
  console.log(`📂 Apri il file per vedere come appare il PDF!`);
}

generateTestPDF().catch(console.error);
