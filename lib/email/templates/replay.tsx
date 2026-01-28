/**
 * Replay Available Email Template
 */

interface ReplayEmailProps {
  recipientName: string;
  webinarTitle: string;
  replayUrl: string;
  attended: boolean;
  hostName?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function renderReplayEmail(props: ReplayEmailProps): string {
  const headingText = props.attended
    ? "Thanks for joining!"
    : "Sorry we missed you!";

  const introText = props.attended
    ? `We hope you enjoyed <strong>${props.webinarTitle}</strong>. Here's the replay in case you want to watch it again or share it with a friend.`
    : `We missed you at <strong>${props.webinarTitle}</strong>, but don't worry - the replay is now available for you to watch at your convenience.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Replay: ${props.webinarTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

      <div style="background-color: #ecfdf5; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0; text-align: center;">
        <span style="color: #065f46; font-size: 14px; font-weight: 500;">🎬 Replay Now Available</span>
      </div>

      <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        ${headingText}
      </h1>

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
        Hi ${props.recipientName || 'there'},
      </p>

      <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${introText}
      </p>

      <div style="text-align: center; margin: 0 0 24px 0;">
        <a href="${props.replayUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none; padding: 12px 32px; border-radius: 8px;">
          Watch Replay
        </a>
      </div>

      ${props.ctaText && props.ctaUrl ? `
      <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin: 0 0 24px 0; text-align: center;">
        <p style="color: #3f3f46; font-size: 14px; margin: 0 0 16px 0;">
          ${props.ctaText}
        </p>
        <a href="${props.ctaUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 10px 24px; border-radius: 6px;">
          Learn More
        </a>
      </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">

      <p style="color: #71717a; font-size: 14px; margin: 0;">
        ${props.hostName ? `Thanks again from ${props.hostName}. ` : ''}We hope to see you at our next event!
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function getReplaySubject(webinarTitle: string, attended: boolean): string {
  return attended
    ? `Replay: ${webinarTitle}`
    : `You missed it, but here's the replay: ${webinarTitle}`;
}
