# HOMEPAGE REDESIGN - NUOVE SEZIONI

## Istruzioni per l'implementazione
Sostituire il contenuto di ogni sezione nel file `templates/index.json` con il codice corrispondente.

---

## 1. SECTION_MHJMJG - DISCLAIMER (Badge Style con Icone)

**Design:** 3 card grandi con icone circolari, gradient background, hover effects

**Sostituire in:** `sections.section_mhHMjg.blocks.custom_liquid_DUAUr4.settings.custom_liquid`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disclaimer Section - Icon Badge Style</title>
    <style>
        .disclaimer-section-new {
            padding: 60px 0;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            position: relative;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
        }

        .disclaimer-section-new::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(193, 38, 36, 0.08) 0%, transparent 70%);
            border-radius: 50%;
            animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
        }

        .disclaimer-container-new {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            position: relative;
            z-index: 2;
        }

        .disclaimer-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 30px;
            margin-bottom: 0;
        }

        .disclaimer-badge {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 2px solid transparent;
            opacity: 0;
            transform: translateY(50px);
        }

        .disclaimer-badge.animate {
            opacity: 1;
            transform: translateY(0);
        }

        .disclaimer-badge:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 15px 50px rgba(0, 0, 0, 0.12);
            border-color: #C12624;
        }

        .disclaimer-badge-icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 25px;
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 50px;
            box-shadow: 0 8px 25px rgba(193, 38, 36, 0.3);
            transition: all 0.3s ease;
        }

        .disclaimer-badge:hover .disclaimer-badge-icon {
            transform: rotate(10deg) scale(1.1);
            box-shadow: 0 12px 35px rgba(193, 38, 36, 0.5);
        }

        .disclaimer-badge-title {
            font-size: 1.3rem;
            font-weight: 800;
            color: #2c3e50;
            margin-bottom: 15px;
            line-height: 1.3;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }

        .disclaimer-badge-text {
            font-size: 1rem;
            color: #6c757d;
            line-height: 1.6;
            font-weight: 500;
        }

        .disclaimer-badge-highlight {
            color: #C12624;
            font-weight: 700;
        }

        /* Responsive */
        @media (max-width: 992px) {
            .disclaimer-grid {
                grid-template-columns: 1fr;
                gap: 25px;
            }
        }

        @media (max-width: 768px) {
            .disclaimer-section-new {
                padding: 40px 0;
            }

            .disclaimer-badge {
                padding: 30px 20px;
            }

            .disclaimer-badge-icon {
                width: 80px;
                height: 80px;
                font-size: 40px;
                margin-bottom: 20px;
            }

            .disclaimer-badge-title {
                font-size: 1.1rem;
            }

            .disclaimer-badge-text {
                font-size: 0.95rem;
            }
        }
    </style>
</head>
<body>
    <div class="disclaimer-section-new">
        <div class="disclaimer-container-new">
            <div class="disclaimer-grid">
                <div class="disclaimer-badge" data-delay="0">
                    <div class="disclaimer-badge-icon">🏥</div>
                    <h3 class="disclaimer-badge-title">Kein Pflegedienst</h3>
                    <p class="disclaimer-badge-text">
                        Die <span class="disclaimer-badge-highlight">Agentur Pflege Teufel</span> ist keine Pflegedienst und bietet keine medizinische Pflege an.
                    </p>
                </div>

                <div class="disclaimer-badge" data-delay="200">
                    <div class="disclaimer-badge-icon">⚕️</div>
                    <h3 class="disclaimer-badge-title">Keine Ambulanten Dienste</h3>
                    <p class="disclaimer-badge-text">
                        Wir bieten <span class="disclaimer-badge-highlight">keine ambulanten Pflegedienstleistungen</span> an.
                    </p>
                </div>

                <div class="disclaimer-badge" data-delay="400">
                    <div class="disclaimer-badge-icon">⚖️</div>
                    <h3 class="disclaimer-badge-title">Keine Rechtsberatung</h3>
                    <p class="disclaimer-badge-text">
                        Wir sind <span class="disclaimer-badge-highlight">keine Rechtsanwaltskanzlei</span> und bieten keine juristische Beratung an.
                    </p>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        'use strict';

        function disclaimerNewAnimate() {
            const badges = document.querySelectorAll('.disclaimer-badge');
            badges.forEach((badge, index) => {
                const delay = parseInt(badge.getAttribute('data-delay')) || 0;
                setTimeout(() => {
                    badge.classList.add('animate');
                }, delay);
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', disclaimerNewAnimate);
        } else {
            disclaimerNewAnimate();
        }

        window.addEventListener('load', function() {
            setTimeout(disclaimerNewAnimate, 100);
        });
    })();
    </script>
</body>
</html>
```

---

## 2. SECTION_RRXRYN - WARUM (Split Screen con Video e Testo)

**Design:** Layout 50/50 con video a sinistra e contenuto a destra, effetti parallax

**Sostituire in:** `sections.section_RrxRYn.blocks.custom_liquid_kEpfcw.settings.custom_liquid`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warum Section - Split Screen</title>
    <style>
        .warum-section-split {
            padding: 0;
            background: white;
            position: relative;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
        }

        .warum-split-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 600px;
            align-items: center;
        }

        /* Video Side */
        .warum-video-side {
            position: relative;
            height: 100%;
            min-height: 600px;
            overflow: hidden;
            background: #000;
        }

        .warum-video-side::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.05) 100%);
            pointer-events: none;
        }

        .warum-video-bg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.9;
        }

        /* Content Side */
        .warum-content-side {
            padding: 80px 60px;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            position: relative;
            overflow: hidden;
        }

        .warum-content-side::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(193, 38, 36, 0.05) 0%, transparent 70%);
            border-radius: 50%;
        }

        .warum-content-inner {
            position: relative;
            z-index: 2;
            opacity: 0;
            transform: translateX(50px);
            transition: all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .warum-content-inner.animate {
            opacity: 1;
            transform: translateX(0);
        }

        .warum-badge {
            display: inline-block;
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 20px;
        }

        .warum-title-split {
            font-size: 2.5rem;
            font-weight: 900;
            color: #2c3e50;
            margin-bottom: 25px;
            line-height: 1.2;
            text-transform: uppercase;
        }

        .warum-title-highlight {
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .warum-text-split {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.8;
            margin-bottom: 30px;
        }

        .warum-text-split strong {
            color: #2c3e50;
            font-weight: 700;
        }

        .warum-text-split em {
            color: #C12624;
            font-style: normal;
            font-weight: 700;
        }

        .warum-features {
            display: grid;
            grid-template-columns: 1fr;
            gap: 15px;
        }

        .warum-feature-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }

        .warum-feature-item:hover {
            transform: translateX(10px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }

        .warum-feature-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            flex-shrink: 0;
        }

        .warum-feature-text {
            font-size: 1rem;
            color: #2c3e50;
            font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 992px) {
            .warum-split-container {
                grid-template-columns: 1fr;
            }

            .warum-video-side {
                min-height: 400px;
            }

            .warum-content-side {
                padding: 50px 30px;
            }

            .warum-title-split {
                font-size: 2rem;
            }

            .warum-text-split {
                font-size: 1rem;
            }
        }

        @media (max-width: 768px) {
            .warum-content-side {
                padding: 40px 20px;
            }

            .warum-title-split {
                font-size: 1.8rem;
            }
        }
    </style>
</head>
<body>
    <div class="warum-section-split">
        <div class="warum-split-container">
            <div class="warum-video-side">
                <video class="warum-video-bg" autoplay muted loop playsinline preload="metadata">
                    <source src="https://cdn.shopify.com/videos/c/o/v/a2761182757c447b961ff9ba48cbb439.mp4" type="video/mp4">
                </video>
            </div>

            <div class="warum-content-side">
                <div class="warum-content-inner" id="warum-content">
                    <span class="warum-badge">Über Uns</span>
                    <h2 class="warum-title-split">
                        Wer Ist der <span class="warum-title-highlight">PflegeTeufel</span>?
                    </h2>
                    <p class="warum-text-split">
                        <strong>Ganz einfach.</strong> Weil wir keine Angst vor Bürokratie haben. Wo andere sich im Formular-Dschungel verirren, kennen wir jede Abkürzung. Der <em>„PflegeTeufel"</em> steht für das, was wir tun: <strong>Wir kämpfen für unsere Kunden</strong>, verhandeln clever und wissen, wann wir den Teufel rausholen müssen, um Ergebnisse zu liefern.
                    </p>

                    <div class="warum-features">
                        <div class="warum-feature-item">
                            <div class="warum-feature-icon">📋</div>
                            <div class="warum-feature-text">Weniger Papierkram</div>
                        </div>
                        <div class="warum-feature-item">
                            <div class="warum-feature-icon">💡</div>
                            <div class="warum-feature-text">Mehr Klarheit</div>
                        </div>
                        <div class="warum-feature-item">
                            <div class="warum-feature-icon">🤝</div>
                            <div class="warum-feature-text">Maximale Unterstützung</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        'use strict';

        function warumSplitInit() {
            setTimeout(function() {
                const content = document.getElementById('warum-content');
                if (content) {
                    content.classList.add('animate');
                }
            }, 300);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', warumSplitInit);
        } else {
            warumSplitInit();
        }
    })();
    </script>
</body>
</html>
```

---

## 3. SECTION_HEGKPG - PFLEGEBOX (Card Asimmetrica con Immagine Grande)

**Design:** Layout asimmetrico con immagine grande a sinistra e contenuto impilato a destra

**Sostituire in:** `sections.section_HeGkpG.blocks.custom_liquid_BndAmW.settings.custom_liquid`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pflegebox - Asymmetric Card</title>
    <style>
        .pflegebox-asymmetric-wrapper {
            padding: 80px 0;
            background: #f8f9fa;
            font-family: 'Inter', sans-serif;
        }

        .pflegebox-asymmetric-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }

        .pflegebox-header-asym {
            text-align: center;
            margin-bottom: 50px;
            opacity: 0;
            transform: translateY(30px);
            transition: all 1s ease;
        }

        .pflegebox-header-asym.animate {
            opacity: 1;
            transform: translateY(0);
        }

        .pflegebox-title-asym {
            font-size: 2.5rem;
            font-weight: 900;
            color: #2c3e50;
            margin-bottom: 15px;
            text-transform: uppercase;
        }

        .pflegebox-title-highlight {
            color: #C12624;
        }

        .pflegebox-subtitle-asym {
            font-size: 1.2rem;
            color: #6c757d;
            font-weight: 500;
        }

        .pflegebox-asymmetric-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 40px;
            background: white;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            opacity: 0;
            transform: scale(0.95);
            transition: all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .pflegebox-asymmetric-grid.animate {
            opacity: 1;
            transform: scale(1);
        }

        .pflegebox-image-side {
            position: relative;
            overflow: hidden;
        }

        .pflegebox-image-large {
            width: 100%;
            height: 100%;
            object-fit: cover;
            min-height: 600px;
            transition: transform 0.5s ease;
        }

        .pflegebox-asymmetric-grid:hover .pflegebox-image-large {
            transform: scale(1.05);
        }

        .pflegebox-image-overlay {
            position: absolute;
            bottom: 30px;
            left: 30px;
            background: linear-gradient(135deg, rgba(193, 38, 36, 0.95), rgba(160, 31, 29, 0.95));
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .pflegebox-overlay-title {
            font-size: 1.8rem;
            font-weight: 800;
            margin-bottom: 5px;
        }

        .pflegebox-overlay-subtitle {
            font-size: 1rem;
            opacity: 0.9;
        }

        .pflegebox-content-side {
            padding: 50px 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .pflegebox-features-list {
            list-style: none;
            padding: 0;
            margin: 0 0 30px 0;
        }

        .pflegebox-features-list li {
            padding: 15px 0;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 1.1rem;
            color: #2c3e50;
        }

        .pflegebox-features-list li:last-child {
            border-bottom: none;
        }

        .pflegebox-feature-icon-inline {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }

        .pflegebox-highlight-box {
            background: linear-gradient(135deg, #fef7f7 0%, #fff 100%);
            padding: 25px;
            border-radius: 15px;
            border-left: 5px solid #C12624;
            margin-bottom: 30px;
        }

        .pflegebox-highlight-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #C12624;
            margin-bottom: 10px;
        }

        .pflegebox-highlight-text {
            font-size: 0.95rem;
            color: #555;
            line-height: 1.6;
        }

        .pflegebox-cta-button-asym {
            display: inline-block;
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            color: white;
            padding: 20px 40px;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: 700;
            text-decoration: none;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(193, 38, 36, 0.3);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .pflegebox-cta-button-asym:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(193, 38, 36, 0.5);
            color: white;
            text-decoration: none;
        }

        /* Responsive */
        @media (max-width: 992px) {
            .pflegebox-asymmetric-grid {
                grid-template-columns: 1fr;
            }

            .pflegebox-image-side {
                min-height: 400px;
            }

            .pflegebox-image-large {
                min-height: 400px;
            }

            .pflegebox-content-side {
                padding: 40px 30px;
            }
        }

        @media (max-width: 768px) {
            .pflegebox-asymmetric-wrapper {
                padding: 50px 0;
            }

            .pflegebox-title-asym {
                font-size: 2rem;
            }

            .pflegebox-content-side {
                padding: 30px 20px;
            }

            .pflegebox-features-list li {
                font-size: 1rem;
            }

            .pflegebox-cta-button-asym {
                width: 100%;
                padding: 18px 30px;
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="pflegebox-asymmetric-wrapper">
        <div class="pflegebox-asymmetric-container">
            <div class="pflegebox-header-asym" id="pflegebox-header-asym">
                <h2 class="pflegebox-title-asym">
                    DIE <span class="pflegebox-title-highlight">PFLEGEBOX</span> – IHR MONATLICHES PAKET
                </h2>
                <p class="pflegebox-subtitle-asym">
                    Hochwertige Pflegehilfsmittel direkt zu Ihnen nach Hause. Von der Pflegekasse bezahlt.
                </p>
            </div>

            <div class="pflegebox-asymmetric-grid" id="pflegebox-grid-asym">
                <div class="pflegebox-image-side">
                    <img src="https://cdn.shopify.com/s/files/1/0909/2805/4653/files/0624e619-4c93-462d-86b9-6bb2f218fa44_a764ab18-f1d9-42f9-949f-fd78265128c6.jpg?v=1751094187"
                         alt="PflegeBox Paket"
                         class="pflegebox-image-large">
                    <div class="pflegebox-image-overlay">
                        <div class="pflegebox-overlay-title">bis 42€</div>
                        <div class="pflegebox-overlay-subtitle">Monatlich kostenfrei*</div>
                    </div>
                </div>

                <div class="pflegebox-content-side">
                    <ul class="pflegebox-features-list">
                        <li>
                            <div class="pflegebox-feature-icon-inline">🧤</div>
                            <span>Einmalhandschuhe in verschiedenen Größen</span>
                        </li>
                        <li>
                            <div class="pflegebox-feature-icon-inline">🧴</div>
                            <span>Desinfektionsmittel für Hände und Flächen</span>
                        </li>
                        <li>
                            <div class="pflegebox-feature-icon-inline">😷</div>
                            <span>Mundschutzmasken und Schutzschürzen</span>
                        </li>
                        <li>
                            <div class="pflegebox-feature-icon-inline">🛏️</div>
                            <span>Bettschutzeinlagen</span>
                        </li>
                        <li>
                            <div class="pflegebox-feature-icon-inline">🚚</div>
                            <span>Lieferung direkt vor Ihre Haustür</span>
                        </li>
                    </ul>

                    <div class="pflegebox-highlight-box">
                        <div class="pflegebox-highlight-title">💡 Gut zu wissen:</div>
                        <p class="pflegebox-highlight-text">
                            Laut § 40 SGB XI haben alle Personen mit Pflegegrad 1-5 Anspruch auf diese Hilfsmittel.
                            Wir kümmern uns um die Antragstellung und Abrechnung mit Ihrer Pflegekasse.
                        </p>
                    </div>

                    <a href="https://pflegeteufel.de/collections/all" class="pflegebox-cta-button-asym">
                        Jetzt bestellen
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        'use strict';

        function pflegeboxAsymInit() {
            setTimeout(function() {
                const header = document.getElementById('pflegebox-header-asym');
                const grid = document.getElementById('pflegebox-grid-asym');

                if (header) header.classList.add('animate');
                setTimeout(function() {
                    if (grid) grid.classList.add('animate');
                }, 300);
            }, 200);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', pflegeboxAsymInit);
        } else {
            pflegeboxAsymInit();
        }
    })();
    </script>
</body>
</html>
```

---

_Continua nel prossimo file..._
