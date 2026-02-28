-- Enforce monthly-charge idempotency per lease and billing period.
CREATE UNIQUE INDEX "RentCharge_leaseId_periodStart_periodEnd_key"
ON "RentCharge"("leaseId", "periodStart", "periodEnd");
