import { Resend } from 'resend';

// Используем API ключ из .env.local
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

console.log('[Resend] Инициализация с API ключом:', apiKey.substring(0, 15) + '...');

export const resend = new Resend(apiKey);

export async function sendVerificationEmail(email: string, token: string, name?: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  try {
    // Всегда используем onboarding@resend.dev - это стандартный адрес Resend для тестирования
    // Он работает без верификации домена
    const fromAddress = 'onboarding@resend.dev';
    
    console.log('[Resend] Отправка письма:', { 
      from: fromAddress, 
      to: email, 
      apiKey: apiKey ? apiKey.substring(0, 15) + '...' : 'undefined',
      envFromEmail: process.env.RESEND_FROM_EMAIL 
    });
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: 'Подтвердите ваш email адрес',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Подтверждение email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h1 style="color: #2563eb; margin-top: 0;">Подтвердите ваш email адрес</h1>
            
            <p>Здравствуйте${name ? `, ${name}` : ''}!</p>
            
            <p>Спасибо за регистрацию на сайте ООО «Крымская Водная Компания».</p>
            
            <p>Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш email адрес, нажав на кнопку ниже:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Подтвердить email
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Или скопируйте и вставьте следующую ссылку в браузер:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
              С уважением,<br>
              ООО «Крымская Водная Компания»
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send verification email: ${JSON.stringify(error)}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

