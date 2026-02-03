import { NextRequest, NextResponse } from 'next/server';
import { generateZoomSignature, isValidMeetingNumber } from '@/lib/integrations/zoom/signature';
import { getRegistrationById } from '@/lib/data/registrations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingNumber, registrationId } = body;

    // Validate required fields
    if (!meetingNumber || !registrationId) {
      return NextResponse.json(
        { error: 'Missing meetingNumber or registrationId' },
        { status: 400 }
      );
    }

    // Validate meeting number format
    if (!isValidMeetingNumber(meetingNumber)) {
      return NextResponse.json(
        { error: 'Invalid meeting number format' },
        { status: 400 }
      );
    }

    // Verify registration exists (authorization check)
    const registration = await getRegistrationById(registrationId);
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 401 }
      );
    }

    // Generate signature for attendee (role: 0)
    const signature = generateZoomSignature(meetingNumber, 0);

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Failed to generate Zoom signature:', error);

    // Check for missing env vars
    if (error instanceof Error && error.message.includes('Missing ZOOM_SDK')) {
      return NextResponse.json(
        { error: 'Zoom SDK not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}
