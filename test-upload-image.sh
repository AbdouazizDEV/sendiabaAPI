#!/bin/bash

echo "=== Test d'upload d'image pour un produit ==="
echo ""

# Configuration
API_URL="http://localhost:3000/api/v1"
EMAIL="elhadjifallbasse@gmail.com"
PASSWORD="Aadeldiablo10"
PRODUCT_ID="40b7aeb2-cbbd-4af2-bcd6-75c3cc92f7c7"

# Étape 1: Se connecter
echo "1. Connexion..."
LOGIN_RESPONSE=$(curl -s -X 'POST' \
  "$API_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible de se connecter"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Token obtenu: ${TOKEN:0:50}..."
echo ""

# Étape 2: Vérifier que le produit existe
echo "2. Vérification du produit..."
PRODUCT_RESPONSE=$(curl -s -X 'GET' \
  "$API_URL/seller/products/$PRODUCT_ID" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PRODUCT_RESPONSE" | jq -e '.success == false' > /dev/null; then
  echo "❌ Erreur: Produit non trouvé"
  echo "$PRODUCT_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Produit trouvé"
echo ""

# Étape 3: Upload d'image (exemple avec un fichier de test)
echo "3. Upload d'image..."
echo "⚠️  Note: Créez un fichier image de test ou utilisez un fichier existant"
echo ""
echo "Exemple de commande curl:"
echo ""
echo "curl -X 'POST' \\"
echo "  '$API_URL/seller/products/$PRODUCT_ID/images' \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -F 'images=@/chemin/vers/votre/image.jpg'"
echo ""
echo "Pour plusieurs images:"
echo ""
echo "curl -X 'POST' \\"
echo "  '$API_URL/seller/products/$PRODUCT_ID/images' \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -F 'images=@/chemin/vers/image1.jpg' \\"
echo "  -F 'images=@/chemin/vers/image2.jpg'"
