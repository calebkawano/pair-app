import { NextRequest } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') || undefined
    const cuisine = searchParams.get('cuisine') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const cursor = searchParams.get('cursor') // expecting created_at ISO or numeric id; simple time-based cursor
    const maxReady = parseInt(searchParams.get('maxReady') || '0', 10)

    let query = supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category) query = query.eq('category', category)
    if (cuisine) query = query.eq('cuisine', cuisine)
    if (maxReady > 0) query = query.lte('cooking_time_minutes', maxReady)
    if (cursor) query = query.lt('created_at', cursor)

    const { data, error } = await query
    if (error) throw error

    const nextCursor = data && data.length > 0 ? data[data.length - 1].created_at : null
    return Response.json({ items: data || [], nextCursor })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Failed to fetch meals' }), { status: 500 })
  }
}


