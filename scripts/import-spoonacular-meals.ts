/*
  One-off ingestion script for Spoonacular recipes -> Supabase meals table.
  Usage:
    - Ensure env vars are set in .env.local or environment:
        SPOONACULAR_API_KEY=...
        NEXT_PUBLIC_SUPABASE_URL=...
        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
    - Run with ts-node or tsx:
        npx tsx scripts/import-spoonacular-meals.ts
*/
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { searchRecipes } from '../src/lib/recipes/spoonacular'

type DB = any

// Load .env.local so Next-style local envs are picked up in Node scripts
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

// Use service role key for ingestion to bypass RLS insert restrictions. Do NOT expose client-side.
const supabase = createClient<DB>(supabaseUrl, serviceKey)

async function upsertMeals(batch: any[]) {
  if (batch.length === 0) return
  const rows = batch.map((m) => ({
    source: 'spoonacular',
    source_id: m.id,
    name: m.name,
    category: m.category,
    cuisine: null,
    diet_tags: m.dietaryTags,
    cooking_time_minutes: parseInt(String(m.cookingTime).replace(/\D/g, ''), 10) || null,
    ingredients: m.ingredients,
    steps: m.steps,
    nutrition: m.nutrition,
    image_url: m.imageUrl,
    cost_estimate_cents: null,
    servings: null,
  }))
  const { error } = await supabase.from('meals').upsert(rows, { onConflict: 'source,source_id' })
  if (error) throw error
}

async function main() {
  const target = 1000
  const pageSize = 50
  let fetched = 0
  let offset = 0

  while (fetched < target) {
    const { items, total, number } = await searchRecipes({ number: pageSize, offset })
    if (!items.length) break
    await upsertMeals(items)
    fetched += items.length
    offset += number
    console.log(`Imported ${fetched}/${Math.min(total, target)}...`)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


