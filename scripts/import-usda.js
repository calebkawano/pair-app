import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv from 'ajv';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
const SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'grocery-item.schema.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'grocery_usda.json');
const CATEGORY_MAP_PATH = path.join(__dirname, '..', 'data', 'category-map.json');
const SEASON_MAP_PATH = path.join(__dirname, '..', 'data', 'season-map.json');
const API_KEY = process.env.FDC_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const PAGE_SIZE = 200;

// Seasonal categories mapping (example mapping, can be expanded)
const SEASONAL_CATEGORIES = {
  'Fresh vegetables': {
    'Leafy vegetables': 'spring',
    'Summer squash': 'summer',
    'Winter squash': 'fall',
    'Root vegetables': 'winter'
  }
};

// Categories typically vegan
const VEGAN_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Legumes',
  'Nuts and Seeds',
  'Grains'
];

// Categories typically gluten-containing
const GLUTEN_CATEGORIES = [
  'Wheat',
  'Barley',
  'Rye',
  'Breads',
  'Pasta',
  'Cereals'
];

async function loadJsonSafe(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function validateSchema(data) {
  const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  
  return validate(data);
}

async function fetchFoodData(pageNumber) {
  try {
    const response = await axios.get(`${BASE_URL}/foods/search`, {
      params: {
        api_key: API_KEY,
        pageSize: PAGE_SIZE,
        pageNumber,
        dataType: ['Foundation', 'SR Legacy', 'Branded'].join(',')
      }
    });
    return response.data.foods || [];
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error.message);
    return [];
  }
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeName(name) {
  return normalizeWhitespace(name.toLowerCase().replace(/[^a-z0-9\s]/g, ''));
}

function mapCategory(usdaCategory, description, categoryMap) {
  const source = `${usdaCategory || ''} ${description || ''}`.toLowerCase();
  for (const entry of categoryMap) {
    const { match, to } = entry;
    if (match.some((m) => source.includes(m.toLowerCase()))) {
      return to;
    }
  }
  return 'Other';
}

function determineSeason(foodCategory, description, seasonMap) {
  for (const [category, subCategories] of Object.entries(SEASONAL_CATEGORIES)) {
    if (foodCategory?.includes(category)) {
      for (const [subCat, season] of Object.entries(subCategories)) {
        if (description?.toLowerCase().includes(subCat.toLowerCase())) {
          return season;
        }
      }
    }
  }
  // Season mapping by name keywords
  const name = `${foodCategory || ''} ${description || ''}`;
  for (const entry of seasonMap) {
    if (entry.match.some((m) => name.toLowerCase().includes(m.toLowerCase()))) {
      return entry.season; // single primary season
    }
  }
  return null;
}

function isVegan(foodCategory, ingredients) {
  const nonVeganKeywords = ['milk', 'egg', 'honey', 'gelatin', 'whey', 'casein', 'lard'];
  const hasAnimal = nonVeganKeywords.some((k) => ingredients?.toLowerCase().includes(k));
  if (hasAnimal) return false;
  return VEGAN_CATEGORIES.some(category => 
    foodCategory?.toLowerCase().includes(category.toLowerCase())
  );
}

function isGlutenFree(foodCategory, ingredients) {
  const hasGluten = GLUTEN_CATEGORIES.some(category =>
    foodCategory?.toLowerCase().includes(category.toLowerCase()) ||
    ingredients?.toLowerCase().includes(category.toLowerCase())
  );
  return !hasGluten;
}

function mapNutrients(foodNutrients) {
  return foodNutrients?.map(nutrient => ({
    nutrientName: nutrient.nutrientName,
    amount: nutrient.value,
    unit: nutrient.unitName
  })) || [];
}

function makeDedupeKey(item) {
  const description = item.description || '';
  const brandOwner = item.brandOwner || '';
  const dataType = item.dataType || '';
  const isBranded = dataType.toLowerCase() === 'branded';

  const genericKeywords = ['apple', 'banana', 'strawberry', 'potato', 'sugar', 'salt', 'flour', 'rice', 'chicken', 'beef', 'pork', 'milk', 'yogurt', 'egg'];
  const isGeneric = genericKeywords.some((k) => description.toLowerCase().includes(k));

  if ((isBranded || brandOwner) && !isGeneric) {
    return `${normalizeName(brandOwner)}::${normalizeName(description)}`;
  }
  return normalizeName(description);
}

function isBeneficial(item) {
  const cat = (item.foodCategory || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const excludeKeywords = ['supplement', 'infant', 'toddler', 'medical', 'clinical', 'enteral', 'pet', 'dog', 'cat'];
  if (excludeKeywords.some((k) => cat.includes(k) || desc.includes(k))) return false;
  return true;
}

function transformFoodItem(item, categoryMap, seasonMap) {
  return {
    id: item.fdcId.toString(),
    name: item.description,
    category: mapCategory(item.foodCategory, item.description, categoryMap),
    price: 1.00, // Default price as specified
    season: determineSeason(item.foodCategory, item.description, seasonMap),
    nutrients: mapNutrients(item.foodNutrients),
    isVegan: isVegan(item.foodCategory, item.ingredients),
    isGlutenFree: isGlutenFree(item.foodCategory, item.ingredients),
    fdcId: item.fdcId.toString(),
    servingSize: item.servingSize ? {
      amount: item.servingSize,
      unit: item.servingSizeUnit
    } : null,
    brandOwner: item.brandOwner || null,
    ingredients: item.ingredients || null,
    dataSource: 'USDA_FDC'
  };
}

async function main() {
  if (!API_KEY) {
    console.error('Error: FDC_API_KEY environment variable is not set');
    process.exit(1);
  }

  console.log('Starting USDA FoodData Central import...');
  const categoryMap = await loadJsonSafe(CATEGORY_MAP_PATH, []);
  const seasonMap = await loadJsonSafe(SEASON_MAP_PATH, []);
  
  let pageNumber = 1;
  const keyToItem = new Map();
  let existingItems = {};
  let stats = { total: 0, new: 0, updated: 0, invalid: 0 };

  // Load existing items if any
  try {
    const existing = JSON.parse(await fs.readFile(OUTPUT_PATH, 'utf8'));
    existingItems = existing.reduce((acc, item) => {
      acc[item.fdcId] = item;
      return acc;
    }, {});
  } catch (error) {
    console.log('No existing items found or error reading file');
  }

  // Fetch all pages
  while (true) {
    console.log(`Fetching page ${pageNumber}...`);
    const items = await fetchFoodData(pageNumber);
    
    if (!items.length) break;
    
    // Transform, filter, dedupe, and validate items
    for (const item of items) {
      stats.total++;
      if (!isBeneficial(item)) continue;

      const transformedItem = transformFoodItem(item, categoryMap, seasonMap);
      if (!transformedItem.category || transformedItem.category === 'Other') {
        // Keep only items that map into our taxonomy meaningfully
        // Comment out the following line if you want to keep 'Other'
        // continue;
      }
      
      const isValid = await validateSchema(transformedItem);
      if (!isValid) {
        stats.invalid++;
        continue;
      }

      const key = makeDedupeKey(item);
      if (keyToItem.has(key)) {
        // Prefer Foundation/SR Legacy over Branded for the same item key
        const current = keyToItem.get(key);
        const currentIsBranded = (current.brandOwner && current.brandOwner.length > 0);
        const incomingIsBranded = (item.dataType || '').toLowerCase() === 'branded';
        if (currentIsBranded && !incomingIsBranded) {
          keyToItem.set(key, transformedItem);
        }
      } else {
        keyToItem.set(key, transformedItem);
        if (existingItems[transformedItem.fdcId]) {
          stats.updated++;
        } else {
          stats.new++;
        }
      }
    }

    pageNumber++;
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Write to file
  const result = Array.from(keyToItem.values());
  await fs.writeFile(
    OUTPUT_PATH,
    JSON.stringify(result, null, 2)
  );

  console.log('\nImport Summary:');
  console.log('==============');
  console.log(`Total items processed: ${stats.total}`);
  console.log(`New items: ${stats.new}`);
  console.log(`Updated items: ${stats.updated}`);
  console.log(`Invalid items: ${stats.invalid}`);
  console.log(`Total valid items: ${result.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
