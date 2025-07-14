import { callChat, rateLimiter } from '@/lib/ai';
import { handleApiError } from '@/lib/api/handleApiError';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/middleware';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for meal-based grocery request
const mealPreferencesSchema = z.object({
  mealType: z.string().optional().default(''),
  preferences: z.string().optional().default(''),
  dietary: z.string().optional().default(''),
  occasion: z.string().optional().default(''),
});

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || 'unknown';
  const requestLogger = logger.child({ requestId, route: 'meal-grocery-suggestions' });
  
  try {
    const supabase = await createClient();
    const userId = requireUser(req);
    
    requestLogger.info({ userId }, 'Processing meal-based grocery suggestions request');

    if (!rateLimiter(userId, 'meal-grocery-suggestions')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate request body
    const validationResult = mealPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { mealType, preferences, dietary, occasion } = validationResult.data;

    // Ensure at least one field has content
    if (!mealType && !preferences && !dietary && !occasion) {
      return NextResponse.json(
        { error: 'Please provide at least one field (meal type, preferences, dietary requirements, or occasion)' },
        { status: 400 }
      );
    }

    // Get user's past preferences for context
    const { data: userPreferences, error: preferencesError } = await supabase
      .from('item_preferences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (preferencesError) {
      requestLogger.error({ error: preferencesError, userId }, 'Error fetching user preferences');
    }

    // Format past preferences for AI context
    const pastPreferences = userPreferences?.map(pref => 
      `${pref.item_name}: ${pref.preference_type}`
    ).join(', ') || 'No past preferences';

    // Create AI prompt for meal-based grocery suggestions
    const prompt = `Generate a grocery shopping list based on the following information:

${mealType ? `Meal Type: ${mealType}` : ''}
${occasion ? `Occasion: ${occasion}` : ''}
${preferences ? `Food Preferences: ${preferences}` : ''}
${dietary ? `Dietary Requirements: ${dietary}` : ''}

User's Past Item Preferences: ${pastPreferences}

Based on the provided information, suggest practical grocery items that would be needed. Consider:
1. The type of meal being planned (if specified)
2. The occasion (if specified) 
3. Dietary restrictions and preferences (if specified)
4. Past preferences to avoid rejected items
5. Common, practical ingredients for versatile meal preparation

If specific details are limited, suggest versatile, commonly used grocery items that can be used for multiple meal types.

Format the response as a JSON object with these exact fields:
{
  "items": [
    {
      "name": "item name",
      "category": "section name (Produce, Meat, Dairy, etc.)",
      "quantity": number,
      "unit": "unit name",
      "notes": "cooking uses or storage tips",
      "section": "store section",
      "priority": "normal"
    }
  ]
}

Focus on practical, commonly available items that fit the meal type and dietary needs.`;

    const responseSchema = z.object({
      items: z.array(z.object({
        name: z.string(),
        category: z.string(),
        quantity: z.number(),
        unit: z.string(),
        notes: z.string(),
        section: z.string(),
        priority: z.string()
      }))
    });

    const suggestions = await callChat(
      'gpt-3.5-turbo',
      'You are a meal planning assistant that helps users create grocery lists for specific meals and occasions. Focus on practical, commonly available ingredients that match their dietary preferences and meal requirements. Always format responses as valid JSON with the exact structure specified.',
      prompt,
      responseSchema
    );

    requestLogger.info({ userId, itemCount: suggestions.items?.length }, 'Successfully generated meal-based grocery suggestions');
    return NextResponse.json(suggestions);
  } catch (error) {
    return handleApiError(error, 500);
  }
} 