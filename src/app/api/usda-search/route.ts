import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type UsdaItem = {
  id: string;
  name: string;
  category?: string;
  nutrients?: Array<{ nutrientName: string; amount: number; unit: string }>;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  season?: string | null;
  brandOwner?: string | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50);
    if (!q || q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const dataPath = path.join(process.cwd(), 'public', 'data', 'grocery_usda.json');
    const raw = await fs.readFile(dataPath, 'utf8');
    const items: UsdaItem[] = JSON.parse(raw);

    const query = q.toLowerCase();
    const results = items
      .filter((it) => it.name?.toLowerCase().includes(query))
      .slice(0, limit)
      .map((it) => ({
        id: it.id,
        name: it.name,
        category: it.category,
        nutrients: Array.isArray(it.nutrients) ? it.nutrients.slice(0, 8) : [],
        isVegan: it.isVegan,
        isGlutenFree: it.isGlutenFree,
        season: it.season ?? null,
        brandOwner: it.brandOwner ?? null,
      }));

    return NextResponse.json({ items: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `USDA search failed: ${message}` }, { status: 500 });
  }
}


