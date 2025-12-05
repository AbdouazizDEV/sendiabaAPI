-- Add tracking fields to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingNumber" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "trackingUrl" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "carrier" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippedAt" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(6);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "refundReason" TEXT;

-- CreateIndex: orders trackingNumber
CREATE INDEX IF NOT EXISTS "orders_trackingNumber_idx" ON "orders"("trackingNumber");

-- CreateTable: order_messages
CREATE TABLE IF NOT EXISTS "order_messages" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "orderId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderRole" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: order_messages orderId
CREATE INDEX IF NOT EXISTS "order_messages_orderId_idx" ON "order_messages"("orderId");

-- CreateIndex: order_messages senderId
CREATE INDEX IF NOT EXISTS "order_messages_senderId_idx" ON "order_messages"("senderId");

-- CreateIndex: order_messages isRead
CREATE INDEX IF NOT EXISTS "order_messages_isRead_idx" ON "order_messages"("isRead");

-- CreateIndex: order_messages createdAt
CREATE INDEX IF NOT EXISTS "order_messages_createdAt_idx" ON "order_messages"("createdAt");

-- AddForeignKey: order_messages.orderId -> orders.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'order_messages_orderId_fkey'
    ) THEN
        ALTER TABLE "order_messages" 
        ADD CONSTRAINT "order_messages_orderId_fkey" 
        FOREIGN KEY ("orderId") 
        REFERENCES "orders"("id") 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION;
    END IF;
END $$;


