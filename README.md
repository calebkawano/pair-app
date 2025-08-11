This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Spoonacular Setup

Environment variable name for Spoonacular:

- Add to your `.env.local` (do not commit):

```
SPOONACULAR_API_KEY=your_key_here
```

Client location:

- `src/lib/recipes/spoonacular.ts` provides `searchRecipes` and `getRecipeById`.

Supabase meals table:

- Migration created at `src/lib/supabase/migrations/20250811_create_meals.sql`.

Importer script:

- `scripts/import-spoonacular-meals.ts` (run with `npx tsx scripts/import-spoonacular-meals.ts`).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## USDA Data Import

The application includes a script to import food data from the USDA FoodData Central database. This data is used to enhance our grocery item database with detailed nutritional information.

### Prerequisites

1. Get a USDA FoodData Central API key from [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)
2. Add your API key to the environment:
   ```bash
   echo "FDC_API_KEY=your_api_key_here" >> .env
   ```

### Running the Import

To import USDA data:

```bash
# Install dependencies if you haven't already
npm install

# Run the import script
node scripts/import-usda.js
```

The script will:
1. Fetch all available foods from the USDA database
2. Transform them to match our schema
3. Validate the data against our schema
4. Save to `public/data/grocery_data.json`
5. Print a summary of imported items

### Running Tests

To validate the imported data:

```bash
npm test tests/importer.test.js
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
