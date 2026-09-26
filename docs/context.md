# Context – Multi-Barbershop Scheduling & Management System

## Overview
This project is a multi-establishment barbershop management system.  
Each establishment (barbershop) can have multiple barbers, clients, services, appointments, financial records, and managers.

The system must support:
- Client scheduling
- Barber daily agenda
- Manager control over barbers’ schedules
- Financial management and dashboards
- Multi-establishment support
- Secure authentication

This is an internal management system (no online payments for now).

---

## Roles & Permissions

### Roles
- CLIENT  
- BARBER  
- MANAGER  

### Permissions

| Action                               | Client | Barber | Manager |
|--------------------------------------|--------|--------|---------|
| View available time slots            | Yes    | Yes    | Yes     |
| Create appointment                   | Yes    | No     | Yes     |
| Finalize appointment (mark as done)  | No     | Yes    | Yes     |
| View own appointments                | Yes    | Yes    | Yes     |
| View barber agenda                   | No     | Yes    | Yes     |
| Manage barber working hours          | No     | No     | Yes     |
| Create schedule overrides            | No     | No     | Yes     |
| Create time off / blocks             | No     | No     | Yes     |
| View financial dashboards            | No     | Partial (own) | Yes |

---

## Core Domain Models

### Establishment
- id
- name
- latitude
- longitude
- monthlyCost

### User
- id
- name
- email (unique)
- passwordHash
- role (CLIENT | BARBER | MANAGER)
- establishmentId

### Barber
- id
- userId
- establishmentId
- commissionPercent (default 50%)

### Client
- id
- userId
- establishmentId

### Service
- id
- establishmentId
- name
- price
- durationMinutes

### Appointment
- id
- establishmentId
- barberId
- clientId
- serviceId
- startsAt
- endsAt
- status (SCHEDULED | DONE | CANCELED)
- priceSnapshot
- barberAmountSnapshot
- establishmentAmountSnapshot

> Price and commission must be stored as snapshots to preserve historical financial data.

### FinanceRecord
- id
- appointmentId
- establishmentId
- barberId
- total
- barberAmount
- establishmentAmount
- createdAt

---

## Barber Schedule System (Flexible & Manager-Controlled)

### Scheduling Rules (Priority Order)
1. Time Off / Block (specific date or time range)
2. Schedule Override (date range or weekly override)
3. Default Weekly Working Hours

This layered rule system avoids complex conditional logic and supports:
- Specific day overrides
- Weekly temporary changes
- Monthly working hour adjustments
- Vacations and special blocks

---

## Schedule Models

### Default Weekly Working Hours
Represents the base weekly schedule.

Fields:
- barberId
- weekday (0 = Sunday, 6 = Saturday)
- startTime ("09:00")
- endTime ("18:00")

### Schedule Override (Temporary Rules)
Overrides the default schedule for a date range.

Fields:
- barberId
- startDate
- endDate
- weekday (optional)
- startTime
- endTime
- reason (optional)

Examples:
- "From Feb 10 to Feb 20, works only from 13:00 to 18:00"
- "This week, on Wednesday, starts at 11:00"
- "Entire month works only afternoons"

### Time Off / Block
Hard blocks for absences or unavailable periods.

Fields:
- barberId
- date
- startTime (optional)
- endTime (optional)
- reason

Examples:
- Vacation day
- Doctor appointment
- Full-day off

---

## Appointment Availability Logic

When requesting available time slots for a barber and date:

1. Check for Time Off blocks  
   - If full-day block exists, return no slots
2. Check for Schedule Overrides covering the date  
   - If found, use override schedule
3. If no override exists, use Default Weekly Working Hours
4. Generate time slots based on service duration
5. Remove slots that conflict with:
   - Existing appointments
   - Time off ranges

This logic must run on the backend. The frontend only consumes the availability API.

---

## Financial Rules

- Barbers receive a fixed 50% commission per service.
- Establishment receives the remaining 50%.
- No online payments (internal tracking only).
- Financial records are created when an appointment is marked as DONE.
- Dashboards must support:
  - Revenue per establishment
  - Revenue per barber
  - Monthly costs vs revenue comparison
  - Profit calculation

---

## Dashboards & Metrics

Manager dashboards:
- Total revenue (monthly)
- Total costs (monthly)
- Profit
- Revenue per barber
- Number of clients
- Number of barbers

Barber dashboard:
- Total earned
- Expected earnings
- Served clients list

---

## Frontend Calendar UX

Flow:
1. User selects establishment
2. User selects barber
3. User selects a date in a calendar
4. Frontend calls availability API:
   - GET /appointments/availability?barberId=&date=&serviceId=
5. Backend returns available time slots
6. User selects a slot
7. Frontend creates appointment

Frontend libraries:
- FullCalendar (calendar)
- Modal for available slots
- Dropdown for barber selection

---

## Security & Auth

- Passwords must be hashed (bcrypt or argon2)
- JWT-based authentication
- Role-based authorization middleware
- Data isolation per establishment
- Barbers can only see their own data
- Clients can only see their own appointments
- Managers can see all data within their establishment

---

## Non-Goals (For Now)
- No online payment gateway
- No customer public marketplace
- No microservices architecture
- No real-time socket updates (optional future improvement)

---

## Architecture Constraints

- Backend: NestJS + Prisma + PostgreSQL
- Monolith backend with modular domain structure
- Clear separation of:
  - Controllers
  - Use cases (services)
  - Repositories
  - DTOs

---

## Key Principles

- Backend is the single source of truth for scheduling rules.
- Financial data must be historically consistent (snapshots).
- Schedules must be layered (default → override → time off).
- No scheduling logic in frontend.
- No SQL scattered across the codebase.