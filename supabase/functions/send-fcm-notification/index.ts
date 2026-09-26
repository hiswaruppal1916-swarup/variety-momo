import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Server-side Firebase Cloud Messaging configuration loaded securely via environment variables
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || "variety-momo";
const CLIENT_EMAIL = Deno.env.get("FIREBASE_CLIENT_EMAIL") || "";
const PRIVATE_KEY = (Deno.env.get("FIREBASE_PRIVATE_KEY") || "").replace(/\\n/g, "\n");

function pemToBinary(pem: string): Uint8Array {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(data: Uint8Array | string): string {
  const str = typeof data === "string" ? data : String.fromCharCode(...data);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getGoogleOAuthAccessToken(): Promise<string> {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error("FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY is not configured in Supabase Secrets.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: CLIENT_EMAIL,
    sub: CLIENT_EMAIL,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging"
  };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedJwt = `${encHeader}.${encPayload}`;

  const keyBytes = pemToBinary(PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureBytes = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(unsignedJwt))
  );

  const signedJwt = `${unsignedJwt}.${base64UrlEncode(signatureBytes)}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${signedJwt}`
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`OAuth token exchange failed (${tokenRes.status}): ${errText}`);
  }

  const tokenData = await tokenRes.json();
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: now + (tokenData.expires_in || 3600)
  };

  return tokenData.access_token;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, body, token, tokens, data, url } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required notification fields: title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetTokens: string[] = [];
    if (token) targetTokens.push(token);
    if (Array.isArray(tokens)) {
      for (const t of tokens) {
        if (t && typeof t === "string" && !targetTokens.includes(t)) {
          targetTokens.push(t);
        }
      }
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No target FCM registration tokens provided" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getGoogleOAuthAccessToken();
    const results = [];

    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    for (const fcmToken of targetTokens) {
      const payload = {
        message: {
          token: fcmToken,
          notification: {
            title,
            body
          },
          webpush: {
            notification: {
              icon: "/variety-momo-logo.jpg",
              badge: "/favicon-96x96.png",
              tag: (data?.order_number ? `order-${data.order_number}` : "variety-momo-alert"),
              renotify: true
            },
            fcm_options: {
              link: url || data?.click_action || "/"
            }
          },
          data: {
            title,
            body,
            click_action: url || data?.click_action || "/",
            order_id: data?.order_id || "",
            order_number: data?.order_number || ""
          }
        }
      };

      try {
        const fcmRes = await fetch(fcmEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const fcmResult = await fcmRes.json();
        results.push({
          token: fcmToken.substring(0, 12) + "...",
          status: fcmRes.status,
          success: fcmRes.ok,
          result: fcmResult
        });
      } catch (err: any) {
        results.push({
          token: fcmToken.substring(0, 12) + "...",
          success: false,
          error: err.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: results.filter(r => r.success).length,
        total: targetTokens.length,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
