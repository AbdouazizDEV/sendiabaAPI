import { PrismaClient, ProductStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Début du seeding...');

  // Catégories principales pour une marketplace sénégalaise
  const categories = [
    {
      name: 'Électronique',
      slug: 'electronique',
      description: 'Téléphones, ordinateurs, accessoires électroniques',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      isActive: true,
    },
    {
      name: 'Mode & Vêtements',
      slug: 'mode-vetements',
      description: 'Vêtements, chaussures, accessoires de mode',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      isActive: true,
    },
    {
      name: 'Maison & Décoration',
      slug: 'maison-decoration',
      description: 'Meubles, décoration intérieure, articles ménagers',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      isActive: true,
    },
    {
      name: 'Alimentation & Boissons',
      slug: 'alimentation-boissons',
      description: 'Produits alimentaires, boissons, épicerie',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      isActive: true,
    },
    {
      name: 'Santé & Beauté',
      slug: 'sante-beaute',
      description: 'Produits de beauté, soins personnels, parfums',
      image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
      isActive: true,
    },
    {
      name: 'Sports & Loisirs',
      slug: 'sports-loisirs',
      description: 'Équipements sportifs, articles de loisirs',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      isActive: true,
    },
    {
      name: 'Livres & Médias',
      slug: 'livres-medias',
      description: 'Livres, films, musique, jeux vidéo',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
      isActive: true,
    },
    {
      name: 'Automobile',
      slug: 'automobile',
      description: 'Pièces auto, accessoires véhicules',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
      isActive: true,
    },
    {
      name: 'Jouets & Enfants',
      slug: 'jouets-enfants',
      description: 'Jouets, articles pour bébés et enfants',
      image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
      isActive: true,
    },
    {
      name: 'Informatique',
      slug: 'informatique',
      description: 'Ordinateurs, composants, logiciels',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
      isActive: true,
    },
    {
      name: 'Téléphonie',
      slug: 'telephonie',
      description: 'Smartphones, tablettes, accessoires mobiles',
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
      isActive: true,
    },
    {
      name: 'Électroménager',
      slug: 'electromenager',
      description: 'Appareils électroménagers, petit et gros électroménager',
      image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
      isActive: true,
    },
  ];

  // Créer les catégories
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {
        name: categoryData.name,
        description: categoryData.description,
        image: categoryData.image,
        isActive: categoryData.isActive,
      },
      create: categoryData,
    });
    console.log(`✅ Catégorie créée/mise à jour: ${category.name}`);
  }

  // Créer quelques sous-catégories
  const electronique = await prisma.category.findUnique({
    where: { slug: 'electronique' },
  });

  if (electronique) {
    const subCategories = [
      {
        name: 'Téléphones Portables',
        slug: 'telephones-portables',
        description: 'Smartphones et téléphones portables',
        parentId: electronique.id,
        isActive: true,
      },
      {
        name: 'Ordinateurs Portables',
        slug: 'ordinateurs-portables',
        description: 'Laptops et notebooks',
        parentId: electronique.id,
        isActive: true,
      },
      {
        name: 'Accessoires Électroniques',
        slug: 'accessoires-electroniques',
        description: 'Câbles, chargeurs, écouteurs, etc.',
        parentId: electronique.id,
        isActive: true,
      },
    ];

    for (const subCategoryData of subCategories) {
      const subCategory = await prisma.category.upsert({
        where: { slug: subCategoryData.slug },
        update: {
          name: subCategoryData.name,
          description: subCategoryData.description,
          parentId: subCategoryData.parentId,
          isActive: subCategoryData.isActive,
        },
        create: subCategoryData,
      });
      console.log(`✅ Sous-catégorie créée/mise à jour: ${subCategory.name}`);
    }
  }

  const mode = await prisma.category.findUnique({
    where: { slug: 'mode-vetements' },
  });

  if (mode) {
    const subCategories = [
      {
        name: 'Vêtements Hommes',
        slug: 'vetements-hommes',
        description: 'Vêtements pour hommes',
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800',
        parentId: mode.id,
        isActive: true,
      },
      {
        name: 'Vêtements Femmes',
        slug: 'vetements-femmes',
        description: 'Vêtements pour femmes',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
        parentId: mode.id,
        isActive: true,
      },
      {
        name: 'Chaussures',
        slug: 'chaussures',
        description: 'Chaussures pour tous',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        parentId: mode.id,
        isActive: true,
      },
    ];

    for (const subCategoryData of subCategories) {
      const subCategory = await prisma.category.upsert({
        where: { slug: subCategoryData.slug },
        update: {
          name: subCategoryData.name,
          description: subCategoryData.description,
          image: subCategoryData.image,
          parentId: subCategoryData.parentId,
          isActive: subCategoryData.isActive,
        },
        create: subCategoryData,
      });
      console.log(`✅ Sous-catégorie créée/mise à jour: ${subCategory.name}`);
    }
  }

  // Créer des sous-catégories pour Maison & Décoration
  const maison = await prisma.category.findUnique({
    where: { slug: 'maison-decoration' },
  });

  if (maison) {
    const subCategories = [
      {
        name: 'Meuble de salon',
        slug: 'meuble-de-salon',
        description: 'Meubles pour le salon et la salle de séjour',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        parentId: maison.id,
        isActive: true,
      },
      {
        name: 'Meuble de bureau',
        slug: 'meuble-de-bureau',
        description: 'Meubles pour le bureau et le travail',
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800',
        parentId: maison.id,
        isActive: true,
      },
      {
        name: 'Mobilier d\'intérieur',
        slug: 'mobilier-interieur',
        description: 'Mobilier et ameublement pour l\'intérieur',
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        parentId: maison.id,
        isActive: true,
      },
      {
        name: 'Luminaires',
        slug: 'luminaires',
        description: 'Éclairage et luminaires pour la maison',
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
        parentId: maison.id,
        isActive: true,
      },
    ];

    for (const subCategoryData of subCategories) {
      const subCategory = await prisma.category.upsert({
        where: { slug: subCategoryData.slug },
        update: {
          name: subCategoryData.name,
          description: subCategoryData.description,
          image: subCategoryData.image,
          parentId: subCategoryData.parentId,
          isActive: subCategoryData.isActive,
        },
        create: subCategoryData,
      });
      console.log(`✅ Sous-catégorie créée/mise à jour: ${subCategory.name}`);
    }
  }

  // Créer des sous-catégories pour Électroménager
  const electromenager = await prisma.category.findUnique({
    where: { slug: 'electromenager' },
  });

  if (electromenager) {
    const subCategories = [
      {
        name: 'Gros électroménager',
        slug: 'gros-electromenager',
        description: 'Réfrigérateurs, lave-linges, fours, etc.',
        image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
        parentId: electromenager.id,
        isActive: true,
      },
      {
        name: 'Petit électroménager',
        slug: 'petit-electromenager',
        description: 'Mixeurs, bouilloires, grille-pain, etc.',
        image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800',
        parentId: electromenager.id,
        isActive: true,
      },
    ];

    for (const subCategoryData of subCategories) {
      const subCategory = await prisma.category.upsert({
        where: { slug: subCategoryData.slug },
        update: {
          name: subCategoryData.name,
          description: subCategoryData.description,
          image: subCategoryData.image,
          parentId: subCategoryData.parentId,
          isActive: subCategoryData.isActive,
        },
        create: subCategoryData,
      });
      console.log(`✅ Sous-catégorie créée/mise à jour: ${subCategory.name}`);
    }
  }

  // ============================================
  // SEEDING DES PRODUITS
  // ============================================
  console.log('\n📦 Début du seeding des produits...');

  // Trouver ou créer un vendeur pour les produits
  let seller = await prisma.user.findFirst({
    where: {
      role: 'SELLER',
    },
  });

  if (!seller) {
    // Créer un vendeur de test si aucun n'existe
    console.log('⚠️  Aucun vendeur trouvé. Création d\'un vendeur de test...');
    seller = await prisma.user.create({
      data: {
        email: 'vendeur@sendiaba.sn',
        password: '$2b$10$dummy.hash.for.testing.purposes.only',
        firstName: 'Vendeur',
        lastName: 'Test',
        role: 'SELLER',
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log(`✅ Vendeur créé: ${seller.email}`);
  } else {
    console.log(`✅ Vendeur trouvé: ${seller.email}`);
  }

  // Récupérer les catégories pour les produits
  const catElectronique = await prisma.category.findUnique({
    where: { slug: 'electronique' },
  });
  const catTelephones = await prisma.category.findUnique({
    where: { slug: 'telephones-portables' },
  });
  const catMode = await prisma.category.findUnique({
    where: { slug: 'mode-vetements' },
  });
  const catVetementsHommes = await prisma.category.findUnique({
    where: { slug: 'vetements-hommes' },
  });
  const catMaison = await prisma.category.findUnique({
    where: { slug: 'maison-decoration' },
  });
  const catAlimentation = await prisma.category.findUnique({
    where: { slug: 'alimentation-boissons' },
  });
  const catSante = await prisma.category.findUnique({
    where: { slug: 'sante-beaute' },
  });
  const catSports = await prisma.category.findUnique({
    where: { slug: 'sports-loisirs' },
  });

  // Produits variés pour une marketplace sénégalaise
  const productsData = [
    // Électronique - Téléphones
    {
      name: 'Samsung Galaxy S21 Ultra 256GB',
      slug: 'samsung-galaxy-s21-ultra-256gb',
      description:
        'Smartphone Samsung haut de gamme avec écran AMOLED 6.8 pouces, 108MP, 5G, 256GB de stockage. Parfait pour la photographie et les performances.',
      shortDescription: 'Smartphone Samsung haut de gamme 5G',
      sku: 'SAMSUNG-S21-ULTRA-256',
      categoryId: catTelephones?.id || catElectronique?.id,
      price: 650000,
      compareAtPrice: 750000,
      costPrice: 550000,
      weight: 227,
      dimensions: JSON.stringify({ length: 16.5, width: 7.6, height: 0.9 }),
      tags: ['téléphone', 'samsung', 'smartphone', '5g', 'haut-de-gamme'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 15, lowStockThreshold: 5 },
    },
    {
      name: 'iPhone 13 Pro Max 128GB',
      slug: 'iphone-13-pro-max-128gb',
      description:
        'iPhone Apple avec écran Super Retina XDR 6.7 pouces, triple caméra 12MP, puce A15 Bionic, 128GB. Design premium en acier inoxydable.',
      shortDescription: 'iPhone Apple haut de gamme',
      sku: 'APPLE-IPHONE-13-PRO-MAX-128',
      categoryId: catTelephones?.id || catElectronique?.id,
      price: 750000,
      compareAtPrice: 850000,
      costPrice: 650000,
      weight: 240,
      dimensions: JSON.stringify({ length: 16.0, width: 7.8, height: 0.8 }),
      tags: ['iphone', 'apple', 'smartphone', 'premium'],
      status: 'ACTIVE',
      trackInventory: true,
      stock: { quantity: 8, lowStockThreshold: 3 },
    },
    {
      name: 'Xiaomi Redmi Note 11 Pro',
      slug: 'xiaomi-redmi-note-11-pro',
      description:
        'Smartphone Xiaomi avec écran AMOLED 6.67 pouces, 108MP, 128GB, batterie 5000mAh. Excellent rapport qualité-prix.',
      shortDescription: 'Smartphone Xiaomi performant',
      sku: 'XIAOMI-REDMI-NOTE-11-PRO',
      categoryId: catTelephones?.id || catElectronique?.id,
      price: 180000,
      compareAtPrice: 220000,
      costPrice: 150000,
      weight: 202,
      dimensions: JSON.stringify({ length: 16.4, width: 7.6, height: 0.8 }),
      tags: ['xiaomi', 'redmi', 'smartphone', 'budget'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 25, lowStockThreshold: 10 },
    },
    // Mode - Vêtements
    {
      name: 'Chemise Homme Coton Blanc',
      slug: 'chemise-homme-coton-blanc',
      description:
        'Chemise élégante en coton 100% pour homme, couleur blanche, taille standard. Parfait pour le bureau et les occasions formelles.',
      shortDescription: 'Chemise élégante en coton',
      sku: 'CHEMISE-HOMME-BLANC-M',
      categoryId: catVetementsHommes?.id || catMode?.id,
      price: 25000,
      compareAtPrice: 35000,
      costPrice: 15000,
      weight: 0.3,
      dimensions: JSON.stringify({ length: 0.3, width: 0.3, height: 0.05 }),
      tags: ['chemise', 'homme', 'coton', 'formel'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 50, lowStockThreshold: 15 },
    },
    {
      name: 'Robe Africaine Wax Imprimé',
      slug: 'robe-africaine-wax-imprime',
      description:
        'Magnifique robe en tissu wax africain, coupe moderne, plusieurs tailles disponibles. Idéale pour les occasions spéciales.',
      shortDescription: 'Robe en tissu wax africain',
      sku: 'ROBE-WAX-AFRICAINE-L',
      categoryId: catMode?.id,
      price: 45000,
      compareAtPrice: 60000,
      costPrice: 25000,
      weight: 0.4,
      dimensions: JSON.stringify({ length: 0.4, width: 0.4, height: 0.1 }),
      tags: ['robe', 'wax', 'africain', 'traditionnel'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 30, lowStockThreshold: 10 },
    },
    // Maison & Décoration
    {
      name: 'Tapis Tissé Artisanal Sénégalais',
      slug: 'tapis-tisse-artisanal-senegalais',
      description:
        'Tapis artisanal tissé à la main, motifs traditionnels sénégalais, dimensions 200x150cm. Décoration authentique pour votre salon.',
      shortDescription: 'Tapis artisanal tissé à la main',
      sku: 'TAPIS-ARTISANAL-200X150',
      categoryId: catMaison?.id,
      price: 85000,
      compareAtPrice: 120000,
      costPrice: 50000,
      weight: 3.5,
      dimensions: JSON.stringify({ length: 200, width: 150, height: 2 }),
      tags: ['tapis', 'artisanal', 'traditionnel', 'décoration'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 12, lowStockThreshold: 3 },
    },
    {
      name: 'Set de Vaisselle Céramique 12 Pièces',
      slug: 'set-vaisselle-ceramique-12-pieces',
      description:
        'Set complet de vaisselle en céramique, 12 assiettes plates, design moderne. Parfait pour recevoir vos invités.',
      shortDescription: 'Set de vaisselle 12 pièces',
      sku: 'VAISSELLE-CERAMIQUE-12',
      categoryId: catMaison?.id,
      price: 35000,
      compareAtPrice: 45000,
      costPrice: 20000,
      weight: 4.2,
      dimensions: JSON.stringify({ length: 30, width: 30, height: 15 }),
      tags: ['vaisselle', 'céramique', 'maison', 'ustensiles'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 20, lowStockThreshold: 5 },
    },
    // Alimentation
    {
      name: 'Riz Basmati Premium 5kg',
      slug: 'riz-basmati-premium-5kg',
      description:
        'Riz basmati de qualité premium, sac de 5kg, origine Inde. Riz long grain parfumé, idéal pour vos plats.',
      shortDescription: 'Riz basmati premium 5kg',
      sku: 'RIZ-BASMATI-5KG',
      categoryId: catAlimentation?.id,
      price: 8500,
      compareAtPrice: 10000,
      costPrice: 6000,
      weight: 5,
      dimensions: JSON.stringify({ length: 30, width: 20, height: 10 }),
      tags: ['riz', 'alimentation', 'basmati', 'premium'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 100, lowStockThreshold: 20 },
    },
    {
      name: 'Huile d\'Arachide Pure 2L',
      slug: 'huile-arachide-pure-2l',
      description:
        'Huile d\'arachide pure, pressée à froid, bouteille de 2 litres. Produit local de qualité pour vos cuissons.',
      shortDescription: 'Huile d\'arachide pure 2L',
      sku: 'HUILE-ARACHIDE-2L',
      categoryId: catAlimentation?.id,
      price: 3500,
      compareAtPrice: 4500,
      costPrice: 2500,
      weight: 2.1,
      dimensions: JSON.stringify({ length: 10, width: 10, height: 25 }),
      tags: ['huile', 'arachide', 'alimentation', 'local'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 80, lowStockThreshold: 15 },
    },
    // Santé & Beauté
    {
      name: 'Crème Hydratante Visage Karité 50ml',
      slug: 'creme-hydratante-visage-karite-50ml',
      description:
        'Crème hydratante pour le visage à base de beurre de karité naturel, 50ml. Hydratation intense, adaptée à tous les types de peau.',
      shortDescription: 'Crème hydratante au karité',
      sku: 'CREME-KARITE-50ML',
      categoryId: catSante?.id,
      price: 12000,
      compareAtPrice: 15000,
      costPrice: 7000,
      weight: 0.1,
      dimensions: JSON.stringify({ length: 5, width: 5, height: 8 }),
      tags: ['crème', 'karité', 'beauté', 'hydratant'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 60, lowStockThreshold: 15 },
    },
    // Sports & Loisirs
    {
      name: 'Ballon de Football Adidas',
      slug: 'ballon-football-adidas',
      description:
        'Ballon de football officiel Adidas, taille 5, design moderne. Parfait pour les matchs et entraînements.',
      shortDescription: 'Ballon de football Adidas',
      sku: 'BALLON-ADIDAS-T5',
      categoryId: catSports?.id,
      price: 25000,
      compareAtPrice: 35000,
      costPrice: 15000,
      weight: 0.4,
      dimensions: JSON.stringify({ length: 22, width: 22, height: 22 }),
      tags: ['ballon', 'football', 'sport', 'adidas'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 40, lowStockThreshold: 10 },
    },
    {
      name: 'Maillot Équipe Sénégal 2024',
      slug: 'maillot-equipe-senegal-2024',
      description:
        'Maillot officiel de l\'équipe nationale du Sénégal, édition 2024, toutes tailles. Supportez les Lions de la Téranga!',
      shortDescription: 'Maillot officiel Sénégal 2024',
      sku: 'MAILLOT-SENEGAL-2024-M',
      categoryId: catSports?.id,
      price: 35000,
      compareAtPrice: 45000,
      costPrice: 20000,
      weight: 0.2,
      dimensions: JSON.stringify({ length: 0.5, width: 0.4, height: 0.1 }),
      tags: ['maillot', 'sénégal', 'football', 'sport'],
      status: ProductStatus.ACTIVE,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 35, lowStockThreshold: 8 },
    },
    // Produits en rupture de stock
    {
      name: 'Ordinateur Portable HP Pavilion 15"',
      slug: 'ordinateur-portable-hp-pavilion-15',
      description:
        'Ordinateur portable HP Pavilion 15 pouces, Intel Core i5, 8GB RAM, 512GB SSD. Idéal pour le travail et les études.',
      shortDescription: 'Laptop HP Pavilion 15"',
      sku: 'HP-PAVILION-15-I5',
      categoryId: catElectronique?.id,
      price: 450000,
      compareAtPrice: 550000,
      costPrice: 380000,
      weight: 1.8,
      dimensions: JSON.stringify({ length: 36, width: 24, height: 2.5 }),
      tags: ['ordinateur', 'laptop', 'hp', 'informatique'],
      status: ProductStatus.OUT_OF_STOCK,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 0, lowStockThreshold: 5 },
    },
    // Produit en brouillon
    {
      name: 'Tablette Samsung Galaxy Tab S8',
      slug: 'tablette-samsung-galaxy-tab-s8',
      description:
        'Tablette Android Samsung Galaxy Tab S8, écran 11 pouces, 128GB, S Pen inclus. Parfaite pour le travail et le divertissement.',
      shortDescription: 'Tablette Samsung Galaxy Tab S8',
      sku: 'SAMSUNG-TAB-S8-128',
      categoryId: catElectronique?.id,
      price: 350000,
      compareAtPrice: 420000,
      costPrice: 300000,
      weight: 0.5,
      dimensions: JSON.stringify({ length: 25, width: 16, height: 0.6 }),
      tags: ['tablette', 'samsung', 'android', 's-pen'],
      status: ProductStatus.DRAFT,
      isDigital: false,
      requiresShipping: true,
      trackInventory: true,
      allowBackorder: false,
      stock: { quantity: 5, lowStockThreshold: 2 },
    },
  ];

  // Créer les produits
  let createdCount = 0;
  for (const productData of productsData) {
    if (!productData.categoryId) {
      console.log(
        `⚠️  Produit "${productData.name}" ignoré: catégorie non trouvée`,
      );
      continue;
    }

    try {
      const { stock, ...productFields } = productData;

      // Vérifier si le produit existe déjà
      const existingProduct = await prisma.product.findUnique({
        where: { slug: productFields.slug },
      });

      if (existingProduct) {
        console.log(`⏭️  Produit déjà existant: ${productFields.name}`);
        continue;
      }

      // S'assurer que categoryId n'est pas undefined
      if (!productFields.categoryId) {
        console.log(
          `⚠️  Produit "${productFields.name}" ignoré: categoryId manquant`,
        );
        continue;
      }

      const product = await prisma.product.create({
        data: {
          name: productFields.name,
          slug: productFields.slug,
          description: productFields.description,
          shortDescription: productFields.shortDescription,
          sku: productFields.sku,
          sellerId: seller.id,
          categoryId: productFields.categoryId,
          price: productFields.price,
          compareAtPrice: productFields.compareAtPrice,
          costPrice: productFields.costPrice,
          weight: productFields.weight,
          length: productFields.dimensions ? JSON.parse(productFields.dimensions as string).length : null,
          width: productFields.dimensions ? JSON.parse(productFields.dimensions as string).width : null,
          height: productFields.dimensions ? JSON.parse(productFields.dimensions as string).height : null,
          tags: productFields.tags,
      status: productFields.status as ProductStatus,
      isDigital: productData.isDigital ?? false,
      requiresShipping: productData.requiresShipping ?? true,
      trackInventory: productData.trackInventory ?? true,
      allowBackorder: productData.allowBackorder ?? false,
        },
      });

      // Créer le stock si trackInventory est true
      if (productData.trackInventory && stock) {
        await prisma.productStock.create({
          data: {
            productId: product.id,
            quantity: stock.quantity,
            reservedQuantity: 0,
            lowStockThreshold: stock.lowStockThreshold,
          },
        });
      }

      createdCount++;
      console.log(`✅ Produit créé: ${productFields.name}`);
    } catch (error) {
      console.error(
        `❌ Erreur lors de la création du produit "${productData.name}":`,
        error,
      );
    }
  }

  console.log(
    `\n✨ Seeding terminé avec succès! ${createdCount} produit(s) créé(s).`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

