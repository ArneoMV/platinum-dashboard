import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

import type { Narudzba } from "@/lib/types";

// Webhook must never be statically optimized: it reads request data and has side effects.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KANALI = ["mail", "telefon", "webshop", "osobno"] as const;
type Kanal = (typeof KANALI)[number];

// --- WhatsApp Cloud API webhook payload (only the parts we read) ---
type WhatsAppWebhook = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

type ParsedOrder = {
  klijent_naziv: string | null;
  iznos: number | null;
  stavke: number | null;
  kanal: Kanal | null;
};

// ---------------------------------------------------------------------------
// GET — webhook verification handshake (Meta calls this once when you subscribe)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const verifyToken = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && verifyToken === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new Response("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — incoming message. ALWAYS returns 200 quickly (Meta retries non-2xx).
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WhatsAppWebhook;
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Status callbacks (delivered/read) and other non-message events: ignore.
    if (!message) {
      return ok();
    }

    const from = message.from;
    const text = message.text?.body;
    if (!from) {
      return ok();
    }

    // Allowlist: if ALLOWED_NUMBERS is set, only those senders are processed.
    // If unset (test phase), allow everyone.
    const allowedRaw = process.env.ALLOWED_NUMBERS;
    if (allowedRaw) {
      const allowed = allowedRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!allowed.includes(from)) {
        return ok();
      }
    }

    // Non-text messages (image/audio/etc.) have nothing to parse.
    if (!text || !text.trim()) {
      return ok();
    }

    const order = await parseOrder(text);

    // Hard requirements for a usable order row.
    if (!order.klijent_naziv || order.iznos === null) {
      await sendWhatsApp(
        from,
        "Nedostaju podaci za narudžbu. Molim navedite barem naziv klijenta i iznos (€).",
      );
      return ok();
    }

    const narudzba: Narudzba = {
      id: `w-${Date.now()}`,
      datum: zagrebToday(),
      klijent_id: "",
      klijent_naziv: order.klijent_naziv,
      stavke: order.stavke ?? 0,
      iznos: order.iznos,
      kanal: order.kanal ?? "",
    };

    const written = await writeNarudzba(narudzba);

    if (written) {
      await sendWhatsApp(
        from,
        `Zapisano ✓ ${narudzba.klijent_naziv} · ${narudzba.stavke} stavki · ${narudzba.iznos} € · ${narudzba.kanal || "—"}`,
      );
    } else {
      await sendWhatsApp(from, "Greška pri spremanju. Pokušajte ponovno.");
    }
  } catch (err) {
    // Swallow everything: we must still return 200 so Meta doesn't retry-storm.
    console.error("[whatsapp] webhook error:", err);
  }

  return ok();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function ok(): Response {
  return new Response("OK", { status: 200 });
}

// Pin to Zagreb local date (en-CA formats as YYYY-MM-DD) so it matches the
// dashboard's local-time bucketing regardless of server timezone (Vercel = UTC).
function zagrebToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function stripFences(s: string): string {
  const t = s.trim();
  if (t.startsWith("```")) {
    return t
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
  }
  return t;
}

async function parseOrder(text: string): Promise<ParsedOrder> {
  const empty: ParsedOrder = {
    klijent_naziv: null,
    iznos: null,
    stavke: null,
    kanal: null,
  };

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system = `Ti si asistent za unos narudžbi za hrvatskog distributera vina (Platinum vina).
Iz korisnikove poruke na hrvatskom izvuci JEDNU narudžbu i vrati ISKLJUČIVO JSON objekt — bez ikakvog teksta, bez markdown ograda.

Shema (svi ključevi obavezni; koristi null kad vrijednost nedostaje ili je nejasna):
{
  "klijent_naziv": string|null,  // naziv klijenta/tvrtke točno kako je napisan
  "iznos": number|null,          // ukupan iznos narudžbe u EUR, samo brojke (npr. 1250.50)
  "stavke": number|null,         // broj stavki / različitih artikala u narudžbi
  "kanal": "mail"|"telefon"|"webshop"|"osobno"|null  // kanal narudžbe
}

Pravila:
- Za "iznos" i "stavke" vrati samo broj (bez znaka valute, bez separatora tisućica).
- "kanal" mora biti točno jedan od: mail, telefon, webshop, osobno. Ako kanal nije naveden ili ne odgovara, koristi null.
- Ne izmišljaj naziv klijenta; ako nije naveden, koristi null.
- Izlaz je striktno JSON objekt i ništa drugo.`;

  let raw = "";
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system,
    messages: [{ role: "user", content: text }],
  });
  raw = msg.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  try {
    const parsed = JSON.parse(stripFences(raw)) as Partial<ParsedOrder>;
    const kanal =
      typeof parsed.kanal === "string" &&
      (KANALI as readonly string[]).includes(parsed.kanal)
        ? (parsed.kanal as Kanal)
        : null;
    return {
      klijent_naziv:
        typeof parsed.klijent_naziv === "string" && parsed.klijent_naziv.trim()
          ? parsed.klijent_naziv.trim()
          : null,
      iznos:
        typeof parsed.iznos === "number" && Number.isFinite(parsed.iznos)
          ? parsed.iznos
          : null,
      stavke:
        typeof parsed.stavke === "number" && Number.isFinite(parsed.stavke)
          ? parsed.stavke
          : null,
      kanal,
    };
  } catch {
    return empty;
  }
}

async function writeNarudzba(narudzba: Narudzba): Promise<boolean> {
  const url = process.env.APPS_SCRIPT_URL;
  const token = process.env.APPS_SCRIPT_TOKEN;
  if (!url || !token) {
    console.error("[whatsapp] missing APPS_SCRIPT_URL or APPS_SCRIPT_TOKEN");
    return false;
  }

  try {
    // Apps Script 302-redirects POST to googleusercontent; fetch follows it.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, narudzba }),
    });
    const detail = await res.text();
    if (!res.ok) {
      console.error(
        "[whatsapp] Apps Script write failed:",
        res.status,
        res.statusText,
        detail.slice(0, 200),
      );
      return false;
    }

    // Success requires a real app-level confirmation ({ ok: true }), not just
    // HTTP 200 — a 200 with ok:false or a non-JSON body is treated as failure.
    try {
      const json = JSON.parse(detail) as { ok?: boolean };
      if (json.ok === true) {
        return true;
      }
      console.error(
        "[whatsapp] Apps Script returned ok!==true:",
        detail.slice(0, 200),
      );
      return false;
    } catch {
      console.error(
        "[whatsapp] Apps Script response not JSON:",
        detail.slice(0, 200),
      );
      return false;
    }
  } catch (err) {
    console.error("[whatsapp] Apps Script write error:", err);
    return false;
  }
}

async function sendWhatsApp(to: string, bodyText: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.error("[whatsapp] missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
    return;
  }

  // Observability before the send — never log the full token (prefix + length only).
  console.log(
    "[whatsapp] sending reply:",
    JSON.stringify({
      to,
      phoneNumberId,
      tokenPresent: true,
      tokenLength: token.length,
      tokenPrefix: token.slice(0, 6),
    }),
  );

  try {
    const res = await fetch(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: bodyText },
        }),
      },
    );

    // Always read + log the full body: Graph can return an error INSIDE a 200,
    // so success-path logging is exactly the blind spot we are diagnosing.
    const detail = await res.text();

    if (!res.ok) {
      console.error(
        "[whatsapp] send failed:",
        res.status,
        res.statusText,
        detail,
      );
      return;
    }

    let messageId: string | undefined;
    let apiError: unknown;
    try {
      const json = JSON.parse(detail) as {
        messages?: Array<{ id?: string }>;
        error?: unknown;
      };
      messageId = json.messages?.[0]?.id;
      apiError = json.error;
    } catch {
      // Non-JSON 200 body — keep the raw text for inspection below.
    }

    if (apiError) {
      // 200 status but Graph reported an error in the payload.
      console.error(
        "[whatsapp] send returned 200 with an error payload:",
        detail,
      );
    } else {
      console.log(
        "[whatsapp] send ok:",
        res.status,
        JSON.stringify({ messageId: messageId ?? null }),
        detail,
      );
    }
  } catch (err) {
    console.error("[whatsapp] send error:", err);
  }
}
