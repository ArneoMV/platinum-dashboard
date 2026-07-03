import type { Klijent, Vino, Narudzba } from './types';

// Pure, total metrics over already-typed arrays. No I/O. Functions never throw and
// handle empty inputs. Dates arrive as ISO strings (possibly with time/zone) and are
// parsed with `new Date(...)`; calendar buckets use local time, since the source dates
// are authored as local calendar days.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 'YYYY-MM' key for a date (local time). */
function mjesecKljuc(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function valjanDatum(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function uMjesecu(o: Narudzba, godina: number, mjesec: number): boolean {
  const d = new Date(o.datum);
  return valjanDatum(d) && d.getFullYear() === godina && d.getMonth() === mjesec;
}

function zbroj(nums: number[]): number {
  return nums.reduce((acc, x) => acc + x, 0);
}

export function prihodTekuciMjesec(n: Narudzba[]): number {
  const now = new Date();
  const godina = now.getFullYear();
  const mjesec = now.getMonth();
  return zbroj(n.filter((o) => uMjesecu(o, godina, mjesec)).map((o) => o.iznos));
}

export function brojNarudzbiTekuciMjesec(n: Narudzba[]): number {
  const now = new Date();
  const godina = now.getFullYear();
  const mjesec = now.getMonth();
  return n.filter((o) => uMjesecu(o, godina, mjesec)).length;
}

// Average order value in the current month; 0 when there are no orders this month.
export function prosjekNarudzbeMjesec(n: Narudzba[]): number {
  const broj = brojNarudzbiTekuciMjesec(n);
  if (broj === 0) return 0;
  return prihodTekuciMjesec(n) / broj;
}

// Revenue for the last N months including the current one, oldest -> newest,
// 'YYYY-MM' keys, missing months filled with 0.
export function prihodPoMjesecima(
  n: Narudzba[],
  mjeseci = 6,
): { mjesec: string; iznos: number }[] {
  const now = new Date();
  const kljucevi: string[] = [];
  for (let i = mjeseci - 1; i >= 0; i--) {
    kljucevi.push(mjesecKljuc(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }

  const suma = new Map<string, number>(kljucevi.map((k) => [k, 0]));
  for (const o of n) {
    const d = new Date(o.datum);
    if (!valjanDatum(d)) continue;
    const k = mjesecKljuc(d);
    if (suma.has(k)) suma.set(k, (suma.get(k) ?? 0) + o.iznos);
  }

  return kljucevi.map((mjesec) => ({ mjesec, iznos: suma.get(mjesec) ?? 0 }));
}

// Whole days since the client's most recent order; Infinity if they have none.
export function danaOdZadnjeNarudzbe(klijentId: string, n: Narudzba[]): number {
  let maxTs = -Infinity;
  for (const o of n) {
    if (o.klijent_id !== klijentId) continue;
    const ts = new Date(o.datum).getTime();
    if (!Number.isNaN(ts) && ts > maxTs) maxTs = ts;
  }
  if (maxTs === -Infinity) return Infinity;
  return Math.floor((Date.now() - maxTs) / MS_PER_DAY);
}

// Clients whose last order is >= `prag` days ago (or who never ordered), worst first.
export function klijentiZaKontakt(
  k: Klijent[],
  n: Narudzba[],
  prag = 45,
): (Klijent & { dani: number })[] {
  return k
    .map((klijent) => ({ ...klijent, dani: danaOdZadnjeNarudzbe(klijent.id, n) }))
    .filter((klijent) => klijent.dani >= prag)
    .sort((a, b) => (a.dani === b.dani ? 0 : a.dani > b.dani ? -1 : 1));
}

export function prihodPoRegiji(
  n: Narudzba[],
  k: Klijent[],
): { regija: string; iznos: number }[] {
  const regijaPoId = new Map<string, string>(k.map((klijent) => [klijent.id, klijent.regija]));

  const suma = new Map<string, number>();
  for (const o of n) {
    const regija = regijaPoId.get(o.klijent_id) ?? 'Nepoznato';
    suma.set(regija, (suma.get(regija) ?? 0) + o.iznos);
  }

  return [...suma.entries()]
    .map(([regija, iznos]) => ({ regija, iznos }))
    .sort((a, b) => b.iznos - a.iznos);
}

export function prihodPoKanalu(n: Narudzba[]): { kanal: string; iznos: number }[] {
  const suma = new Map<string, number>();
  for (const o of n) {
    suma.set(o.kanal, (suma.get(o.kanal) ?? 0) + o.iznos);
  }

  return [...suma.entries()]
    .map(([kanal, iznos]) => ({ kanal, iznos }))
    .sort((a, b) => b.iznos - a.iznos);
}

// Gross margin of a single wine in [.. , 1]; 0 when sale price is non-positive.
export function marzaVina(v: Vino): number {
  if (v.prodajna_cijena <= 0) return 0;
  return (v.prodajna_cijena - v.nabavna_cijena) / v.prodajna_cijena;
}

// Average margin and wine count per category (category order = first appearance).
export function marzaPoKategoriji(
  v: Vino[],
): { kategorija: string; marza: number; broj: number }[] {
  const grupe = new Map<string, { zbrojMarzi: number; broj: number }>();
  for (const vino of v) {
    const g = grupe.get(vino.kategorija) ?? { zbrojMarzi: 0, broj: 0 };
    g.zbrojMarzi += marzaVina(vino);
    g.broj += 1;
    grupe.set(vino.kategorija, g);
  }

  return [...grupe.entries()].map(([kategorija, g]) => ({
    kategorija,
    marza: g.broj === 0 ? 0 : g.zbrojMarzi / g.broj,
    broj: g.broj,
  }));
}

// ── Home overview helpers ───────────────────────────────────────────────────

// The n wines with the lowest stock, ascending. No threshold — just the lowest n.
export function vinaNajnizaZaliha(
  v: Vino[],
  n = 3,
): { naziv: string; zaliha: number }[] {
  return [...v]
    .sort((a, b) => a.zaliha - b.zaliha)
    .slice(0, n)
    .map((vino) => ({ naziv: vino.naziv, zaliha: vino.zaliha }));
}

// The single most recent order by datum; null when there are none.
export function zadnjaNarudzba(
  n: Narudzba[],
): { klijent_naziv: string; iznos: number; datum: string } | null {
  let best: Narudzba | null = null;
  let bestTs = -Infinity;
  for (const o of n) {
    const ts = new Date(o.datum).getTime();
    if (!Number.isNaN(ts) && ts > bestTs) {
      bestTs = ts;
      best = o;
    }
  }
  if (!best) return null;
  return { klijent_naziv: best.klijent_naziv, iznos: best.iznos, datum: best.datum };
}

// Zagreb calendar day (YYYY-MM-DD) for a date — tz-explicit so "danas" is correct
// even when computed on a UTC server (SSR).
function zagrebDan(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Count of orders whose datum is today in Europe/Zagreb.
export function brojNarudzbiDanas(n: Narudzba[]): number {
  const danas = zagrebDan(new Date());
  let broj = 0;
  for (const o of n) {
    const d = new Date(o.datum);
    if (!Number.isNaN(d.getTime()) && zagrebDan(d) === danas) broj += 1;
  }
  return broj;
}
