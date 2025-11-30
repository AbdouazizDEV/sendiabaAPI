# Architecture Sendiaba API

## Vue d'ensemble

L'architecture de Sendiaba API suit les principes de **Clean Architecture** et **SOLID**, garantissant une séparation claire des responsabilités, une maintenabilité élevée et une extensibilité.

## Principes SOLID appliqués

### 1. Single Responsibility Principle (SRP)

Chaque classe a une seule responsabilité :

- **Controllers** : Gèrent uniquement les requêtes HTTP
- **Services** : Contiennent la logique métier
- **Repositories** : Gèrent uniquement l'accès aux données
- **Guards** : Vérifient l'authentification et les autorisations
- **Strategies** : Implémentent des stratégies d'authentification spécifiques

### 2. Open/Closed Principle (OCP)

- Les stratégies d'authentification sont extensibles (JWT, Refresh Token)
- Les guards peuvent être étendus sans modifier le code existant
- Les interfaces permettent d'ajouter de nouvelles implémentations

### 3. Liskov Substitution Principle (LSP)

- Les DTOs héritent correctement des validations
- Les guards sont interchangeables
- Les stratégies Passport sont substituables

### 4. Interface Segregation Principle (ISP)

- Interfaces spécifiques pour chaque service (IAuthService, IProfileService)
- Pas de dépendances inutiles entre modules

### 5. Dependency Inversion Principle (DIP)

- Injection de dépendances via constructeur
- Dépendances d'abstractions, pas d'implémentations concrètes
- Utilisation de TypeORM Repository pattern

## Structure des modules

### Module Auth

```
auth/
├── dto/                    # Data Transfer Objects
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── forgot-password.dto.ts
│   └── reset-password.dto.ts
├── entities/               # Entités TypeORM
│   └── user.entity.ts
├── strategies/             # Stratégies Passport
│   ├── jwt.strategy.ts
│   └── refresh-token.strategy.ts
├── guards/                 # Guards d'authentification
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── interfaces/             # Interfaces TypeScript
│   └── jwt-payload.interface.ts
├── auth.controller.ts      # Contrôleur HTTP
├── auth.service.ts         # Logique métier
├── auth.repository.ts      # Accès aux données
└── auth.module.ts          # Module NestJS
```

**Responsabilités :**
- Authentification des utilisateurs
- Gestion des tokens JWT
- Inscription et connexion
- Réinitialisation de mot de passe

### Module Profile

```
profile/
├── dto/                    # Data Transfer Objects
│   ├── update-profile.dto.ts
│   ├── create-address.dto.ts
│   ├── update-address.dto.ts
│   └── update-preferences.dto.ts
├── entities/               # Entités TypeORM
│   ├── address.entity.ts
│   └── user-preferences.entity.ts
├── profile.controller.ts   # Contrôleur HTTP
├── profile.service.ts      # Logique métier
├── profile.repository.ts   # Accès aux données
└── profile.module.ts       # Module NestJS
```

**Responsabilités :**
- Gestion du profil utilisateur
- Gestion des adresses
- Gestion des préférences utilisateur

## Couches de l'application

### 1. Couche Présentation (Controllers)

- Reçoit les requêtes HTTP
- Valide les données d'entrée (DTOs)
- Appelle les services
- Retourne les réponses formatées

### 2. Couche Métier (Services)

- Contient la logique métier
- Orchestre les opérations
- Gère les transactions
- Valide les règles métier

### 3. Couche Données (Repositories)

- Accès à la base de données
- Requêtes TypeORM
- Mapping des entités

### 4. Couche Infrastructure

- Configuration (database, JWT, Swagger)
- Guards et interceptors
- Filters d'exception
- Décorateurs personnalisés

## Flux de données

```
Client Request
    ↓
Controller (Validation DTO)
    ↓
Service (Logique métier)
    ↓
Repository (Accès données)
    ↓
Database (PostgreSQL)
    ↓
Repository (Mapping entité)
    ↓
Service (Transformation)
    ↓
Controller (Formatage réponse)
    ↓
Client Response
```

## Sécurité

### Authentification

1. **Inscription** : Hash du mot de passe avec bcrypt
2. **Connexion** : Vérification du mot de passe, génération de tokens
3. **Protection des routes** : Guards JWT
4. **Autorisation** : Guards de rôles

### Validation

- **DTOs** : Validation avec class-validator
- **Pipes** : ValidationPipe global
- **Sanitization** : Transformation automatique

### Gestion des erreurs

- **Filters** : Capture et formatage des exceptions
- **Interceptors** : Formatage des réponses réussies
- **Logging** : Enregistrement des erreurs

## Extensibilité

L'architecture permet d'ajouter facilement :

- Nouveaux modules métier
- Nouvelles stratégies d'authentification
- Nouveaux guards
- Nouvelles entités et relations
- Nouveaux endpoints

## Patterns utilisés

- **Repository Pattern** : Abstraction de l'accès aux données
- **Strategy Pattern** : Stratégies d'authentification
- **Decorator Pattern** : Décorateurs NestJS (@Get, @Post, etc.)
- **Dependency Injection** : Injection de dépendances NestJS
- **Factory Pattern** : Configuration des modules

## Base de données

### Relations

```
User (1) ──< (N) Address
User (1) ── (1) UserPreferences
```

### Entités principales

- **User** : Informations utilisateur, authentification
- **Address** : Adresses de livraison/facturation
- **UserPreferences** : Préférences de notification et localisation

## Configuration

Toutes les configurations sont centralisées dans `src/config/` :

- `database.config.ts` : Configuration TypeORM
- `jwt.config.ts` : Configuration JWT
- `swagger.config.ts` : Configuration Swagger
- `validation.config.ts` : Configuration validation

## Tests

Structure de tests :

- **Unitaires** : Tests des services et repositories
- **E2E** : Tests des endpoints complets
- **Intégration** : Tests des modules complets


