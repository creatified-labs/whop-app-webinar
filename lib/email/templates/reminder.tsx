/**
 * Webinar Reminder Email Template
 */

interface ReminderEmailProps {
  recipientName: string;
  webinarTitle: string;
  webinarDate: string;
  webinarTime: string;
  timezone: string;
  watchUrl: string;
  reminderType: '24h' | '1h';
  hostName?: string;
}

export function renderReminderEmail(props: ReminderEmailProps): string {
  const isOneHour = props.reminderType === '1h';
  const urgencyText = isOneHour ? 'starts in 1 hour' : 'is tomorrow';
  const subjectLine = isOneHour
    ? `Starting soon: ${props.webinarTitle}`
    : `Reminder: ${props.webinarTitle} is tomorrow`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectLine}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      ${isOneHour ? `
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0; text-align: center;">
        <span style="color: #92400e; font-size: 14px; font-weight: 500;">⏰ Starting in 1 hour!</span>
      </div>
      ` : ''}

      <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        ${isOneHour ? "We're about to go live!" : "See you tomorrow!"}
      </h1>

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hi ${props.recipientName || 'there'},
      </p>

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Just a friendly reminder that <strong>${props.webinarTitle}</strong> ${urgencyText}${props.hostName ? ` with ${props.hostName}` : ''}.
      </p>

      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin: 0 0 24px 0;">
        <h2 style="color: #18181b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">${props.webinarTitle}</h2>
        <p style="color: #52525b; font-size: 14px; margin: 0 0 8px 0;">
          <strong>Date:</strong> ${props.webinarDate}
        </p>
        <p style="color: #52525b; font-size: 14px; margin: 0;">
          <strong>Time:</strong> ${props.webinarTime} (${props.timezone})
        </p>
      </div>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${props.watchUrl}" style="display: inline-block; background-color: ${isOneHour ? '#dc2626' : '#2563eb'}; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
          ${isOneHour ? 'Join Now' : 'Save Your Spot'}
        </a>
      </div>

      <p style="color: #71717a; font-size: 14px; text-align: center; margin: 0;">
        ${isOneHour
          ? "Click the button above when you're ready to join."
          : "We'll send you another reminder 1 hour before the event."}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getReminderSubject(webinarTitle: string, reminderType: '24h' | '1h'): string {
  return reminderType === '1h'
    ? `Starting soon: ${webinarTitle}`
    : `Reminder: ${webinarTitle} is tomorrow`;
}
