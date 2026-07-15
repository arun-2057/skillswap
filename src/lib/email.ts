import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename?: string;
    content?: string | Buffer;
  }>;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
  cc,
  bcc,
  attachments,
}: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY is not configured. Email not sent.');
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: from || process.env.RESEND_FROM_EMAIL || 'SkillSwap <noreply@skillswap.app>',
      to,
      subject,
      html,
      replyTo,
      cc,
      bcc,
      attachments,
    });
    return result;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return null;
  }
}

export async function sendSessionBookingEmail({
  to,
  learnerName,
  listingTitle,
  scheduledAt,
  duration,
}: {
  to: string;
  learnerName: string;
  listingTitle: string;
  scheduledAt: string;
  duration: number;
}) {
  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return sendEmail({
    to,
    subject: `New Session Request: ${listingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Session Request</h2>
        <p>Hi there,</p>
        <p><strong>${learnerName}</strong> has requested a session for:</p>
        <ul>
          <li><strong>Listing:</strong> ${listingTitle}</li>
          <li><strong>Date & Time:</strong> ${formattedDate}</li>
          <li><strong>Duration:</strong> ${duration} minutes</li>
        </ul>
        <p>Please log in to SkillSwap to accept or decline this request.</p>
        <p>Best regards,<br>SkillSwap Team</p>
      </div>
    `,
  });
}

export async function sendSessionConfirmedEmail({
  to,
  learnerName,
  listingTitle,
  scheduledAt,
  duration,
}: {
  to: string;
  learnerName: string;
  listingTitle: string;
  scheduledAt: string;
  duration: number;
}) {
  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return sendEmail({
    to,
    subject: `Session Confirmed: ${listingTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Session Confirmed</h2>
        <p>Hi ${learnerName},</p>
        <p>Your session has been confirmed:</p>
        <ul>
          <li><strong>Listing:</strong> ${listingTitle}</li>
          <li><strong>Date & Time:</strong> ${formattedDate}</li>
          <li><strong>Duration:</strong> ${duration} minutes</li>
        </ul>
        <p>We'll send you a reminder before the session starts.</p>
        <p>Best regards,<br>SkillSwap Team</p>
      </div>
    `,
  });
}

export async function sendMessageNotificationEmail({
  to,
  senderName,
  message,
  conversationId,
}: {
  to: string;
  senderName: string;
  message: string;
  conversationId: string;
}) {
  return sendEmail({
    to,
    subject: `New message from ${senderName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Message</h2>
        <p>You received a new message from <strong>${senderName}</strong>:</p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin: 1rem 0; color: #333;">
          ${message.length > 200 ? message.substring(0, 200) + '...' : message}
        </blockquote>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/messages/${conversationId}">
            View conversation
          </a>
        </p>
        <p>Best regards,<br>SkillSwap Team</p>
      </div>
    `,
  });
}
