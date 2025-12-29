/**
 * Утилиты для генерации QR-кода в формате СБП
 */

/**
 * Формирует строку QR-кода для оплаты через СБП
 * Формат: ST00012|Name=ООО Крым ВК|PayeeINN=9107000240|PersonalAcc=40702810725190003625|BIC=044525411|PersAcc=9004|PayerAddress=г. Евпатория...|Sum=20616,36
 */
export function generateSBPQRString(
  lscode: string,
  address: string,
  commonDuty: string | number,
  region?: string
): string {
  // Форматируем сумму: заменяем точку на запятую и убираем лишние символы
  // Пример: 20616.36 -> 20616,36 или 20616 -> 20616
  let sum = String(commonDuty);
  // Убираем все символы кроме цифр, точки и запятой
  sum = sum.replace(/[^\d.,]/g, "");
  // Заменяем точку на запятую для десятичного разделителя
  sum = sum.replace(/\./g, ",");
  
  // Определяем организацию
  // Используем формат без кавычек: "ООО Крым ВК"
  const orgName = "ООО Крым ВК";
  const payeeINN = "9107000240";
  const personalAcc = "40702810725190003625";
  const bic = "044525411";
  
  // Формируем строку QR-кода в формате СБП
  // Важно: PayerAddress (одно слово, не PayerAddress)
  const qrString = `ST00012|Name=${orgName}|PayeeINN=${payeeINN}|PersonalAcc=${personalAcc}|BIC=${bic}|PersAcc=${lscode}|PayerAddress=${address}|Sum=${sum}`;
  
  return qrString;
}

/**
 * Формирует URL для оплаты через СБП
 * Открывает страницу СБП с выбором банка
 * 
 * СБП принимает строку QR-кода в формате ST00012|Name=...|PayeeINN=...
 * Для URL нужно правильно кодировать специальные символы
 */
export function generateSBPURL(
  lscode: string,
  address: string,
  commonDuty: string | number,
  region?: string
): string {
  const qrString = generateSBPQRString(lscode, address, commonDuty, region);
  
  // Кодируем строку для URL: заменяем специальные символы
  // | -> %7C, пробелы -> %20, запятые -> %2C
  const encoded = qrString
    .replace(/\|/g, "%7C")    // Разделитель полей
    .replace(/\s/g, "%20")     // Пробелы
    .replace(/,/g, "%2C")      // Запятые (в сумме)
    .replace(/=/g, "%3D");     // Знак равенства
  
  // Используем qr.nspk.ru с кодированной строкой
  return `https://qr.nspk.ru/${encoded}`;
}

