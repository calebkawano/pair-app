import { callChat, rateLimiter } from '@/lib/ai';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/middleware';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || 'unknown';
  const requestLogger = logger.child({ requestId, route: 'meal-suggestions' });
  
  try {
    const supabase = await createClient();
    const userId = requireUser(req);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    requestLogger.info({ userId }, 'Processing meal suggestions request');

    if (!rateLimiter(userId, 'meal-suggestions')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const requestBodySchema = z.object({
      // Meal suggestions route doesn't require a body, but we should validate if one is provided
    }).optional();

    // Validate request body if present
    const body = await req.json().catch(() => ({}));
    const validationResult = requestBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
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
      .eq('requested_by', userId)
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

    const systemPrompt = `You are a helpful cooking assistant. Given a list of available grocery items, suggest a meal that can be made using SOME of these ingredients - you don't need to use all of them. Be creative and practical - it's better to make a great meal with a few ingredients than try to use everything. Format your response as a JSON object with the following structure:\n{\n  "meal_name": "Name of the meal",\n  "cooking_time": "Estimated cooking time (e.g., '30 mins')",\n  "rating": 4,\n  "category": "main",\n  "dietary_tags": ["tag1", "tag2"],\n  "ingredients": ["ingredient1", "ingredient2"],\n  "steps": ["step1", "step2"],\n  "nutrition": {\n    "calories": 0,\n    "protein": 0,\n    "carbs": 0,\n    "fat": 0,\n    "fiber": 0\n  }\n}`;

    const userPrompt = `Here are my available grocery items:\n${itemsList}\n\nSuggest a meal I can make using some of these ingredients. You don't need to use everything - focus on making a delicious meal with what makes sense to use together.`;

    const responseSchema = z.object({
      meal_name: z.string(),
      cooking_time: z.string(),
      rating: z.number().min(1).max(5),
      category: z.string(),
      dietary_tags: z.array(z.string()),
      ingredients: z.array(z.string()),
      steps: z.array(z.string()),
      nutrition: z.object({
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
        fiber: z.number()
      })
    });

    const suggestion = await callChat(
      'gpt-4-turbo-preview',
      systemPrompt,
      userPrompt,
      responseSchema
    );

    // Save the meal to recent_meals
    const { data: mealData, error: mealError } = await supabase
      .from('recent_meals')
      .insert([{
        user_id: userId,
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
      requestLogger.error({ error: mealError, userId }, 'Error saving meal');
      return NextResponse.json(
        { error: 'Failed to save meal' },
        { status: 500 }
      );
    }

    requestLogger.info({ userId, mealName: suggestion.meal_name }, 'Successfully generated and saved meal');
    return NextResponse.json(mealData);
  } catch (error) {
    requestLogger.error({ error, userId: req.headers.get('x-user-id') }, 'Error in meal suggestions');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 