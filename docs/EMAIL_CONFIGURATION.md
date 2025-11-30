# Configuration Email - Sendiaba API

## 📧 Configuration de l'envoi d'emails pour la réinitialisation de mot de passe

### Configuration Gmail (Recommandé pour le développement)

#### Étape 1 : Activer l'authentification à deux facteurs

1. Allez sur [Google Account Security](https://myaccount.google.com/security)
2. Activez l'**Authentification à deux facteurs** si ce n'est pas déjà fait

#### Étape 2 : Générer un mot de passe d'application

1. Allez sur [App Passwords](https://myaccount.google.com/apppasswords)
2. Sélectionnez **"Mail"** comme application
3. Sélectionnez **"Autre (nom personnalisé)"** comme appareil
4. Entrez "Sendiaba API" comme nom
5. Cliquez sur **"Générer"**
6. **Copiez le mot de passe généré** (16 caractères sans espaces)

#### Étape 3 : Configurer le fichier .env

Mettez à jour votre fichier `.env` avec vos informations :

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=votre_email@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Le mot de passe d'application généré
MAIL_FROM=noreply@sendiaba.com
```

**⚠️ Important :** Utilisez le **mot de passe d'application** (pas votre mot de passe Gmail normal).

---

### Configuration avec d'autres services SMTP

#### Outlook / Microsoft 365

```env
MAIL_HOST=smtp.office365.com
MAIL_PORT=587
MAIL_USER=votre_email@outlook.com
MAIL_PASSWORD=votre_mot_de_passe
MAIL_FROM=noreply@sendiaba.com
```

#### SendGrid

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=votre_api_key_sendgrid
MAIL_FROM=noreply@sendiaba.com
```

#### Mailgun

```env
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=postmaster@votre-domaine.mailgun.org
MAIL_PASSWORD=votre_mot_de_passe_mailgun
MAIL_FROM=noreply@sendiaba.com
```

#### Amazon SES

```env
MAIL_HOST=email-smtp.region.amazonaws.com
MAIL_PORT=587
MAIL_USER=votre_access_key_id
MAIL_PASSWORD=votre_secret_access_key
MAIL_FROM=noreply@sendiaba.com
```

---

### Test de la configuration

Pour tester si votre configuration email fonctionne, vous pouvez créer un endpoint de test (optionnel) :

```typescript
// Dans auth.controller.ts (à ajouter temporairement pour les tests)
@Post('test-email')
async testEmail(@Body('email') email: string) {
  await this.mailService.sendPasswordResetEmail(
    email,
    'test-token-123',
    'Test User'
  );
  return { message: 'Email de test envoyé' };
}
```

---

### Template Email

Le template d'email de réinitialisation de mot de passe est situé dans :
```
src/modules/mail/templates/password-reset.template.ts
```

Il inclut :
- ✅ Logo Sendiaba
- ✅ Design responsive et moderne
- ✅ Bouton de réinitialisation stylisé
- ✅ Lien de secours
- ✅ Avertissements de sécurité
- ✅ Footer avec informations de contact

---

### Variables d'environnement requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Port SMTP (587 pour TLS, 465 pour SSL) | `587` |
| `MAIL_USER` | Email d'envoi | `votre_email@gmail.com` |
| `MAIL_PASSWORD` | Mot de passe ou clé API | `xxxx xxxx xxxx xxxx` |
| `MAIL_FROM` | Nom d'affichage de l'expéditeur | `noreply@sendiaba.com` |
| `FRONTEND_URL` | URL du frontend pour les liens | `http://localhost:4200` |

---

### Sécurité

⚠️ **Important :**
- Ne commitez **jamais** le fichier `.env` dans Git
- Utilisez des **mots de passe d'application** pour Gmail (pas votre mot de passe principal)
- En production, utilisez des services dédiés comme SendGrid, Mailgun ou Amazon SES
- Limitez le taux d'envoi d'emails pour éviter le spam

---

### Dépannage

#### Erreur : "Invalid login"

- Vérifiez que vous utilisez un **mot de passe d'application** (pas votre mot de passe Gmail)
- Vérifiez que l'authentification à deux facteurs est activée

#### Erreur : "Connection timeout"

- Vérifiez que le port est correct (587 pour TLS, 465 pour SSL)
- Vérifiez votre pare-feu
- Essayez avec `secure: true` pour le port 465

#### Email non reçu

- Vérifiez le dossier spam
- Vérifiez les logs de l'application
- Testez avec un autre service email

---

### Production

Pour la production, il est recommandé d'utiliser :
- **SendGrid** : Service fiable avec bon délivrabilité
- **Mailgun** : Excellent pour les transactions
- **Amazon SES** : Économique pour gros volumes
- **Postmark** : Spécialisé dans les emails transactionnels

