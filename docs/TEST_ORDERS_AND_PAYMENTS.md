# Guide de Test - Gestion des Commandes et Paiements

Ce guide vous permet de tester tous les endpoints de gestion des commandes et des paiements étape par étape.

## 📋 Prérequis

1. **Application démarrée** : L'API doit être en cours d'exécution sur `http://localhost:3000`
2. **Base de données** : PostgreSQL doit être accessible et les migrations appliquées
3. **Utilisateur** : Vous devez avoir un compte utilisateur avec le rôle `CUSTOMER` ou `ENTERPRISE`
4. **Produits** : Au moins un produit doit exister dans la base de données
5. **Adresse de livraison** : Vous devez avoir au moins une adresse de livraison enregistrée

## 🔐 Étape 1 : Authentification

### 1.1 Connexion (Login)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "votre-email@example.com",
    "password": "votre-mot-de-passe"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-de-l-utilisateur",
      "email": "votre-email@example.com",
      "role": "CUSTOMER"
    }
  }
}
```

**⚠️ Important :** Copiez le `accessToken` pour l'utiliser dans les prochaines requêtes.

---

## 🛒 Étape 2 : Préparation du Panier

Avant de créer une commande, vous devez avoir des articles dans votre panier.

### 2.1 Vérifier le panier actuel

```bash
curl -X GET http://localhost:3000/api/v1/cart \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

### 2.2 Ajouter un produit au panier

**Note :** Remplacez `PRODUCT_ID` par l'ID d'un produit existant dans votre base de données.

```bash
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 2
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Produit ajouté au panier avec succès",
  "data": {
    "id": "cart-item-id",
    "product": {
      "id": "product-id",
      "name": "Nom du produit",
      "price": 25000,
      "finalPrice": 22500,
      "hasPromotion": true
    },
    "quantity": 2,
    "subtotal": 45000
  }
}
```

### 2.3 Vérifier le total du panier

```bash
curl -X GET http://localhost:3000/api/v1/cart/total \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

---

## 🛍️ Étape 3 : Gestion des Commandes

### 3.1 Créer une commande

**Note :** Remplacez `SHIPPING_ADDRESS_ID` par l'ID d'une adresse de livraison existante.

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "SHIPPING_ADDRESS_ID",
    "items": [
      {
        "productId": "PRODUCT_ID",
        "quantity": 2
      }
    ],
    "notes": "Livrer entre 9h et 12h"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": "order-uuid",
    "orderNumber": "CMD-1733123456789-1234",
    "status": "PENDING",
    "subtotal": 50000,
    "tax": 0,
    "shipping": 0,
    "discount": 5000,
    "total": 45000,
    "items": [
      {
        "productId": "product-id",
        "productName": "Nom du produit",
        "quantity": 2,
        "unitPrice": 22500,
        "total": 45000
      }
    ],
    "createdAt": "2025-12-02T10:00:00.000Z"
  }
}
```

**⚠️ Important :** Copiez l'`id` de la commande (ou `orderNumber`) pour les prochaines étapes.

### 3.2 Récupérer le récapitulatif d'une commande

```bash
curl -X GET http://localhost:3000/api/v1/orders/ORDER_ID/summary \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Récapitulatif de la commande récupéré avec succès",
  "data": {
    "id": "order-uuid",
    "orderNumber": "CMD-1733123456789-1234",
    "status": "PENDING",
    "subtotal": 50000,
    "total": 45000,
    "shippingAddress": "123 Rue Example",
    "shippingCity": "Dakar",
    "items": [...],
    "payments": []
  }
}
```

### 3.3 Récupérer la confirmation d'une commande

```bash
curl -X GET http://localhost:3000/api/v1/orders/ORDER_ID/confirmation \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

---

## 💳 Étape 4 : Gestion des Paiements

### 4.1 Paiement Mobile Money (via PayDunya)

**Note :** Assurez-vous que PayDunya est correctement configuré (voir `docs/PAYDUNYA_CONFIGURATION.md`).

```bash
curl -X POST http://localhost:3000/api/v1/payments/mobile-money \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "provider": "ORANGE_MONEY",
    "phoneNumber": "+221771234567"
  }'
```

**Réponse attendue :**
```json
{
  "id": "payment-uuid",
  "orderId": "order-uuid",
  "orderNumber": "CMD-1733123456789-1234",
  "method": "MOBILE_MONEY",
  "status": "PENDING",
  "amount": 45000,
  "paymentUrl": "https://paydunya.com/sandbox-checkout/invoice/test_9jTlZiIc3O",
  "token": "test_9jTlZiIc3O"
}
```

**⚠️ Important :** 
- Copiez l'`paymentUrl` et ouvrez-la dans un navigateur pour compléter le paiement
- Le `token` sera utilisé par PayDunya pour envoyer le webhook

### 4.2 Paiement à la livraison (Cash on Delivery)

```bash
curl -X POST http://localhost:3000/api/v1/payments/cash-on-delivery \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "notes": "Préparer la monnaie"
  }'
```

**Réponse attendue :**
```json
{
  "id": "payment-uuid",
  "orderId": "order-uuid",
  "orderNumber": "CMD-1733123456789-1234",
  "method": "CASH_ON_DELIVERY",
  "status": "PENDING",
  "amount": 45000,
  "message": "Paiement à la livraison confirmé. La commande sera livrée et payée à la réception."
}
```

### 4.3 Contact direct avec l'entreprise

```bash
curl -X POST http://localhost:3000/api/v1/payments/direct-contact \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID",
    "email": "client@example.com",
    "phone": "+221771234567",
    "message": "Je souhaite payer par virement bancaire. Veuillez me contacter pour les coordonnées bancaires."
  }'
```

**Réponse attendue :**
```json
{
  "id": "payment-uuid",
  "orderId": "order-uuid",
  "orderNumber": "CMD-1733123456789-1234",
  "method": "DIRECT_CONTACT",
  "status": "PENDING",
  "amount": 45000,
  "message": "Votre demande de contact direct a été enregistrée. L'équipe vous contactera bientôt."
}
```

### 4.4 Traitement du paiement via l'endpoint Orders

Vous pouvez aussi traiter le paiement directement via l'endpoint `/orders/:id/payment` :

#### Mobile Money
```bash
curl -X POST http://localhost:3000/api/v1/orders/ORDER_ID/payment \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "MOBILE_MONEY",
    "phoneNumber": "+221771234567",
    "provider": "ORANGE_MONEY"
  }'
```

#### Cash on Delivery
```bash
curl -X POST http://localhost:3000/api/v1/orders/ORDER_ID/payment \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "CASH_ON_DELIVERY",
    "notes": "Livrer entre 9h et 12h"
  }'
```

#### Direct Contact
```bash
curl -X POST http://localhost:3000/api/v1/orders/ORDER_ID/payment \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "DIRECT_CONTACT",
    "email": "client@example.com",
    "phone": "+221771234567",
    "message": "Je souhaite contacter directement l'entreprise"
  }'
```

---

## 🔔 Étape 5 : Webhook PayDunya (Test)

**Note :** Cet endpoint est appelé automatiquement par PayDunya. Pour tester manuellement :

```bash
curl -X POST http://localhost:3000/api/v1/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_9jTlZiIc3O",
    "invoice": {
      "token": "test_9jTlZiIc3O",
      "status": "completed",
      "receipt_url": "https://paydunya.com/receipt/...",
      "txn_code": "TXN123456"
    }
  }'
```

**⚠️ Important :** 
- Cet endpoint ne nécessite pas d'authentification (public)
- PayDunya signe les requêtes avec une signature HMAC
- Pour un test complet, configurez ngrok ou localtunnel (voir `docs/PAYDUNYA_CONFIGURATION.md`)

---

## 📊 Flux Complet de Test

Voici le flux complet recommandé pour tester tous les endpoints :

### Scénario 1 : Paiement Mobile Money

1. ✅ **Authentification** → Obtenir le token JWT
2. ✅ **Ajouter des produits au panier** → Remplir le panier
3. ✅ **Créer une commande** → Générer une commande depuis le panier
4. ✅ **Récupérer le récapitulatif** → Vérifier les détails de la commande
5. ✅ **Initier le paiement Mobile Money** → Créer une facture PayDunya
6. ✅ **Compléter le paiement** → Ouvrir l'URL PayDunya et payer
7. ✅ **Vérifier la confirmation** → Récupérer la confirmation de commande

### Scénario 2 : Paiement à la livraison

1. ✅ **Authentification** → Obtenir le token JWT
2. ✅ **Ajouter des produits au panier** → Remplir le panier
3. ✅ **Créer une commande** → Générer une commande depuis le panier
4. ✅ **Confirmer le paiement à la livraison** → Enregistrer le choix
5. ✅ **Vérifier le statut** → La commande doit être en statut CONFIRMED

### Scénario 3 : Contact direct

1. ✅ **Authentification** → Obtenir le token JWT
2. ✅ **Ajouter des produits au panier** → Remplir le panier
3. ✅ **Créer une commande** → Générer une commande depuis le panier
4. ✅ **Demander un contact direct** → Enregistrer la demande
5. ✅ **Vérifier le statut** → La commande doit être en statut CONFIRMED

---

## 🐛 Dépannage

### Erreur : "Panier vide"
**Solution :** Ajoutez des produits au panier avant de créer une commande.

### Erreur : "Adresse de livraison non trouvée"
**Solution :** Créez une adresse de livraison via le module Profile avant de créer une commande.

### Erreur : "Stock insuffisant"
**Solution :** Vérifiez que les produits ont suffisamment de stock disponible.

### Erreur : "Commande déjà payée"
**Solution :** Une commande ne peut avoir qu'un seul paiement. Créez une nouvelle commande pour tester un autre paiement.

### Erreur : "Invalid Masterkey Specified" (PayDunya)
**Solution :** Vérifiez votre configuration PayDunya dans le fichier `.env`. Utilisez le script `check-paydunya-config.js` pour vérifier.

---

## 📝 Notes Importantes

1. **Token JWT** : Le token expire après 15 minutes. Si vous obtenez une erreur 401, reconnectez-vous.

2. **Panier** : Le panier est automatiquement vidé après la création d'une commande.

3. **Stock** : Le stock est réservé lors de la création de la commande.

4. **Statuts de commande** :
   - `PENDING` : Commande créée, en attente de paiement
   - `CONFIRMED` : Commande confirmée (paiement validé ou à la livraison)
   - `PROCESSING` : Commande en cours de traitement
   - `SHIPPED` : Commande expédiée
   - `DELIVERED` : Commande livrée
   - `CANCELLED` : Commande annulée

5. **Statuts de paiement** :
   - `PENDING` : Paiement en attente
   - `COMPLETED` : Paiement complété
   - `FAILED` : Paiement échoué
   - `CANCELLED` : Paiement annulé

---

## 🔗 Ressources

- **Documentation Swagger** : http://localhost:3000/api/docs
- **Configuration PayDunya** : `docs/PAYDUNYA_CONFIGURATION.md`
- **Guide de démarrage PayDunya** : `QUICK_START_PAYDUNYA.md`
- **Dépannage PayDunya** : `TROUBLESHOOTING_PAYDUNYA.md`

---

## 💡 Astuces

1. **Utilisez Postman ou Insomnia** : Plus facile que curl pour gérer les tokens et les requêtes
2. **Collection Postman** : Créez une collection avec toutes ces requêtes pour un test rapide
3. **Variables d'environnement** : Utilisez des variables pour `VOTRE_ACCESS_TOKEN`, `ORDER_ID`, etc.
4. **Logs** : Surveillez les logs de l'application pour voir les erreurs détaillées

