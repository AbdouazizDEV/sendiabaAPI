#!/bin/bash

# Script d'aide pour configurer ngrok pour PayDunya

echo "🔧 Configuration de ngrok pour PayDunya"
echo "========================================"
echo ""

# Vérifier si ngrok est installé
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok n'est pas installé."
    echo ""
    echo "Installation de ngrok..."
    npm install -g ngrok
    echo ""
fi

# Vérifier si ngrok est configuré
if ngrok config check &> /dev/null; then
    echo "✅ ngrok est déjà configuré"
    echo ""
    echo "Pour lancer ngrok, exécutez :"
    echo "  ngrok http 3000"
    echo ""
    echo "Ensuite, utilisez l'URL HTTPS générée pour l'endpoint IPN :"
    echo "  https://votre-url-ngrok.io/api/v1/payments/paydunya/webhook"
else
    echo "⚠️  ngrok n'est pas encore configuré."
    echo ""
    echo "Pour configurer ngrok :"
    echo "1. Créez un compte gratuit sur https://dashboard.ngrok.com/signup"
    echo "2. Récupérez votre authtoken sur https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Exécutez la commande suivante :"
    echo "   ngrok config add-authtoken VOTRE_AUTHTOKEN"
    echo ""
    echo "Ensuite, relancez ce script."
fi

echo ""
echo "💡 Alternative : Utiliser localtunnel (sans compte)"
echo "   npm install -g localtunnel"
echo "   lt --port 3000"




