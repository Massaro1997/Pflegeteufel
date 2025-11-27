import json

# Leggi il file JSON
with open('templates/blog.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Le 3 nuove card HTML da aggiungere
new_articles_html = '''<!-- NUOVISSIMI ARTICOLI – Novembre 2025 -->
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

'''

# Trova e modifica il contenuto HTML
custom_liquid = data['sections']['custom_liquid_7Ti9zt']['settings']['custom_liquid']

# Trova il punto dove inserire (dopo "<div class=\"articles-grid\">")
insert_marker = '<div class="articles-grid">\n'
insert_position = custom_liquid.find(insert_marker)

if insert_position != -1:
    # Inserisci le nuove card subito dopo il marker
    insert_position += len(insert_marker)
    updated_liquid = custom_liquid[:insert_position] + new_articles_html + custom_liquid[insert_position:]

    # Aggiorna il JSON
    data['sections']['custom_liquid_7Ti9zt']['settings']['custom_liquid'] = updated_liquid

    # Salva il file
    with open('templates/blog.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    print("✅ File aggiornato con successo!")
    print(f"📍 Nuove card inserite alla posizione {insert_position}")
else:
    print("❌ Marker non trovato nel file!")
