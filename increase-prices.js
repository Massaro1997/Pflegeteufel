// Script per aumentare tutti i prezzi dei prodotti Shopify di 1 euro
// Uso:
// 1. Imposta le variabili d'ambiente:
//    set SHOPIFY_SHOP=your-shop.myshopify.com
//    set SHOPIFY_ADMIN_TOKEN=shpat_xxxxx
// 2. Esegui: node increase-prices.js

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_API_VERSION = '2024-10';
const PRICE_INCREASE = 1.00; // Euro da aggiungere

async function getAllProducts() {
    const products = [];
    let nextPageUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/products.json?limit=250`;

    while (nextPageUrl) {
        console.log('📥 Fetching products...');

        const response = await fetch(nextPageUrl, {
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        products.push(...data.products);

        // Check for pagination
        const linkHeader = response.headers.get('Link');
        nextPageUrl = null;

        if (linkHeader) {
            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            if (nextMatch) {
                nextPageUrl = nextMatch[1];
            }
        }
    }

    return products;
}

async function updateProductVariant(variantId, newPrice) {
    const response = await fetch(
        `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/variants/${variantId}.json`,
        {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                variant: {
                    id: variantId,
                    price: newPrice.toFixed(2)
                }
            })
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update variant ${variantId}: ${response.status} - ${error}`);
    }

    return await response.json();
}

async function increasePrices() {
    console.log('🚀 Starting price increase script...');
    console.log(`💰 Increasing all prices by ${PRICE_INCREASE}€\n`);

    try {
        // Get all products
        const products = await getAllProducts();
        console.log(`✅ Found ${products.length} products\n`);

        let totalVariants = 0;
        let updatedVariants = 0;

        // Process each product
        for (const product of products) {
            console.log(`\n📦 Product: ${product.title} (ID: ${product.id})`);
            console.log(`   Variants: ${product.variants.length}`);

            for (const variant of product.variants) {
                totalVariants++;
                const oldPrice = parseFloat(variant.price);
                const newPrice = oldPrice + PRICE_INCREASE;

                console.log(`   • ${variant.title || 'Default'}: ${oldPrice}€ → ${newPrice}€`);

                try {
                    await updateProductVariant(variant.id, newPrice);
                    updatedVariants++;
                    console.log(`     ✅ Updated`);
                } catch (error) {
                    console.error(`     ❌ Error: ${error.message}`);
                }

                // Rate limiting: wait 500ms between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('\n\n📊 Summary:');
        console.log(`   Total products: ${products.length}`);
        console.log(`   Total variants: ${totalVariants}`);
        console.log(`   Updated variants: ${updatedVariants}`);
        console.log(`   Failed: ${totalVariants - updatedVariants}`);
        console.log('\n✅ Price increase completed!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Check credentials
if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_TOKEN) {
    console.error('❌ Error: Missing Shopify credentials');
    console.error('Please set SHOPIFY_SHOP and SHOPIFY_ADMIN_TOKEN in the script');
    process.exit(1);
}

// Run the script
increasePrices();
