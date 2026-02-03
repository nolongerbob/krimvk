/**
 * Утилиты для генерации QR-кода в формате СБП
 */

/**
 * Формирует строку QR-кода для оплаты через СБП
 * Формат: ST00012|Name=ООО Крым ВК|PayeeINN=9107000240|PersonalAcc=40702810725190003625|BIC=044525411|PersAcc=9004|PayerAddress=г. Евпатория...|Sum=2061636
 *
 * Важно: многие банки (в т.ч. ВТБ) трактуют Sum как сумму в КОПЕЙКАХ (целое число),
 * поэтому передаём Sum без разделителей: 3349.07 ₽ -> 334907
 */
export function generateSBPQRString(
  lscode: string,
  address: string,
  commonDuty: string | number,
  paymPeriod?: string,
  purpose?: string,
  region?: string
): string {
  // Форматируем сумму:
  // - учитываем пробелы и запятые
  // - не допускаем отрицательных значений (переплата не должна превращаться в сумму к оплате)
  // - всегда отдаём 2 знака после запятой (копейки)
  const parseAmount = (value: string | number): number => {
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (!value) return 0;
    const normalized = String(value).replace(/,/g, ".").replace(/\s/g, "");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const amount = Math.max(0, parseAmount(commonDuty));
  // Sum в копейках, целым числом
  const sum = String(Math.round(amount * 100));
  
  // Определяем организацию
  // Используем формат без кавычек: "ООО Крым ВК"
  const orgName = "ООО Крым ВК";
  const payeeINN = "9107000240";
  const personalAcc = "40702810725190003625";
  const bic = "044525411";
  
  // Формируем строку QR-кода в формате СБП
  // Важно: PayerAddress (одно слово, не PayerAddress)
  // Дополнительно:
  // - PaymPeriod: период оплаты (MM.YYYY)
  // - Purpose: назначение платежа (некоторые банки показывают период именно отсюда)
  const paymPeriodPart = paymPeriod ? `|PaymPeriod=${paymPeriod}` : "";
  const purposePart = purpose ? `|Purpose=${purpose}` : "";

  const qrString =
    `ST00012|Name=${orgName}|PayeeINN=${payeeINN}|PersonalAcc=${personalAcc}|BIC=${bic}` +
    `|PersAcc=${lscode}|PayerAddress=${address}|Sum=${sum}` +
    `${paymPeriodPart}${purposePart}`;
  
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
  paymPeriod?: string,
  purpose?: string,
  region?: string
): string {
  const qrString = generateSBPQRString(lscode, address, commonDuty, paymPeriod, purpose, region);
  
  // Кодируем строку для URL: заменяем специальные символы
  // | -> %7C, пробелы -> %20
  const encoded = qrString
    .replace(/\|/g, "%7C")    // Разделитель полей
    .replace(/\s/g, "%20")     // Пробелы
    .replace(/\n/g, "%0A")     // Переносы строк (если вдруг будут)
    .replace(/=/g, "%3D");     // Знак равенства
  
  // Используем qr.nspk.ru с кодированной строкой
  return `https://qr.nspk.ru/${encoded}`;
}

