/**
 * Registration Confirmation Email Template
 */

import * as React from 'react';

interface ConfirmationEmailProps {
  recipientName: string;
  webinarTitle: string;
  webinarDate: string;
  webinarTime: string;
  timezone: string;
  watchUrl: string;
  addToCalendarUrl?: string;
  hostName?: string;
  companyName?: string;
}

export function ConfirmationEmail({
  recipientName,
  webinarTitle,
  webinarDate,
  webinarTime,
  timezone,
  watchUrl,
  addToCalendarUrl,
  hostName,
  companyName,
}: ConfirmationEmailProps): React.ReactElement {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <h1 style={styles.heading}>You&apos;re registered!</h1>

        <p style={styles.text}>
          Hi {recipientName || 'there'},
        </p>

        <p style={styles.text}>
          You&apos;re all set for <strong>{webinarTitle}</strong>
          {hostName && ` with ${hostName}`}
          {companyName && ` from ${companyName}`}.
        </p>

        {/* Event Details */}
        <div style={styles.eventBox}>
          <h2 style={styles.eventTitle}>{webinarTitle}</h2>
          <p style={styles.eventDetail}>
            <strong>Date:</strong> {webinarDate}
          </p>
          <p style={styles.eventDetail}>
            <strong>Time:</strong> {webinarTime} ({timezone})
          </p>
        </div>

        {/* CTA Button */}
        <div style={styles.buttonContainer}>
          <a href={watchUrl} style={styles.button}>
            Join Webinar
          </a>
        </div>

        {addToCalendarUrl && (
          <p style={styles.calendarLink}>
            <a href={addToCalendarUrl} style={styles.link}>
              Add to Calendar
            </a>
          </p>
        )}

        <p style={styles.text}>
          We&apos;ll send you a reminder before the event starts.
        </p>

        {/* Footer */}
        <hr style={styles.divider} />
        <p style={styles.footer}>
          Can&apos;t make it? Don&apos;t worry - we&apos;ll send you the replay after the event.
        </p>
      </div>
    </div>
  );
}

export function renderConfirmationEmail(props: ConfirmationEmailProps): string {
  // Simple HTML render for Resend
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're registered for ${props.webinarTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">You're registered!</h1>

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hi ${props.recipientName || 'there'},
      </p>

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        You're all set for <strong>${props.webinarTitle}</strong>${props.hostName ? ` with ${props.hostName}` : ''}${props.companyName ? ` from ${props.companyName}` : ''}.
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
        <a href="${props.watchUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
          Join Webinar
        </a>
      </div>

      ${props.addToCalendarUrl ? `
      <p style="text-align: center; margin: 0 0 24px 0;">
        <a href="${props.addToCalendarUrl}" style="color: #2563eb; font-size: 14px;">
          Add to Calendar
        </a>
      </p>
      ` : ''}

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        We'll send you a reminder before the event starts.
      </p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

      <p style="color: #71717a; font-size: 14px; margin: 0;">
        Can't make it? Don't worry - we'll send you the replay after the event.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f4f4f5',
    padding: '40px 20px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  content: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  heading: {
    color: '#18181b',
    fontSize: '24px',
    fontWeight: 600,
    margin: '0 0 24px 0',
  },
  text: {
    color: '#3f3f46',
    fontSize: '16px',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },
  eventBox: {
    backgroundColor: '#f4f4f5',
    borderRadius: '8px',
    padding: '24px',
    margin: '0 0 24px 0',
  },
  eventTitle: {
    color: '#18181b',
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 16px 0',
  },
  eventDetail: {
    color: '#52525b',
    fontSize: '14px',
    margin: '0 0 8px 0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '0 0 24px 0',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 500,
    textDecoration: 'none',
    padding: '12px 32px',
    borderRadius: '8px',
  },
  calendarLink: {
    textAlign: 'center' as const,
    margin: '0 0 24px 0',
  },
  link: {
    color: '#2563eb',
    fontSize: '14px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e4e4e7',
    margin: '24px 0',
  },
  footer: {
    color: '#71717a',
    fontSize: '14px',
    margin: 0,
  },
};
