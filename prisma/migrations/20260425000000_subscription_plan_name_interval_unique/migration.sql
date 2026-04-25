DROP INDEX IF EXISTS "subscription_plans_name_key";

CREATE UNIQUE INDEX "subscription_plans_name_interval_key" ON "subscription_plans"("name", "interval");
