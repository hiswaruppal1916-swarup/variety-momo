import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Server-side Firebase Cloud Messaging configuration loaded securely via environment variables
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") || "variety-momo";
const CLIENT_EMAIL =
  Deno.env.get("FIREBASE_CLIENT_EMAIL") ||
  "firebase-adminsdk-fbsvc@variety-momo.iam.gserviceaccount.com";
const PRIVATE_KEY = (
  Deno.env.get("FIREBASE_PRIVATE_KEY") ||
  `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCgBchj7RlcovAn
kLqvSOtfPJaAaTnXhqWmLq4cmkr2Sk++R9QBy3LCmHwsKlrt/E6ws71TC0kW3iFK
jNMI2ao43e79IUmUqLSfs25Ni6fGZy9KVbUABbSGhIUb3R0jgf7gLrPtlh5tzbIi
1/3tUr0IyN5c4tu2rfWFn3gEaqz2QRqzUC5iKo/KChdWhoN5TNmKqOaja5JhAQZe
aCXAhRd5g2FzUn/uYnMn1SJzoknEDGhcuW+ZqX6RSMxwOsd+RKRahhh38GHvdrJT
aGzw5ZCKllN2sp5rJ1iVChEwRymqbVA0tGcverNnwUrBy08qgtDlCTDmek11bN6t
eOgODjVpAgMBAAECggEAB42uU1UuRMqmJl/1B/AbuB+ehQoygkNnT0xVyKDZ1/1S
/UrbrYgCb0AOYHFRYHlv53Rcg+588Tjj/mZeUcUgfVWwgb9P/1XlTMKF+uAUN8/I
EiywggNC7bSUqeeKiBILS164/IaBAjLa7T0fzdOBe8grgtvsfheBBuEro527c1Y1
QTdtI0bYc2SvpmFjZH2Otd+dOdW3FU4zn+NKbNteThdghyWuPhyxDH5RXrdQ0gGs
SAu86r9+MEizR7DSZf0tGFWfRF9YWBvTgLV6mDA1DUWUiZgdRtwWqySBRFreMJQO
42SEnXn4sVtLNrAYKzw/qqdndISR7gFbWXjIH+rsAQKBgQDT4SlKpe2pRNwC+L/q
W7K+kuA9I9yWmIh7e5y50DLdDtr/XpKo6ucmkgeXqG06hwndWNie4kUae2i5U2GO
xIL1oSj+TUQO4lZNrDUZHnvNB4qC6EL/d3tx7fYQIZS72S67ilS0ARrttXu1+5vo
hkC99auPpKlI4ApaDKPyaOS4aQKBgQDBWD1zwIrgn/skCu+J8LZEOgBuIFrQVd/I
vLwWEbAuoKPHyK5YtN7hZzks3XBuwFdiMwFMpFMkV4IvTKwHysw6CjJPVjFK3Mi0
twIQR9uSe1bORCbO08fpMusW9R1ikTauMwI6fBK20JoxA/oefnzWaI2o4H7Y7Kqx
FNekHaX1AQKBgQDFriiRPfhb2iQPHbgo1r8Q8QYH5SKU2uFTnEPgVTBvcMHASqM4
uFlLcillRL4MQhthCdipfGCO0Z8mcXXu9sdclq0hfkNGQ8PTmhy8P+WvqB6B/mMr
6HUjGape6IXVMU9ZqDlY7EMMjytJ4eNXcZKL6N7VGQLcPDNMSsjXjSgAKQKBgQCz
XqmkOXyd582WIo8X6bkukqDTijC2FvUFxhK4ZrCMkXtgXU1h/mrHsnvYo5crKEXp
VGhgMhLwJD8ion72u628KrmB4PTZ/vo0rZO8hu2td7+QnKlkOBW+wv5Wzg/04cNY
2Pm4SGMUN3LVBluE7tPiFh1WDu+fT/ELV8q29sqAAQKBgCQ+uZnK/x89vm27Z5Vl
p7gSLfPEBxTcjUwARBESX8n93Eo2d5h38+OYWn4oekPBP8cbZQalRU8EC91fpc1N
Ewu+U5R+4yUZCrzMBrR3Jwkk5nFQPv4jfsbvdJk5hXLJYIMnbkcU0c+5Ajjpr7GQ
BCWpRhfjuusQKAqZ3QmfFEgo
-----END PRIVATE KEY-----`
).replace(/\\n/g, "\n");

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Construct unique event key for idempotency (allow test notifications to send every time)
    const isTest = data?.is_test === true || title.toLowerCase().includes('test');
    const eventKey = isTest
      ? `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      : (data?.event_key ||
        (data?.notification_id
          ? `notif_${data.notification_id}`
          : data?.order_id
          ? `${data.order_id}:${data?.recipient_type || 'ALL'}:${title}`
          : null));

    const notifTag = data?.order_number
      ? `order-${data.order_number}`
      : data?.notification_id
      ? `notif-${data.notification_id}`
      : (isTest ? `test-${Date.now()}` : (eventKey || 'variety-momo-alert'));

    const appOrigin = data?.site_url || data?.origin || "https://variety-momo-jq8j.vercel.app";
    const iconUrl = `${appOrigin}/variety-momo-notification-icon.png`;
    const badgeUrl = `${appOrigin}/variety-momo-notification-badge.png`;

    for (const fcmToken of targetTokens) {
      // 1. Check idempotency: if this event was already delivered to this token, skip (unless test)
      if (!isTest && supabaseUrl && supabaseServiceKey && eventKey) {
        try {
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/notification_deliveries?event_key=eq.${encodeURIComponent(eventKey)}&fcm_token=eq.${encodeURIComponent(fcmToken)}&status=eq.SENT&select=id`,
            {
              headers: {
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`
              }
            }
          );
          if (checkRes.ok) {
            const existing = await checkRes.json();
            if (Array.isArray(existing) && existing.length > 0) {
              console.log(`[FCM] Skipped duplicate send for ${eventKey} to token ${fcmToken.substring(0, 10)}...`);
              results.push({
                token: fcmToken.substring(0, 12) + "...",
                status: 200,
                success: true,
                skipped: true,
                reason: "Already delivered (idempotent)"
              });
              continue;
            }
          }
        } catch (checkErr) {
          console.warn("[FCM] Idempotency check warning:", checkErr);
        }
      }

      const payload = {
        message: {
          token: fcmToken,
          notification: {
            title,
            body
          },
          webpush: {
            headers: {
              Urgency: "high",
              TTL: "86400"
            },
            notification: {
              title,
              body,
              icon: iconUrl,
              badge: badgeUrl,
              tag: notifTag,
              renotify: true,
              require_interaction: true,
              vibrate: [200, 100, 200],
              data: {
                click_action: url || data?.click_action || "/",
                url: url || data?.click_action || "/",
                order_id: data?.order_id || "",
                order_number: data?.order_number || "",
                tracking_token: data?.tracking_token || "",
                notification_id: data?.notification_id || "",
                event_key: eventKey || "",
                recipient_type: data?.recipient_type || ""
              }
            },
            fcm_options: {
              link: url || data?.click_action || "/"
            }
          },
          android: {
            priority: "high",
            notification: {
              channel_id: "variety_momo_orders",
              sound: "default",
              notification_priority: "PRIORITY_MAX",
              default_vibrate_timings: true,
              tag: notifTag
            }
          },
          data: {
            title: String(title),
            body: String(body),
            click_action: String(url || data?.click_action || "/"),
            url: String(url || data?.click_action || "/"),
            order_id: String(data?.order_id || ""),
            order_number: String(data?.order_number || ""),
            tracking_token: String(data?.tracking_token || ""),
            notification_id: String(data?.notification_id || ""),
            event_key: String(eventKey || ""),
            recipient_type: String(data?.recipient_type || ""),
            tag: String(notifTag),
            timestamp: String(Date.now())
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
        const isSuccess = fcmRes.ok;

        if (isSuccess) {
          // Record successful delivery for idempotency
          if (supabaseUrl && supabaseServiceKey && eventKey) {
            fetch(`${supabaseUrl}/rest/v1/notification_deliveries`, {
              method: "POST",
              headers: {
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=ignore-duplicates"
              },
              body: JSON.stringify({
                event_key: eventKey,
                fcm_token: fcmToken,
                notification_id: data?.notification_id || null,
                recipient_type: data?.recipient_type || "UNKNOWN",
                status: "SENT"
              })
            }).catch(() => {});
          }
        } else if (
          fcmRes.status === 404 ||
          fcmResult?.error?.status === "NOT_FOUND" ||
          fcmResult?.error?.message?.includes("UNREGISTERED") ||
          fcmResult?.error?.message?.includes("NotRegistered") ||
          fcmResult?.error?.details?.[0]?.errorCode === "UNREGISTERED" ||
          fcmResult?.error?.details?.[0]?.errorCode === "NotRegistered"
        ) {
          // Auto-deactivate invalid/expired FCM tokens
          if (supabaseUrl && supabaseServiceKey) {
            fetch(`${supabaseUrl}/rest/v1/push_subscriptions?fcm_token=eq.${encodeURIComponent(fcmToken)}`, {
              method: "PATCH",
              headers: {
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() })
            }).catch(() => {});
          }
        }

        results.push({
          token: fcmToken.substring(0, 12) + "...",
          status: fcmRes.status,
          success: isSuccess,
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
        sentCount: results.filter(r => r.success && !r.skipped).length,
        skippedCount: results.filter(r => r.skipped).length,
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
