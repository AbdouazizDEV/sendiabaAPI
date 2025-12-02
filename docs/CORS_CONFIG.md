# 🌐 Configuration CORS

## Vue d'ensemble

La configuration CORS (Cross-Origin Resource Sharing) permet à votre application frontend d'accéder à l'API depuis différentes origines.

## Configuration actuelle

### Origines autorisées par défaut (développement)

- `http://localhost:3000`
- `http://localhost:4200` (Angular par défaut)
- `http://localhost:5173` (Vite par défaut)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:4200`
- `http://127.0.0.1:5173`

### Méthodes HTTP autorisées

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS` (pour les preflight requests)

### Headers autorisés

- `Content-Type`
- `Authorization`
- `Accept`
- `Origin`
- `X-Requested-With`
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Methods`

## Configuration via variables d'environnement

### Variable `ALLOWED_ORIGINS`

Vous pouvez configurer les origines autorisées via la variable d'environnement `ALLOWED_ORIGINS` dans votre fichier `.env` :

```env
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:5173,https://sendiaba.com
```

**Format :** Liste d'URLs séparées par des virgules (sans espaces)

### Exemples de configuration

#### Développement local
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200,http://localhost:5173
```

#### Production
```env
ALLOWED_ORIGINS=https://sendiaba.com,https://www.sendiaba.com,https://app.sendiaba.com
```

#### Multi-environnements
```env
ALLOWED_ORIGINS=http://localhost:4200,https://staging.sendiaba.com,https://sendiaba.com
```

## Comportement en développement

En mode développement (`NODE_ENV=development`), toutes les origines commençant par `http://localhost` sont automatiquement autorisées, même si elles ne sont pas dans la liste `ALLOWED_ORIGINS`.

## Credentials (cookies, tokens)

Les credentials sont activés (`credentials: true`), ce qui permet :
- L'envoi de cookies avec les requêtes
- L'utilisation de tokens d'authentification
- La gestion de sessions

## Headers exposés

Le header `Authorization` est exposé pour permettre au frontend d'accéder au token JWT dans les réponses.

## Dépannage

### Erreur : "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Solutions :**

1. **Vérifier l'origine dans `.env`**
   ```env
   ALLOWED_ORIGINS=http://localhost:4200
   ```

2. **Vérifier que l'application est en mode développement**
   ```env
   NODE_ENV=development
   ```

3. **Vérifier que l'URL frontend correspond exactement**
   - Pas d'espace en fin d'URL
   - Protocole correct (`http://` ou `https://`)
   - Port correct

4. **Redémarrer l'application après modification du `.env`**

### Erreur : "Preflight request doesn't pass access control check"

**Solution :** Vérifier que la méthode HTTP utilisée est autorisée (GET, POST, PUT, PATCH, DELETE).

### Tester CORS avec cURL

```bash
# Test simple
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3000/api/v1/auth/login \
     -v
```

### Tester CORS avec Postman

1. Créer une nouvelle requête
2. Ajouter le header `Origin: http://localhost:4200`
3. Envoyer la requête
4. Vérifier les headers de réponse :
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Credentials`
   - `Access-Control-Allow-Methods`

## Exemple de requête frontend

### JavaScript (fetch)

```javascript
fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important pour les cookies/tokens
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error:', error));
```

### Axios

```javascript
import axios from 'axios';

axios.defaults.withCredentials = true; // Important pour les cookies/tokens

axios.post('http://localhost:3000/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password123',
})
  .then((response) => console.log(response.data))
  .catch((error) => console.error('Error:', error));
```

## Sécurité en production

⚠️ **Important :** En production, ne jamais utiliser `*` comme origine. Toujours spécifier les origines exactes.

```env
# ❌ MAUVAIS
ALLOWED_ORIGINS=*

# ✅ BON
ALLOWED_ORIGINS=https://sendiaba.com,https://www.sendiaba.com
```

## Notes

- Les requêtes sans origine (Postman, curl, etc.) sont automatiquement autorisées
- Les preflight requests (OPTIONS) sont gérées automatiquement
- Le statut de succès pour les preflight requests est `204 No Content`



