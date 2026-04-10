import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar/callback`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/google-calendar\/?/, "").replace(/^functions\/v1\/google-calendar\/?/, "");

  try {
    // ─── GET /auth-url ───
    if (path === "auth-url") {
      const user = await getAuthUser(req);
      if (!user) return json({ error: "Unauthorized" }, 401);

      const origin = req.headers.get("origin") || req.headers.get("referer") || "";
      const appOrigin = origin ? new URL(origin).origin : "";

      const scope = "https://www.googleapis.com/auth/calendar.events";
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scope);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", `${user.id}|${appOrigin}`);

      return json({ url: authUrl.toString() });
    }

    // ─── GET /callback ───
    if (path === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "";
      const error = url.searchParams.get("error");

      const [userId, appOrigin] = state.split("|");
      const redirectBase = appOrigin || "";

      // Caso de erro → redirecionar para página de erro do frontend
      if (error || !code || !userId) {
        const errorMsg = error || "missing_params";
        if (redirectBase) {
          return Response.redirect(
            `${redirectBase}/google-calendar/callback?status=error&message=${encodeURIComponent(errorMsg)}`,
            302
          );
        }
        return json({ error: errorMsg }, 400);
      }

      // Trocar código por tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();

      if (tokens.error) {
        console.error("[callback] Token exchange error:", tokens);
        const errMsg = tokens.error_description || tokens.error;
        if (redirectBase) {
          return Response.redirect(
            `${redirectBase}/google-calendar/callback?status=error&message=${encodeURIComponent(errMsg)}`,
            302
          );
        }
        return json({ error: errMsg }, 400);
      }

      // Armazenar tokens nos metadados do usuário
      const admin = getSupabaseAdmin();
      const { data: { user: existingUser } } = await admin.auth.admin.getUserById(userId);
      const currentMeta = existingUser?.user_metadata || {};
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...currentMeta,
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token || currentMeta.google_refresh_token,
          google_token_expires_at: Date.now() + (tokens.expires_in || 3600) * 1000,
        },
      });

      // Redirecionar para página de sucesso do frontend
      if (redirectBase) {
        return Response.redirect(
          `${redirectBase}/google-calendar/callback?status=success`,
          302
        );
      }
      return json({ success: true });
    }

    // ─── GET /status ───
    if (path === "status") {
      const user = await getAuthUser(req);
      if (!user) return json({ connected: false });
      const connected = !!user.user_metadata?.google_refresh_token;
      return json({ connected });
    }

    // ─── POST /create-event ───
    if (path === "create-event" && req.method === "POST") {
      const user = await getAuthUser(req);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const body = await req.json();
      const accessToken = await getValidAccessToken(user);
      if (!accessToken) return json({ error: "Google Calendar not connected" }, 400);
      const event = {
        summary: `${body.patient_name} — ${body.procedure_name}`,
        description: `Consultório: ${body.office_name}\n${body.notes || ""}`,
        start: { dateTime: `${body.date}T${body.time}:00`, timeZone: "America/Sao_Paulo" },
        end: { dateTime: `${body.date}T${addMinutes(body.time, body.duration || 30)}:00`, timeZone: "America/Sao_Paulo" },
      };
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      const created = await res.json();
      if (!res.ok) return json({ error: created.error?.message || "Failed" }, res.status);
      return json({ event_id: created.id });
    }

    // ─── POST /update-event ───
    if (path === "update-event" && (req.method === "PATCH" || req.method === "POST")) {
      const user = await getAuthUser(req);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const body = await req.json();
      const accessToken = await getValidAccessToken(user);
      if (!accessToken) return json({ error: "Google Calendar not connected" }, 400);
      const event: Record<string, unknown> = {};
      if (body.patient_name) event.summary = `${body.patient_name} — ${body.procedure_name || ""}`;
      if (body.date && body.time) {
        event.start = { dateTime: `${body.date}T${body.time}:00`, timeZone: "America/Sao_Paulo" };
        event.end = { dateTime: `${body.date}T${addMinutes(body.time, body.duration || 30)}:00`, timeZone: "America/Sao_Paulo" };
      }
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${body.event_id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      return json({ success: true });
    }

    // ─── POST /delete-event ───
    if (path === "delete-event" && (req.method === "DELETE" || req.method === "POST")) {
      const user = await getAuthUser(req);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const body = await req.json();
      const accessToken = await getValidAccessToken(user);
      if (!accessToken) return json({ error: "Google Calendar not connected" }, 400);
      await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${body.event_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return json({ success: true });
    }

    // ─── POST /disconnect ───
    if (path === "disconnect") {
      const user = await getAuthUser(req);
      if (!user) return json({ error: "Unauthorized" }, 401);
      const accessToken = user.user_metadata?.google_access_token;
      if (accessToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, { method: "POST" });
        } catch (e) {
          console.error("[disconnect] Revoke failed:", e);
        }
      }
      const admin = getSupabaseAdmin();
      const currentMeta = user.user_metadata || {};
      const { google_access_token, google_refresh_token, google_token_expires_at, ...rest } = currentMeta;
      await admin.auth.admin.updateUserById(user.id, { user_metadata: rest });
      return json({ success: true });
    }

    return json({ error: "Not found", path }, 404);
  } catch (err) {
    console.error("[google-calendar] Error:", err);
    return json({ error: String(err) }, 500);
  }
});

async function getValidAccessToken(user: any): Promise<string | null> {
  const meta = user.user_metadata;
  if (!meta?.google_refresh_token) return null;
  if (meta.google_access_token && meta.google_token_expires_at > Date.now() + 60000) {
    return meta.google_access_token;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: meta.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const tokens = await res.json();
  if (tokens.error) return null;
  const admin = getSupabaseAdmin();
  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...meta, google_access_token: tokens.access_token, google_token_expires_at: Date.now() + (tokens.expires_in || 3600) * 1000 },
  });
  return tokens.access_token;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
