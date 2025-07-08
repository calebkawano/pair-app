import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/middleware';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestBodySchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required').refine((phone) => {
    try {
      return isValidPhoneNumber(phone);
    } catch {
      return false;
    }
  }, 'Phone number must be a valid international number'),
  householdId: z.string().uuid('Invalid household ID'),
  householdName: z.string().min(1, 'Household name is required'),
});

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const requestLogger = logger.child({ requestId, route: 'invite' });
  
  try {
    const supabase = await createClient();
    const userId = requireUser(request);

    const body = await request.json();
    const validationResult = requestBodySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { phoneNumber: rawPhoneNumber, householdId, householdName } = validationResult.data;
    
    requestLogger.info({ userId, householdId }, 'Processing household invite request');

    // Normalize phone number to E.164 format
    let normalizedPhoneNumber: string;
    try {
      const parsed = parsePhoneNumber(rawPhoneNumber);
      if (!parsed || !parsed.isValid()) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      normalizedPhoneNumber = parsed.format('E.164');
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse phone number' },
        { status: 400 }
      );
    }

    // Verify the user has permission to invite to this household
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', userId)
      .single();

    if (memberError || !memberData || memberData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to invite to this household' },
        { status: 403 }
      );
    }

    // Rate limiting: max 5 invites per user per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: todayInvites, error: inviteCountError } = await supabase
      .from('household_invites')
      .select('id')
      .eq('invited_by', userId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());
    
    if (inviteCountError) {
      requestLogger.error({ error: inviteCountError, userId }, 'Error checking invite count');
      return NextResponse.json(
        { error: 'Failed to check invite limit' },
        { status: 500 }
      );
    }
    
    if (todayInvites && todayInvites.length >= 5) {
      return NextResponse.json(
        { error: 'Daily invite limit exceeded (5 invites per day)' },
        { status: 429 }
      );
    }

    // Generate a unique invite code using crypto.randomUUID()
    let inviteCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;
    
    // Generate a unique invite code with collision detection
    do {
      inviteCode = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      
      // Check if this code already exists
      const { data: existingInvite } = await supabase
        .from('household_invites')
        .select('code')
        .eq('code', inviteCode)
        .single();
      
      isUnique = !existingInvite;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);
    
    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code' },
        { status: 500 }
      );
    }
    
    // TODO: Add unique index on invite_code column in database migration:
    // ALTER TABLE household_invites ADD CONSTRAINT unique_invite_code UNIQUE (code);
    
    // Store the invite in the database
    const { error: inviteError } = await supabase
      .from('household_invites')
      .insert([
        {
          household_id: householdId,
          invited_by: userId,
          phone_number: normalizedPhoneNumber,
          code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }
      ]);

    if (inviteError) {
      requestLogger.error({ error: inviteError, userId, householdId }, 'Error creating invite');
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    // Generate the invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/join-household/${inviteCode}?name=${encodeURIComponent(householdName)}`;

    requestLogger.info({ userId, householdId, inviteCode, phoneNumber: normalizedPhoneNumber }, 'Successfully created household invite');
    return NextResponse.json({ success: true, inviteLink });
  } catch (error) {
    requestLogger.error({ error, userId: request.headers.get('x-user-id') }, 'Error sending invite');
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    );
  }
} 