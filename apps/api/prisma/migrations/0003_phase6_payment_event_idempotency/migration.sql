-- Add provider-event idempotency key for payment event ingestion.
ALTER TABLE "PaymentEvent"
ADD COLUMN "externalEventId" TEXT;

CREATE UNIQUE INDEX "PaymentEvent_externalEventId_key"
ON "PaymentEvent"("externalEventId");
