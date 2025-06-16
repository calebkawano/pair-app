import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { phoneNumber, householdId, householdName } = await request.json();

    if (!phoneNumber || !householdId || !householdName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the user has permission to invite to this household
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData || memberData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to invite to this household' },
        { status: 403 }
      );
    }

    // Generate a unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 15);
    
    // Store the invite in the database
    const { error: inviteError } = await supabase
      .from('household_invites')
      .insert([
        {
          household_id: householdId,
          invited_by: user.id,
          phone_number: phoneNumber,
          code: inviteCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }
      ]);

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      );
    }

    // Generate the invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/join-household/${inviteCode}`;

    return NextResponse.json({ success: true, inviteLink });
  } catch (error) {
    console.error('Error sending invite:', error);
    return NextResponse.json(
      { error: 'Failed to send invite' },
      { status: 500 }
    );
  }
} 