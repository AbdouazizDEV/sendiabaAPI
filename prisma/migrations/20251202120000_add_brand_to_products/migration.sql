-- AlterTable
ALTER TABLE "products" ADD COLUMN "brand" VARCHAR;

-- CreateIndex
CREATE INDEX "products_brand_idx" ON "products"("brand");

