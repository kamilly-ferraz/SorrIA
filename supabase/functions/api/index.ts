import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-tenant-id",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const tenantId = req.headers.get("x-tenant-id");
  const authHeader = req.headers.get("authorization");

  // Validar token Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Authorization header with Bearer token is required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!tenantId) {
    return new Response(JSON.stringify({ error: "x-tenant-id header is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Validar o token
  const token = authHeader.replace("Bearer ", "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!anonKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claimsData, error: claimsError } = await authClient.auth.getUser(token);

  if (claimsError || !claimsData?.user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Registrar requisição da API
  try {
    await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      user_id: claimsData.user.id,
      action: `api_${req.method}_${path}`,
      table_name: "api",
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
    });
  } catch {
    // Não bloqueante
  }

  try {
    // GET /patients/phone/:phone
    if (req.method === "GET" && path.startsWith("patients/phone/")) {
      const phone = decodeURIComponent(path.split("patients/phone/")[1]);
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("phone", phone)
        .limit(1);
      if (error) throw error;
      return new Response(JSON.stringify(data?.[0] || null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /patients
    if (req.method === "GET" && path === "patients") {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /patients
    if (req.method === "POST" && path === "patients") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...body, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /appointments
    if (req.method === "POST" && path === "appointments") {
      const body = await req.json();
      const required = ["patient_id", "office_id", "procedure_type_id", "appointment_date", "appointment_time"];
      for (const field of required) {
        if (!body[field]) {
          return new Response(JSON.stringify({ error: `${field} is required` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("office_id", body.office_id)
        .eq("appointment_date", body.appointment_date)
        .eq("appointment_time", body.appointment_time)
        .neq("status", "cancelled");
      if (conflicts && conflicts.length > 0) {
        return new Response(JSON.stringify({ error: "Time conflict in this office" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...body, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH /appointments/:id
    if (req.method === "PATCH" && path.match(/^appointments\/[^/]+$/)) {
      const id = path.split("/")[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from("appointments")
        .update(body)
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH /appointments/:id/status
    if (req.method === "PATCH" && path.match(/^appointments\/[^/]+\/status$/)) {
      const id = path.split("/")[1];
      const body = await req.json();
      const { data, error } = await supabase
        .from("appointments")
        .update({ status: body.status })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /offices
    if (req.method === "GET" && path === "offices") {
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /procedure-types
    if (req.method === "GET" && path === "procedure-types") {
      const { data, error } = await supabase
        .from("procedure_types")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("API error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
