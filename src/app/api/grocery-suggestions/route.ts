import { callChat, rateLimiter } from '@/lib/ai';
import { handleApiError } from '@/lib/api/handleApiError';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/middleware';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for user preferences
const userPreferencesSchema = z.object({
  dietaryGoal: z.string().min(1),
  favoriteFood: z.string().min(1),
  cookingTime: z.string().min(1),
  budget: z.string().min(1),
  shoppingFrequency: z.string().min(1),
  favoriteStores: z.string().min(1),
  avoidStores: z.string(),
  servingCount: z.string().min(1),
});

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || 'unknown';
  const requestLogger = logger.child({ requestId, route: 'grocery-suggestions' });
  
  try {
    const supabase = await createClient();
    const userId = requireUser(req);
    
    requestLogger.info({ userId }, 'Processing grocery suggestions request');

    if (!rateLimiter(userId, 'grocery-suggestions')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const requestBodySchema = z.object({
      preferences: userPreferencesSchema,
    });

    // Validate request body
    const validationResult = requestBodySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { preferences } = validationResult.data;

    // Get user's past preferences
    const { data: userPreferences, error: preferencesError } = await supabase
      .from('item_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (preferencesError) {
      requestLogger.error({ error: preferencesError, userId }, 'Error fetching user preferences');
      return NextResponse.json(
        { error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    // Format past preferences for AI context
    const pastPreferences = userPreferences?.map(pref => 
      `${pref.item_name}: ${pref.preference_type} (${new Date(pref.created_at).toLocaleDateString()})`
    ).join('\n') || 'No past preferences';

    // Create AI prompt
    const prompt = `Generate a personalized shopping list based on the following preferences:

Dietary Goal: ${preferences.dietaryGoal}
Favorite Foods: ${preferences.favoriteFood}
Cooking Time: ${preferences.cookingTime}
Monthly Budget: $${preferences.budget}
Shopping Frequency: ${preferences.shoppingFrequency}
Preferred Stores: ${preferences.favoriteStores}
Stores to Avoid: ${preferences.avoidStores}
Serving Count: ${preferences.servingCount}

Past Item Preferences:
${pastPreferences}

Generate a shopping list with the following information for each item:
1. Item name
2. Category/Section
3. Quantity and unit
4. Estimated price range
5. Cooking versatility (what meals it can be used for)
6. Storage tips
7. Nutritional highlights

Format the response as a JSON array of objects with these exact fields:
{
  "items": [
    {
      "name": "item name",
      "category": "section name",
      "quantity": number,
      "unit": "unit name",
      "priceRange": "price range",
      "cookingUses": ["use1", "use2"],
      "storageTips": "storage tip",
      "nutritionalHighlights": ["highlight1", "highlight2"]
    }
  ]
}`;

    const responseSchema = z.object({
      items: z.array(z.object({
        name: z.string(),
        category: z.string(),
        quantity: z.number(),
        unit: z.string(),
        priceRange: z.string(),
        cookingUses: z.array(z.string()),
        storageTips: z.string(),
        nutritionalHighlights: z.array(z.string())
      }))
    });

    const suggestions = await callChat(
      'gpt-3.5-turbo',
      'You are a smart shopping assistant that helps users create personalized grocery lists. You consider dietary preferences, budget constraints, cooking habits, and past preferences to suggest items. Always format responses as valid JSON arrays with the exact structure specified in the prompt.',
      prompt,
      responseSchema
    );

    requestLogger.info({ userId, itemCount: suggestions.items?.length }, 'Successfully generated grocery suggestions');
    return NextResponse.json(suggestions);
  } catch (error) {
    return handleApiError(error, 500);
  }
} 