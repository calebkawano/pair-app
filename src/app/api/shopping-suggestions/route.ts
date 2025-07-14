import { callChat, rateLimiter } from '@/lib/ai';
import { handleApiError } from '@/lib/api/handleApiError';
import { logger } from '@/lib/logger';
import { requireUser } from '@/middleware';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const shoppingPreferencesSchema = z.object({
  budget: z.string().min(1, 'Budget is required'),
  shoppingFrequency: z.string().min(1, 'Shopping frequency is required'),
  favoriteStores: z.string().min(1, 'Favorite stores is required'),
  avoidStores: z.string().optional().default(''),
});

const requestBodySchema = z.object({
  preferences: shoppingPreferencesSchema,
});

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') || 'unknown';
  const requestLogger = logger.child({ requestId, route: 'shopping-suggestions' });
  
  try {
    const userId = requireUser(req);
    const body = await req.json();
    const validationResult = requestBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { preferences } = validationResult.data;

    requestLogger.info({ userId }, 'Processing shopping suggestions request');

    if (!rateLimiter(userId, 'shopping-suggestions')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Create AI prompt focused on shopping logistics and optimization
    const prompt = `Generate personalized shopping recommendations based on the following preferences:

Monthly Budget: $${preferences.budget}
Shopping Frequency: ${preferences.shoppingFrequency}
Preferred Stores: ${preferences.favoriteStores}
Stores to Avoid: ${preferences.avoidStores}

Provide shopping optimization advice including:

1. Budget Breakdown: Suggest how to allocate the budget across different grocery categories (produce, meat, dairy, pantry, etc.) with percentages and amounts
2. Shopping Tips: Practical advice for maximizing value within the budget and frequency
3. Store Recommendations: Analysis of preferred stores and suggestions for which categories to buy at each store
4. Scheduling Advice: Recommendations for optimal shopping timing based on frequency preference

Format the response as a JSON object with these exact fields:
{
  "budgetBreakdown": [
    {
      "category": "category name",
      "suggestedAmount": number,
      "percentage": number
    }
  ],
  "shoppingTips": ["tip1", "tip2", "tip3"],
  "storeRecommendations": [
    {
      "store": "store name",
      "reason": "why this store is good for you",
      "categories": ["category1", "category2"]
    }
  ],
  "schedulingAdvice": "advice about when and how often to shop"
}`;

    const responseSchema = z.object({
      budgetBreakdown: z.array(z.object({
        category: z.string(),
        suggestedAmount: z.number(),
        percentage: z.number(),
      })),
      shoppingTips: z.array(z.string()),
      storeRecommendations: z.array(z.object({
        store: z.string(),
        reason: z.string(),
        categories: z.array(z.string())
      })),
      schedulingAdvice: z.string()
    });

    const recommendations = await callChat(
      'gpt-3.5-turbo',
      'You are a shopping efficiency expert that helps users optimize their grocery shopping experience. Focus on budget optimization, store selection, timing strategies, and cost-effective shopping habits. Always format responses as valid JSON with the exact structure specified.',
      prompt,
      responseSchema
    );

    requestLogger.info({ userId }, 'Successfully generated shopping recommendations');
    return NextResponse.json(recommendations);
  } catch (error) {
    return handleApiError(error, 500);
  }
} 