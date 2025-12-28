import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('Missing Twilio credentials');
}

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendWhatsApp(to: string, message: string) {
  try {
    await client.messages.create({
      body: message,
      from: \`whatsapp:\${process.env.TWILIO_WHATSAPP_NUMBER}\`,
      to: \`whatsapp:\${to}\`,
    });
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}