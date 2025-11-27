# HOMEPAGE REDESIGN - PARTE 2

## 4. SECTION_7HEIZW - ADDRESS/MAP (Hero Style con Overlay)

**Design:** Immagine fullwidth con overlay gradient e contenuto sovrapposto

**Sostituire in:** `sections.section_7hEizw.blocks.custom_liquid_AKgMqP.settings.custom_liquid`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Besuchen Sie Uns - Hero Overlay</title>
    <style>
        .address-hero-wrapper {
            padding: 0;
            font-family: 'Inter', sans-serif;
            position: relative;
        }

        .address-hero-section {
            position: relative;
            min-height: 700px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .address-hero-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        }

        .address-hero-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg,
                rgba(193, 38, 36, 0.85) 0%,
                rgba(44, 62, 80, 0.85) 100%);
            z-index: 2;
        }

        .address-hero-content {
            position: relative;
            z-index: 3;
            text-align: center;
            color: white;
            max-width: 800px;
            padding: 40px 20px;
            opacity: 0;
            transform: translateY(50px);
            transition: all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .address-hero-content.animate {
            opacity: 1;
            transform: translateY(0);
        }

        .address-hero-badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            padding: 10px 25px;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .address-hero-title {
            font-size: 4rem;
            font-weight: 900;
            margin-bottom: 30px;
            text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            line-height: 1.1;
        }

        .address-hero-details {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .address-hero-street {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }

        .address-hero-city {
            font-size: 1.4rem;
            font-weight: 500;
            opacity: 0.95;
        }

        .address-hero-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .address-hero-btn {
            display: inline-block;
            padding: 18px 35px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .address-hero-btn-primary {
            background: white;
            color: #C12624;
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
        }

        .address-hero-btn-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(255, 255, 255, 0.4);
            color: #C12624;
            text-decoration: none;
        }

        .address-hero-btn-secondary {
            background: transparent;
            color: white;
            border: 2px solid white;
        }

        .address-hero-btn-secondary:hover {
            background: white;
            color: #C12624;
            transform: translateY(-3px);
            text-decoration: none;
        }

        .address-scroll-indicator {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 3;
            animation: bounce 2s infinite;
        }

        .address-scroll-icon {
            color: white;
            font-size: 2rem;
            opacity: 0.8;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateX(-50%) translateY(0);
            }
            40% {
                transform: translateX(-50%) translateY(-10px);
            }
            60% {
                transform: translateX(-50%) translateY(-5px);
            }
        }

        /* Responsive */
        @media (max-width: 768px) {
            .address-hero-section {
                min-height: 600px;
            }

            .address-hero-title {
                font-size: 2.5rem;
            }

            .address-hero-street {
                font-size: 1.5rem;
                flex-direction: column;
                gap: 10px;
            }

            .address-hero-city {
                font-size: 1.2rem;
            }

            .address-hero-details {
                padding: 30px 20px;
            }

            .address-hero-buttons {
                flex-direction: column;
                width: 100%;
            }

            .address-hero-btn {
                width: 100%;
                text-align: center;
            }
        }

        @media (max-width: 480px) {
            .address-hero-title {
                font-size: 2rem;
            }

            .address-hero-street {
                font-size: 1.3rem;
            }

            .address-hero-btn {
                font-size: 1rem;
                padding: 15px 25px;
            }
        }
    </style>
</head>
<body>
    <div class="address-hero-wrapper">
        <div class="address-hero-section">
            <img src="https://cdn.shopify.com/s/files/1/0909/2805/4653/files/Screenshot_2025-08-19_102635.png?v=1755592048"
                 alt="Satellitenkarte von Regentenstraße 88"
                 class="address-hero-bg">

            <div class="address-hero-overlay"></div>

            <div class="address-hero-content" id="address-hero-content">
                <span class="address-hero-badge">Standort</span>

                <h1 class="address-hero-title">Besuchen Sie uns!</h1>

                <div class="address-hero-details">
                    <div class="address-hero-street">
                        <span>📍</span>
                        <span>Regentenstraße 88</span>
                    </div>
                    <div class="address-hero-city">51063 Köln-Mülheim</div>
                </div>

                <div class="address-hero-buttons">
                    <a href="https://www.google.com/maps/search/?api=1&query=Regentenstraße+88,+51063+Köln-Mülheim,+Germany"
                       target="_blank"
                       class="address-hero-btn address-hero-btn-primary">
                        📱 In Google Maps öffnen
                    </a>
                    <a href="https://pflegeteufel.de/blogs/notizie/wir-sind-umgezogen"
                       class="address-hero-btn address-hero-btn-secondary">
                        Mehr erfahren
                    </a>
                </div>
            </div>

            <div class="address-scroll-indicator">
                <div class="address-scroll-icon">↓</div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        'use strict';

        function addressHeroInit() {
            setTimeout(function() {
                const content = document.getElementById('address-hero-content');
                if (content) {
                    content.classList.add('animate');
                }
            }, 300);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addressHeroInit);
        } else {
            addressHeroInit();
        }
    })();
    </script>
</body>
</html>
```

---

## 5. SECTION_ZMBBל3 - LVR (Testimonial/Feature Style)

**Design:** Layout orizzontale con icona grande a sinistra e contenuto centrato

**Sostituire in:** `sections.section_zMbbL3.blocks.custom_liquid_4xT8TT.settings.custom_liquid`

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LVR Service - Feature Style</title>
    <style>
        .lvr-feature-wrapper {
            padding: 80px 0;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow: hidden;
        }

        .lvr-feature-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" fill="rgba(255,255,255,0.05)"/></svg>');
            background-size: 50px 50px;
            opacity: 0.5;
        }

        .lvr-feature-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            position: relative;
            z-index: 2;
        }

        .lvr-feature-content {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            padding: 60px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 50px;
            align-items: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: scale(0.95);
            transition: all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .lvr-feature-content.animate {
            opacity: 1;
            transform: scale(1);
        }

        .lvr-feature-icon-large {
            width: 200px;
            height: 200px;
            background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%);
            border-radius: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 100px;
            box-shadow: 0 15px 40px rgba(193, 38, 36, 0.4);
            transition: all 0.4s ease;
        }

        .lvr-feature-content:hover .lvr-feature-icon-large {
            transform: rotate(-5deg) scale(1.05);
            box-shadow: 0 20px 50px rgba(193, 38, 36, 0.6);
        }

        .lvr-feature-text-content {
            color: white;
        }

        .lvr-feature-badge {
            display: inline-block;
            background: rgba(193, 38, 36, 0.2);
            color: #ff6b6b;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 107, 107, 0.3);
        }

        .lvr-feature-title {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 20px;
            line-height: 1.2;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }

        .lvr-feature-description {
            font-size: 1.2rem;
            line-height: 1.8;
            margin-bottom: 30px;
            opacity: 0.95;
            font-weight: 400;
        }

        .lvr-feature-btn {
            display: inline-block;
            background: white;
            color: #2c3e50;
            padding: 18px 40px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            text-decoration: none;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
        }

        .lvr-feature-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(255, 255, 255, 0.3);
            color: #C12624;
            text-decoration: none;
        }

        .lvr-feature-highlights {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 40px;
        }

        .lvr-highlight-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }

        .lvr-highlight-item:hover {
            background: rgba(255, 255, 255, 0.15);
            transform: translateY(-5px);
        }

        .lvr-highlight-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }

        .lvr-highlight-text {
            font-size: 0.95rem;
            font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 992px) {
            .lvr-feature-content {
                grid-template-columns: 1fr;
                text-align: center;
                padding: 40px;
                gap: 30px;
            }

            .lvr-feature-icon-large {
                margin: 0 auto;
            }

            .lvr-feature-highlights {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 768px) {
            .lvr-feature-wrapper {
                padding: 50px 0;
            }

            .lvr-feature-content {
                padding: 30px 20px;
            }

            .lvr-feature-icon-large {
                width: 150px;
                height: 150px;
                font-size: 75px;
            }

            .lvr-feature-title {
                font-size: 2rem;
            }

            .lvr-feature-description {
                font-size: 1.1rem;
            }

            .lvr-feature-btn {
                width: 100%;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="lvr-feature-wrapper">
        <div class="lvr-feature-container">
            <div class="lvr-feature-content" id="lvr-feature-content">
                <div class="lvr-feature-icon-large">🏛️</div>

                <div class="lvr-feature-text-content">
                    <span class="lvr-feature-badge">Neue Leistung</span>
                    <h2 class="lvr-feature-title">LVR-Unterstützung</h2>
                    <p class="lvr-feature-description">
                        Professionelle Hilfe bei der Beantragung von LVR-Leistungen. Wir begleiten Sie durch den kompletten Antragsprozess für Eingliederungshilfe, Persönliches Budget und weitere Unterstützungsleistungen.
                    </p>
                    <a href="https://pflegeteufel.de/pages/lvr" class="lvr-feature-btn">
                        Mehr erfahren
                    </a>

                    <div class="lvr-feature-highlights">
                        <div class="lvr-highlight-item">
                            <div class="lvr-highlight-icon">📋</div>
                            <div class="lvr-highlight-text">Komplette Antragstellung</div>
                        </div>
                        <div class="lvr-highlight-item">
                            <div class="lvr-highlight-icon">🤝</div>
                            <div class="lvr-highlight-text">Persönliche Begleitung</div>
                        </div>
                        <div class="lvr-highlight-item">
                            <div class="lvr-highlight-icon">✅</div>
                            <div class="lvr-highlight-text">Erfolgsgarantie</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    (function() {
        'use strict';

        function lvrFeatureInit() {
            setTimeout(function() {
                const content = document.getElementById('lvr-feature-content');
                if (content) {
                    content.classList.add('animate');
                }
            }, 300);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', lvrFeatureInit);
        } else {
            lvrFeatureInit();
        }
    })();
    </script>
</body>
</html>
```

---

_Fine Parte 2 - Le sezioni rimanenti verranno analizzate nella parte 3_
