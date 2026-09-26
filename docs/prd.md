# PRD -- Multi-Barbershop Scheduling & Management System

## 1. Purpose

Build a multi-establishment barbershop management system that allows:
- Clients to schedule appointments
- Barbers to manage and view their daily agenda and earnings
- Managers to control barbers' schedules, monitor performance, and manage finances

The system focuses on internal operations, financial tracking, and public-facing booking.
Online payment gateway integration and public marketplace features are out of scope for now.

---

## 2. Goals & Success Metrics

### Goals
- Provide a reliable scheduling system with no time conflicts
- Centralize financial tracking per establishment
- Give managers visibility into performance and profitability
- Improve operational efficiency for barbershops
- Support multiple establishments under the same system

### Success Metrics
- Zero double-booking incidents
- 100% of appointments reflected in financial reports
- Managers can view revenue vs costs per month
- Barbers can clearly see past and expected earnings
- Clients can book without manual intervention

---

## 3. Personas

### Client
- Wants to easily book services with a specific barber
- Wants to see available times and upcoming appointments
- Wants to manage bookings (confirm, cancel, reschedule) without needing an account

### Barber
- Wants to see daily agenda
- Wants to know how much they have earned and will earn
- Wants visibility of their client base
- Wants real-time updates on their dashboard when bookings change

### Manager
- Controls barbers' schedules and availability
- Manages services and pricing
- Tracks revenue, costs, and profit
- Monitors number of clients and barbers
- Views performance metrics in dashboards
- Configures platform fees and manages expenses
- Exports financial reports

---

## 4. User Stories

### Client
- As a client, I want to see available time slots for a barber on a specific date.
- As a client, I want to book an appointment.
- As a client, I want to view my upcoming and past appointments.
- As a client, I want to book without creating an account (public booking).
- As a client, I want to confirm, cancel, or reschedule my booking using a code.
- As a client, I want to receive WhatsApp confirmation and reminders.

### Barber
- As a barber, I want to see my daily schedule.
- As a barber, I want to see how much I have earned.
- As a barber, I want to see how much I am expected to earn from scheduled appointments.
- As a barber, I want to see the list of clients I have served.
- As a barber, I want to receive real-time updates on my dashboard when bookings change.

### Manager
- As a manager, I want to define barbers' working hours.
- As a manager, I want to override barbers' schedules for specific periods.
- As a manager, I want to block days or time ranges (vacation, days off).
- As a manager, I want to view revenue vs costs in a dashboard.
- As a manager, I want to see performance per barber.
- As a manager, I want to see total number of clients and barbers.
- As a manager, I want to manage multiple establishments.
- As a manager, I want to track expenses by category.
- As a manager, I want to configure platform fees per establishment.
- As a manager, I want to export financial reports in CSV or JSON.
- As a manager, I want to see revenue forecasting based on trends.
- As a manager, I want to manage payments and process refunds.

---

## 5. Scope

### In Scope
- Multi-establishment support
- User authentication and role-based access control
- Scheduling system with conflict prevention and appointment status tracking
- Barber schedule management (weekly base + overrides + time off)
- Financial tracking (revenue, barber commission, expenses, platform fees, profit)
- Advanced analytics dashboards (revenue, barber performance, service performance, customer analytics, capacity, forecasting)
- Payment lifecycle management (pending, completed, refunded, failed)
- Public booking system (no-account booking with code-based confirmation, cancellation, and rescheduling)
- WhatsApp notifications (booking confirmation and reminders)
- Audit trail for all booking, refund, and commission events
- Automated appointment lifecycle management (late marking, no-show detection, stale booking cleanup)
- Real-time dashboard updates for barbers
- Report export (CSV/JSON)
- Soft deletes for critical data preservation
- Encryption of sensitive client data (CPF, phone)
- Calendar-based scheduling UI
- Map visualization of establishments

### Out of Scope (for now)
- Customer marketplace / discovery platform
- Loyalty programs
- Reviews and ratings
- Real-time chat
- Online payment gateway integration (Stripe, PagSeguro, etc.)

---

## 6. Functional Requirements

### Scheduling
- The system must prevent double bookings.
- Availability must be calculated on the backend.
- Time slots must respect:
  - Default weekly schedule
  - Temporary overrides
  - Time off blocks
- Service duration must define slot size.

### Appointment Lifecycle
- Appointments follow a strict status flow: Scheduled > Confirmation Pending > Confirmed > In Progress > Done.
- Canceled and No-Show are terminal states.
- Invalid status transitions must be rejected.
- Every status change must be audited.
- Late appointments are automatically flagged.
- No-shows are automatically detected after appointment end time.
- Stale unconfirmed bookings are automatically canceled.

### Barber Schedule Management
- Managers must be able to define default weekly working hours.
- Managers must be able to define schedule overrides for date ranges.
- Managers must be able to block specific days or time ranges.

### Public Booking System
- Clients can book appointments without authentication.
- Each booking receives a unique code.
- Clients can confirm, cancel, or reschedule bookings using only their code.
- Public endpoints expose establishments, services, barbers, and available time slots.

### Financial Management
- Barbers receive configurable commission per service (default 50%).
- Establishments receive the remaining percentage.
- Expenses are tracked per establishment with categories (rent, supplies, utilities, maintenance, salary, other).
- Platform fee configurations support multiple fee types (percentage, flat, tiered, hybrid).
- Fee reconciliation compares expected vs. actual fees and reports mismatches.
- Financial reports can be exported in CSV and JSON formats.

### Payment System
- Each appointment can have an associated payment record.
- Payment lifecycle: pending > completed > refunded (or failed).
- Supported payment methods: cash, PIX, credit card, debit card.
- Refunds are supported (total or partial) with reason tracking.
- Price, barber commission, and establishment share are snapshotted at booking creation.

### Dashboards & Analytics
- Dashboard overview with KPIs (total clients, barbers, appointments, revenue).
- Revenue analytics by period, barber, or service.
- Barber performance analytics (appointments completed, commission earned, averages).
- Service performance analytics (popularity, revenue contribution).
- Customer analytics (new vs. returning, frequency).
- Capacity utilization metrics.
- Financial breakdown (revenue vs. expenses vs. profit).
- Forecasting based on historical data trends.
- Time-series data for trend visualization.

### Establishment Management
- Managers must be able to create and manage establishments.
- Each establishment stores geographic coordinates for map visualization.
- Establishment address is stored and snapshotted on appointments.

### Notifications
- Booking confirmation messages sent automatically via WhatsApp.
- Reminder messages sent before appointment time.
- Message delivery must be reliable with retry mechanisms.
- Missed reminders must be automatically recovered.

### Audit Trail
- All booking lifecycle events must be logged (created, status changed, deleted).
- Refund and commission events must be logged.
- Each log entry stores the previous and new state, plus who triggered the change.

### Real-Time Updates
- Barbers must receive live dashboard updates when their appointments change status.
- Only authorized barbers can subscribe to their own events.

---

## 7. Non-Functional Requirements

- Secure password storage (hashed)
- Role-based authorization (Barber, Manager, Super Admin)
- CSRF protection for cookie-based authentication
- Rate limiting to prevent abuse
- Data isolation per establishment
- Sensitive data encryption (CPF, phone)
- Scalable to multiple establishments and barbers
- High reliability in scheduling logic (no conflicting appointments)
- Maintainable modular backend architecture
- Soft deletes on critical entities to preserve data integrity
- Standardized domain error handling with typed error codes
- Optimized database queries with proper indexing
- Caching for frequently accessed data

---

## 8. UX Requirements

- Calendar view for appointment selection
- Barber selector
- Modal with available time slots
- Dashboard with clear KPIs and charts
- Simple and consistent UI design system
- Responsive layout for desktop and tablet

---

## 9. Technical Requirements

### Backend
- NestJS + Prisma + PostgreSQL
- Redis for caching and job queues
- Docker Compose for local infrastructure

### Frontend (separate repository)
- React or Next.js
- Charts: Chart.js or Recharts
- Calendar: FullCalendar
- Maps: Google Maps or Mapbox

---

## 10. Risks & Mitigations

### Risk: Scheduling conflicts
Mitigation:
- Backend-driven availability calculation
- Strict conflict validation on appointment creation

### Risk: Financial data inconsistency
Mitigation:
- Snapshot pricing and commissions on appointment creation
- Separate financial records

### Risk: Feature creep
Mitigation:
- Strict scope definition (no online payments, no marketplace)

### Risk: Poor UX adoption
Mitigation:
- Use existing UI libraries
- Provide calendar-based scheduling instead of forms

### Risk: Notification delivery failures
Mitigation:
- Queue-based sending with retries
- Recovery mechanism for missed notifications

---

## 11. Milestones

### Phase 1 -- Core System
- Authentication and role management
- Establishment management
- Service management
- Barber and client management
- Scheduling with conflict prevention
- User management with pagination and filters

### Phase 2 -- Financial & Dashboards
- Payment lifecycle management
- Expense tracking with categories
- Platform fee configuration
- Fee reconciliation
- Manager dashboard with KPIs
- Revenue, barber performance, service performance, and customer analytics
- Capacity utilization and financial breakdown
- Forecasting and time-series data
- Report export (CSV/JSON)
- Barber earnings summary

### Phase 3 -- UX & Visualization
- Real-time barber dashboard updates
- Calendar UI
- Map visualization
- UI polish

### Phase 4 -- Public Booking, Notifications & Automation
- Public booking system (no-account, code-based flow)
- Appointment status machine and lifecycle automation
- WhatsApp notifications (confirmation and reminders)
- Audit trail system
- Soft deletes
- Sensitive data encryption
- API documentation

---

## 12. Open Questions

### Resolved
- Clients can cancel appointments via the public booking flow.
- Automated WhatsApp reminders are sent before appointments.
- Managers can export financial reports in CSV and JSON.
- All appointment status changes are audited.

### Open (for future)
- Should there be email notifications in addition to WhatsApp?
- Should the system support multi-language (i18n) for notifications and UI?
- Should there be a client-facing mobile app with push notifications?
- Should barbers be able to set their own availability preferences?
- Should the system support recurring/subscription appointments?
