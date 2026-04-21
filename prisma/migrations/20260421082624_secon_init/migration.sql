/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'REFUNDED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PlanFeature" AS ENUM ('PREMIUM_CONTENT', 'AI_CHAT_ACCESS', 'UNLIMITED_EVENTS', 'PRIORITY_SUPPORT', 'ADVANCED_ANALYTICS', 'CUSTOM_BRANDING', 'EXPORT_DATA');

-- AlterTable
ALTER TABLE "_ShopProductPurchasers" ADD CONSTRAINT "_ShopProductPurchasers_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ShopProductPurchasers_AB_unique";

-- AlterTable
ALTER TABLE "payment_transactions" ADD COLUMN     "subscriptionId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" TEXT;

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" "BillingInterval" NOT NULL DEFAULT 'MONTHLY',
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialDays" INTEGER NOT NULL DEFAULT 7,
    "features" "PlanFeature"[] DEFAULT ARRAY[]::"PlanFeature"[],
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_subscriptions" (
    "id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "isTrialing" BOOLEAN NOT NULL DEFAULT false,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_refunds" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "paymentTransactionId" TEXT,
    "originalAmount" DECIMAL(10,2) NOT NULL,
    "refundedAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "stripeRefundId" TEXT,
    "reason" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_key" ON "subscription_plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripeProductId_key" ON "subscription_plans"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_stripePriceId_key" ON "subscription_plans"("stripePriceId");

-- CreateIndex
CREATE INDEX "subscription_plans_isActive_sortOrder_idx" ON "subscription_plans"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptions_stripeSubscriptionId_key" ON "user_subscriptions"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "user_subscriptions_userId_status_idx" ON "user_subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "user_subscriptions_status_currentPeriodEnd_idx" ON "user_subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "user_subscriptions_deletedAt_idx" ON "user_subscriptions"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_refunds_stripeRefundId_key" ON "subscription_refunds"("stripeRefundId");

-- CreateIndex
CREATE INDEX "subscription_refunds_subscriptionId_status_idx" ON "subscription_refunds"("subscriptionId", "status");

-- CreateIndex
CREATE INDEX "payment_transactions_subscriptionId_idx" ON "payment_transactions"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_refunds" ADD CONSTRAINT "subscription_refunds_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "user_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_refunds" ADD CONSTRAINT "subscription_refunds_paymentTransactionId_fkey" FOREIGN KEY ("paymentTransactionId") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
