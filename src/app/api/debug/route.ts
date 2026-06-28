// TODO: remove before deploy
import { NextResponse } from 'next/server';

import { getBaza } from '@/lib/data';

export async function GET() {
  const baza = await getBaza();
  return NextResponse.json(baza);
}
