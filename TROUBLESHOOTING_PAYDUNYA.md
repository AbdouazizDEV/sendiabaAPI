# 🔧 Dépannage PayDunya - "Invalid Masterkey Specified"

## ❌ Problème

Vous recevez l'erreur : `"Erreur PayDunya: Invalid Masterkey Specified"`

## ✅ Solutions

### 1. Vérifier que vous utilisez les bonnes clés

**Important** : Les clés de test et de production sont différentes !

1. **Connectez-vous à PayDunya** : https://paydunya.com
2. **Allez dans** : "Intégrez notre API" → "Sendiaba"
3. **Vérifiez le mode** :
   - Si vous êtes en **mode test**, utilisez les clés qui commencent par `test_`
   - Si vous êtes en **mode production**, utilisez les clés qui commencent par `live_`

### 2. Vérifier votre fichier `.env`

Ouvrez votre fichier `.env` et vérifiez :

```env
# Mode PayDunya
PAYDUNYA_MODE=test  # ou "live" pour la production

# Clés de TEST (si PAYDUNYA_MODE=test)
PAYDUNYA_TEST_MASTER_KEY=test_xxxxxxxxxxxxx
PAYDUNYA_TEST_PRIVATE_KEY=test_xxxxxxxxxxxxx
PAYDUNYA_TEST_PUBLIC_KEY=test_xxxxxxxxxxxxx
PAYDUNYA_TEST_TOKEN=test_xxxxxxxxxxxxx
```

**Points importants** :
- ✅ Pas d'espaces avant ou après les clés
- ✅ Pas de guillemets autour des valeurs
- ✅ Les clés doivent commencer par `test_` si `PAYDUNYA_MODE=test`
- ✅ Les clés doivent commencer par `live_` si `PAYDUNYA_MODE=live`

### 3. Vérifier que les clés sont correctement copiées

**Erreurs courantes** :
- ❌ Espaces invisibles au début ou à la fin
- ❌ Guillemets ajoutés par erreur
- ❌ Retours à la ligne dans la clé
- ❌ Clés mélangées (test vs live)

**Exemple correct** :
```env
PAYDUNYA_TEST_MASTER_KEY=test_abc123def456ghi789
```

**Exemples incorrects** :
```env
# ❌ Avec guillemets
PAYDUNYA_TEST_MASTER_KEY="test_abc123def456ghi789"

# ❌ Avec espaces
PAYDUNYA_TEST_MASTER_KEY= test_abc123def456ghi789 

# ❌ Clé de production en mode test
PAYDUNYA_TEST_MASTER_KEY=live_abc123def456ghi789
```

### 4. Redémarrer l'application

Après avoir modifié le fichier `.env`, **redémarrez toujours l'application** :

```bash
# Arrêter l'application (Ctrl+C)
# Puis relancer
npm start
# ou
npm run start:dev
```

### 5. Vérifier le mode PayDunya dans votre compte

1. Allez sur https://paydunya.com
2. Connectez-vous
3. Allez dans "Intégrez notre API" → "Sendiaba"
4. Vérifiez le mode sélectionné :
   - **Mode test** : Pour les tests
   - **Mode production** : Pour la production

**Important** : Le mode dans PayDunya doit correspondre à `PAYDUNYA_MODE` dans votre `.env` !

### 6. Vérifier que l'application Sendiaba existe dans PayDunya

1. Allez dans "Intégrez notre API"
2. Vérifiez que l'application **"Sendiaba"** existe
3. Si elle n'existe pas, créez-la
4. Récupérez les clés de cette application spécifique

### 7. Tester avec le script de vérification

Exécutez le script de vérification :

```bash
node check-paydunya-config.js
```

Ce script vérifie que toutes les variables sont présentes et non vides.

### 8. Vérifier les logs de l'application

Dans les logs de l'application, vous devriez voir :
- Le mode PayDunya utilisé
- Les premiers caractères de la Master Key (pour vérification)

Si vous voyez des clés vides ou incorrectes, corrigez-les dans le `.env`.

## 📝 Checklist de vérification

- [ ] Les clés sont récupérées depuis le bon compte PayDunya
- [ ] Les clés correspondent au mode (test/live)
- [ ] Les clés commencent par `test_` si mode test, `live_` si mode live
- [ ] Pas d'espaces avant/après les clés dans `.env`
- [ ] Pas de guillemets autour des valeurs
- [ ] `PAYDUNYA_MODE` correspond au mode dans PayDunya
- [ ] L'application a été redémarrée après modification du `.env`
- [ ] Le script `check-paydunya-config.js` confirme que tout est configuré

## 🔍 Debug avancé

Si le problème persiste, activez les logs de debug dans `paydunya.service.ts` :

Les logs affichent maintenant :
- L'URL utilisée
- Le mode (test/live)
- Les premiers caractères de la Master Key

Vérifiez dans les logs que :
1. Le mode correspond à vos attentes
2. La Master Key commence par `test_` ou `live_` selon le mode
3. L'URL est correcte (`sandbox-api` pour test, `api` pour live)

## 📞 Support PayDunya

Si le problème persiste après toutes ces vérifications :
1. Vérifiez que votre compte PayDunya est actif
2. Contactez le support PayDunya
3. Vérifiez la documentation PayDunya : https://paydunya.com/developers




