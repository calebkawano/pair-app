import { z } from 'zod';

// Member dietary preferences schema
export const memberDietaryPreferencesSchema = z.object({
  notes: z.string().optional(),
}).catchall(z.unknown());

// Member schema
export const memberSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  email: z.string(),
  dietary_preferences: memberDietaryPreferencesSchema,
  allergies: z.array(z.string()),
  role: z.enum(['admin', 'member'])
});

// Household schema
export const householdSchema = z.object({
  id: z.string(),
  name: z.string(),
  members: z.array(memberSchema),
  isExpanded: z.boolean().optional(),
  color: z.string().optional(),
  is_personal: z.boolean().optional(),
  created_by: z.string(),
  address: z.string().optional()
});

// Supabase profile schema
export const supabaseProfileSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string().nullable()
});

// Supabase household member schema
export const supabaseHouseholdMemberSchema = z.object({
  profiles: supabaseProfileSchema.nullable(),
  dietary_preferences: memberDietaryPreferencesSchema.nullable(),
  allergies: z.array(z.string()).nullable().optional(),
  role: z.enum(['admin', 'member'])
});

// Supabase household row schema
export const supabaseHouseholdRowSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  color: z.string().nullable().optional(),
  household_members: z.array(supabaseHouseholdMemberSchema).nullable().optional(),
  is_personal: z.boolean().nullable().optional(),
  created_by: z.string()
});

// Membership data schema
export const membershipDataSchema = z.object({
  household_id: z.union([z.string(), z.number()]),
  role: z.enum(['admin', 'member']).nullable().transform((val) => val || 'member')
});

// Type exports
export type MemberDietaryPreferences = z.infer<typeof memberDietaryPreferencesSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Household = z.infer<typeof householdSchema>;
export type SupabaseProfile = z.infer<typeof supabaseProfileSchema>;
export type SupabaseHouseholdMember = z.infer<typeof supabaseHouseholdMemberSchema>;
export type SupabaseHouseholdRow = z.infer<typeof supabaseHouseholdRowSchema>;
export type MembershipData = z.infer<typeof membershipDataSchema>; 