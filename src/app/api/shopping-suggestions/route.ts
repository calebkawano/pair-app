import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ShoppingPreferences {
  budget: string;
  shoppingFrequency: string;
  favoriteStores: string;
  avoidStores: string;
}

export async function POST(req: Request) {
  try {
    const { preferences } = await req.json() as { preferences: ShoppingPreferences };

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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a shopping efficiency expert that helps users optimize their grocery shopping experience. Focus on budget optimization, store selection, timing strategies, and cost-effective shopping habits. Always format responses as valid JSON with the exact structure specified."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    let recommendations;
    try {
      recommendations = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      recommendations = {
        budgetBreakdown: [],
        shoppingTips: [],
        storeRecommendations: [],
        schedulingAdvice: ''
      };
    }

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error generating shopping recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate shopping recommendations' },
      { status: 500 }
    );
  }
} 