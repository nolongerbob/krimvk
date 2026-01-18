import { Resend } from 'resend';

// Ленивая инициализация — не бросаем ошибку при импорте, чтобы не ломать маршруты
// если RESEND_API_KEY не задан (напр. на Vercel). Ошибка будет при первой отправке.
let _client: Resend | null = null;

function getClient(): Resend {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    throw new Error('Сервис отправки почты не настроен. Обратитесь к администратору.');
  }
  _client = new Resend(apiKey);
  return _client;
}

export async function sendVerificationEmail(email: string, token: string, name?: string) {
  // Определяем базовый URL для ссылок
  // На Vercel должен быть установлен NEXTAUTH_URL
  // Если не установлен, пытаемся определить из окружения или используем production URL
  const baseUrl = process.env.NEXTAUTH_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NODE_ENV === 'production' ? 'https://krimvk.ru' : 'http://localhost:3000');
  
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Resend] verificationUrl:', baseUrl, '->', verificationUrl);
  }
  
  try {
    // Определяем адрес отправителя:
    // 1. Если указан RESEND_FROM_EMAIL в env - используем его (приоритет)
    // 2. В production используем send@krimvk.ru (домен верифицирован)
    // 3. В development пробуем send@krimvk.ru, если не работает - используй onboarding@resend.dev
    // Можно использовать формат с именем: "Имя <email@domain.com>"
    const isProduction = process.env.NODE_ENV === 'production';
    const defaultFrom = isProduction 
      ? 'КрымВК <send@krimvk.ru>' 
      : 'КрымВК <send@krimvk.ru>'; // Используем верифицированный домен везде
    
    const fromAddress = process.env.RESEND_FROM_EMAIL || defaultFrom;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Resend] Отправка письма:', { from: fromAddress, to: email });
    }
    
    const { data, error } = await getClient().emails.send({
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
      const errMsg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
      console.error('[Resend] Ошибка отправки (verify):', errMsg);
      if (/verify|domain|from\s*address/i.test(errMsg)) {
        throw new Error('Домен отправителя не верифицирован. Обратитесь к администратору.');
      }
      if (/api|key|invalid|unauthorized|401/i.test(errMsg)) {
        throw new Error('Сервис отправки почты не настроен. Обратитесь к администратору.');
      }
      throw new Error('Не удалось отправить письмо. Обратитесь к администратору.');
    }

    if (process.env.NODE_ENV === 'development') console.log('[Resend] Verify email sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Resend] Error sending verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  // Определяем базовый URL для ссылок
  // На Vercel должен быть установлен NEXTAUTH_URL
  // Если не установлен, пытаемся определить из окружения или используем production URL
  const baseUrl = process.env.NEXTAUTH_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    (process.env.NODE_ENV === 'production' ? 'https://krimvk.ru' : 'http://localhost:3000');
  
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  try {
    // Используем верифицированный домен krimvk.ru
    const isProduction = process.env.NODE_ENV === 'production';
    const defaultFrom = isProduction 
      ? 'КрымВК <send@krimvk.ru>' 
      : 'КрымВК <send@krimvk.ru>';
    
    const fromAddress = process.env.RESEND_FROM_EMAIL || defaultFrom;
    
    const { data, error } = await getClient().emails.send({
      from: fromAddress,
      to: email,
      subject: 'Восстановление пароля',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Восстановление пароля</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h1 style="color: #2563eb; margin-top: 0;">Восстановление пароля</h1>
            
            <p>Здравствуйте${name ? `, ${name}` : ''}!</p>
            
            <p>Вы запросили восстановление пароля для вашего аккаунта на сайте ООО «Крымская Водная Компания».</p>
            
            <p>Для сброса пароля нажмите на кнопку ниже:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Сбросить пароль
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Или скопируйте и вставьте следующую ссылку в браузер:<br>
              <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              <strong>Важно:</strong> Ссылка действительна в течение 1 часа. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
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
      const errMsg = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
      console.error('[Resend] Ошибка отправки (reset):', errMsg);
      if (/verify|domain|from\s*address/i.test(errMsg)) {
        throw new Error('Домен отправителя не верифицирован. Обратитесь к администратору.');
      }
      if (/api|key|invalid|unauthorized|401/i.test(errMsg)) {
        throw new Error('Сервис отправки почты не настроен. Обратитесь к администратору.');
      }
      throw new Error('Не удалось отправить письмо. Обратитесь к администратору.');
    }

    if (process.env.NODE_ENV === 'development') console.log('[Resend] Password reset email sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Resend] Error sending password reset email:', error);
    throw error;
  }
}

