-- CreateEnum
CREATE TYPE "ShopCategory" AS ENUM ('MENS', 'WOMENS', 'CHILDRENS', 'ACCESSORIES', 'OTHER');

-- CreateEnum
CREATE TYPE "ShopProductType" AS ENUM ('STANDARD', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "ShopProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SHOP', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "WebhookProcessStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "shop_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imagePublicIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "type" "ShopProductType" NOT NULL DEFAULT 'STANDARD',
    "status" "ShopProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "details" TEXT,
    "categories" "ShopCategory"[] DEFAULT ARRAY[]::"ShopCategory"[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_orders" (
    "id" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "deliveryLocation" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" TEXT,
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PaymentType" NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookProcessStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ShopProductPurchasers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "shop_products_createdById_idx" ON "shop_products"("createdById");

-- CreateIndex
CREATE INDEX "shop_products_status_type_idx" ON "shop_products"("status", "type");

-- CreateIndex
CREATE INDEX "shop_products_createdAt_idx" ON "shop_products"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "shop_orders_userId_status_idx" ON "shop_orders"("userId", "status");

-- CreateIndex
CREATE INDEX "shop_orders_productId_idx" ON "shop_orders"("productId");

-- CreateIndex
CREATE INDEX "shop_orders_createdAt_idx" ON "shop_orders"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_stripeCheckoutSessionId_key" ON "payment_transactions"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_orderId_key" ON "payment_transactions"("orderId");

-- CreateIndex
CREATE INDEX "payment_transactions_userId_status_idx" ON "payment_transactions"("userId", "status");

-- CreateIndex
CREATE INDEX "payment_transactions_type_status_idx" ON "payment_transactions"("type", "status");

-- CreateIndex
CREATE INDEX "payment_transactions_createdAt_idx" ON "payment_transactions"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_providerEventId_key" ON "payment_webhook_events"("providerEventId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_status_idx" ON "payment_webhook_events"("provider", "status");

-- CreateIndex
CREATE INDEX "payment_webhook_events_createdAt_idx" ON "payment_webhook_events"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "_ShopProductPurchasers_AB_unique" ON "_ShopProductPurchasers"("A", "B");

-- CreateIndex
CREATE INDEX "_ShopProductPurchasers_B_index" ON "_ShopProductPurchasers"("B");

-- AddForeignKey
ALTER TABLE "shop_products" ADD CONSTRAINT "shop_products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_orders" ADD CONSTRAINT "shop_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "shop_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ShopProductPurchasers" ADD CONSTRAINT "_ShopProductPurchasers_A_fkey" FOREIGN KEY ("A") REFERENCES "shop_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ShopProductPurchasers" ADD CONSTRAINT "_ShopProductPurchasers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
