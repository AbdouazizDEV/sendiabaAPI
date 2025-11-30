#!/bin/bash

# Script pour créer la base de données Sendiaba
# Usage: ./setup-database.sh

echo "🔧 Configuration de la base de données Sendiaba..."

# Vérifier si la base existe déjà
export PGPASSWORD='databeez123'
DB_EXISTS=$(psql -U databeez -h 127.0.0.1 -p 5432 -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='sendiaba_db'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "✅ La base de données sendiaba_db existe déjà."
else
    echo "📦 Tentative de création de la base de données..."
    
    # Essayer avec l'utilisateur databeez
    psql -U databeez -h 127.0.0.1 -p 5432 -d postgres -c "CREATE DATABASE sendiaba_db;" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Base de données créée avec succès avec l'utilisateur databeez."
    else
        echo "❌ Échec de la création avec l'utilisateur databeez."
        echo ""
        echo "🔧 Veuillez exécuter une des commandes suivantes :"
        echo ""
        echo "Option 1 (avec sudo) :"
        echo "  sudo -u postgres psql -c \"CREATE DATABASE sendiaba_db OWNER databeez;\""
        echo ""
        echo "Option 2 (interactif) :"
        echo "  sudo -u postgres psql"
        echo "  CREATE DATABASE sendiaba_db OWNER databeez;"
        echo "  \\q"
        echo ""
        exit 1
    fi
fi

# Vérifier la connexion
echo ""
echo "🔍 Vérification de la connexion..."
psql -U databeez -h 127.0.0.1 -p 5432 -d sendiaba_db -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Connexion à la base de données réussie !"
    echo ""
    echo "📋 Informations de connexion :"
    echo "   Host: 127.0.0.1"
    echo "   Port: 5432"
    echo "   User: databeez"
    echo "   Database: sendiaba_db"
    echo ""
    echo "🚀 Vous pouvez maintenant démarrer l'application avec :"
    echo "   npm run start:dev"
else
    echo "❌ Impossible de se connecter à la base de données."
    echo "   Vérifiez vos paramètres dans le fichier .env"
    exit 1
fi


