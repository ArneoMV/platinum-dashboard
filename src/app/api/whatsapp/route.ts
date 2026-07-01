import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

// Webhook must never be statically optimized: it reads request data and has side effects.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// --- Fixed-option value sets (canonical forms) ------------------------------
const KANALI = ["mail", "telefon", "webshop", "osobno"] as const;
const STATUSI = ["aktivan", "za_kontakt"] as const;
const KATEGORIJE = [
  "Velika pakiranja",
  "Atraktivne sorte",
  "Vranac",
  "Vrhunska Hrvatska vina",
  "Vintonic",
] as const;
const PAKIRANJA = ["2 L", "1 L", "0.75 L", "3 L (bag-in-box)"] as const;

type Tip = "narudzba" | "klijent" | "vino";

// Per-type field spec: which keys are strings, which are numbers, which are
// fixed-option enums (and their allowed canonical values).
type Spec = {
  strings: readonly string[];
  numbers: readonly string[];
  enums: Readonly<Record<string, readonly string[]>>;
};

const SPECS: Record<Tip, Spec> = {
  narudzba: {
    strings: ["klijent_naziv"],
    numbers: ["iznos", "stavke"],
    enums: { kanal: KANALI },
  },
  klijent: {
    strings: [
      "naziv",
      "grad",
      "regija",
      "email",
      "kontakt_osoba",
      "uobicajena_narudzba",
    ],
    numbers: [],
    enums: { status: STATUSI },
  },
  vino: {
    strings: ["naziv", "sorta", "porijeklo"],
    numbers: ["alkohol", "prodajna_cijena", "nabavna_cijena", "zaliha"],
    enums: { kategorija: KATEGORIJE, pakiranje: PAKIRANJA },
  },
};

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

type Classified = { tip: Tip; podaci: Record<string, string | number> };

type DoPostResult = {
  ok?: boolean;
  id?: string;
  upisano?: Record<string, unknown>;
  error?: string;
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

    const result = await classifyAndExtract(text);
    if (!result) {
      await sendWhatsApp(
        from,
        "Nisam uspio razumjeti poruku. Primjer: „N Restoran More, 1200 €, 3 stavke, telefon\".",
      );
      return ok();
    }

    const { tip, podaci } = result;

    // Minimum required fields per type — if unmet, ask and don't write.
    const missing = missingMessage(tip, podaci);
    if (missing) {
      await sendWhatsApp(from, missing);
      return ok();
    }

    const res = await writeToSheet(tip, podaci);

    if (res && res.ok === true) {
      // Use the id + echoed data doPost returns (webhook no longer owns them).
      const data: Record<string, unknown> = { ...podaci, ...(res.upisano ?? {}) };
      await sendWhatsApp(from, confirmation(tip, res.id ?? "", data));
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

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
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

function missingMessage(
  tip: Tip,
  podaci: Record<string, string | number>,
): string | null {
  if (tip === "narudzba") {
    if (typeof podaci.klijent_naziv !== "string" || typeof podaci.iznos !== "number") {
      return "Nedostaju podaci za narudžbu. Molim navedite barem naziv klijenta i iznos (€).";
    }
  } else if (tip === "klijent") {
    if (typeof podaci.naziv !== "string") {
      return "Nedostaje naziv klijenta.";
    }
  } else {
    if (typeof podaci.naziv !== "string") {
      return "Nedostaje naziv vina.";
    }
  }
  return null;
}

function confirmation(
  tip: Tip,
  id: string,
  data: Record<string, unknown>,
): string {
  const idPart = id || "?";
  switch (tip) {
    case "narudzba":
      return `Zapisano ✓ narudžba ${idPart}: ${str(data.klijent_naziv)} · ${str(data.iznos)} €`;
    case "klijent":
      return `Zapisano ✓ klijent ${idPart}: ${str(data.naziv)}`;
    case "vino":
      return `Zapisano ✓ vino ${idPart}: ${str(data.naziv)}`;
  }
}

// Build a clean podaci object: keep only known keys per type, coerce numbers,
// validate fixed-options (non-canonical values are dropped and noted), and
// gather any notes into `biljeska`.
function sanitize(
  tip: Tip,
  raw: Record<string, unknown>,
): Record<string, string | number> {
  const spec = SPECS[tip];
  const out: Record<string, string | number> = {};
  const notes: string[] = [];

  for (const key of spec.strings) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) {
      out[key] = v.trim();
    }
  }

  for (const key of spec.numbers) {
    const v = raw[key];
    // Claude is asked to return clean numbers; string is a defensive fallback.
    const n =
      typeof v === "number"
        ? v
        : typeof v === "string" && v.trim() !== ""
          ? Number(v.replace(/[^\d,.-]/g, "").replace(",", "."))
          : NaN;
    if (Number.isFinite(n)) {
      out[key] = n;
    }
  }

  for (const key of Object.keys(spec.enums)) {
    const allowed = spec.enums[key];
    const v = raw[key];
    if (typeof v === "string" && allowed.includes(v)) {
      out[key] = v;
    } else if (v !== null && v !== undefined && String(v).trim() !== "") {
      notes.push(`${key}: "${String(v).trim()}" nije u standardnim opcijama`);
    }
  }

  const claudeNote = typeof raw.biljeska === "string" ? raw.biljeska.trim() : "";
  const allNotes = [claudeNote, ...notes].filter(Boolean);
  if (allNotes.length) {
    out.biljeska = allNotes.join("; ");
  }

  // Default status for a client when unclear.
  if (tip === "klijent" && typeof out.status !== "string") {
    out.status = "aktivan";
  }

  return out;
}

async function classifyAndExtract(text: string): Promise<Classified | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system = `Ti si asistent za unos podataka za hrvatskog distributera vina (Platinum vina).
Klasificiraj korisnikovu poruku u JEDAN tip i izvuci relevantna polja. Vrati ISKLJUČIVO JSON objekt, bez teksta i bez markdown ograda.

Format odgovora:
{ "tip": "narudzba" | "klijent" | "vino", "podaci": { ... } }

KLASIFIKACIJA:
- Ako poruka počinje slovom-prefiksom "K", "V" ili "N" (može biti praćeno s ":", "-" ili razmakom), to je jak signal: K = klijent, V = vino, N = narudzba. Ukloni prefiks prije izvlačenja podataka.
- Inače zaključi tip iz sadržaja poruke.

POLJA PO TIPU (izvuci SAMO polja za klasificirani tip):
- narudzba: klijent_naziv (string), iznos (number, EUR), stavke (number), kanal
- klijent:  naziv, grad, regija, email, kontakt_osoba, uobicajena_narudzba, status
- vino:     naziv, kategorija, sorta, porijeklo, pakiranje, alkohol (number), prodajna_cijena (number), nabavna_cijena (number), zaliha (number)

POLJA S FIKSNIM OPCIJAMA — normaliziraj slobodan tekst na TOČNU dopuštenu vrijednost (prepoznaj varijante, npr. "0,75L", "0.75 litara", "075" → "0.75 L"):
- kanal (narudzba): mail | telefon | webshop | osobno
- status (klijent): aktivan | za_kontakt   (ako nije jasno, koristi "aktivan")
- kategorija (vino): Velika pakiranja | Atraktivne sorte | Vranac | Vrhunska Hrvatska vina | Vintonic
- pakiranje (vino): 2 L | 1 L | 0.75 L | 3 L (bag-in-box)

PRAVILA:
- Brojčana polja (iznos, stavke, alkohol, prodajna_cijena, nabavna_cijena, zaliha): vrati samo broj, bez znaka valute i bez separatora tisućica (decimalni zarez pretvori u točku).
- Ako je vrijednost fiksnog polja jasno prisutna ali NE odgovara nijednoj dopuštenoj opciji, postavi to polje na null I dodaj kratku napomenu u polje "biljeska" (npr. "pakiranje: 5L nije u standardnim opcijama").
- Sve dodatne informacije koje ne pripadaju strukturiranom polju stavi u "biljeska".
- Polja koja nedostaju ili su nejasna: null (ili izostavi).
- Ne izmišljaj vrijednosti.
- Vrati SAMO JSON objekt.`;

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system,
    messages: [{ role: "user", content: text }],
  });

  const raw = msg.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    console.error("[whatsapp] classify response not JSON:", raw.slice(0, 200));
    return null;
  }

  const obj = parsed as { tip?: unknown; podaci?: unknown };
  const tip = obj.tip;
  if (tip !== "narudzba" && tip !== "klijent" && tip !== "vino") {
    console.error("[whatsapp] classify returned unknown tip:", str(tip));
    return null;
  }

  const rawPodaci =
    obj.podaci && typeof obj.podaci === "object"
      ? (obj.podaci as Record<string, unknown>)
      : {};

  return { tip, podaci: sanitize(tip, rawPodaci) };
}

async function writeToSheet(
  tip: Tip,
  podaci: Record<string, string | number>,
): Promise<DoPostResult | null> {
  const url = process.env.APPS_SCRIPT_URL;
  const token = process.env.APPS_SCRIPT_TOKEN;
  if (!url || !token) {
    console.error("[whatsapp] missing APPS_SCRIPT_URL or APPS_SCRIPT_TOKEN");
    return null;
  }

  try {
    // Apps Script 302-redirects POST to googleusercontent; fetch follows it.
    // New contract: { token, tip, podaci } — doPost owns id, datum, klijent_id.
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tip, podaci }),
    });
    const detail = await res.text();
    if (!res.ok) {
      console.error(
        "[whatsapp] Apps Script write failed:",
        res.status,
        res.statusText,
        detail.slice(0, 200),
      );
      return null;
    }

    // Success requires a real app-level confirmation ({ ok: true }), not just
    // HTTP 200 — a 200 with ok:false or a non-JSON body is treated as failure.
    try {
      const json = JSON.parse(detail) as DoPostResult;
      if (json.ok !== true) {
        console.error(
          "[whatsapp] Apps Script returned ok!==true:",
          detail.slice(0, 200),
        );
      }
      return json;
    } catch {
      console.error(
        "[whatsapp] Apps Script response not JSON:",
        detail.slice(0, 200),
      );
      return null;
    }
  } catch (err) {
    console.error("[whatsapp] Apps Script write error:", err);
    return null;
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
