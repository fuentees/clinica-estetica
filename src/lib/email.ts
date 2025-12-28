import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('Missing SendGrid API key');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(to: string, subject: string, text: string) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@clinicaestetica.com',
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}