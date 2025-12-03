# 💳 Configuration PayDunya

Ce guide vous aidera à configurer correctement PayDunya pour l'intégration des paiements dans Sendiaba API.

## 📋 Prérequis

- Compte PayDunya Business actif
- Accès à l'interface d'administration PayDunya
- URL de votre API accessible publiquement (pour l'IPN en production)

## 🔧 Configuration dans PayDunya

### 1. Configuration de l'Application

Sur la page **"Configuration d'une nouvelle application"** dans PayDunya :

#### ✅ Informations de base

- **Nom de l'application** : `Sendiaba` ✅ (déjà configuré)
- **Petite Description** : ✅ (déjà configurée)
- **URL du site Web** : 
  - **En développement** : `http://localhost:3000` ou `http://127.0.0.1:3000`
  - **En production** : `https://votre-domaine.com` (remplacer par votre domaine réel)
  
  ⚠️ **Important** : Remplacez `http://www.exemple.com` par votre URL réelle.

#### ✅ Services

- **Payin** : ✅ Activé (pour recevoir des paiements)
- **Payout** : ⬜ Optionnel (pour envoyer de l'argent)

#### ✅ Mode de fonctionnement

- **Activer le mode production** : 
  - **Pour les tests** : Sélectionnez `Mode test, je veux faire des tests de paiements.`
  - **Pour la production** : Sélectionnez `Mode production` (après validation)

#### ✅ Facturation

- **Envoyer Facture après paiement** : 
  - Sélectionnez `Envoyer une facture au client` ✅

### 2. Configuration des Moyens de Paiement

Dans la section **"Moyens de paiements à afficher sur la page de paiement"** :

#### ✅ Carte Bancaire
- **CARD** : ✅ Activé

#### ✅ Mobile Money par Pays

**Sénégal** :
- ✅ **ORANGE MONEY SENEGAL**
- ✅ **WAVE SENEGAL**

**Burkina Faso** :
- ✅ **ORANGE MONEY BURKINA**
- ✅ **MOOV BURKINA FASO**

**Côte d'Ivoire** :
- ✅ **ORANGE MONEY CI**
- ✅ **MTN CI**
- ✅ **MOOV CI**
- ✅ **Wave CI**

**Togo** :
- ✅ **T MONEY TOGO**
- ✅ **MOOV TOGO**

**Mali** :
- ✅ **ORANGE MONEY MALI**

### 3. Configuration IPN (Instant Payment Notification) ⚠️ CRITIQUE

L'IPN permet à PayDunya de notifier votre API lorsqu'un paiement est effectué.

#### 📍 Endpoint IPN

Dans la section **"Instant Payment Notification (IPN)"** :

**En développement (local)** :
```
http://localhost:3000/api/v1/payments/paydunya/webhook
```

⚠️ **Note** : Pour tester en local, vous devrez utiliser un service de tunneling. Voici plusieurs options :

### 🔧 Option 1 : ngrok (Recommandé)

**Étape 1 : Créer un compte ngrok (gratuit)**
1. Allez sur [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2. Créez un compte gratuit
3. Connectez-vous à votre dashboard

**Étape 2 : Récupérer votre authtoken**
1. Dans le dashboard, allez dans **"Your Authtoken"** : [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Copiez votre authtoken

**Étape 3 : Configurer ngrok**
```bash
# Configurer l'authtoken
ngrok config add-authtoken VOTRE_AUTHTOKEN_ICI

# Vérifier la configuration
ngrok config check
```

**Étape 4 : Lancer ngrok**
```bash
# Dans un terminal séparé, lancez ngrok
ngrok http 3000
```

**Étape 5 : Utiliser l'URL générée**
- ngrok affichera une URL HTTPS (ex: `https://abc123.ngrok.io`)
- Utilisez cette URL pour l'endpoint IPN : `https://abc123.ngrok.io/api/v1/payments/paydunya/webhook`

### 🔧 Option 2 : localtunnel (Alternative gratuite, sans compte)

```bash
# Installer localtunnel
npm install -g localtunnel

# Lancer localtunnel
lt --port 3000

# Utiliser l'URL générée (ex: https://abc123.loca.lt)
# Endpoint IPN: https://abc123.loca.lt/api/v1/payments/paydunya/webhook
```

**Note** : localtunnel peut être moins stable que ngrok, mais ne nécessite pas de compte.

### 🔧 Option 3 : serveo (Alternative via SSH)

```bash
# Lancer serveo (nécessite SSH)
ssh -R 80:localhost:3000 serveo.net

# Utiliser l'URL générée
# Endpoint IPN: https://votre-url.serveo.net/api/v1/payments/paydunya/webhook
```

**Note** : serveo est gratuit mais peut être moins fiable.

**En production** :
```
https://votre-domaine.com/api/v1/payments/paydunya/webhook
```

#### ✅ Activer l'IPN

- **Activer** : Sélectionnez `Oui` ✅

⚠️ **Important** : L'IPN doit être activé pour que les notifications de paiement fonctionnent.

### 4. Récupération des Clés API

Après avoir sauvegardé la configuration, PayDunya génère des clés API. Vous devez les récupérer :

1. Allez dans la section **"Intégrez notre API"**
2. Cliquez sur votre application **"Sendiaba"**
3. Récupérez les clés suivantes :
   - **Master Key** (clé principale)
   - **Private Key** (clé privée)
   - **Public Key** (clé publique)
   - **Token** (token d'authentification)

⚠️ **Sécurité** : Ne partagez jamais ces clés publiquement. Elles doivent être stockées dans des variables d'environnement.

## 🔐 Configuration des Variables d'Environnement

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
# PayDunya Configuration
PAYDUNYA_MODE=test
# Options: 'test' ou 'live'

# Clés API PayDunya (Mode Test)
PAYDUNYA_TEST_MASTER_KEY=votre_master_key_test
PAYDUNYA_TEST_PRIVATE_KEY=votre_private_key_test
PAYDUNYA_TEST_PUBLIC_KEY=votre_public_key_test
PAYDUNYA_TEST_TOKEN=votre_token_test

# Clés API PayDunya (Mode Production)
PAYDUNYA_LIVE_MASTER_KEY=votre_master_key_live
PAYDUNYA_LIVE_PRIVATE_KEY=votre_private_key_live
PAYDUNYA_LIVE_PUBLIC_KEY=votre_public_key_live
PAYDUNYA_LIVE_TOKEN=votre_token_live

# URL de l'API (pour les callbacks)
API_BASE_URL=http://localhost:3000
# En production: https://votre-domaine.com

# URL Frontend (pour redirections après paiement)
FRONTEND_URL=http://localhost:4200
# En production: https://votre-domaine.com
```

## 📝 Checklist de Configuration

Avant de commencer l'intégration, vérifiez que :

- [ ] L'URL du site Web est correctement configurée
- [ ] Les moyens de paiement nécessaires sont activés
- [ ] L'endpoint IPN est configuré et accessible
- [ ] L'IPN est activé dans PayDunya
- [ ] Les clés API sont récupérées (test et/ou production)
- [ ] Les variables d'environnement sont configurées dans `.env`
- [ ] Le service de tunneling est configuré (si test en local)

## 🧪 Test de l'Endpoint IPN

### Test en local (sans tunneling)

```bash
# Test avec curl (fonctionne seulement si l'API est accessible publiquement)
curl -X POST http://localhost:3000/api/v1/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Test avec ngrok

```bash
# 1. Lancer ngrok dans un terminal
ngrok http 3000

# 2. Dans un autre terminal, tester avec l'URL ngrok
curl -X POST https://votre-url-ngrok.io/api/v1/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### Test avec localtunnel

```bash
# 1. Lancer localtunnel dans un terminal
lt --port 3000

# 2. Dans un autre terminal, tester avec l'URL localtunnel
curl -X POST https://votre-url.loca.lt/api/v1/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

**Note** : L'endpoint IPN doit répondre avec un code HTTP 200 pour être considéré comme valide par PayDunya.

## 📚 Documentation PayDunya

- [Documentation API PayDunya](https://paydunya.com/developers)
- [Guide d'intégration](https://paydunya.com/developers/integration-guide)

## ⚠️ Notes Importantes

1. **Mode Test vs Production** :
   - En mode test, utilisez les clés de test
   - En mode production, utilisez les clés live
   - Les deux modes ont des endpoints différents

2. **Sécurité IPN** :
   - PayDunya signe les requêtes IPN avec une signature
   - Vérifiez toujours la signature pour éviter les fraudes
   - Utilisez HTTPS en production

3. **Webhook URL** :
   - L'URL doit être accessible publiquement
   - En local, utilisez un service de tunneling
   - En production, utilisez HTTPS

4. **Timeout** :
   - PayDunya attend une réponse dans les 30 secondes
   - Votre endpoint doit répondre rapidement

## ✅ Prochaines Étapes

Une fois la configuration PayDunya terminée :

1. ✅ Vérifiez que tous les éléments de la checklist sont cochés
2. ✅ Dites "ok" pour que je commence l'intégration des endpoints
3. 🔄 Je créerai les endpoints de commandes et paiements

---

**Besoin d'aide ?** Consultez la [documentation PayDunya](https://paydunya.com/developers) ou contactez le support PayDunya.

