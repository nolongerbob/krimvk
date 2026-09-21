/**
 * Утилиты для работы с 1С HTTP-сервисом WebAccounts.
 * Базовый URL: ONE_C_API_BASE_URL в .env (на prod fallback как до выноса в env).
 */

import { assertValid1cRegion } from '@/lib/1c-regions';
import { hasMonthlyReading, meterPeriod, MeterSubmissionError, reserveMeterSubmission } from '@/lib/meter-submission-guard';

/** Прежний захардкоженный адрес — fallback, если PM2 не подхватил .env */
const LEGACY_1C_BASE_URL = 'http://46.172.223.34';

function stripEnvUrl(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '');
}

export function get1cBaseUrl(): string {
  const fromEnv = process.env.ONE_C_API_BASE_URL;
  if (fromEnv) {
    const cleaned = stripEnvUrl(fromEnv);
    if (cleaned) return cleaned;
  }
  if (process.env.NODE_ENV === 'production') {
    return LEGACY_1C_BASE_URL;
  }
  throw new Error('ONE_C_API_BASE_URL is not set (configure in .env for dev)');
}

/** URL как на старом PHP-сайте: query вручную, urlencode л/с и пароля */
function build1cGetUrl(
  regionPath: string,
  method: string,
  params: Record<string, string>
): string {
  const base = `${get1cBaseUrl()}/${regionPath}/hs/WebAccounts/${method}`;
  const query = Object.entries(params)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return query ? `${base}?${query}` : base;
}

function map1cHttpError(status: number, errorText: string): Error {
  if (status === 401 || status === 403) {
    return new Error('AUTH_ERROR: Неверный номер лицевого счета или пароль');
  }
  // 1С часто отвечает 404 + "## Error in incoming data." при неверных параметрах
  if (
    status === 404 &&
    /Error in incoming|Data not found|incoming data/i.test(errorText)
  ) {
    return new Error('AUTH_ERROR: Неверный номер лицевого счета или пароль');
  }
  return new Error(`1C API error: ${status} - ${errorText}`);
}

/**
 * Форматирует дату в формат DD.MM.YYYY для 1С API
 */
export function formatDateFor1C(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Форматирует дату в формат YYYY-MM-DD для истории платежей
 */
export function formatDateForHistory(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Получить регион для API (allowlist, без ../ и лишних сегментов пути)
 */
export function getRegion(region?: string | null): string {
  return assertValid1cRegion(region);
}

/**
 * Обработка ошибок подключения к 1С API
 */
function handleFetchError(error: any, url: string): never {
  if (error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
    throw new Error("TIMEOUT: Сервер 1С не отвечает. Проверьте доступность сервера или используйте VPN.");
  }
  if (error.code === 'ECONNREFUSED') {
    throw new Error("CONNECTION_REFUSED: Не удалось подключиться к серверу 1С. Возможно, требуется VPN или сервер недоступен.");
  }
  if (error.message?.includes('fetch failed')) {
    throw new Error(`NETWORK_ERROR: Ошибка подключения к серверу 1С: ${error.message}`);
  }
  throw error;
}

/**
 * Получить данные пользователя из 1С
 * GET /{region}/hs/WebAccounts/get_data
 */
export async function get1CUserData(
  accountNumber: string,
  password: string,
  region?: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<any> {
  const regionPath = getRegion(region);
  const params: Record<string, string> = {
    WaLsCode: accountNumber.trim(),
    WaPass: password.trim(),
  };
  if (dateFrom) params.WaDateFrom = formatDateFor1C(dateFrom);
  if (dateTo) params.WaDateTo = formatDateFor1C(dateTo);

  const url = build1cGetUrl(regionPath, 'get_data', params);

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30 секунд таймаут
    });
  } catch (error: any) {
    handleFetchError(error, url);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw map1cHttpError(response.status, errorText);
  }

  return await response.json();
}

/**
 * Передать показания счетчика в 1С
 * GET /{region}/hs/WebAccounts/set_metering_device_indication
 */
export async function submitMeterReading(
  accountNumber: string,
  password: string,
  deviceNumber: string,
  reading: number,
  region?: string
): Promise<any> {
  const regionPath = getRegion(region);
  if(typeof deviceNumber!=='string'||!deviceNumber.trim()||!Number.isFinite(reading)||reading<0)throw new MeterSubmissionError('Некорректные показания','METER_INVALID',400);
  const period=meterPeriod();
  if(period.day<6||period.day>25)throw new MeterSubmissionError('Показания можно передавать только с 6 по 25 число','METER_PERIOD',400);
  try{
    const last=new Date(Date.UTC(period.year,period.month,0)).getUTCDate(),month=String(period.month).padStart(2,'0');
    const history=await getMeteringDeviceHistory(accountNumber,password,region,`01.${month}.${period.year}`,`${last}.${month}.${period.year}`);
    if(hasMonthlyReading(history,deviceNumber,period.key))throw new MeterSubmissionError('Показания для этого счётчика уже переданы в этом месяце. Для исправления обратитесь к оператору.','METER_ALREADY_SENT');
  }catch(error){
    if(error instanceof MeterSubmissionError)throw error;
    throw new MeterSubmissionError('Не удалось проверить предыдущие показания. Новые показания не отправлены. Попробуйте позже.','METER_HISTORY_UNAVAILABLE',503);
  }
  const finish=await reserveMeterSubmission(regionPath,accountNumber,deviceNumber,reading,period.key);
  try{
    const result=await sendMeterReadingOnce(accountNumber,password,deviceNumber,reading,regionPath);
    if(result===null||(typeof result==='object'&&(result.Error||result.error||result.success===false)))throw new Error('Unconfirmed receipt');
    await finish('accepted');return result;
  }catch{
    await finish('unknown').catch(()=>{});
    throw new MeterSubmissionError('Не удалось подтвердить результат отправки. 1С могла принять показания. Повторная отправка заблокирована — обратитесь к оператору.','METER_RESULT_UNKNOWN',409);
  }
}

async function sendMeterReadingOnce(accountNumber:string,password:string,deviceNumber:string,reading:number,regionPath:string):Promise<any>{
  /**
   * ВАЖНО:
   * Старый PHP-сайт формировал URL вручную:
   *
   *   .../set_metering_device_indication?WaLsCode=...&WaPass=...&WaNumberOfDevice=...&WaReading=...
   *
   * при этом для WaNumberOfDevice пробелы заменялись на "%20":
   *
   *   preg_replace("/\s/is","%20",$val['0'])
   *
   * Если использовать URLSearchParams, пробелы могут кодироваться как "+",
   * что для 1С может отличаться от ожидаемого и приводить к "## Data not found.".
   *
   * Поэтому формируем строку запроса максимально близко к старому сайту.
   */
  const baseUrl = `${get1cBaseUrl()}/${regionPath}/hs/WebAccounts/set_metering_device_indication`;

  // Полностью повторяем поведение старого сайта:
  // - LSCode триммим и кодируем
  // - пароль передаём как есть (как делал PHP)
  // - номер прибора: пробелы -> "%20", как в preg_replace
  // - показание просто как число в строке
  const query =
    `WaLsCode=${encodeURIComponent(accountNumber.trim())}` +
    `&WaPass=${encodeURIComponent(password)}` +
    `&WaNumberOfDevice=${encodeURIComponent(deviceNumber.trim())}` +
    `&WaReading=${reading.toString()}`;

  const url = `${baseUrl}?${query}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: 'no-store',
      redirect: 'error',
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30 секунд таймаут
    });
  } catch (error: any) {
    handleFetchError(error, url.toString());
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR: Неверный номер лицевого счета или пароль");
    }
    throw new Error(`1C API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Получить историю платежей из 1С
 * GET /{region}/hs/WebAccounts/get_payment_history
 * 
 * На старом сайте использовался формат:
 * $url = 'http://46.172.223.34/'.$lk_region.'/hs/WebAccounts/get_payment_history?WaLsCode='.urlencode(trim($lk_login)).'&WaPass='.urlencode(trim($lk_passwd)).'&WaDateFrom='.$start_date.'&WaDateTo='.$end_date;
 */
export async function getPaymentHistory(
  accountNumber: string,
  password: string,
  dateFrom: Date,
  dateTo: Date,
  region?: string
): Promise<any> {
  const regionPath = getRegion(region);
  const baseUrl = `${get1cBaseUrl()}/${regionPath}/hs/WebAccounts/get_payment_history`;
  
  // Формируем даты в формате ДД.ММ.ГГГГ как на старом сайте
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  // Формируем URL как на старом сайте: WaLsCode и WaPass кодируются, даты передаются как есть
  const query =
    `WaLsCode=${encodeURIComponent(accountNumber.trim())}` +
    `&WaPass=${encodeURIComponent(password.trim())}` +
    `&WaDateFrom=${formatDate(dateFrom)}` +
    `&WaDateTo=${formatDate(dateTo)}`;
  
  const url = `${baseUrl}?${query}`;

  let response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30 секунд таймаут
    });
  } catch (error: any) {
    handleFetchError(error, url.toString());
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR: Неверный номер лицевого счета или пароль");
    }
    throw new Error(`1C API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Получить историю показаний счетчиков из 1С
 * GET /{region}/hs/WebAccounts/get_metering_device_history
 * 
 * На старом сайте использовался формат:
 * $url = 'http://46.172.223.34/'.$lk_region.'/hs/WebAccounts/get_metering_device_history?WaLsCode='.urlencode(trim($lk_login)).'&WaPass='.urlencode(trim($lk_passwd)).'&WaDateFrom='.$start_date.'&WaDateTo='.$end_date;
 */
export async function getMeteringDeviceHistory(
  accountNumber: string,
  password: string,
  region?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<any> {
  const regionPath = getRegion(region);
  const baseUrl = `${get1cBaseUrl()}/${regionPath}/hs/WebAccounts/get_metering_device_history`;
  
  // Формируем URL как на старом сайте: WaLsCode и WaPass кодируются, даты передаются как есть
  const query =
    `WaLsCode=${encodeURIComponent(accountNumber.trim())}` +
    `&WaPass=${encodeURIComponent(password.trim())}` +
    (dateFrom ? `&WaDateFrom=${dateFrom}` : '') +
    (dateTo ? `&WaDateTo=${dateTo}` : '');
  
  const url = `${baseUrl}?${query}`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: 'no-store',
      headers: {
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(30000), // 30 секунд таймаут
    });
  } catch (error: any) {
    handleFetchError(error, url);
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error("AUTH_ERROR: Неверный номер лицевого счета или пароль");
    }
    throw new Error(`1C API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}
