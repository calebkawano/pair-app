# Environment Setup

This document outlines all the environment variables required to run the application.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Spoonacular API Configuration
SPOONACULAR_API_KEY=your_spoonacular_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_SLUG=pair-app
NEXT_PUBLIC_STORAGE_KEY=your_storage_key

# Logging Configuration (optional)
LOG_LEVEL=info # Available options: debug, info, warn, error
```

## Setting Up Environment Variables

1. Create a new file named `.env.local` in the root directory
2. Copy the above template
3. Replace the placeholder values with your actual API keys and configuration

### Getting the Required Keys

1. **Supabase Configuration**
   - Create a project at [Supabase](https://supabase.com)
   - Get the URL and anon key from your project settings

2. **OpenAI Configuration**
   - Get your API key from [OpenAI](https://platform.openai.com/api-keys)

3. **Spoonacular API**
   - Sign up at [Spoonacular](https://spoonacular.com/food-api)
   - Get your API key from your dashboard

4. **Application Configuration**
   - `NEXT_PUBLIC_APP_URL`: Your application's URL (use http://localhost:3000 for local development)
   - `NEXT_PUBLIC_APP_SLUG`: A unique identifier for your app (default: pair-app)
   - `NEXT_PUBLIC_STORAGE_KEY`: A random string for local storage encryption

## Deployment

When deploying to platforms like Vercel:

1. Add all these environment variables in your deployment platform's settings
2. Ensure all NEXT_PUBLIC_ variables are properly set
3. The application will automatically use production URLs when deployed
