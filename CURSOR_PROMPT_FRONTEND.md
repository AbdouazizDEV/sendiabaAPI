# Prompt pour Cursor - Intégration Frontend Commandes & Paiements

## 🎯 OBJECTIF

Créer la page `/orders/success` qui affiche la confirmation de commande après paiement PayDunya. Actuellement, cette page est blanche car elle n'existe pas ou n'a pas de logique.

## 📋 CONTEXTE

### Flux de Paiement PayDunya

1. L'utilisateur crée une commande via `POST /api/v1/orders`
2. L'utilisateur choisit le paiement Mobile Money
3. Le frontend appelle `POST /api/v1/payments/mobile-money` qui retourne :
   ```json
   {
     "paymentUrl": "https://paydunya.com/sandbox-checkout/invoice/test_JZAo8SakxF",
     "token": "test_JZAo8SakxF"
   }
   ```
4. L'utilisateur est redirigé vers `paymentUrl` (PayDunya)
5. Après paiement, PayDunya redirige vers : `http://localhost:5173/orders/success?token=test_JZAo8SakxF`
6. **PROBLÈME ACTUEL** : Cette page est blanche car elle n'existe pas ou n'a pas de logique

## 🔌 ENDPOINTS API DISPONIBLES

### Base URL
```
http://localhost:3000/api/v1
```

### Authentification
Tous les endpoints nécessitent un header :
```
Authorization: Bearer <access_token>
```

### 1. Vérifier le statut d'un paiement PayDunya
**GET `/api/v1/payments/verify/:token`**

**Rôle :** Vérifie le statut d'un paiement via le token PayDunya retourné dans l'URL

**Paramètre :** `token` (dans l'URL, ex: `test_JZAo8SakxF`)

**Réponse :**
```json
{
  "success": true,
  "message": "Statut du paiement récupéré avec succès",
  "data": {
    "payment": {
      "id": "payment-uuid",
      "status": "COMPLETED" | "PENDING" | "FAILED" | "CANCELLED",
      "method": "MOBILE_MONEY",
      "amount": 450000,
      "currency": "XOF",
      "paydunyaReceiptUrl": "https://paydunya.com/receipt/...",
      "transactionId": "TXN123456",
      "paidAt": "2025-12-03T05:56:44.929Z"
    },
    "order": {
      "id": "order-uuid",
      "orderNumber": "CMD-1764741404562-4560",
      "status": "CONFIRMED" | "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
      "total": 450000,
      "items": [
        {
          "product": {
            "name": "Téléphone Samsung Galaxy S222",
            "image": "https://res.cloudinary.com/..."
          },
          "quantity": 1,
          "total": 450000
        }
      ]
    }
  }
}
```

### 2. Récupérer la confirmation d'une commande
**GET `/api/v1/orders/:id/confirmation`**

**Rôle :** Récupère les détails de confirmation d'une commande (format optimisé)

**Paramètre :** `id` (UUID de la commande)

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

## 🎨 CE QUE DOIT FAIRE LA PAGE `/orders/success`

### Scénario 1 : Paiement Mobile Money (avec token)
1. **Récupérer le token depuis l'URL**
   ```typescript
   const searchParams = new URLSearchParams(window.location.search);
   const token = searchParams.get('token');
   ```

2. **Appeler l'API pour vérifier le statut**
   ```typescript
   GET /api/v1/payments/verify/${token}
   ```

3. **Afficher les informations selon le statut :**
   - **Si `payment.status === "COMPLETED"`** :
     - ✅ Message de succès : "Votre paiement a été effectué avec succès !"
     - Afficher le numéro de commande
     - Afficher le montant total
     - Afficher la liste des produits commandés
     - Afficher un lien vers le reçu PayDunya (si disponible)
     - Bouton "Voir ma commande" ou "Retour à l'accueil"
   
   - **Si `payment.status === "PENDING"`** :
     - ⏳ Message : "Votre paiement est en cours de traitement"
     - Afficher les détails de la commande
     - Message : "Vous recevrez une confirmation par email une fois le paiement validé"
   
   - **Si `payment.status === "FAILED"`** :
     - ❌ Message d'erreur : "Votre paiement a échoué"
     - Bouton "Réessayer le paiement"
     - Bouton "Contacter le support"
   
   - **Si `payment.status === "CANCELLED"`** :
     - ⚠️ Message : "Paiement annulé"
     - Bouton "Réessayer" ou "Retour au panier"

### Scénario 2 : Paiement à la livraison ou Contact direct (sans token)
Si pas de token dans l'URL, cela signifie que c'est un paiement à la livraison ou contact direct.

1. **Récupérer la dernière commande de l'utilisateur**
   - Utiliser un endpoint pour récupérer les commandes récentes
   - Ou stocker l'ID de la commande dans le localStorage avant la redirection

2. **Afficher la confirmation**
   - Message de confirmation selon la méthode :
     - Cash on Delivery : "Votre commande sera livrée et payée à la réception"
     - Direct Contact : "Votre demande de contact a été enregistrée. L'équipe vous contactera bientôt."

## 📝 STRUCTURE DE LA PAGE

```typescript
// Page: /orders/success
interface SuccessPageProps {}

const OrderSuccessPage: React.FC<SuccessPageProps> = () => {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // 1. Récupérer le token depuis l'URL
    const token = new URLSearchParams(window.location.search).get('token');
    
    if (token) {
      // 2. Appeler l'API pour vérifier le statut
      verifyPayment(token);
    } else {
      // 3. Pas de token = Cash on Delivery ou Direct Contact
      handleNoToken();
    }
  }, []);
  
  const verifyPayment = async (token: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/payments/verify/${token}`,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}` // Fonction pour récupérer le token JWT
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification du paiement');
      }
      
      const data = await response.json();
      setPaymentData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Rendu selon le statut
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!paymentData) return <NoDataMessage />;
  
  return (
    <div className="order-success-page">
      {/* Afficher selon paymentData.payment.status */}
      {renderStatusMessage(paymentData)}
      {renderOrderDetails(paymentData.order)}
      {renderActions(paymentData)}
    </div>
  );
};
```

## 🎨 ÉLÉMENTS UI À CRÉER

### 1. Message de Statut
- ✅ Succès (vert) : "Paiement effectué avec succès !"
- ⏳ En attente (orange) : "Paiement en cours de traitement"
- ❌ Échec (rouge) : "Paiement échoué"
- ⚠️ Annulé (gris) : "Paiement annulé"

### 2. Détails de la Commande
- Numéro de commande (ex: CMD-1764741404562-4560)
- Date de la commande
- Montant total
- Liste des produits avec images
- Adresse de livraison (optionnel)

### 3. Actions
- **Si succès :**
  - Bouton "Voir ma commande" → `/orders/:id`
  - Bouton "Télécharger le reçu" (si `paydunyaReceiptUrl` disponible)
  - Bouton "Retour à l'accueil" → `/`
  
- **Si échec :**
  - Bouton "Réessayer le paiement" → Retour à la page de paiement
  - Bouton "Contacter le support" → `/contact`

### 4. Informations Supplémentaires
- Lien vers le reçu PayDunya (si `payment.paydunyaReceiptUrl` existe)
- Numéro de transaction (si `payment.transactionId` existe)
- Méthode de paiement utilisée

## 🔧 GESTION D'ERREURS

### Erreur 401 (Unauthorized)
- Token JWT expiré ou invalide
- Solution : Rediriger vers la page de connexion

### Erreur 404 (Not Found)
- Paiement non trouvé pour ce token
- Solution : Afficher un message "Commande non trouvée" avec un bouton "Retour à l'accueil"

### Erreur 500 (Server Error)
- Erreur serveur
- Solution : Afficher un message générique avec possibilité de contacter le support

## 📱 RESPONSIVE DESIGN

La page doit être responsive et fonctionner sur :
- Desktop
- Tablet
- Mobile

## ✅ CHECKLIST DE DÉVELOPPEMENT

- [ ] Créer la route `/orders/success` dans le router
- [ ] Récupérer le token depuis l'URL
- [ ] Appeler l'endpoint `GET /api/v1/payments/verify/:token`
- [ ] Gérer les différents statuts de paiement
- [ ] Afficher les détails de la commande
- [ ] Afficher les produits commandés avec images
- [ ] Créer les boutons d'action selon le statut
- [ ] Gérer les cas sans token (Cash on Delivery, Direct Contact)
- [ ] Gérer les erreurs (401, 404, 500)
- [ ] Ajouter un état de chargement
- [ ] Rendre la page responsive
- [ ] Tester avec différents statuts de paiement
- [ ] Tester avec et sans token

## 🎯 EXEMPLE DE RENDU VISUEL

```
┌─────────────────────────────────────────┐
│  ✅ Paiement effectué avec succès !    │
│                                         │
│  Numéro de commande: CMD-XXX           │
│  Date: 03/12/2025                      │
│  Montant total: 450 000 XOF             │
│                                         │
│  Produits commandés:                   │
│  ┌─────────────────────────────────┐  │
│  │ [Image] Téléphone Samsung...     │  │
│  │ Quantité: 1 × 450 000 XOF        │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Télécharger le reçu]                  │
│  [Voir ma commande]  [Retour accueil]   │
└─────────────────────────────────────────┘
```

## 🔗 RESSOURCES

- Documentation API complète : `docs/FRONTEND_INTEGRATION_GUIDE.md`
- Guide de test : `docs/TEST_ORDERS_AND_PAYMENTS.md`
- Commandes curl : `CURL_COMMANDS_ORDERS_PAYMENTS.md`

## 💡 NOTES IMPORTANTES

1. **Token JWT** : N'oubliez pas d'inclure le token JWT dans les headers de toutes les requêtes API
2. **Gestion du token** : Le token peut être stocké dans le localStorage ou dans un contexte React
3. **Synchronisation** : L'endpoint `/payments/verify/:token` synchronise automatiquement le statut avec PayDunya si nécessaire
4. **Reçu PayDunya** : Si disponible, afficher un lien vers `payment.paydunyaReceiptUrl`
5. **Numéro de transaction** : Afficher `payment.transactionId` si disponible pour référence

---

**IMPORTANT :** Cette page est critique pour l'expérience utilisateur. Elle doit être claire, informative et offrir toutes les actions nécessaires selon le statut du paiement.

