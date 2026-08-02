/** SendGrid email service */
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@honeypotz.net';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  trackingSettings?: { openTracking?: boolean; clickTracking?: boolean };
}

export async function sendEmail(opts: EmailOptions): Promise<{ messageId: string; status: string }> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid not configured — set SENDGRID_API_KEY');
  }

  const [response] = await sgMail.send({
    to: opts.to,
    from: opts.from || SENDGRID_FROM_EMAIL,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || opts.html.replace(/<[^>]*>/g, ''),
    trackingSettings: opts.trackingSettings || { openTracking: { enable: true }, clickTracking: { enable: true } },
  });

  return { messageId: response.headers['x-message-id'] || '', status: 'sent' };
}

export function isConfigured(): boolean {
  return SENDGRID_API_KEY.length > 0;
}