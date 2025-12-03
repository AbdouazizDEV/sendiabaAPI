# Commandes cURL pour tester les Endpoints Commandes & Paiements

## 📋 Variables à définir

Avant de commencer, définissez ces variables dans votre terminal :

```bash
# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Remplacez ces valeurs par vos vraies données
EMAIL="votre-email@example.com"
PASSWORD="votre-mot-de-passe"
PRODUCT_ID="uuid-du-produit"
ADDRESS_ID="uuid-de-l-adresse"
ORDER_ID="uuid-de-la-commande"  # Sera rempli après création de commande
```

---

## 🔐 ÉTAPE 1 : Authentification

### 1.1 Connexion (Login)

```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }" | jq '.'
```

**Copiez le `accessToken` de la réponse et définissez-le :**

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🛒 ÉTAPE 2 : Préparation du Panier

### 2.1 Vérifier le panier actuel

```bash
curl -X GET $BASE_URL/cart \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 2.2 Ajouter un produit au panier

```bash
curl -X POST $BASE_URL/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"quantity\": 2
  }" | jq '.'
```

### 2.3 Vérifier le total du panier

```bash
curl -X GET $BASE_URL/cart/total \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 🛍️ ÉTAPE 3 : Gestion des Commandes

### 3.1 Créer une commande

```bash
curl -X POST $BASE_URL/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"shippingAddressId\": \"$ADDRESS_ID\",
    \"items\": [
      {
        \"productId\": \"$PRODUCT_ID\",
        \"quantity\": 2
      }
    ],
    \"notes\": \"Livrer entre 9h et 12h\"
  }" | jq '.'
```

**Copiez l'`id` de la commande créée :**

```bash
ORDER_ID="uuid-de-la-commande-creee"
```

### 3.2 Récupérer le récapitulatif d'une commande

```bash
curl -X GET $BASE_URL/orders/$ORDER_ID/summary \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### 3.3 Récupérer la confirmation d'une commande

```bash
curl -X GET $BASE_URL/orders/$ORDER_ID/confirmation \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 💳 ÉTAPE 4 : Gestion des Paiements

### 4.1 Paiement Mobile Money (via PayDunya)

```bash
curl -X POST $BASE_URL/payments/mobile-money \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"provider\": \"ORANGE_MONEY\",
    \"phoneNumber\": \"+221771234567\"
  }" | jq '.'
```

**Autres fournisseurs disponibles :**
- `"WAVE"`
- `"MTN"`
- `"MOOV"`
- `"T_MONEY"`

### 4.2 Paiement à la livraison (Cash on Delivery)

```bash
curl -X POST $BASE_URL/payments/cash-on-delivery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"notes\": \"Préparer la monnaie\"
  }" | jq '.'
```

### 4.3 Contact direct avec l'entreprise

```bash
curl -X POST $BASE_URL/payments/direct-contact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"email\": \"client@example.com\",
    \"phone\": \"+221771234567\",
    \"message\": \"Je souhaite payer par virement bancaire. Veuillez me contacter pour les coordonnées bancaires.\"
  }" | jq '.'
```

### 4.4 Traitement du paiement via l'endpoint Orders

#### Mobile Money
```bash
curl -X POST $BASE_URL/orders/$ORDER_ID/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"MOBILE_MONEY\",
    \"phoneNumber\": \"+221771234567\",
    \"provider\": \"ORANGE_MONEY\"
  }" | jq '.'
```

#### Cash on Delivery
```bash
curl -X POST $BASE_URL/orders/$ORDER_ID/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"CASH_ON_DELIVERY\",
    \"notes\": \"Livrer entre 9h et 12h\"
  }" | jq '.'
```

#### Direct Contact
```bash
curl -X POST $BASE_URL/orders/$ORDER_ID/payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"method\": \"DIRECT_CONTACT\",
    \"email\": \"client@example.com\",
    \"phone\": \"+221771234567\",
    \"message\": \"Je souhaite contacter directement l'entreprise\"
  }" | jq '.'
```

---

## 🔔 ÉTAPE 5 : Webhook PayDunya (Test)

**Note :** Cet endpoint est normalement appelé par PayDunya. Pour tester manuellement :

```bash
curl -X POST $BASE_URL/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"token\": \"test_9jTlZiIc3O\",
    \"invoice\": {
      \"token\": \"test_9jTlZiIc3O\",
      \"status\": \"completed\",
      \"receipt_url\": \"https://paydunya.com/receipt/...\",
      \"txn_code\": \"TXN123456\"
    }
  }" | jq '.'
```

---

## 📝 Exemple de Session Complète

Voici un exemple complet de session de test :

```bash
# 1. Définir les variables
BASE_URL="http://localhost:3000/api/v1"
EMAIL="test@example.com"
PASSWORD="Password123"
PRODUCT_ID="e8faa8e6-39a7-4223-a249-023536cc01ea"
ADDRESS_ID="29dfbd94-6a09-4162-b9af-25234a69f04c"

# 2. Se connecter
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# 3. Vérifier le panier
curl -X GET $BASE_URL/cart \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Ajouter un produit au panier
curl -X POST $BASE_URL/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}" | jq '.'

# 5. Créer une commande
ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"shippingAddressId\":\"$ADDRESS_ID\",\"items\":[{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}]}")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')
echo "Commande créée: $ORDER_ID"

# 6. Récupérer le récapitulatif
curl -X GET $BASE_URL/orders/$ORDER_ID/summary \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 7. Paiement à la livraison
curl -X POST $BASE_URL/payments/cash-on-delivery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\":\"$ORDER_ID\",\"notes\":\"Test\"}" | jq '.'
```

---

## 🐛 Dépannage

### Erreur 401 (Unauthorized)
- Vérifiez que le token est correct
- Le token expire après 15 minutes, reconnectez-vous si nécessaire

### Erreur 404 (Not Found)
- Vérifiez que les IDs (PRODUCT_ID, ADDRESS_ID, ORDER_ID) sont corrects
- Vérifiez que l'application est bien démarrée

### Erreur 400 (Bad Request)
- Vérifiez le format JSON de votre requête
- Vérifiez que tous les champs requis sont présents

### Format JSON dans bash
Si vous avez des problèmes avec les guillemets dans bash, utilisez des guillemets simples à l'extérieur :

```bash
curl -X POST $BASE_URL/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "'$ADDRESS_ID'",
    "items": [{"productId": "'$PRODUCT_ID'", "quantity": 2}]
  }'
```

