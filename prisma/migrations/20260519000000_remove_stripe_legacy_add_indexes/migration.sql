-- Remove legacy Stripe fields from Subscription
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_stripeSubscriptionId_key";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_planId_fkey";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "planId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "stripeSubscriptionId";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "currentPeriodEnd";

-- Drop SubscriptionPlan table (Stripe legacy, unused)
DROP TABLE IF EXISTS "SubscriptionPlan";

-- Drop SubscriptionStatus2 enum (Stripe legacy, unused)
DROP TYPE IF EXISTS "SubscriptionStatus2";

-- Remove stale subscriptionStatus from Profile (never updated, Subscription.plan is source of truth)
ALTER TABLE "Profile" DROP COLUMN IF EXISTS "subscriptionStatus";

-- Add missing performance indexes
CREATE INDEX IF NOT EXISTS "Appointment_userId_fecha_idx" ON "Appointment"("userId", "fecha");
CREATE INDEX IF NOT EXISTS "UserRoutine_profileId_idx" ON "UserRoutine"("profileId");
