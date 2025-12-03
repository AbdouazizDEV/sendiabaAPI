#!/bin/bash

# Guide de test interactif pour les endpoints de Commandes et Paiements
# Base URL
BASE_URL="http://localhost:3000/api/v1"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test des Endpoints Commandes & Paiements${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Variables globales
TOKEN=""
ORDER_ID=""
PAYMENT_ID=""

# Fonction pour afficher une section
print_section() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Fonction pour afficher une commande
print_command() {
    echo -e "${YELLOW}Commande :${NC}"
    echo -e "${BLUE}$1${NC}"
    echo ""
}

# Fonction pour exécuter une commande curl
execute_curl() {
    local description="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local needs_auth="${5:-true}"
    
    print_section "$description"
    print_command "curl -X $method $BASE_URL$endpoint"
    
    if [ "$needs_auth" = "true" ] && [ -z "$TOKEN" ]; then
        echo -e "${RED}⚠️  Erreur : Vous devez d'abord vous authentifier (Étape 1)${NC}"
        return 1
    fi
    
    local cmd="curl -X $method $BASE_URL$endpoint"
    
    if [ "$needs_auth" = "true" ]; then
        cmd="$cmd -H 'Authorization: Bearer $TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        cmd="$cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    cmd="$cmd -w '\n\nStatus Code: %{http_code}\n' -s"
    
    echo -e "${YELLOW}Exécution...${NC}"
    echo ""
    
    eval $cmd | jq '.' 2>/dev/null || eval $cmd
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

# Menu principal
show_menu() {
    clear
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Menu de Test - Commandes & Paiements${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "1. 🔐 Étape 1 : Authentification (Login)"
    echo "2. 🛒 Étape 2 : Vérifier le panier"
    echo "3. 🛒 Étape 3 : Ajouter un produit au panier"
    echo "4. 🛍️  Étape 4 : Créer une commande"
    echo "5. 🛍️  Étape 5 : Récupérer le récapitulatif d'une commande"
    echo "6. 🛍️  Étape 6 : Récupérer la confirmation d'une commande"
    echo "7. 💳 Étape 7 : Paiement Mobile Money"
    echo "8. 💳 Étape 8 : Paiement à la livraison"
    echo "9. 💳 Étape 9 : Contact direct"
    echo "10. 💳 Étape 10 : Traitement paiement via /orders/:id/payment"
    echo "11. 🔔 Étape 11 : Test webhook PayDunya"
    echo "12. 📊 Afficher les variables (TOKEN, ORDER_ID, etc.)"
    echo "0. Quitter"
    echo ""
    read -p "Choisissez une option (0-12): " choice
    
    case $choice in
        1) test_login ;;
        2) test_get_cart ;;
        3) test_add_to_cart ;;
        4) test_create_order ;;
        5) test_get_order_summary ;;
        6) test_get_order_confirmation ;;
        7) test_mobile_money_payment ;;
        8) test_cash_on_delivery ;;
        9) test_direct_contact ;;
        10) test_process_payment ;;
        11) test_webhook ;;
        12) show_variables ;;
        0) exit 0 ;;
        *) echo "Option invalide"; sleep 1; show_menu ;;
    esac
}

# Test 1 : Login
test_login() {
    print_section "🔐 Étape 1 : Authentification"
    echo "Entrez vos identifiants :"
    read -p "Email: " email
    read -sp "Mot de passe: " password
    echo ""
    
    local data="{\"email\":\"$email\",\"password\":\"$password\"}"
    
    print_command "curl -X POST $BASE_URL/auth/login -H 'Content-Type: application/json' -d '$data'"
    
    local response=$(curl -X POST $BASE_URL/auth/login \
        -H 'Content-Type: application/json' \
        -d "$data" \
        -s)
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extraire le token
    TOKEN=$(echo "$response" | jq -r '.data.accessToken' 2>/dev/null)
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo ""
        echo -e "${GREEN}✅ Token récupéré avec succès !${NC}"
        echo -e "${BLUE}Token: ${TOKEN:0:50}...${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erreur lors de la connexion${NC}"
    fi
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Test 2 : Get Cart
test_get_cart() {
    execute_curl "🛒 Récupérer le contenu du panier" "GET" "/cart" "" "true"
    show_menu
}

# Test 3 : Add to Cart
test_add_to_cart() {
    print_section "🛒 Ajouter un produit au panier"
    read -p "ID du produit: " product_id
    read -p "Quantité (défaut: 1): " quantity
    quantity=${quantity:-1}
    
    local data="{\"productId\":\"$product_id\",\"quantity\":$quantity}"
    execute_curl "🛒 Ajouter un produit au panier" "POST" "/cart/items" "$data" "true"
    show_menu
}

# Test 4 : Create Order
test_create_order() {
    print_section "🛍️  Créer une commande"
    read -p "ID de l'adresse de livraison: " address_id
    read -p "ID du produit: " product_id
    read -p "Quantité: " quantity
    read -p "Notes (optionnel): " notes
    
    local data="{\"shippingAddressId\":\"$address_id\",\"items\":[{\"productId\":\"$product_id\",\"quantity\":$quantity}]"
    if [ -n "$notes" ]; then
        data="$data,\"notes\":\"$notes\""
    fi
    data="$data}"
    
    print_command "curl -X POST $BASE_URL/orders -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '$data'"
    
    local response=$(curl -X POST $BASE_URL/orders \
        -H "Authorization: Bearer $TOKEN" \
        -H 'Content-Type: application/json' \
        -d "$data" \
        -s)
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extraire l'ID de la commande
    ORDER_ID=$(echo "$response" | jq -r '.data.id' 2>/dev/null)
    
    if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        echo ""
        echo -e "${GREEN}✅ Commande créée ! ID: $ORDER_ID${NC}"
    fi
    
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Test 5 : Get Order Summary
test_get_order_summary() {
    if [ -z "$ORDER_ID" ]; then
        read -p "ID de la commande: " order_id
        ORDER_ID=$order_id
    fi
    
    execute_curl "🛍️  Récupérer le récapitulatif" "GET" "/orders/$ORDER_ID/summary" "" "true"
    show_menu
}

# Test 6 : Get Order Confirmation
test_get_order_confirmation() {
    if [ -z "$ORDER_ID" ]; then
        read -p "ID de la commande: " order_id
        ORDER_ID=$order_id
    fi
    
    execute_curl "🛍️  Récupérer la confirmation" "GET" "/orders/$ORDER_ID/confirmation" "" "true"
    show_menu
}

# Test 7 : Mobile Money Payment
test_mobile_money_payment() {
    if [ -z "$ORDER_ID" ]; then
        read -p "ID de la commande: " order_id
        ORDER_ID=$order_id
    fi
    
    print_section "💳 Paiement Mobile Money"
    read -p "Numéro de téléphone (ex: +221771234567): " phone
    echo "Fournisseurs disponibles:"
    echo "1. ORANGE_MONEY"
    echo "2. WAVE"
    echo "3. MTN"
    echo "4. MOOV"
    echo "5. T_MONEY"
    read -p "Choisissez un fournisseur (1-5): " provider_choice
    
    case $provider_choice in
        1) provider="ORANGE_MONEY" ;;
        2) provider="WAVE" ;;
        3) provider="MTN" ;;
        4) provider="MOOV" ;;
        5) provider="T_MONEY" ;;
        *) provider="ORANGE_MONEY" ;;
    esac
    
    local data="{\"orderId\":\"$ORDER_ID\",\"provider\":\"$provider\",\"phoneNumber\":\"$phone\"}"
    execute_curl "💳 Paiement Mobile Money" "POST" "/payments/mobile-money" "$data" "true"
    show_menu
}

# Test 8 : Cash on Delivery
test_cash_on_delivery() {
    if [ -z "$ORDER_ID" ]; then
        read -p "ID de la commande: " order_id
        ORDER_ID=$order_id
    fi
    
    read -p "Notes (optionnel): " notes
    
    local data="{\"orderId\":\"$ORDER_ID\""
    if [ -n "$notes" ]; then
        data="$data,\"notes\":\"$notes\""
    fi
    data="$data}"
    
    execute_curl "💳 Paiement à la livraison" "POST" "/payments/cash-on-delivery" "$data" "true"
    show_menu
}

# Test 9 : Direct Contact
test_direct_contact() {
    if [ -z "$ORDER_ID" ]; then
        read -p "ID de la commande: " order_id
        ORDER_ID=$order_id
    fi
    
    read -p "Email: " email
    read -p "Téléphone: " phone
    read -p "Message: " message
    
    local data="{\"orderId\":\"$ORDER_ID\",\"email\":\"$email\",\"phone\":\"$phone\",\"message\":\"$message\"}"
    execute_curl "💳 Contact direct" "POST" "/payments/direct-contact" "$data" "true"
    show_menu
}

# Test 10 : Process Payment via Orders endpoint
test_process_payment() {
    if [ -z "$ORDER_ID" ]; then
        read -p "ID de la commande: " order_id
        ORDER_ID=$order_id
    fi
    
    print_section "💳 Traitement du paiement via /orders/:id/payment"
    echo "Méthodes disponibles:"
    echo "1. MOBILE_MONEY"
    echo "2. CASH_ON_DELIVERY"
    echo "3. DIRECT_CONTACT"
    read -p "Choisissez une méthode (1-3): " method_choice
    
    case $method_choice in
        1)
            read -p "Numéro de téléphone: " phone
            echo "Fournisseurs: ORANGE_MONEY, WAVE, MTN, MOOV, T_MONEY"
            read -p "Fournisseur: " provider
            local data="{\"method\":\"MOBILE_MONEY\",\"phoneNumber\":\"$phone\",\"provider\":\"$provider\"}"
            ;;
        2)
            read -p "Notes (optionnel): " notes
            local data="{\"method\":\"CASH_ON_DELIVERY\""
            if [ -n "$notes" ]; then
                data="$data,\"notes\":\"$notes\""
            fi
            data="$data}"
            ;;
        3)
            read -p "Email: " email
            read -p "Téléphone: " phone
            read -p "Message: " message
            local data="{\"method\":\"DIRECT_CONTACT\",\"email\":\"$email\",\"phone\":\"$phone\",\"message\":\"$message\"}"
            ;;
        *)
            echo "Méthode invalide"
            sleep 1
            show_menu
            return
            ;;
    esac
    
    execute_curl "💳 Traitement du paiement" "POST" "/orders/$ORDER_ID/payment" "$data" "true"
    show_menu
}

# Test 11 : Webhook PayDunya
test_webhook() {
    print_section "🔔 Test Webhook PayDunya"
    read -p "Token PayDunya: " token
    read -p "Statut (completed/cancelled/failed): " status
    
    local data="{\"token\":\"$token\",\"invoice\":{\"token\":\"$token\",\"status\":\"$status\"}}"
    execute_curl "🔔 Webhook PayDunya" "POST" "/payments/paydunya/webhook" "$data" "false"
    show_menu
}

# Afficher les variables
show_variables() {
    print_section "📊 Variables actuelles"
    echo -e "${BLUE}TOKEN:${NC} ${TOKEN:0:50}..."
    echo -e "${BLUE}ORDER_ID:${NC} $ORDER_ID"
    echo -e "${BLUE}PAYMENT_ID:${NC} $PAYMENT_ID"
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
    show_menu
}

# Démarrer le menu
show_menu

