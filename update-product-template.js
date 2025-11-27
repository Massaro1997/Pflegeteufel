const fs = require('fs');

// Read product.json
const data = JSON.parse(fs.readFileSync('templates/product.json', 'utf8'));

// Update related products settings
if (data.sections && data.sections.related_products_6GdKfU) {
    data.sections.related_products_6GdKfU.name = "Alle Produkte";
    data.sections.related_products_6GdKfU.settings.title = "Alle verfügbaren Produkte";
    data.sections.related_products_6GdKfU.settings.subtitle = "Entdecken Sie unser komplettes Sortiment";
    data.sections.related_products_6GdKfU.settings.products_limit = 50;
}

// Save file
fs.writeFileSync('templates/product.json', JSON.stringify(data), 'utf8');

console.log('✅ Product template aggiornato con successo!');
console.log('📍 Mostra ora 50 prodotti invece di 12');
