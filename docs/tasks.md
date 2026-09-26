# Project Tasks – Frontend & Backend

This README organizes the work into **Backend**, grouped by **Features**, **Refactors**, **UX Improvements**, **Quality**, and **Infra & Jobs**.  
Goal: keep tracking clean, PRs small, and delivery predictable.

## 📁 Backend Tasks

### ✅ Features

- [ ] **Public Booking Validations**
  - [ ] Validate phone number (E.164 / regex + normalization)
  - [ ] Validate name (min. 2 words + junk pattern blacklist)
  - [ ] Block booking creation beyond 1 month in the future

- [ ] **Services per Barber**
  - [ ] Change service scope:
    - [ ] Service belongs to barber, not establishment
  - [ ] Endpoint: list services by barber
  - [ ] Rules:
    - [ ] A barber can only offer services linked to them

- [ ] **Refunds**
  - [ ] Endpoint to list refunds
  - [ ] Endpoint to fetch refund details

- [ ] **Confirm / Cancel / Reschedule by Code**
  - [ ] Endpoint: confirm booking by code only
  - [ ] Endpoint: cancel booking by code
  - [ ] Endpoint: reschedule booking by code
  - [ ] Remove CPF dependency for confirmation
    - [ ] Rate limit: max 5 confirmation attempts per IP per 10 minutes
    - [ ] Log all confirmation attempts (audit trail)

- [ ] **Service Notes**
  - [ ] Add `notes` field to service model
  - [ ] Persist and expose notes in booking DTO

- [ ] **Booking Location Snapshot**
  - [ ] Add address field to booking snapshot
  - [ ] Return address directly in booking payload

- [ ] **Barber Daily Summary**
  - [ ] Query: list all bookings for barber by date (default: today)
  - [ ] Query: count completed services for the day
  - [ ] Query: calculate commission total (50% of completed services)
  - [ ] Ensure data is returned in a single optimized query (avoid N+1)

- [ ] **Users List (CQRS + Pagination)**
  - [ ] Replace "barbers list" with "users list"
  - [ ] Query endpoint with:
    - [ ] Pagination
    - [ ] Filter by role (Barber, Manager, Admin)
    - [ ] Search by name
    - [ ] Sorting (name, role, createdAt)
  - [ ] Follow CQRS strictly:
    - [ ] Dedicated read model / query handlers
    - [ ] Do not reuse write models
  - [ ] Return paginated metadata (total, page, pageSize)


- [ ] **WhatsApp Notifications**
  - [ ] Choose provider (Twilio / WhatsApp Business API / MessageBird)
  - [ ] Get API credentials
  - [ ] If WhatsApp Business API: submit message templates for approval (7-14 day lead time)
  - [ ] Create message templates:
    - [ ] Booking confirmation: "Seu agendamento em {{establishment}} no dia {{date}} às {{time}} foi confirmado. Ver detalhes: {{link}}"
    - [ ] Booking reminder (24h before): "Lembrete: você tem agendamento amanhã às {{time}}. Localização: {{map_link}}"
    - [ ] Booking cancellation: "Seu agendamento foi cancelado. Reagendar: {{link}}"
  - [ ] Implement `WhatsAppService`:
    - [ ] `sendBookingConfirmation(booking)`
    - [ ] `sendBookingReminder(booking)`
    - [ ] `sendBookingCancellation(booking)`
  - [ ] Queue-based sending (BullMQ):
    - [ ] Create `send-whatsapp` job
    - [ ] Max 3 retries with exponential backoff (1s, 5s, 15s)
    - [ ] Move to dead-letter queue after failures
  - [ ] Rate limiting:
    - [ ] Respect provider limits (e.g., Twilio: 1 msg/sec)
    - [ ] Implement token bucket locally
  - [ ] Error handling:
    - [ ] Log failed sends with details
    - [ ] Alert if failure rate >5%
---

### 🔁 Refactors

- [ ] Establishment uniqueness validation:
  - [ ] Prevent two establishments with the same normalized address/location
- [ ] Expenses CQRS:
  - [ ] Separate command and query models
  - [ ] Dedicated read endpoint for finance dashboards
- [ ] Standardize domain error messages:
  - [ ] Deleting barber with active/future bookings
  - [ ] Deleting establishment with active/future bookings

---

### 🧪 Quality / Tests

- [ ] **Unit tests**:
  - [ ] Finance calculations (revenue, commission, forecasts)
  - [ ] Phone/name validation logic
- [ ] **Integration tests**:
  - [ ] Users list pagination with 10k users
  - [ ] Barber daily dashboard with 100+ bookings
- [ ] **E2E tests**:
  - [ ] Full booking flow (public page → confirmation → completion)
  - [ ] Refund flow (request → approval → refund)

---

### 🛠 Infra & Jobs (BullMQ + Cron)

- [ ] Create delay/late check job:
  - [ ] Auto-mark late bookings
- [ ] Create auto-cancel no-show job (if applicable)
- [ ] Create cancellation notification job:
  - [ ] Trigger when booking is deleted
- [ ] Cron:
  - [ ] Daily sweep for inconsistencies (expired bookings, invalid statuses)
  - [ ] **WhatsApp Jobs**:
  - [ ] `send-whatsapp` job (processes queued messages)
  - [ ] `send-booking-reminder` cron (runs daily at 9 AM, queues reminders for bookings in 24h)

> Opinionated rule:  
> Cron schedules triggers. Real processing must live in a queue (BullMQ) with retries and dead-letter handling. Cron-only jobs will fail silently and bite you later.

---

### 🔐 Domain Rules

- [ ] On booking deletion:
  - [ ] Emit cancellation event
  - [ ] Send WhatsApp notification
- [ ] Block deletion of:
  - [ ] Barber with future bookings
  - [ ] Establishment with future bookings

### 📊 Audit Log (Finance Operations)

**Purpose:** Track all state changes to financial entities for debugging and compliance.

**Implementation:**
- [ ] Create `audit_log` table:
```sql
  CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'booking', 'refund', 'commission'
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
    old_value JSONB, -- Previous state (null for 'created')
    new_value JSONB NOT NULL, -- New state
    user_id UUID, -- Who made the change (null for system actions)
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
  CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
```

- [ ] Log these events automatically (via domain events):
  - [ ] `booking.created`
  - [ ] `booking.status_changed` (scheduled → confirmed → completed → canceled)
  - [ ] `refund.created`
  - [ ] `refund.approved`
  - [ ] `commission.calculated` (when booking status → completed)
  - [ ] `commission.adjusted` (when refund issued)

- [ ] Implement logging in event handlers (example):
```typescript
  // When BookingCompletedEvent fires:
  async handle(event: BookingCompletedEvent) {
    await auditLog.create({
      entityType: 'booking',
      entityId: event.bookingId,
      action: 'status_changed',
      oldValue: { status: 'confirmed' },
      newValue: { status: 'completed', commission: event.commissionAmount },
      userId: event.userId
    });
  }
```

- [ ] Retention: Keep logs for **2 years** (financial compliance)

### ⚡ Performance Implementation

- [ ] **Users List Optimization**:
  - [ ] Add composite index:
```sql
    CREATE INDEX idx_users_list ON users(role, created_at, name) WHERE deleted_at IS NULL;
```
  - [ ] Test with 10k users (target: <100ms query time)
  - [ ] Run `EXPLAIN ANALYZE` and verify index is used (no seq scan)

- [ ] **Barber Daily Dashboard Optimization**:
  - [ ] Implement single-query fetch (use LEFT JOIN, no N+1):
```sql
    SELECT 
      b.id, b.date, b.status, b.service_price,
      s.name as service_name,
      c.name as client_name
    FROM bookings b
    LEFT JOIN services s ON b.service_id = s.id
    LEFT JOIN clients c ON b.client_id = c.id
    WHERE b.barber_id = $1 
      AND DATE(b.date) = $2 
      AND b.deleted_at IS NULL
    ORDER BY b.date ASC;
```
  - [ ] Test with 100+ bookings (target: <200ms)

- [ ] **Finance Aggregations (if >10k bookings)**:
  - [ ] Create materialized view:
```sql
    CREATE MATERIALIZED VIEW finance_daily_summary AS
    SELECT 
      barber_id,
      DATE(completed_at) as date,
      COUNT(*) as completed_count,
      SUM(service_price * 0.5) as commission_total
    FROM bookings
    WHERE status = 'COMPLETED' AND deleted_at IS NULL
    GROUP BY barber_id, DATE(completed_at);
```
  - [ ] Add cron job: `REFRESH MATERIALIZED VIEW finance_daily_summary` (runs daily at midnight)
  - [ ] Test query performance (target: <50ms even with 100k bookings)

### 🚨 Error Handling

- [ ] Define error code enum (TypeScript):
```typescript
  enum DomainErrorCode {
    BARBER_NOT_FOUND = 'BARBER_NOT_FOUND',
    BARBER_HAS_BOOKINGS = 'BARBER_HAS_BOOKINGS',
    ESTABLISHMENT_NOT_FOUND = 'ESTABLISHMENT_NOT_FOUND',
    ESTABLISHMENT_HAS_BOOKINGS = 'ESTABLISHMENT_HAS_BOOKINGS',
    BOOKING_NOT_FOUND = 'BOOKING_NOT_FOUND',
    BOOKING_EXPIRED = 'BOOKING_EXPIRED',
    INVALID_PHONE = 'INVALID_PHONE',
    INVALID_NAME = 'INVALID_NAME',
    DATE_TOO_FAR = 'DATE_TOO_FAR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
  }
```

- [ ] Standardize error response format:
```json
  {
    "statusCode": 400,
    "code": "BARBER_HAS_BOOKINGS",
    "message": "Cannot delete barber with active bookings",
    "details": { "bookingCount": 5 }
  }
```

- [ ] Use neverthrow `Result<T, DomainError>` in domain layer
- [ ] Add global exception filter (NestJS) to map errors → HTTP responses

---

### 🗄️ Data Migrations

#### Service Ownership Migration (Dev-Only)

- [ ] Drop `establishment_id` from `services` table
- [ ] Add `barber_id NOT NULL`
- [ ] Truncate tables, reseed test data
- [ ] Update all queries in one PR

#### Soft Deletes (Critical Tables) ← ADD THIS

- [ ] Add `deleted_at TIMESTAMP NULL` to:
  - [ ] `bookings`
  - [ ] `users`
  - [ ] `services`
- [ ] Update **all queries** to include `WHERE deleted_at IS NULL`
- [ ] Update **all delete operations**:
  - Replace `DELETE FROM table WHERE id = ?`
  - With `UPDATE table SET deleted_at = NOW() WHERE id = ?`
- [ ] Create utility: `softDelete(table: string, id: string)`
- [ ] Test: verify deleted records are hidden from queries but remain in DB

---

### 🔄 Real-Time Updates (SSE Backend)

**Implementation:**

- [ ] Create `/sse/barber/:id/dashboard` endpoint
- [ ] Emit `booking.status_changed` events when booking status updates
- [ ] Event payload: `{ event: "booking.status_changed", data: { bookingId, status, timestamp } }`
- [ ] Security: validate JWT, ensure barber can only subscribe to their own events
- [ ] Handle client disconnections gracefully (clean up subscriptions)

---

### 💰 Finance Rules (Locked)

**Commission:**

- 50% of service price when `status = COMPLETED`
- Refunds deduct from barber's next payout

**Out of Scope:**

- Coupons/discounts (future feature)
- Partial payments (not supported)

---

### 🔄 API Versioning

**Current:** No external clients → no versioning needed.
**Future Trigger:** Add versioning when mobile app or third-party integrations exist.

---

### 💾 Backup & Disaster Recovery

**Phase 1 (Now):**

- [ ] Audit log for finance operations (see Audit Log section below)

**Phase 2 (Before Production):**

- [ ] Automated backups
- [ ] Monthly restore tests
