#!/bin/bash

# Script pour récupérer les données nécessaires pour les tests
# Nécessite psql et les variables d'environnement de la base de données

echo "🔍 Récupération des données pour les tests..."
echo ""

# Charger les variables d'environnement depuis .env si disponible
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Variables de connexion (ajustez selon votre configuration)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-sendiaba}
DB_DATABASE=${DB_DATABASE:-sendiaba_db}

echo "📦 Produits disponibles :"
echo "-------------------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "
SELECT 
    id,
    name,
    price,
    status,
    \"createdAt\"
FROM products 
WHERE status = 'ACTIVE' 
LIMIT 5;
" 2>/dev/null || echo "⚠️  Impossible de se connecter à la base de données"

echo ""
echo "👤 Utilisateurs disponibles :"
echo "-------------------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "
SELECT 
    id,
    email,
    role,
    \"firstName\",
    \"lastName\"
FROM users 
WHERE \"isActive\" = true 
LIMIT 5;
" 2>/dev/null || echo "⚠️  Impossible de se connecter à la base de données"

echo ""
echo "📍 Adresses disponibles :"
echo "-------------------"
psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "
SELECT 
    a.id,
    a.\"userId\",
    u.email,
    a.street,
    a.city,
    a.region
FROM addresses a
JOIN users u ON a.\"userId\" = u.id
LIMIT 5;
" 2>/dev/null || echo "⚠️  Impossible de se connecter à la base de données"

echo ""
echo "💡 Astuce : Utilisez ces IDs dans vos commandes curl"
echo ""

