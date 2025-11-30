# 📸 Guide d'upload d'images avec Cloudinary

## Configuration

### Variables d'environnement

Le fichier `.env` doit contenir :

```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

**Exemple :**
```env
CLOUDINARY_URL=cloudinary://881626186613942:hCrN4ej9QbjByht3QZsw1vQ0GJ4@dao8m0if6
```

## Endpoints avec upload de photos de profil

### 1. Inscription (`POST /api/v1/auth/register`)

**Format :** `multipart/form-data`

**Champs :**
- `email` (string, requis)
- `password` (string, requis)
- `firstName` (string, requis)
- `lastName` (string, requis)
- `phone` (string, optionnel)
- `role` (enum, requis)
- `profilePicture` (file, optionnel) - Image de profil

**Exemple avec cURL :**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -F "email=user@example.com" \
  -F "password=Password123" \
  -F "firstName=Amadou" \
  -F "lastName=Diallo" \
  -F "phone=+221 77 123 45 67" \
  -F "role=CUSTOMER" \
  -F "profilePicture=@/path/to/image.jpg"
```

**Exemple avec JavaScript (FormData) :**
```javascript
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('password', 'Password123');
formData.append('firstName', 'Amadou');
formData.append('lastName', 'Diallo');
formData.append('phone', '+221 77 123 45 67');
formData.append('role', 'CUSTOMER');
formData.append('profilePicture', fileInput.files[0]);

fetch('http://localhost:3000/api/v1/auth/register', {
  method: 'POST',
  body: formData,
});
```

### 2. Inscription publique (`POST /api/v1/auth/register-public`)

Même format que l'inscription, mais sans le champ `role` (automatiquement `CUSTOMER`).

### 3. Modification du profil (`PUT /api/v1/profile`)

**Format :** `multipart/form-data`

**Headers :**
```
Authorization: Bearer <access_token>
```

**Champs :**
- `firstName` (string, optionnel)
- `lastName` (string, optionnel)
- `phone` (string, optionnel)
- `profilePicture` (file, optionnel) - Nouvelle photo de profil

**Exemple avec cURL :**
```bash
curl -X PUT http://localhost:3000/api/v1/profile \
  -H "Authorization: Bearer <token>" \
  -F "firstName=Amadou" \
  -F "lastName=Diallo" \
  -F "profilePicture=@/path/to/new-image.jpg"
```

## Spécifications des images

### Formats acceptés
- JPEG / JPG
- PNG
- WebP
- GIF

### Taille maximale
- **5 MB** par fichier

### Transformations automatiques
- **Photo de profil** : Redimensionnée à 400x400px avec crop centré sur le visage
- **Qualité** : Optimisée automatiquement
- **Format** : Converti automatiquement au format optimal

## Structure des URLs Cloudinary

Les images sont stockées dans Cloudinary avec la structure suivante :

```
sendiaba/profiles/profile_{userId}
```

**Exemple d'URL retournée :**
```
https://res.cloudinary.com/dao8m0if6/image/upload/v1234567890/sendiaba/profiles/profile_uuid.jpg
```

## Gestion des photos de profil

### Upload
- Lors de l'upload d'une nouvelle photo, l'ancienne est automatiquement supprimée de Cloudinary
- Le nom de fichier est basé sur l'ID utilisateur pour éviter les doublons

### Suppression
- La suppression de la photo de profil se fait automatiquement lors de l'upload d'une nouvelle
- Le champ `profilePicture` dans la base de données contient l'URL complète de l'image

## Réponses API

### Succès
```json
{
  "success": true,
  "message": "Inscription réussie",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "profilePicture": "https://res.cloudinary.com/...",
      ...
    }
  }
}
```

### Erreurs

**Fichier trop volumineux :**
```json
{
  "success": false,
  "message": "Fichier trop volumineux. Taille maximale: 5MB",
  "error": "BAD_REQUEST",
  "statusCode": 400
}
```

**Format non supporté :**
```json
{
  "success": false,
  "message": "Type de fichier non autorisé. Types acceptés: image/jpeg, image/png, ...",
  "error": "BAD_REQUEST",
  "statusCode": 400
}
```

## Tests avec Postman

1. Créez une nouvelle requête POST ou PUT
2. Sélectionnez l'onglet **Body**
3. Choisissez **form-data**
4. Ajoutez vos champs texte normalement
5. Pour l'image, ajoutez un champ de type **File** nommé `profilePicture`
6. Sélectionnez votre image
7. Envoyez la requête

## Tests avec Swagger

1. Accédez à `http://localhost:3000/api/docs`
2. Trouvez l'endpoint souhaité (register, register-public, ou PUT /profile)
3. Cliquez sur "Try it out"
4. Remplissez les champs texte
5. Pour `profilePicture`, cliquez sur "Choose File" et sélectionnez une image
6. Cliquez sur "Execute"

## Notes importantes

- ⚠️ Les photos de profil sont **optionnelles** - vous pouvez créer un compte sans photo
- ✅ L'ancienne photo est **automatiquement supprimée** lors de l'upload d'une nouvelle
- ✅ Les images sont **optimisées automatiquement** par Cloudinary
- ✅ Les URLs retournées sont **HTTPS sécurisées**
- ✅ Les images sont stockées de manière **permanente** dans Cloudinary

