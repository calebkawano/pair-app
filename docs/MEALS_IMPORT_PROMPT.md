### Purpose
This doc contains the exact prompt to drive the assistant to finish wiring the 1,000-meal catalog, ingestion, and personalization.

### Environment
- Put your Spoonacular key in `.env.local` as:
```
SPOONACULAR_API_KEY=YOUR_KEY
```

### Model and Mode
- Use: GPT-4.1 or GPT-4o (reasoning) in “code” mode within Cursor. If those are unavailable, GPT-4 Turbo.

### Files added in this step
- `src/lib/recipes/spoonacular.ts` — API client
- `src/app/api/meals/route.ts` — Meals read endpoint
- `src/lib/supabase/migrations/20250811_create_meals.sql` — Meals table
- `scripts/import-spoonacular-meals.ts` — Importer script

### Next prompt to run

Copy-paste this prompt to the assistant:

```
Please do the following:

1) Apply and run the Supabase migration at `src/lib/supabase/migrations/20250811_create_meals.sql`.
   - Ensure the `uuid-ossp` extension is enabled if not already.
   - Confirm `meals` table exists and RLS policy "Anyone can read meals" is active.

2) Update package scripts to include:
   - "import-meals": "tsx scripts/import-spoonacular-meals.ts"

3) Run the importer to ingest ~1,000 meals from Spoonacular.
   - Use batches of 50 until 1,000 are inserted.
   - Verify dedupe on (source, source_id).

4) Wire client to use `/api/meals` in `src/app/dashboard/meals/page.tsx`:
   - Replace `dummyMeals` usage with a paginated fetch by selected category.
   - Prefetch next page as user swipes; fall back to a random item from DB if category empty.

5) Add basic personalization on the server:
   - In `/api/meals`, load `household_members.dietary_preferences` for the auth user.
   - Filter: diet tags, max cooking time, exclude undesired cuisines if present.
   - Order by `popularity_score DESC, created_at DESC` temporarily.

6) Add swipe feedback endpoint `/api/meals/feedback`:
   - Insert rows to a `meal_feedback` table with columns: `user_id`, `meal_id`, `liked` (boolean), `created_at`.
   - Increase/decrease a rolling `popularity_score` on `meals`.
   - Update server ranking to consider per-user preferences (favor cuisines/tags the user liked over time).

7) Show me where in `SwipeableMealCard` to POST feedback on left/right swipes and how to debounce batch updates.

Finally, run the app and confirm:
 - Categories load real meals.
 - Swiping saves feedback and future results shift accordingly.
```


