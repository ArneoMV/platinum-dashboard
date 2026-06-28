import 'server-only';

import type { Baza } from './types';

export async function getBaza(): Promise<Baza> {
  const url = process.env.APPS_SCRIPT_URL;
  const token = process.env.APPS_SCRIPT_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing APPS_SCRIPT_URL or APPS_SCRIPT_TOKEN in environment (.env.local).',
    );
  }

  // Apps Script 302-redirects to googleusercontent.com; fetch follows it automatically.
  const res = await fetch(`${url}?token=${token}`, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(
      `Apps Script request failed: ${res.status} ${res.statusText}`,
    );
  }

  const body = await res.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    // HTML instead of JSON => token/deploy problem. Surface the start of the body.
    throw new Error(
      `Apps Script returned non-JSON (likely a token/deploy error). First 200 chars: ${body.slice(0, 200)}`,
    );
  }

  const baza = parsed as Partial<Baza>;
  if (
    !Array.isArray(baza.Klijenti) ||
    !Array.isArray(baza.Vina) ||
    !Array.isArray(baza.Narudzbe)
  ) {
    throw new Error(
      `Apps Script JSON is missing expected arrays (Klijenti/Vina/Narudzbe). First 200 chars: ${body.slice(0, 200)}`,
    );
  }

  return baza as Baza;
}
