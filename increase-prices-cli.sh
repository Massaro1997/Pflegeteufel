#!/bin/bash

# Script per aumentare tutti i prezzi dei prodotti di 1 euro usando Shopify CLI
# Questo script recupera tutti i prodotti e li aggiorna uno per uno

PRICE_INCREASE=1.00

echo "🚀 Avvio script aumento prezzi..."
echo "💰 Aumento: +${PRICE_INCREASE}€"
echo ""

# Prima recuperiamo tutti i prodotti con le loro varianti
echo "📥 Recupero lista prodotti..."

# Query GraphQL per ottenere tutti i prodotti
QUERY='query {
  products(first: 250) {
    edges {
      node {
        id
        title
        variants(first: 100) {
          edges {
            node {
              id
              title
              price
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}'

# Esegui la query
shopify admin graphql query "$QUERY" > products.json

# Ora processa ogni prodotto e aggiorna i prezzi
# Nota: questo richiede un parser JSON come jq

if ! command -v jq &> /dev/null; then
    echo "❌ Errore: jq non è installato. Installa jq per continuare."
    echo "Installa con: npm install -g node-jq"
    exit 1
fi

echo "📊 Analisi prodotti in corso..."

# Conta i prodotti
PRODUCT_COUNT=$(jq '.data.products.edges | length' products.json)
echo "✅ Trovati ${PRODUCT_COUNT} prodotti"
echo ""

# Processa ogni variante
TOTAL_VARIANTS=0
UPDATED_VARIANTS=0

jq -c '.data.products.edges[] | .node' products.json | while read product; do
    PRODUCT_ID=$(echo $product | jq -r '.id')
    PRODUCT_TITLE=$(echo $product | jq -r '.title')

    echo "📦 Prodotto: $PRODUCT_TITLE"

    echo $product | jq -c '.variants.edges[] | .node' | while read variant; do
        VARIANT_ID=$(echo $variant | jq -r '.id')
        VARIANT_TITLE=$(echo $variant | jq -r '.title')
        OLD_PRICE=$(echo $variant | jq -r '.price')

        # Calcola nuovo prezzo
        NEW_PRICE=$(echo "$OLD_PRICE + $PRICE_INCREASE" | bc)

        echo "   • $VARIANT_TITLE: ${OLD_PRICE}€ → ${NEW_PRICE}€"

        # Mutation GraphQL per aggiornare il prezzo
        MUTATION="mutation {
          productVariantUpdate(input: {
            id: \"$VARIANT_ID\"
            price: \"$NEW_PRICE\"
          }) {
            productVariant {
              id
              price
            }
            userErrors {
              field
              message
            }
          }
        }"

        # Esegui la mutation
        RESULT=$(shopify admin graphql query "$MUTATION")

        # Controlla errori
        ERRORS=$(echo $RESULT | jq -r '.data.productVariantUpdate.userErrors | length')

        if [ "$ERRORS" -eq "0" ]; then
            echo "     ✅ Aggiornato"
            ((UPDATED_VARIANTS++))
        else
            ERROR_MSG=$(echo $RESULT | jq -r '.data.productVariantUpdate.userErrors[0].message')
            echo "     ❌ Errore: $ERROR_MSG"
        fi

        ((TOTAL_VARIANTS++))

        # Rate limiting
        sleep 0.5
    done

    echo ""
done

echo ""
echo "📊 Riepilogo:"
echo "   Totale varianti: $TOTAL_VARIANTS"
echo "   Aggiornate: $UPDATED_VARIANTS"
echo "   Fallite: $((TOTAL_VARIANTS - UPDATED_VARIANTS))"
echo ""
echo "✅ Script completato!"

# Pulisci file temporaneo
rm products.json
