// LearnLynk Tech Test - Task 3: Edge Function create-task

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type CreateTaskPayload = {
  application_id: string;
  task_type: string;
  due_at: string;
};

const VALID_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as Partial<CreateTaskPayload>;
    const { application_id, task_type, due_at } = body;

    // -------------------------
    // INPUT VALIDATION
    --------------------------

    if (!application_id || !task_type || !due_at) {
      return json({ error: "Missing required fields." }, 400);
    }

    if (!VALID_TYPES.includes(task_type)) {
      return json(
        { error: `Invalid task_type. Must be one of: ${VALID_TYPES.join(", ")}` },
        400
      );
    }

    const dueDate = new Date(due_at);
    if (isNaN(dueDate.getTime())) {
      return json({ error: "Invalid due_at datetime format." }, 400);
    }

    const now = new Date();
    if (dueDate <= now) {
      return json({ error: "due_at must be in the future." }, 400);
    }

    // -------------------------
    // INSERT INTO TASKS TABLE
    --------------------------

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        application_id,
        type: task_type,
        due_at,
        status: "open",
        tenant_id: "SYSTEM", // or derive from application if needed
      })
      .select("id")
      .single();

    if (error) {
      console.error("DB Insert Error:", error);
      return json({ error: "Failed to create task." }, 500);
    }

    // -------------------------
    // EMIT REALTIME EVENT
    -------------------------

    await supabase.functions.invoke("broadcast", {
      body: {
        event: "task.created",
        payload: { task_id: data.id, application_id },
      },
    });

    // -------------------------
    // SUCCESS RESPONSE
    -------------------------

    return json(
      {
        success: true,
        task_id: data.id,
      },
      200
    );
  } catch (err) {
    console.error("Unhandled Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

// Helper for JSON responses
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

