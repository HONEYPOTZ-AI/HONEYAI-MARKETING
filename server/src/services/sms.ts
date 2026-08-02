/** Twilio SMS service */
import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

let client: twilio.Twilio | null = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export async function sendSms(to: string, body: string): Promise<{ sid: string; status: string }> {
  if (!client || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
  }

  const message = await client.messages.create({
    body,
    from: TWILIO_PHONE_NUMBER,
    to,
  });

  return { sid: message.sid, status: message.status };
}

export async function lookupPhoneNumber(phone: string): Promise<{ valid: boolean; carrier: string }> {
  if (!client) {
    throw new Error('Twilio not configured');
  }

  const lookup = await client.lookups.v2.phoneNumbers(phone).fetch();
  return { valid: lookup.valid || false, carrier: lookup.carrier?.name || 'unknown' };
}

export function isConfigured(): boolean {
  return !!client && TWILIO_PHONE_NUMBER.length > 0;
}

export function getPhoneNumber(): string {
  return TWILIO_PHONE_NUMBER;
}