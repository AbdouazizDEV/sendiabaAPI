# Documentation API Sendiaba

## Base URL

```
http://localhost:3000/api/v1
```

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Après connexion, inclure le token dans le header :

```
Authorization: Bearer <access_token>
```

## Format des réponses

### Réponse réussie

```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

### Réponse d'erreur

```json
{
  "success": false,
  "message": "Message d'erreur",
  "error": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## Endpoints

### 🔐 Authentification

#### POST /auth/register

Inscription d'un nouvel utilisateur.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "firstName": "Amadou",
  "lastName": "Diallo",
  "phone": "+221 77 123 45 67",
  "role": "CUSTOMER"
}
```

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER",
      "firstName": "Amadou",
      "lastName": "Diallo"
    }
  }
}
```

#### POST /auth/login

Connexion d'un utilisateur.

**Body :**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Réponse 200 :** Même format que `/auth/register`

#### POST /auth/logout

Déconnexion (nécessite authentification).

**Headers :**
```
Authorization: Bearer <token>
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Déconnexion réussie",
  "data": null
}
```

#### POST /auth/forgot-password

Demande de réinitialisation de mot de passe.

**Body :**
```json
{
  "email": "user@example.com"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Si cet email existe, un lien de réinitialisation a été envoyé",
  "data": null
}
```

#### POST /auth/reset-password

Réinitialisation du mot de passe avec token.

**Body :**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewPassword123"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Mot de passe réinitialisé avec succès",
  "data": null
}
```

#### POST /auth/refresh

Rafraîchir le token d'accès.

**Body :**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse 200 :** Même format que `/auth/login`

### 👤 Profil

#### GET /profile

Récupérer le profil utilisateur (nécessite authentification).

**Headers :**
```
Authorization: Bearer <token>
```

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Profil récupéré avec succès",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CUSTOMER",
    "firstName": "Amadou",
    "lastName": "Diallo",
    "phone": "+221 77 123 45 67",
    "isEmailVerified": false,
    "isActive": true
  }
}
```

#### PUT /profile

Modifier le profil utilisateur (nécessite authentification).

**Body :**
```json
{
  "firstName": "Amadou",
  "lastName": "Diallo",
  "phone": "+221 77 123 45 67"
}
```

**Réponse 200 :** Même format que `GET /profile`

### 📍 Adresses

#### GET /profile/addresses

Liste des adresses (nécessite authentification).

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Adresses récupérées avec succès",
  "data": [
    {
      "id": "uuid",
      "label": "Domicile",
      "recipientName": "Amadou Diallo",
      "phone": "+221 77 123 45 67",
      "address": "123 Rue de la République",
      "city": "Dakar",
      "region": "Dakar",
      "postalCode": "12345",
      "country": "Sénégal",
      "isDefault": true
    }
  ]
}
```

#### POST /profile/addresses

Ajouter une adresse (nécessite authentification).

**Body :**
```json
{
  "label": "Domicile",
  "recipientName": "Amadou Diallo",
  "phone": "+221 77 123 45 67",
  "address": "123 Rue de la République",
  "city": "Dakar",
  "region": "Dakar",
  "postalCode": "12345",
  "isDefault": true
}
```

**Réponse 201 :** Adresse créée

#### PUT /profile/addresses/:id

Modifier une adresse (nécessite authentification).

**Body :** Même format que POST

**Réponse 200 :** Adresse modifiée

#### DELETE /profile/addresses/:id

Supprimer une adresse (nécessite authentification).

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Adresse supprimée avec succès",
  "data": null
}
```

### ⚙️ Préférences

#### GET /profile/preferences

Récupérer les préférences (nécessite authentification).

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Préférences récupérées avec succès",
  "data": {
    "id": "uuid",
    "emailNotifications": true,
    "smsNotifications": true,
    "pushNotifications": true,
    "marketingEmails": false,
    "language": "fr",
    "currency": "XOF"
  }
}
```

#### PUT /profile/preferences

Modifier les préférences (nécessite authentification).

**Body :**
```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "pushNotifications": true,
  "marketingEmails": false,
  "language": "fr",
  "currency": "XOF"
}
```

**Réponse 200 :** Préférences modifiées

## Codes de statut HTTP

- `200` : Succès
- `201` : Créé
- `400` : Requête invalide
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Non trouvé
- `409` : Conflit
- `500` : Erreur serveur

## Rôles utilisateurs

- `CUSTOMER` : Particulier
- `SELLER` : Vendeur
- `ENTERPRISE` : Entreprise
- `ADMIN` : Administrateur
- `SUPER_ADMIN` : Super administrateur

## Régions du Sénégal

- `Dakar`
- `Thiès`
- `Saint-Louis`
- `Ziguinchor`
- `Tambacounda`
- `Kaolack`
- `Louga`
- `Fatick`
- `Kolda`
- `Matam`
- `Kédougou`
- `Sédhiou`

## Validation

### Format téléphone sénégalais

```
+221 XX XXX XX XX
```

Exemple : `+221 77 123 45 67`

### Format mot de passe

- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre

## Documentation Swagger

Pour une documentation interactive complète, accéder à :

```
http://localhost:3000/api/docs
```


