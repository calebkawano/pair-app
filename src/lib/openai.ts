import { logger } from '@/lib/logger';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateShoppingRecommendations(prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful shopping assistant that provides product recommendations based on user requests."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    throw error;
  }
}

export async function analyzeShoppingList(items: string[]) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful shopping assistant that analyzes shopping lists and provides insights and suggestions."
        },
        {
          role: "user",
          content: `Analyze this shopping list and provide insights: ${items.join(', ')}`
        }
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error('Error analyzing shopping list:', error);
    throw error;
  }
} 