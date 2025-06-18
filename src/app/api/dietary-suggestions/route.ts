import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface DietaryPreferences {
  dietaryGoal: string;
  favoriteFood: string;
  cookingTime: string;
  servingCount: string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { preferences } = await req.json() as { preferences: DietaryPreferences };

    // Get user's past dietary preferences
    const { data: userPreferences } = await supabase
      .from('item_preferences')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Format past preferences for AI context
    const pastPreferences = userPreferences?.map(pref => 
      `${pref.item_name}: ${pref.preference_type} (${new Date(pref.created_at).toLocaleDateString()})`
    ).join('\n') || 'No past preferences';

    // Create AI prompt focused on dietary and food aspects
    const prompt = `Generate personalized food recommendations based on the following dietary preferences:

Dietary Goal: ${preferences.dietaryGoal}
Favorite Foods: ${preferences.favoriteFood}
Cooking Time Preference: ${preferences.cookingTime}
Serving Count: ${preferences.servingCount}

Past Food Item Preferences:
${pastPreferences}

Focus on nutritional value, dietary alignment, and cooking compatibility. Generate food items that:
1. Align with the dietary goal
2. Match favorite food preferences
3. Are suitable for the cooking time available
4. Are portioned appropriately for the serving count
5. That have variety in types of food (not just one type of food)

For each recommended food item, provide:
1. Item name
2. Food category/section
3. Quantity and unit
4. Cooking versatility (what meals it can be used for)
5. Storage tips
6. Nutritional highlights
7. Estimated price range (general)

Format the response as a JSON array of objects with these exact fields:
{
  "items": [
    {
      "name": "item name",
      "category": "food category",
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
          content: "You are a nutritionist and culinary expert that helps users choose foods that align with their dietary goals provided and cooking preferences also provided. Focus on nutritional value, meal compatibility, and dietary alignment. Always format responses as valid JSON arrays with the exact structure specified."
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

    let suggestions;
    try {
      suggestions = JSON.parse(completion.choices[0].message.content || '{"items": []}');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      suggestions = { items: [] };
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error generating dietary suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate dietary suggestions' },
      { status: 500 }
    );
  }
} 