# 🔧 Configuration Gmail pour Sendiaba API

## ❌ Erreur actuelle : "Invalid login: 535-5.7.8 Username and Password not accepted"

Cette erreur signifie que Gmail refuse l'authentification. Suivez ces étapes pour résoudre le problème :

---

## 📋 Étapes de configuration Gmail

### Étape 1 : Activer l'authentification à deux facteurs

1. Allez sur [Google Account Security](https://myaccount.google.com/security)
2. Dans la section **"Connexion à Google"**, cliquez sur **"Validation en deux étapes"**
3. Suivez les instructions pour activer la validation en deux étapes
4. ⚠️ **C'est obligatoire** pour générer un mot de passe d'application

---

### Étape 2 : Générer un mot de passe d'application

1. Allez sur [App Passwords](https://myaccount.google.com/apppasswords)
   - Si le lien ne fonctionne pas, allez sur [myaccount.google.com](https://myaccount.google.com) → Sécurité → Validation en deux étapes → Mots de passe des applications

2. Sélectionnez :
   - **Application** : `Mail`
   - **Appareil** : `Autre (nom personnalisé)`
   - **Nom** : `    `

3. Cliquez sur **"Générer"**

4. **Copiez le mot de passe généré** (16 caractères, format : `xxxx xxxx xxxx xxxx`)
   - ⚠️ **Important** : Vous ne pourrez plus voir ce mot de passe après. Copiez-le maintenant !

---

### Étape 3 : Mettre à jour le fichier .env

Ouvrez votre fichier `.env` et mettez à jour ces lignes :

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre_email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx
MAIL_FROM=noreply@sendiaba.com
```

**Exemple concret :**
```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=abdouazizdiop583@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop
MAIL_FROM=noreply@sendiaba.com
```

⚠️ **Points importants :**
- Utilisez votre **adresse email Gmail complète** dans `MAIL_USER`
- Utilisez le **mot de passe d'application** (16 caractères) dans `MAIL_PASSWORD`
- **NE PAS** utiliser votre mot de passe Gmail normal
- Vous pouvez garder les espaces dans le mot de passe d'application ou les enlever

---

### Étape 4 : Redémarrer l'application

Après avoir mis à jour le `.env`, redémarrez votre application :

```bash
# Arrêtez l'application (Ctrl+C)
# Puis redémarrez
npm run start:dev
```

---

## ✅ Vérification

Pour vérifier que la configuration fonctionne, testez l'endpoint :

```bash
POST http://localhost:3000/api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "votre_email@example.com"
}
```

Si tout est correct, vous devriez voir dans les logs :
```
✅ Email de réinitialisation envoyé à votre_email@example.com
```

---

## 🔍 Dépannage

### Erreur persiste après configuration

1. **Vérifiez que l'authentification à deux facteurs est activée**
   - Allez sur [Google Account Security](https://myaccount.google.com/security)
   - Vérifiez que "Validation en deux étapes" est activée

2. **Vérifiez le format du mot de passe**
   - Le mot de passe d'application doit avoir 16 caractères
   - Format : `xxxx xxxx xxxx xxxx` (avec ou sans espaces)

3. **Vérifiez les variables d'environnement**
   ```bash
   # Vérifiez que les variables sont bien chargées
   cat .env | grep MAIL
   ```

4. **Testez la connexion manuellement**
   - Créez un fichier de test temporaire pour vérifier la connexion

### "Less secure app access" (ancien système)

⚠️ **Note** : Google a supprimé l'option "Accès aux applications moins sécurisées". Vous **DEVEZ** utiliser un mot de passe d'application avec l'authentification à deux facteurs.

---

## 🚀 Alternative : Utiliser un autre service email

Si vous continuez à avoir des problèmes avec Gmail, vous pouvez utiliser :

### SendGrid (Recommandé pour production)
```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=votre_api_key_sendgrid
```

### Mailgun
```env
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=postmaster@votre-domaine.mailgun.org
MAIL_PASSWORD=votre_mot_de_passe_mailgun
```

---

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes :
1. Vérifiez les logs de l'application pour plus de détails
2. Consultez la documentation : `docs/EMAIL_CONFIGURATION.md`
3. Vérifiez que votre compte Gmail n'est pas bloqué ou suspendu

