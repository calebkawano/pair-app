import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's purchased grocery items
    const { data: groceryItems } = await supabase
      .from('food_requests')
      .select(`
        item_name,
        quantity,
        unit,
        section,
        household:households(name)
      `)
      .eq('requested_by', user.id)
      .eq('is_purchased', true)
      .order('created_at', { ascending: false });

    if (!groceryItems || groceryItems.length === 0) {
      return NextResponse.json(
        { error: 'No purchased grocery items found' },
        { status: 400 }
      );
    }

    // Format items for the prompt
    const itemsList = groceryItems
      .map(item => `${item.quantity} ${item.unit} ${item.item_name} (${item.section})`)
      .join('\n');

    // Generate meal suggestion using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful cooking assistant. Given a list of grocery items, suggest a meal that can be made using some or all of these ingredients. Format your response as a JSON object with the following structure:
{
  "meal_name": "Name of the meal",
  "cooking_time": "Estimated cooking time (e.g., '30 mins')",
  "rating": A number between 1-5,
  "category": "main",
  "dietary_tags": ["tag1", "tag2"],
  "ingredients": ["ingredient1", "ingredient2"],
  "steps": ["step1", "step2"],
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "fiber": number
  }
}`
        },
        {
          role: "user",
          content: `Here are my purchased grocery items:\n${itemsList}\n\nSuggest a meal I can make with some or all of these ingredients.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    const suggestion = JSON.parse(responseContent);

    // Save the meal to recent_meals
    const { data: mealData, error: mealError } = await supabase
      .from('recent_meals')
      .insert([{
        user_id: user.id,
        meal_name: suggestion.meal_name,
        cooking_time: suggestion.cooking_time,
        rating: suggestion.rating,
        category: suggestion.category,
        dietary_tags: suggestion.dietary_tags,
        ingredients: suggestion.ingredients,
        steps: suggestion.steps,
        nutrition: suggestion.nutrition,
        created_from_groceries: true
      }])
      .select()
      .single();

    if (mealError) {
      console.error('Error saving meal:', mealError);
      return NextResponse.json(
        { error: 'Failed to save meal' },
        { status: 500 }
      );
    }

    return NextResponse.json(mealData);
  } catch (error) {
    console.error('Error in meal suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 