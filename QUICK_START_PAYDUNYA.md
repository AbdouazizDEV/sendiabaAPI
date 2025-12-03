# 🚀 Guide Rapide - Configuration PayDunya

## Option 1 : Utiliser localtunnel (Sans compte, immédiat) ⚡

**localtunnel est déjà installé !**

### Étapes :

1. **Lancer localtunnel** (dans un terminal séparé) :
```bash
lt --port 3000
```

2. **Copier l'URL générée** (ex: `https://abc123.loca.lt`)

3. **Dans PayDunya, configurer l'endpoint IPN** :
```
https://abc123.loca.lt/api/v1/payments/paydunya/webhook
```

4. **Activer l'IPN** : Sélectionnez `Oui`

✅ **C'est tout !** Vous pouvez maintenant tester les webhooks PayDunya.

---

## Option 2 : Configurer ngrok (Recommandé pour production)

### Étapes :

1. **Créer un compte ngrok** (gratuit) :
   - Allez sur : https://dashboard.ngrok.com/signup
   - Créez un compte

2. **Récupérer votre authtoken** :
   - Allez sur : https://dashboard.ngrok.com/get-started/your-authtoken
   - Copiez votre authtoken

3. **Configurer ngrok** :
```bash
ngrok config add-authtoken VOTRE_AUTHTOKEN_ICI
```

4. **Lancer ngrok** (dans un terminal séparé) :
```bash
ngrok http 3000
```

5. **Copier l'URL HTTPS générée** (ex: `https://abc123.ngrok.io`)

6. **Dans PayDunya, configurer l'endpoint IPN** :
```
https://abc123.ngrok.io/api/v1/payments/paydunya/webhook
```

7. **Activer l'IPN** : Sélectionnez `Oui`

---

## 📝 Configuration dans PayDunya

### 1. URL du site Web
- **En développement** : `http://localhost:3000`
- **En production** : `https://votre-domaine.com`

### 2. Endpoint IPN
- Utilisez l'URL générée par localtunnel ou ngrok + `/api/v1/payments/paydunya/webhook`
- **Activer** : `Oui` ✅

### 3. Moyens de paiement
Vérifiez que ces moyens sont activés :
- ✅ Carte Bancaire (CARD)
- ✅ Orange Money Sénégal
- ✅ Wave Sénégal
- ✅ Orange Money Burkina, Moov Burkina Faso
- ✅ Orange Money CI, MTN CI, Moov CI, Wave CI
- ✅ T Money Togo, Moov Togo
- ✅ Orange Money Mali

### 4. Récupérer les clés API
Après sauvegarde, récupérez :
- Master Key
- Private Key
- Public Key
- Token

### 5. Ajouter dans `.env`

```env
# PayDunya Configuration
PAYDUNYA_MODE=test
PAYDUNYA_TEST_MASTER_KEY=votre_master_key_test
PAYDUNYA_TEST_PRIVATE_KEY=votre_private_key_test
PAYDUNYA_TEST_PUBLIC_KEY=votre_public_key_test
PAYDUNYA_TEST_TOKEN=votre_token_test

# URL de l'API
API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200
```

---

## ✅ Checklist

- [ ] Service de tunneling lancé (localtunnel ou ngrok)
- [ ] URL du site Web configurée dans PayDunya
- [ ] Endpoint IPN configuré dans PayDunya
- [ ] IPN activé dans PayDunya
- [ ] Moyens de paiement activés
- [ ] Clés API récupérées
- [ ] Variables d'environnement ajoutées dans `.env`

---

## 🧪 Test rapide

Une fois tout configuré, testez l'endpoint IPN :

```bash
# Avec localtunnel
curl -X POST https://votre-url.loca.lt/api/v1/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Avec ngrok
curl -X POST https://votre-url-ngrok.io/api/v1/payments/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

Si vous obtenez une réponse (même une erreur 404), c'est que l'endpoint est accessible ! ✅

---

## 📚 Documentation complète

Pour plus de détails, consultez : `docs/PAYDUNYA_CONFIGURATION.md`




