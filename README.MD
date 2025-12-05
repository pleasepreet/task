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

