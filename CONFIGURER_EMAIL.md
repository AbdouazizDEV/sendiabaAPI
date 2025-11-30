# 🔧 Configuration Email - Guide Étape par Étape

## ❌ Problème actuel

Votre fichier `.env` contient encore les valeurs par défaut :
- `MAIL_USER=votre_email@gmail.com` ❌
- `MAIL_PASSWORD=votre_mot_de_passe_application` ❌

Il faut les remplacer par vos **vraies informations**.

---

## ✅ Solution : Configuration complète

### Étape 1 : Générer un mot de passe d'application Gmail

1. **Allez sur** : https://myaccount.google.com/apppasswords
   - Si vous ne voyez pas cette page, activez d'abord la validation en deux étapes

2. **Sélectionnez** :
   - Application : `Mail`
   - Appareil : `Autre (nom personnalisé)`
   - Nom : `Sendiaba API`

3. **Cliquez sur "Générer"**

4. **Copiez le mot de passe** (16 caractères, format : `abcd efgh ijkl mnop`)
   - ⚠️ **IMPORTANT** : Copiez-le maintenant, vous ne pourrez plus le voir après !

---

### Étape 2 : Mettre à jour le fichier .env

Ouvrez le fichier `.env` dans votre éditeur et trouvez ces lignes :

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre_email@gmail.com
MAIL_PASSWORD=votre_mot_de_passe_application
MAIL_FROM=noreply@sendiaba.com
```

**Remplacez-les par vos vraies informations** :

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=abdouazizdiop583@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=noreply@sendiaba.com
```

**Exemple concret** (remplacez par VOS valeurs) :
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=abdouazizdiop583@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM=noreply@sendiaba.com
```

⚠️ **Points importants** :
- `MAIL_USER` : Votre **adresse email Gmail complète**
- `MAIL_PASSWORD` : Le **mot de passe d'application** généré (16 caractères)
- Vous pouvez garder les espaces dans le mot de passe ou les enlever
- **NE PAS** utiliser votre mot de passe Gmail normal

---

### Étape 3 : Tester la configuration

Après avoir mis à jour le `.env`, testez avec :

```bash
node test-email-config.js
```

**Si c'est correct**, vous verrez :
```
✅ Connexion réussie ! Le serveur email est prêt à envoyer des emails.
```

**Si ça ne marche toujours pas**, vérifiez :
1. Que vous avez bien copié le mot de passe d'application (pas votre mot de passe Gmail)
2. Que l'authentification à deux facteurs est activée
3. Que vous avez bien mis votre email complet dans `MAIL_USER`

---

### Étape 4 : Redémarrer l'application

Après avoir mis à jour le `.env` :

```bash
# Arrêtez l'application (Ctrl+C)
# Puis redémarrez
npm run start:dev
```

---

## 🔍 Vérification rapide

Pour vérifier que vos variables sont bien chargées :

```bash
# Affiche les variables email (sans afficher le mot de passe complet)
cat .env | grep MAIL
```

Vous devriez voir :
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=abdouazizdiop583@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=noreply@sendiaba.com
```

---

## ❓ Problèmes courants

### "Invalid login" persiste

1. **Vérifiez le format du mot de passe d'application**
   - Il doit avoir 16 caractères
   - Format : `xxxx xxxx xxxx xxxx` (avec ou sans espaces)

2. **Vérifiez que vous utilisez le bon email**
   - `MAIL_USER` doit être votre adresse Gmail complète
   - Exemple : `abdouazizdiop583@gmail.com` (pas juste `abdouazizdiop583`)

3. **Vérifiez que l'authentification à deux facteurs est activée**
   - Allez sur : https://myaccount.google.com/security
   - Vérifiez que "Validation en deux étapes" est activée

4. **Générez un nouveau mot de passe d'application**
   - Parfois, les anciens mots de passe ne fonctionnent plus
   - Supprimez l'ancien et créez-en un nouveau

---

## 🚀 Test final

Une fois configuré, testez l'envoi d'email :

```bash
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "abdouazizdiop583@gmail.com"
}
```

**Si tout fonctionne**, vous verrez dans les logs :
```
✅ Email de réinitialisation envoyé à abdouazizdiop583@gmail.com
```

Et vous recevrez l'email dans votre boîte de réception (vérifiez aussi les spams).

---

## 📝 Résumé

1. ✅ Activer validation en deux étapes (déjà fait d'après l'image)
2. ✅ Générer mot de passe d'application : https://myaccount.google.com/apppasswords
3. ⚠️ **Mettre à jour le .env avec vos vraies informations**
4. ✅ Tester avec `node test-email-config.js`
5. ✅ Redémarrer l'application

**Le problème principal** : Votre `.env` contient encore `votre_email@gmail.com` au lieu de votre vrai email !

