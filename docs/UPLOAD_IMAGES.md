# 📸 Guide d'Upload d'Images Produits

Ce guide explique comment uploader des images pour un produit via l'API.

## 🔗 Endpoint

```
POST /api/v1/seller/products/{id}/images
```

## 📋 Prérequis

1. **Authentification** : Vous devez être connecté avec un compte SELLER, ENTERPRISE, ADMIN ou SUPER_ADMIN
2. **Token JWT** : Inclure le token dans l'en-tête `Authorization: Bearer <token>`
3. **Produit existant** : Le produit doit exister et vous devez en être le propriétaire

## 📤 Upload avec cURL

### Upload d'une seule image

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/seller/products/{productId}/images' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'images=@/chemin/vers/votre/image.jpg'
```

### Upload de plusieurs images

```bash
curl -X 'POST' \
  'http://localhost:3000/api/v1/seller/products/{productId}/images' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'images=@/chemin/vers/image1.jpg' \
  -F 'images=@/chemin/vers/image2.jpg' \
  -F 'images=@/chemin/vers/image3.jpg'
```

### Exemple complet

```bash
# 1. Se connecter pour obtenir un token
TOKEN=$(curl -s -X 'POST' \
  'http://localhost:3000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "vendeur@example.com",
    "password": "Password123"
  }' | jq -r '.data.accessToken')

# 2. Créer un produit (si nécessaire)
PRODUCT_ID=$(curl -s -X 'POST' \
  'http://localhost:3000/api/v1/seller/products' \
  -H 'Authorization: Bearer '"$TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Téléphone Samsung Galaxy S21",
    "categoryId": "f0125ec9-4376-4d4b-ac35-dc6272b71090",
    "description": "Téléphone intelligent avec écran AMOLED",
    "price": 450000,
    "status": "DRAFT"
  }' | jq -r '.data.id')

# 3. Uploader des images
curl -X 'POST' \
  "http://localhost:3000/api/v1/seller/products/$PRODUCT_ID/images" \
  -H 'Authorization: Bearer '"$TOKEN" \
  -F 'images=@/chemin/vers/image1.jpg' \
  -F 'images=@/chemin/vers/image2.jpg'
```

## 🌐 Upload avec JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('images', fileInput.files[0]);
formData.append('images', fileInput.files[1]);

const response = await fetch(
  'http://localhost:3000/api/v1/seller/products/{productId}/images',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  }
);

const result = await response.json();
console.log(result);
```

## 📱 Upload avec Postman

1. Méthode : `POST`
2. URL : `http://localhost:3000/api/v1/seller/products/{productId}/images`
3. Headers :
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. Body :
   - Sélectionner `form-data`
   - Clé : `images` (type: File)
   - Valeur : Sélectionner vos fichiers (vous pouvez ajouter plusieurs entrées avec la même clé `images`)

## ✅ Réponse Succès

```json
{
  "success": true,
  "message": "2 image(s) uploadée(s) avec succès",
  "data": [
    {
      "id": "uuid-image-1",
      "productId": "uuid-product",
      "url": "https://res.cloudinary.com/...",
      "cloudinaryId": "sendiaba/products/...",
      "alt": "image1.jpg",
      "order": 0,
      "isPrimary": true,
      "createdAt": "2025-12-01T04:40:00.000Z",
      "updatedAt": "2025-12-01T04:40:00.000Z"
    },
    {
      "id": "uuid-image-2",
      "productId": "uuid-product",
      "url": "https://res.cloudinary.com/...",
      "cloudinaryId": "sendiaba/products/...",
      "alt": "image2.jpg",
      "order": 1,
      "isPrimary": false,
      "createdAt": "2025-12-01T04:40:00.000Z",
      "updatedAt": "2025-12-01T04:40:00.000Z"
    }
  ],
  "timestamp": "2025-12-01T04:40:00.000Z"
}
```

## ❌ Erreurs Possibles

### 400 Bad Request - Aucun fichier fourni

```json
{
  "success": false,
  "message": "Aucun fichier fourni. Veuillez envoyer au moins une image dans le champ \"images\".",
  "error": "BadRequestException",
  "statusCode": 400
}
```

**Solution** : Assurez-vous d'envoyer au moins un fichier avec le champ `images`.

### 404 Not Found - Produit non trouvé

```json
{
  "success": false,
  "message": "Produit non trouvé",
  "error": "NotFoundException",
  "statusCode": 404
}
```

**Solution** : Vérifiez que le `productId` est correct et que le produit appartient au vendeur connecté.

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "UnauthorizedException",
  "statusCode": 401
}
```

**Solution** : Vérifiez que votre token JWT est valide et inclus dans l'en-tête `Authorization`.

## 📝 Notes Importantes

1. **Format de fichiers** : Les formats acceptés sont : JPG, JPEG, PNG, WEBP, GIF
2. **Taille maximale** : 5 MB par fichier
3. **Nombre maximum** : 10 images par requête
4. **Première image** : La première image uploadée devient automatiquement l'image principale
5. **Ordre** : Les images sont ordonnées automatiquement selon l'ordre d'upload
6. **Cloudinary** : Les images sont stockées sur Cloudinary et les URLs sont retournées

## 🔍 Vérifier les Images d'un Produit

```bash
curl -X 'GET' \
  'http://localhost:3000/api/v1/seller/products/{productId}' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

Les images seront incluses dans la réponse avec leur ordre et leur statut (image principale).

