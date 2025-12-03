# Guide d'Intégration Frontend - Commandes & Paiements

## 📋 Vue d'ensemble

Ce document décrit tous les endpoints de gestion des commandes et paiements pour l'intégration frontend. Il explique le flux complet de création de commande jusqu'à la confirmation de paiement.

## 🔄 Flux Complet de Commande

```
1. Utilisateur ajoute des produits au panier
2. Utilisateur crée une commande depuis le panier
3. Utilisateur choisit une méthode de paiement
4. Redirection vers PayDunya (si Mobile Money) ou confirmation directe
5. PayDunya redirige vers /orders/success?token=XXX
6. Page de succès vérifie le statut et affiche la confirmation
```

---

## 🔐 Authentification

Tous les endpoints (sauf webhook) nécessitent un token JWT dans le header :

```
Authorization: Bearer <access_token>
```

---

## 🛒 ENDPOINTS PANIER

### GET `/api/v1/cart`
**Rôle :** Récupère le contenu du panier de l'utilisateur connecté

**Réponse :**
```json
{
  "success": true,
  "message": "Panier récupéré avec succès",
  "data": {
    "id": "cart-uuid",
    "items": [
      {
        "id": "item-uuid",
        "product": {
          "id": "product-uuid",
          "name": "Nom du produit",
          "price": 25000,
          "finalPrice": 22500,
          "hasPromotion": true,
          "image": "https://..."
        },
        "quantity": 2,
        "subtotal": 45000
      }
    ],
    "itemCount": 2,
    "total": 45000
  }
}
```

### POST `/api/v1/cart/items`
**Rôle :** Ajoute un produit au panier

**Body :**
```json
{
  "productId": "uuid-du-produit",
  "quantity": 2
}
```

### GET `/api/v1/cart/total`
**Rôle :** Récupère uniquement le total du panier

---

## 🛍️ ENDPOINTS COMMANDES

### POST `/api/v1/orders`
**Rôle :** Crée une nouvelle commande à partir du panier

**Body :**
```json
{
  "shippingAddressId": "uuid-de-l-adresse",
  "items": [
    {
      "productId": "uuid-du-produit",
      "quantity": 2
    }
  ],
  "notes": "Livrer entre 9h et 12h" // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": {
    "id": "order-uuid",
    "orderNumber": "CMD-1764741259485-7294",
    "status": "PENDING",
    "subtotal": 900000,
    "tax": 0,
    "shipping": 0,
    "discount": 0,
    "total": 900000,
    "shippingAddress": {
      "address": "123 Rue de la République",
      "city": "Dakar",
      "region": "Dakar",
      "country": "Sénégal"
    },
    "items": [...],
    "createdAt": "2025-12-03T05:54:19.490Z"
  }
}
```

**⚠️ Important :** 
- Le panier est automatiquement vidé après création de la commande
- Le stock est réservé lors de la création
- Une commande ne peut avoir qu'un seul paiement

### GET `/api/v1/orders/:id/summary`
**Rôle :** Récupère le récapitulatif détaillé d'une commande

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "CMD-XXX",
    "status": "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
    "subtotal": 900000,
    "total": 900000,
    "shippingAddress": {...},
    "items": [...],
    "payment": {
      "id": "payment-uuid",
      "method": "MOBILE_MONEY" | "CASH_ON_DELIVERY" | "DIRECT_CONTACT",
      "status": "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED",
      "amount": 900000
    }
  }
}
```

### GET `/api/v1/orders/:id/confirmation`
**Rôle :** Récupère la confirmation d'une commande (format optimisé pour page de succès)

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "CMD-XXX",
    "status": "CONFIRMED",
    "total": 900000,
    "items": [
      {
        "product": {
          "name": "Nom du produit",
          "image": "https://..."
        },
        "quantity": 2,
        "total": 900000
      }
    ],
    "payment": {
      "method": "MOBILE_MONEY",
      "status": "COMPLETED"
    }
  }
}
```

---

## 💳 ENDPOINTS PAIEMENTS

### POST `/api/v1/payments/mobile-money`
**Rôle :** Initie un paiement Mobile Money via PayDunya

**Body :**
```json
{
  "orderId": "uuid-de-la-commande",
  "provider": "ORANGE_MONEY" | "WAVE" | "MTN" | "MOOV" | "T_MONEY",
  "phoneNumber": "+221771234567"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "orderNumber": "CMD-XXX",
    "method": "MOBILE_MONEY",
    "status": "PENDING",
    "amount": 900000,
    "paymentUrl": "https://paydunya.com/sandbox-checkout/invoice/test_JZAo8SakxF",
    "token": "test_JZAo8SakxF"
  }
}
```

**⚠️ Important :**
- Rediriger l'utilisateur vers `paymentUrl`
- PayDunya redirigera vers `FRONTEND_URL/orders/success?token=XXX` après paiement
- Le token est utilisé pour vérifier le statut du paiement

### POST `/api/v1/payments/cash-on-delivery`
**Rôle :** Confirme un paiement à la livraison

**Body :**
```json
{
  "orderId": "uuid-de-la-commande",
  "notes": "Préparer la monnaie" // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "orderId": "order-uuid",
    "orderNumber": "CMD-XXX",
    "method": "CASH_ON_DELIVERY",
    "status": "PENDING",
    "amount": 900000,
    "message": "Paiement à la livraison confirmé..."
  }
}
```

### POST `/api/v1/payments/direct-contact`
**Rôle :** Enregistre une demande de contact direct

**Body :**
```json
{
  "orderId": "uuid-de-la-commande",
  "email": "client@example.com",
  "phone": "+221771234567",
  "message": "Je souhaite payer par virement bancaire"
}
```

### POST `/api/v1/orders/:id/payment`
**Rôle :** Traite le paiement d'une commande (endpoint unifié)

**Body pour Mobile Money :**
```json
{
  "method": "MOBILE_MONEY",
  "phoneNumber": "+221771234567",
  "provider": "ORANGE_MONEY"
}
```

**Body pour Cash on Delivery :**
```json
{
  "method": "CASH_ON_DELIVERY",
  "notes": "Livrer entre 9h et 12h"
}
```

**Body pour Direct Contact :**
```json
{
  "method": "DIRECT_CONTACT",
  "email": "client@example.com",
  "phone": "+221771234567",
  "message": "Message personnalisé"
}
```

---

## 🔔 FLUX PAYDUNYA - PAGE DE SUCCÈS

### Problème Actuel
Après paiement sur PayDunya, l'utilisateur est redirigé vers :
```
http://localhost:5173/orders/success?token=test_JZAo8SakxF
```

Cette page est blanche car elle n'existe pas ou n'a pas de logique.

### Solution Requise

La page `/orders/success` doit :

1. **Récupérer le token depuis l'URL**
   ```typescript
   const searchParams = new URLSearchParams(window.location.search);
   const token = searchParams.get('token');
   ```

2. **Vérifier le statut du paiement**
   - Option 1 : Utiliser le token pour trouver la commande et vérifier le statut
   - Option 2 : Créer un endpoint dédié `/api/v1/payments/verify/:token`

3. **Afficher les détails de la commande**
   - Utiliser `GET /api/v1/orders/:id/confirmation` avec l'ID de la commande

4. **Afficher un message de confirmation**
   - Si paiement réussi : "Votre paiement a été effectué avec succès"
   - Si paiement en attente : "Votre paiement est en cours de traitement"
   - Si paiement échoué : "Votre paiement a échoué. Veuillez réessayer"

### Endpoint Recommandé pour Vérification

**GET `/api/v1/payments/verify/:token`**
**Rôle :** Vérifie le statut d'un paiement PayDunya via son token

**Réponse :**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment-uuid",
      "status": "COMPLETED" | "PENDING" | "FAILED",
      "method": "MOBILE_MONEY",
      "amount": 900000
    },
    "order": {
      "id": "order-uuid",
      "orderNumber": "CMD-XXX",
      "status": "CONFIRMED",
      "total": 900000
    }
  }
}
```

---

## 📝 STATUTS IMPORTANTS

### Statuts de Commande
- `PENDING` : Commande créée, en attente de paiement
- `CONFIRMED` : Commande confirmée (paiement validé ou à la livraison)
- `PROCESSING` : Commande en cours de traitement
- `SHIPPED` : Commande expédiée
- `DELIVERED` : Commande livrée
- `CANCELLED` : Commande annulée

### Statuts de Paiement
- `PENDING` : Paiement en attente
- `COMPLETED` : Paiement complété
- `FAILED` : Paiement échoué
- `CANCELLED` : Paiement annulé

---

## 🎯 SCÉNARIOS D'UTILISATION

### Scénario 1 : Paiement Mobile Money
1. Utilisateur crée une commande
2. Utilisateur choisit "Mobile Money"
3. Frontend appelle `POST /api/v1/payments/mobile-money`
4. Frontend redirige vers `paymentUrl` (PayDunya)
5. Utilisateur paie sur PayDunya
6. PayDunya redirige vers `/orders/success?token=XXX`
7. Page de succès vérifie le statut et affiche la confirmation

### Scénario 2 : Paiement à la livraison
1. Utilisateur crée une commande
2. Utilisateur choisit "Paiement à la livraison"
3. Frontend appelle `POST /api/v1/payments/cash-on-delivery`
4. Frontend redirige directement vers `/orders/success` (sans token)
5. Page de succès affiche la confirmation

### Scénario 3 : Contact direct
1. Utilisateur crée une commande
2. Utilisateur choisit "Contact direct"
3. Frontend appelle `POST /api/v1/payments/direct-contact`
4. Frontend redirige vers `/orders/success` (sans token)
5. Page de succès affiche le message de confirmation

---

## 🐛 GESTION D'ERREURS

### Erreurs Communes

**401 Unauthorized**
- Token expiré ou invalide
- Solution : Reconnecter l'utilisateur

**400 Bad Request**
- Données invalides
- Stock insuffisant
- Commande déjà payée
- Solution : Afficher le message d'erreur à l'utilisateur

**404 Not Found**
- Commande non trouvée
- Adresse non trouvée
- Solution : Vérifier les IDs

**500 Internal Server Error**
- Erreur serveur
- Solution : Logger l'erreur et afficher un message générique

---

## 🔗 CONFIGURATION PAYDUNYA

Dans le fichier `.env` :
```env
PAYDUNYA_MODE=sandbox  # ou 'live' pour production
FRONTEND_URL=http://localhost:5173  # URL de redirection après paiement
```

PayDunya redirigera automatiquement vers :
```
${FRONTEND_URL}/orders/success?token=${token}
```

---

## 📱 EXEMPLE DE CODE FRONTEND

### Page de Succès (`/orders/success`)

```typescript
// Récupérer le token depuis l'URL
const token = new URLSearchParams(window.location.search).get('token');

if (token) {
  // Vérifier le statut du paiement
  const response = await fetch(`/api/v1/payments/verify/${token}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Afficher les détails de la commande
    displayOrderConfirmation(data.data.order);
  }
} else {
  // Pas de token = paiement cash on delivery ou direct contact
  // Récupérer la dernière commande de l'utilisateur
  const orders = await fetchUserOrders();
  displayOrderConfirmation(orders[0]);
}
```

---

## ✅ CHECKLIST D'INTÉGRATION

- [ ] Page panier fonctionnelle
- [ ] Création de commande depuis le panier
- [ ] Sélection de méthode de paiement
- [ ] Redirection vers PayDunya (Mobile Money)
- [ ] Page `/orders/success` créée
- [ ] Vérification du statut de paiement
- [ ] Affichage de la confirmation
- [ ] Gestion des erreurs
- [ ] Messages de chargement
- [ ] Redirection après succès

