import { createClient } from '@/lib/supabase/server';
import { GroceryItem } from '@/types/grocery';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
  try {
    const supabase = await createClient();
    const body = await req.json();

    // Validate request body
    const validationResult = userPreferencesSchema.safeParse(body.preferences);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid preferences', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const preferences = validationResult.data;

    // Get user's past preferences
    const { data: userPreferences, error: preferencesError } = await supabase
      .from('item_preferences')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (preferencesError) {
      console.error('Error fetching user preferences:', preferencesError);
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a smart shopping assistant that helps users create personalized grocery lists. You consider dietary preferences, budget constraints, cooking habits, and past preferences to suggest items. Always format responses as valid JSON arrays with the exact structure specified in the prompt."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    let suggestions: { items: GroceryItem[] };
    try {
      suggestions = JSON.parse(completion.choices[0].message.content || '{"items": []}');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      return NextResponse.json(
        { error: 'Failed to parse AI suggestions' },
        { status: 500 }
      );
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to generate shopping list', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 