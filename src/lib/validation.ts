import { STORE_SECTIONS } from '@/constants/store';
import { PRIORITY_LEVELS, UNITS } from '@/types/grocery';
import { z } from 'zod';

// Base schemas for reuse
export const idSchema = z.string().uuid();
export const timestampSchema = z.string().datetime();
export const emailSchema = z.string().email();
export const positiveNumberSchema = z.number().positive();

// Food request validation
export const foodRequestSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  item_description: z.string().nullable(),
  quantity: positiveNumberSchema,
  unit: z.enum(UNITS).nullable(),
  section: z.enum(STORE_SECTIONS).nullable(),
  priority: z.enum(PRIORITY_LEVELS).default('normal'),
  household_id: idSchema,
});

// Profile validation
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: emailSchema.optional(),
  avatar_url: z.string().url().nullable(),
});

// Household validation
export const householdCreateSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

// Price tracking validation
export const priceRecordSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  store_name: z.string().min(1, 'Store name is required'),
  price: z.number().positive('Price must be positive'),
  unit: z.enum(UNITS).nullable(),
});

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      throw validationError;
    }
    throw error;
  }
} 