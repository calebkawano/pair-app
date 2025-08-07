import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'grocery-item.schema.json');
const USDA_DATA_PATH = path.join(__dirname, '..', 'public', 'data', 'grocery_usda.json');
const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'grocery_usda_sample.json');

async function resolveDataPath() {
  try {
    await fs.access(USDA_DATA_PATH);
    return USDA_DATA_PATH;
  } catch {
    // Only try to run importer if API key is present
    if (process.env.FDC_API_KEY) {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['scripts/import-usda.js'], {
          cwd: path.join(__dirname, '..'),
          env: process.env,
          stdio: 'inherit'
        });
        child.on('exit', code => (code === 0 ? resolve() : reject(new Error(`importer exited with code ${code}`))));
      });
      // After import, prefer generated file
      return USDA_DATA_PATH;
    }
    // Fallback to fixture for CI/offline runs
    return FIXTURE_PATH;
  }
}

describe('Grocery Data Schema Validation', () => {
  let schema;
  let groceryData;
  let validate;

  beforeAll(async () => {
    schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8'));
    const dataPath = await resolveDataPath();
    groceryData = JSON.parse(await fs.readFile(dataPath, 'utf8'));

    const ajv = new Ajv();
    validate = ajv.compile(schema);
  });

  test('grocery data file exists', () => {
    expect(groceryData).toBeDefined();
    expect(Array.isArray(groceryData)).toBe(true);
  });

  test('all items match schema', () => {
    for (const item of groceryData) {
      const isValid = validate(item);
      if (!isValid) {
        console.error('Validation errors:', validate.errors);
        console.error('Invalid item:', item);
      }
      expect(isValid).toBe(true);
    }
  });

  test('required fields are present', () => {
    for (const item of groceryData) {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.category).toBeDefined();
    }
  });

  test('nutrient data is properly formatted', () => {
    for (const item of groceryData) {
      if (item.nutrients) {
        expect(Array.isArray(item.nutrients)).toBe(true);
        for (const nutrient of item.nutrients) {
          expect(nutrient.nutrientName).toBeDefined();
          expect(typeof nutrient.amount).toBe('number');
          expect(nutrient.unit).toBeDefined();
        }
      }
    }
  });

  test('boolean flags are correct type', () => {
    for (const item of groceryData) {
      expect(typeof item.isVegan).toBe('boolean');
      expect(typeof item.isGlutenFree).toBe('boolean');
    }
  });

  test('season values are valid', () => {
    const validSeasons = ['spring', 'summer', 'fall', 'winter', null];
    for (const item of groceryData) {
      expect(validSeasons).toContain(item.season);
    }
  });

  test('price is a positive number', () => {
    for (const item of groceryData) {
      expect(typeof item.price).toBe('number');
      expect(item.price).toBeGreaterThan(0);
    }
  });
});
