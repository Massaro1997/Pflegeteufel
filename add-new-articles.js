const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('templates/blog.json', 'utf8'));

// The 3 new article cards HTML to add
const newArticlesHtml = `<!-- NUOVISSIMI ARTICOLI – Novembre 2025 -->
            <!-- Articolo 1 - Diebstahl und Erpressung -->
            <a href="https://pflegeteufel.de/blogs/notizie/diebstahl-erpressung" class="article-card">
                <div class="article-image">
                    <img src="https://cdn.shopify.com/s/files/1/0909/2805/4653/files/WhatsApp_Image_2025-11-02_at_7.16.18_PM_3.jpg?v=1762107988" alt="Diebstahl und Erpressungsversuch bei der Agentur Pflegeteufel" loading="lazy">
                </div>
                <div class="article-content">
                    <span class="article-category">Aktuelles</span>
                    <h3 class="article-title">Diebstahl und Erpressungsversuch bei der Agentur Pflegeteufel</h3>
                    <p class="article-excerpt">Ein dreister Versuch, der gründlich nach hinten losging – wie ein Erpresser sich selbst verriet und unsere Kunden weiterhin sicher sein können.</p>
                    <div class="article-meta">
                        <span class="article-date">📅 November 2025</span>
                        <span class="read-time">⏱️ 4 Min.</span>
                    </div>
                    <span class="read-more">Weiterlesen →</span>
                </div>
            </a>

            <!-- Articolo 2 - Pflegeteufelbox-Shop -->
            <a href="https://pflegeteufel.de/blogs/notizie/pflegeteufelbox-shop-koeln" class="article-card">
                <div class="article-image">
                    <img src="https://cdn.shopify.com/s/files/1/0909/2805/4653/files/WhatsApp_Image_2025-11-02_at_7.16.19_PM.jpg?v=1762107989" alt="Neu im Herzen von Köln: Der Pflegeteufelbox-Shop" loading="lazy">
                </div>
                <div class="article-content">
                    <span class="article-category">Neuigkeiten</span>
                    <h3 class="article-title">Neu im Herzen von Köln: Der Pflegeteufelbox-Shop</h3>
                    <p class="article-excerpt">Pflege zum Anfassen! Ab sofort können Sie Ihre Pflegebox jeden Montag und Donnerstag von 10-18 Uhr direkt bei uns abholen und sich persönlich beraten lassen.</p>
                    <div class="article-meta">
                        <span class="article-date">📅 November 2025</span>
                        <span class="read-time">⏱️ 4 Min.</span>
                    </div>
                    <span class="read-more">Weiterlesen →</span>
                </div>
            </a>

            <!-- Articolo 3 - Aufstieg und Ausstieg -->
            <a href="https://pflegeteufel.de/blogs/notizie/aufstieg-ausstieg-venezia" class="article-card">
                <div class="article-image">
                    <img src="https://cdn.shopify.com/s/files/1/0909/2805/4653/files/WhatsApp_Image_2025-11-02_at_7.16.21_PM_1.jpg?v=1762107989" alt="Aufstieg und Ausstieg – nichts für schwache Nerven" loading="lazy">
                </div>
                <div class="article-content">
                    <span class="article-category">Team</span>
                    <h3 class="article-title">Aufstieg und Ausstieg – nichts für schwache Nerven</h3>
                    <p class="article-excerpt">Herr Venezia geht seinen eigenen Weg – eine Geschichte über mutige Entscheidungen und neue Anfänge mit besten Wünschen vom Pflegeteufel-Team.</p>
                    <div class="article-meta">
                        <span class="article-date">📅 November 2025</span>
                        <span class="read-time">⏱️ 3 Min.</span>
                    </div>
                    <span class="read-more">Weiterlesen →</span>
                </div>
            </a>

`;

// Get the custom liquid content
let customLiquid = data.sections.custom_liquid_7Ti9zt.settings.custom_liquid;

// Find the insertion point (after "<div class=\"articles-grid\">\n")
const insertMarker = '<div class="articles-grid">\n';
const insertPosition = customLiquid.indexOf(insertMarker);

if (insertPosition !== -1) {
    // Insert the new cards right after the marker
    const pos = insertPosition + insertMarker.length;
    customLiquid = customLiquid.substring(0, pos) + newArticlesHtml + customLiquid.substring(pos);

    // Update the JSON
    data.sections.custom_liquid_7Ti9zt.settings.custom_liquid = customLiquid;

    // Save the file
    fs.writeFileSync('templates/blog.json', JSON.stringify(data, null, 0), 'utf8');

    console.log('✅ File aggiornato con successo!');
    console.log(`📍 Nuove card inserite alla posizione ${pos}`);
} else {
    console.log('❌ Marker non trovato nel file!');
}
