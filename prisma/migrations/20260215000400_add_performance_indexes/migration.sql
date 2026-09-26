-- Users list query optimization (Phase 11 & 15)
CREATE INDEX IF NOT EXISTS "idx_users_list" ON "User"("role", "createdAt", "name")
  WHERE "deletedAt" IS NULL;

-- Service lookup by barber
CREATE INDEX IF NOT EXISTS "idx_service_barber" ON "Service"("barberId")
  WHERE "deletedAt" IS NULL;

-- Appointment deletion filter
CREATE INDEX IF NOT EXISTS "idx_appointment_active" ON "Appointment"("deletedAt", "status", "startsAt")
  WHERE "deletedAt" IS NULL;

-- Audit log entity lookup
CREATE INDEX IF NOT EXISTS "idx_audit_log_entity" ON "AuditLog"("entityType", "entityId", "createdAt");

-- Finance: payment status + date for refund queries
CREATE INDEX IF NOT EXISTS "idx_payment_refund" ON "Payment"("status", "refundedAt")
  WHERE "status" = 'REFUNDED';

-- Finance daily summary materialized view (for >10k bookings)
CREATE MATERIALIZED VIEW IF NOT EXISTS "finance_daily_summary" AS
  SELECT
    p."establishmentId",
    DATE_TRUNC('day', p."paidAt") AS "day",
    COUNT(*) AS "booking_count",
    COALESCE(SUM(p."amount"), 0) AS "total_amount",
    COALESCE(SUM(p."tipAmount"), 0) AS "total_tips",
    COALESCE(SUM(p."platformFeeAmount"), 0) AS "total_fees",
    COALESCE(SUM(p."refundAmount"), 0) AS "total_refunds"
  FROM "Payment" p
  WHERE p."status" = 'COMPLETED'
    AND p."paidAt" IS NOT NULL
  GROUP BY p."establishmentId", DATE_TRUNC('day', p."paidAt");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_finance_daily_summary"
  ON "finance_daily_summary"("establishmentId", "day");
