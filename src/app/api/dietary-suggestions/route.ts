import { callChat, rateLimiter } from '@/lib/ai';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/middleware';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Updated schema to make all fields optional
const dietaryPreferencesSchema = z.object({
  dietaryGoal: z.string().optional(),
  favoriteFood: z.string().optional(),
  cookingTime: z.string().optional(),
  servingCount: z.string().optional(),
});

const requestBodySchema = z.object({
  preferences: dietaryPreferencesSchema,
});

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || 'unknown';
  const requestLogger = logger.child({ requestId, route: 'dietary-suggestions' });
  
  try {
    const supabase = await createClient();
    const userId = requireUser(req);
    
    requestLogger.info({ userId }, 'Processing dietary suggestions request');

    // Enforce per-user rate limit (30 req/hr)
    if (!rateLimiter(userId, 'dietary-suggestions')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validationResult = requestBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { preferences } = validationResult.data;

    // Get user's past dietary preferences
    const { data: userPreferences } = await supabase
      .from('item_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Format past preferences for AI context
    const pastPreferences = userPreferences?.map(pref => 
      `${pref.item_name}: ${pref.preference_type} (${new Date(pref.created_at).toLocaleDateString()})`
    ).join('\n') || 'No past preferences';

    // Helper function to get value or default
    const getValueOrDefault = (value: string | undefined, defaultValue: string) => 
      value && value.trim() ? value : defaultValue;

    // Provide defaults for missing preferences
    const dietaryGoal = getValueOrDefault(preferences.dietaryGoal, 'general healthy eating');
    const favoriteFood = getValueOrDefault(preferences.favoriteFood, 'variety of fresh, whole foods');
    const cookingTime = getValueOrDefault(preferences.cookingTime, 'moderate (30-45 minutes)');
    const servingCount = getValueOrDefault(preferences.servingCount, '2-4 people');

    // Check if user provided any preferences
    const hasAnyPreferences = Object.values(preferences).some(value => value && value.trim());
    
    // Create AI prompt that adapts to available information
    const prompt = hasAnyPreferences 
      ? `Generate personalized food recommendations based on the following dietary preferences:

Dietary Goal: ${dietaryGoal}
Favorite Foods: ${favoriteFood}
Cooking Time Preference: ${cookingTime}
Serving Count: ${servingCount}

Past Food Item Preferences:
${pastPreferences}

Focus on nutritional value, dietary alignment, and cooking compatibility. Generate food items that:
1. Align with the dietary goal
2. Match favorite food preferences
3. Are suitable for the cooking time available
4. Are portioned appropriately for the serving count
5. Provide variety in types of food (proteins, vegetables, grains, fruits, etc.)

For each recommended food item, provide:
1. Item name
2. Food category/section
3. Quantity and unit
4. Cooking versatility (what meals it can be used for)
5. Storage tips
6. Nutritional highlights
7. Estimated price range as numerical values (e.g., "$3-5", "$8-12", "$1-3")

Format the response as a JSON array of objects with these exact fields:
{
  "items": [
    {
      "name": "item name",
      "category": "food category",
      "quantity": number,
      "unit": "unit name",
      "priceRange": "price range in format $X-Y",
      "cookingUses": ["use1", "use2"],
      "storageTips": "storage tip",
      "nutritionalHighlights": ["highlight1", "highlight2"]
    }
  ]
}`
      : `Generate basic healthy food recommendations for general wellness. Since no specific preferences were provided, focus on:

1. Essential nutrients and balanced nutrition
2. Common, versatile ingredients suitable for various cooking styles
3. Foods that support overall health and wellness
4. A good mix of proteins, vegetables, fruits, grains, and healthy fats
5. Items that are accessible and not too specialized

Create a well-rounded grocery list that would support healthy meal preparation for a typical household.

For each recommended food item, provide:
1. Item name
2. Food category/section
3. Quantity and unit
4. Cooking versatility (what meals it can be used for)
5. Storage tips
6. Nutritional highlights
7. Estimated price range as numerical values (e.g., "$3-5", "$8-12", "$1-3")

Format the response as a JSON array of objects with these exact fields:
{
  "items": [
    {
      "name": "item name",
      "category": "food category",
      "quantity": number,
      "unit": "unit name",
      "priceRange": "price range in format $X-Y",
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
      'You are a nutritionist and culinary expert that helps users choose foods that align with their dietary goals and cooking preferences. When specific preferences are not provided, focus on general healthy eating principles. Always format responses as valid JSON arrays with the exact structure specified.',
      prompt,
      responseSchema
    );

    requestLogger.info({ 
      userId, 
      itemCount: suggestions.items?.length,
      hasPreferences: hasAnyPreferences 
    }, 'Successfully generated dietary suggestions');
    
    return NextResponse.json(suggestions);
  } catch (error) {
    requestLogger.error({ error, userId: req.headers.get('x-user-id') }, 'Error generating dietary suggestions');
    return NextResponse.json(
      { error: 'Failed to generate dietary suggestions' },
      { status: 500 }
    );
  }
} 