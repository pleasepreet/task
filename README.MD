# LearnLynk – Technical Assessment

This repository contains my complete solution for the LearnLynk backend + frontend technical test.  
The project includes database schema design, RLS policies, an Edge Function, a small Next.js frontend page, and a written Stripe integration answer.

---

## 🚀 Tech Used
- Supabase Postgres
- Supabase Edge Functions (TypeScript)
- Next.js + TypeScript
- Supabase JS Client v2

---

# ---------------------------------------
# ✅ Task 1 — Database Schema
# ---------------------------------------
**File:** `backend/schema.sql`

Implements three core tables:
- `leads`
- `applications`
- `tasks`

Includes:
- UUID primary keys (`gen_random_uuid()`)
- `tenant_id`, `created_at`, `updated_at` (required)
- Foreign keys:
  - `applications.lead_id → leads.id`
  - `tasks.application_id → applications.id`
- Constraints:
  - `tasks.type` IN (`call`, `email`, `review`)
  - `tasks.due_at >= tasks.created_at`
- Indexes:
  - Leads → `tenant_id`, `owner_id`, `stage`
  - Applications → `tenant_id`, `lead_id`
  - Tasks → `tenant_id`, `due_at`, `status`

---

# ---------------------------------------
# ✅ Task 2 — Row-Level Security (RLS)
# ---------------------------------------
**File:** `backend/rls_policies.sql`

RLS Rules:
- **Counselors** can read:
  - Leads they own (`owner_id = user_id`)
  - Leads belonging to any **team** they are part of (`user_teams`)
- **Admins** can read **all leads** in their tenant
- **Insert Policy:**
  - Admins + counselors can insert leads *only inside their own tenant*

Policies use JWT claims:
- `user_id`
- `role`
- `tenant_id`

---

# ---------------------------------------
# ✅ Task 3 — Edge Function: create-task
# ---------------------------------------
**Folder:** `backend/edge-functions/create-task`  
**File:** `index.ts`

Implements a POST endpoint:

### Input:
```json
{
  "application_id": "uuid",
  "task_type": "call",
  "due_at": "2025-01-01T12:00:00Z"
}

Logic:

Validates task_type ∈ {call, email, review}

Validates due_at is a valid future timestamp

Inserts into tasks using service role key

Emits realtime event "task.created"

Returns:

{ "success": true, "task_id": "..." }

Response Codes:

400 → validation errors

500 → internal errors

---------------------------------------
✅ Task 4 — Frontend Page: /dashboard/today
---------------------------------------

File: frontend/pages/dashboard/today.tsx

Implements a small Next.js page that:

Fetches tasks due today

Displays:

type

application_id

due_at

status

Adds "Mark Complete" button → updates task via Supabase

Shows loading + error states

Uses the provided Supabase browser client

Date filtering uses ISO ranges:

.gte("due_at", today.toISOString())
.lt("due_at", tomorrow.toISOString())

---------------------------------------
✅ Task 5 — Stripe Answer (Written)
---------------------------------------
Stripe Answer

To charge an application fee, I would first insert a payment_requests row containing application_id, amount, currency, and an initial status like "pending".
Next, I would call Stripe’s API to create a Checkout Session and store the payment_request_id inside metadata.
Stripe returns a session.url, which I send to the frontend for redirect.
When the payment completes, Stripe triggers a checkout.session.completed webhook.
In the webhook handler, I verify the signature, read the metadata.payment_request_id, and update payment_requests.status to "paid" while storing identifiers like session_id and payment_intent.
After confirming payment, I update the related applications row—typically setting the stage to "payment_received" or adding a timeline entry.
