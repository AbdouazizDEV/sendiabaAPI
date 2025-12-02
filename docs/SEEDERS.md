# 🌱 Seeders - Initialisation des Données

Ce document explique comment utiliser les seeders pour initialiser la base de données avec des données de base.

## 📋 Contenu des Seeders

### Catégories de Produits

Le seeder crée automatiquement les catégories suivantes :

#### Catégories Principales
1. **Électronique** - Téléphones, ordinateurs, accessoires électroniques
2. **Mode & Vêtements** - Vêtements, chaussures, accessoires de mode
3. **Maison & Décoration** - Meubles, décoration intérieure, articles ménagers
4. **Alimentation & Boissons** - Produits alimentaires, boissons, épicerie
5. **Santé & Beauté** - Produits de beauté, soins personnels, parfums
6. **Sports & Loisirs** - Équipements sportifs, articles de loisirs
7. **Livres & Médias** - Livres, films, musique, jeux vidéo
8. **Automobile** - Pièces auto, accessoires véhicules
9. **Jouets & Enfants** - Jouets, articles pour bébés et enfants
10. **Informatique** - Ordinateurs, composants, logiciels
11. **Téléphonie** - Smartphones, tablettes, accessoires mobiles
12. **Électroménager** - Appareils électroménagers

#### Sous-catégories

**Électronique :**
- Téléphones Portables
- Ordinateurs Portables
- Accessoires Électroniques

**Mode & Vêtements :**
- Vêtements Hommes
- Vêtements Femmes
- Chaussures

## 🚀 Utilisation

### Exécuter le Seeder

```bash
npm run prisma:seed
```

### Réexécuter le Seeder

Le seeder utilise `upsert`, donc vous pouvez le réexécuter sans problème. Il mettra à jour les catégories existantes ou créera celles qui manquent.

```bash
npm run prisma:seed
```

## 📝 Structure du Fichier de Seed

Le fichier `prisma/seed.ts` contient :
- Configuration de Prisma Client avec l'adapter PostgreSQL
- Fonction `main()` qui crée toutes les catégories
- Gestion des erreurs
- Messages de log pour suivre le processus

## 🔍 Vérifier les Catégories Créées

### Via l'API

```bash
curl -X 'GET' 'http://localhost:3000/api/v1/categories'
```

### Via Prisma Studio

```bash
npm run prisma:studio
```

Cela ouvrira Prisma Studio dans votre navigateur où vous pourrez voir et modifier les données.

### Via PostgreSQL

```bash
psql -U databeez -h 127.0.0.1 -d sendiaba_db -c "SELECT id, name, slug FROM categories;"
```

## 📦 Ajouter de Nouvelles Catégories

Pour ajouter de nouvelles catégories, modifiez le fichier `prisma/seed.ts` :

```typescript
const categories = [
  // ... catégories existantes
  {
    name: 'Nouvelle Catégorie',
    slug: 'nouvelle-categorie',
    description: 'Description de la nouvelle catégorie',
    isActive: true,
  },
];
```

Puis réexécutez le seeder :

```bash
npm run prisma:seed
```

## ⚠️ Notes Importantes

1. **Idempotence** : Le seeder utilise `upsert` basé sur le `slug`, donc il est sûr de le réexécuter plusieurs fois.

2. **Relations** : Les sous-catégories sont créées après leurs catégories parentes pour respecter les contraintes de clé étrangère.

3. **Environnement** : Assurez-vous que `DATABASE_URL` est correctement configuré dans votre fichier `.env`.

4. **Production** : En production, exécutez le seeder avec précaution et assurez-vous d'avoir des sauvegardes.

## 🔗 Commandes Utiles

```bash
# Exécuter le seeder
npm run prisma:seed

# Générer Prisma Client
npm run prisma:generate

# Ouvrir Prisma Studio
npm run prisma:studio

# Créer une migration
npm run prisma:migrate
```


