#!/bin/bash

echo "=== Test du changement de mot de passe ==="
echo ""

# Étape 1: Se connecter pour obtenir un token
echo "1. Connexion pour obtenir un token JWT..."
LOGIN_RESPONSE=$(curl -s -X 'POST' \
  'http://localhost:3000/api/v1/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "user@example.com",
  "password": "Password123"
}')

echo "Réponse de connexion:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extraire le token (si jq est disponible)
if command -v jq &> /dev/null; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken // empty')
  
  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Erreur: Impossible d'extraire le token. Vérifiez vos identifiants."
    exit 1
  fi
  
  echo "✅ Token obtenu: ${TOKEN:0:50}..."
  echo ""
  
  # Étape 2: Utiliser le token pour changer le mot de passe
  echo "2. Changement de mot de passe avec le token..."
  curl -X 'POST' \
    'http://localhost:3000/api/v1/security/change-password' \
    -H 'accept: */*' \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
    "currentPassword": "Password123",
    "newPassword": "NewPassword123"
  }'
  
  echo ""
else
  echo "⚠️  jq n'est pas installé. Voici comment extraire le token manuellement:"
  echo ""
  echo "1. Copiez le token 'accessToken' de la réponse de connexion"
  echo "2. Utilisez cette commande en remplaçant YOUR_TOKEN:"
  echo ""
  echo 'curl -X '\''POST'\'' \'
  echo '  '\''http://localhost:3000/api/v1/security/change-password'\'' \'
  echo '  -H '\''accept: */*'\'' \'
  echo '  -H '\''Content-Type: application/json'\'' \'
  echo '  -H '\''Authorization: Bearer YOUR_TOKEN'\'' \'
  echo '  -d '\''{'
  echo '    "currentPassword": "Password123",'
  echo '    "newPassword": "NewPassword123"'
  echo '  }'\'
fi
