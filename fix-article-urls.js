const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('templates/blog.json', 'utf8'));

// Get the custom liquid content
let customLiquid = data.sections.custom_liquid_7Ti9zt.settings.custom_liquid;

// Fix the URLs
customLiquid = customLiquid.replace(
    'href="https://pflegeteufel.de/blogs/notizie/diebstahl-erpressung"',
    'href="https://pflegeteufel.de/blogs/notizie/diebstahl-und-erpressungsversuch-bei-der-agentur-pflegeteufel"'
);

customLiquid = customLiquid.replace(
    'href="https://pflegeteufel.de/blogs/notizie/pflegeteufelbox-shop-koeln"',
    'href="https://pflegeteufel.de/blogs/notizie/neu-im-herzen-von-koln-der-pflegeteufelbox-shop-pflege-zum-anfassen"'
);

customLiquid = customLiquid.replace(
    'href="https://pflegeteufel.de/blogs/notizie/aufstieg-ausstieg-venezia"',
    'href="https://pflegeteufel.de/blogs/notizie/aufstieg-und-ausstieg-nichts-fur-schwache-nerven"'
);

// Update the JSON
data.sections.custom_liquid_7Ti9zt.settings.custom_liquid = customLiquid;

// Save the file
fs.writeFileSync('templates/blog.json', JSON.stringify(data, null, 0), 'utf8');

console.log('✅ URL aggiornati con successo!');
