-- CreateTable: companies
CREATE TABLE IF NOT EXISTS "companies" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "legalName" VARCHAR(255),
    "registrationNumber" VARCHAR(255),
    "taxId" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(255),
    "address" TEXT,
    "city" VARCHAR(255),
    "region" VARCHAR(255),
    "country" VARCHAR(255) NOT NULL DEFAULT 'Sénégal',
    "postalCode" VARCHAR(255),
    "website" VARCHAR(255),
    "logo" VARCHAR(255),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: companies name
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies"("name");

-- CreateIndex: companies registrationNumber
CREATE INDEX IF NOT EXISTS "companies_registrationNumber_idx" ON "companies"("registrationNumber");

-- AddColumn: users.companyId
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "companyId" UUID;

-- CreateIndex: users companyId
CREATE INDEX IF NOT EXISTS "users_companyId_idx" ON "users"("companyId");

-- AddForeignKey: users.companyId -> companies.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_companyId_fkey'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_companyId_fkey" 
        FOREIGN KEY ("companyId") 
        REFERENCES "companies"("id") 
        ON DELETE SET NULL 
        ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddColumn: products.length, width, height
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "length" DECIMAL(8,2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "width" DECIMAL(8,2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "height" DECIMAL(8,2);

-- Migrate existing dimensions data (if any)
-- This will attempt to parse JSON dimensions and extract length, width, height
DO $$
DECLARE
    rec RECORD;
    dim_json JSONB;
BEGIN
    FOR rec IN SELECT id, dimensions FROM products WHERE dimensions IS NOT NULL AND dimensions != '' LOOP
        BEGIN
            dim_json := rec.dimensions::jsonb;
            UPDATE products 
            SET 
                length = (dim_json->>'length')::DECIMAL,
                width = (dim_json->>'width')::DECIMAL,
                height = (dim_json->>'height')::DECIMAL
            WHERE id = rec.id;
        EXCEPTION WHEN OTHERS THEN
            -- If JSON parsing fails, skip this record
            CONTINUE;
        END;
    END LOOP;
END $$;

-- DropColumn: products.dimensions (after migration)
-- Note: We keep dimensions for now to avoid breaking existing code, but it's deprecated
-- ALTER TABLE "products" DROP COLUMN IF EXISTS "dimensions";

-- CreateTable: product_reviews
CREATE TABLE IF NOT EXISTS "product_reviews" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "productId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_reviews_productId_userId_key" UNIQUE ("productId", "userId")
);

-- CreateIndex: product_reviews productId
CREATE INDEX IF NOT EXISTS "product_reviews_productId_idx" ON "product_reviews"("productId");

-- CreateIndex: product_reviews userId
CREATE INDEX IF NOT EXISTS "product_reviews_userId_idx" ON "product_reviews"("userId");

-- CreateIndex: product_reviews rating
CREATE INDEX IF NOT EXISTS "product_reviews_rating_idx" ON "product_reviews"("rating");

-- CreateIndex: product_reviews isPublished
CREATE INDEX IF NOT EXISTS "product_reviews_isPublished_idx" ON "product_reviews"("isPublished");

-- AddForeignKey: product_reviews.productId -> products.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_reviews_productId_fkey'
    ) THEN
        ALTER TABLE "product_reviews" 
        ADD CONSTRAINT "product_reviews_productId_fkey" 
        FOREIGN KEY ("productId") 
        REFERENCES "products"("id") 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey: product_reviews.userId -> users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'product_reviews_userId_fkey'
    ) THEN
        ALTER TABLE "product_reviews" 
        ADD CONSTRAINT "product_reviews_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION;
    END IF;
END $$;

