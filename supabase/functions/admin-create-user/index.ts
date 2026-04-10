import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function verifyCaller(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const callerClient = createClient(SUPABASE_URL, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) throw new Error("Unauthorized");

  const admin = getAdminClient();
  const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", caller.id).single();
  const callerRole = roleData?.role;

  if (!callerRole || (callerRole !== "admin" && callerRole !== "super_admin")) {
    throw new Error("Forbidden: admin or super_admin only");
  }

  const { data: callerProfile } = await admin.from("profiles").select("tenant_id").eq("user_id", caller.id).single();

  return { admin, caller, callerRole, tenantId: callerProfile?.tenant_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // MODO BOOTSTRAP: criar super_admin usando service role key como autenticação
    if (body.action === "bootstrap_super_admin") {
      // Verificar usando header apikey (service role key)
      const apiKey = req.headers.get("apikey") || "";
      if (apiKey !== SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Invalid service key" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { email, full_name } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const admin = getAdminClient();
      
      // Verificar se usuário já existe
      const { data: { users } } = await admin.auth.admin.listUsers();
      const existing = users.find((u: any) => u.email === email);
      
      if (existing) {
        // Garantir que perfil e cargo existam
        const { data: existingProfile } = await admin.from("profiles").select("id").eq("user_id", existing.id).single();
        if (!existingProfile) {
          await admin.from("profiles").insert({
            user_id: existing.id,
            full_name: full_name || email,
            tenant_id: "00000000-0000-0000-0000-000000000000",
          });
        }
        await admin.from("user_roles").upsert({
          user_id: existing.id,
          role: "super_admin",
        }, { onConflict: "user_id" });
        
        // Enviar redefinição de senha
        await admin.auth.resetPasswordForEmail(email, {
          redirectTo: `${req.headers.get("origin")}/reset-password`,
        });

        return new Response(JSON.stringify({ success: true, user_id: existing.id, message: "Existing user promoted to super_admin. Password reset email sent." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Criar novo usuário
      const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin.from("profiles").insert({
        user_id: newUser.user!.id,
        full_name: full_name || email,
        tenant_id: "00000000-0000-0000-0000-000000000000",
      });
      await admin.from("user_roles").upsert({
        user_id: newUser.user!.id,
        role: "super_admin",
      }, { onConflict: "user_id" });

      // Enviar redefinição de senha
      await admin.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.headers.get("origin")}/reset-password`,
      });

      return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id, message: "Super admin criado. E-mail de redefinição de senha enviado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Todas as outras operações requerem admin/super_admin autenticado
    const { admin, caller, callerRole, tenantId } = await verifyCaller(req);

    // DELETE: Remover usuário
    if (req.method === "DELETE") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (callerRole !== "super_admin") {
        const { data: targetProfile } = await admin.from("profiles").select("tenant_id").eq("user_id", user_id).single();
        if (!targetProfile || targetProfile.tenant_id !== tenantId) {
          return new Response(JSON.stringify({ error: "User not found in tenant" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      const { error: deleteErr } = await admin.auth.admin.deleteUser(user_id);
      if (deleteErr) {
        return new Response(JSON.stringify({ error: deleteErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: Criar usuário
    const { email, password, full_name, role, target_tenant_id, action } = body;

    // Criar admin para um tenant específico (apenas super_admin)
    if (action === "create_admin") {
      if (callerRole !== "super_admin") {
        return new Response(JSON.stringify({ error: "Only super_admin can create admins" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!email || !password || !full_name || !target_tenant_id) {
        return new Response(JSON.stringify({ error: "Missing required fields (email, password, full_name, target_tenant_id)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, tenant_id: target_tenant_id },
      });
      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Sobrescrever cargo para admin (trigger define dentist por padrão)
      await admin.from("user_roles").update({ role: "admin" }).eq("user_id", newUser.user!.id);
      return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveTenantId = target_tenant_id || tenantId;
    if (!effectiveTenantId) {
      return new Response(JSON.stringify({ error: "No tenant_id available" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, tenant_id: effectiveTenantId },
    });

    if (createErr) {
      console.error("[admin-create-user] Error:", createErr);
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveRole = role || "dentist";
    if (effectiveRole === "admin" || effectiveRole === "dentist") {
      await admin.from("user_roles").update({ role: effectiveRole }).eq("user_id", newUser.user!.id);
    }

    return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = String(err).includes("Unauthorized") ? 401 : String(err).includes("Forbidden") ? 403 : 500;
    console.error("[admin-create-user] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
