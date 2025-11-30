# Sendiaba API

API Backend pour la marketplace Sendiaba - Plateforme de commerce électronique sénégalaise multi-rôles.

## 📋 Description

Sendiaba API est une API REST construite avec NestJS, offrant une architecture modulaire et scalable pour gérer les utilisateurs, l'authentification, les profils et les préférences pour différents types d'utilisateurs (Particuliers, Vendeurs, Entreprises, Administrateurs).

## 🚀 Technologies

- **NestJS** - Framework Node.js progressif
- **TypeORM** - ORM pour TypeScript
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification par tokens
- **Passport** - Middleware d'authentification
- **Swagger** - Documentation API
- **class-validator** - Validation des données
- **bcrypt** - Hashage des mots de passe

## 📦 Installation

### Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL (v12 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet** (si applicable)
   ```bash
   git clone <repository-url>
   cd SendiabaAPI
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   
   Créer un fichier `.env` à la racine du projet :
   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   API_PREFIX=api/v1

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=sendiaba
   DB_PASSWORD=sendiaba_secure_password
   DB_DATABASE=sendiaba_db

   # JWT
   JWT_SECRET=votre_secret_super_securise_ici
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=votre_refresh_secret_super_securise
   JWT_REFRESH_EXPIRES_IN=7d

   # Email (pour réinitialisation password)
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=noreply@sendiaba.com
   MAIL_PASSWORD=password
   MAIL_FROM=noreply@sendiaba.com

   # URL Frontend (pour liens de réinitialisation)
   FRONTEND_URL=http://localhost:4200

   # Bcrypt
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Créer la base de données PostgreSQL**
   ```bash
   createdb sendiaba_db
   ```

5. **Lancer l'application**
   ```bash
   # Mode développement
   npm run start:dev

   # Mode production
   npm run build
   npm run start:prod
   ```

## 📚 Documentation API

Une fois l'application démarrée, la documentation Swagger est accessible à :

**http://localhost:3000/api/docs**

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification :

- **Access Token** : Durée de vie courte (15 minutes par défaut)
- **Refresh Token** : Durée de vie longue (7 jours par défaut)

### Utilisation

1. **Inscription** : `POST /api/v1/auth/register`
2. **Connexion** : `POST /api/v1/auth/login`
3. **Utiliser le token** : Ajouter `Authorization: Bearer <token>` dans les headers

## 👥 Rôles utilisateurs

L'API supporte les rôles suivants :

- `CUSTOMER` - Particulier
- `SELLER` - Vendeur
- `ENTERPRISE` - Entreprise
- `ADMIN` - Administrateur opérationnel
- `SUPER_ADMIN` - Super administrateur

## 📁 Structure du projet

```
src/
├── common/           # Utilitaires partagés (decorators, filters, guards, interceptors)
├── config/           # Configurations (database, jwt, swagger, validation)
├── modules/          # Modules métier
│   ├── auth/        # Module d'authentification
│   └── profile/     # Module de gestion de profil
├── database/         # Migrations et seeds
├── app.module.ts     # Module racine
└── main.ts          # Point d'entrée de l'application
```

## 🛠️ Scripts disponibles

```bash
# Développement
npm run start:dev      # Démarrer en mode watch
npm run start:debug    # Démarrer en mode debug

# Production
npm run build          # Compiler le projet
npm run start:prod     # Démarrer en production

# Tests
npm run test           # Tests unitaires
npm run test:watch     # Tests en mode watch
npm run test:cov       # Tests avec couverture
npm run test:e2e       # Tests end-to-end

# Qualité de code
npm run lint           # Linter le code
npm run format         # Formater le code

# Migrations
npm run migration:generate  # Générer une migration
npm run migration:run       # Exécuter les migrations
npm run migration:revert    # Annuler la dernière migration
```

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (12 rounds)
- Validation stricte des entrées utilisateur
- Protection CORS configurée
- Tokens JWT sécurisés
- Guards pour protéger les routes

## 📝 Endpoints principaux

### Authentification
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/logout` - Déconnexion
- `POST /api/v1/auth/forgot-password` - Demande réinitialisation
- `POST /api/v1/auth/reset-password` - Réinitialisation
- `POST /api/v1/auth/refresh` - Rafraîchir le token

### Profil
- `GET /api/v1/profile` - Récupérer le profil
- `PUT /api/v1/profile` - Modifier le profil
- `GET /api/v1/profile/addresses` - Liste des adresses
- `POST /api/v1/profile/addresses` - Ajouter une adresse
- `PUT /api/v1/profile/addresses/:id` - Modifier une adresse
- `DELETE /api/v1/profile/addresses/:id` - Supprimer une adresse
- `GET /api/v1/profile/preferences` - Récupérer les préférences
- `PUT /api/v1/profile/preferences` - Modifier les préférences

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec couverture
npm run test:cov

# Tests e2e
npm run test:e2e
```

## 📄 Licence

UNLICENSED

## 👨‍💻 Auteur

Sendiaba Team

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez ouvrir une issue ou une pull request.
