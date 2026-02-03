import crypto from 'crypto';

/**
 * Generate a Zoom Meeting SDK signature
 * This must be done server-side to protect the SDK secret
 *
 * @param meetingNumber - The Zoom meeting number
 * @param role - 0 for attendee, 1 for host
 * @returns The generated signature for the Zoom SDK
 */
export function generateZoomSignature(
  meetingNumber: string,
  role: 0 | 1 = 0
): string {
  const sdkKey = process.env.ZOOM_SDK_KEY;
  const sdkSecret = process.env.ZOOM_SDK_SECRET;

  if (!sdkKey || !sdkSecret) {
    throw new Error('Missing ZOOM_SDK_KEY or ZOOM_SDK_SECRET environment variables');
  }

  // Remove any spaces or dashes from meeting number
  const cleanMeetingNumber = meetingNumber.replace(/[\s-]/g, '');

  const timestamp = Date.now() - 30000;
  const msg = Buffer.from(`${sdkKey}${cleanMeetingNumber}${timestamp}${role}`).toString('base64');

  const hash = crypto
    .createHmac('sha256', sdkSecret)
    .update(msg)
    .digest('base64');

  const signature = Buffer.from(
    `${sdkKey}.${cleanMeetingNumber}.${timestamp}.${role}.${hash}`
  ).toString('base64');

  return signature;
}

/**
 * Validate a Zoom meeting number format
 * Meeting numbers are typically 9-11 digits
 */
export function isValidMeetingNumber(meetingNumber: string): boolean {
  const cleaned = meetingNumber.replace(/[\s-]/g, '');
  return /^\d{9,11}$/.test(cleaned);
}

/**
 * Format a meeting number for display (add spaces)
 * e.g., "12345678901" -> "123 4567 8901"
 */
export function formatMeetingNumber(meetingNumber: string): string {
  const cleaned = meetingNumber.replace(/[\s-]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  return cleaned;
}
