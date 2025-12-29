/**
 * Утилиты для работы с 1С HTTP-сервисом WebAccounts
 * Базовый URL: http://46.172.223.34
 */

const BASE_URL = "http://46.172.223.34";

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
 * Получить регион для API (обязательный параметр)
 */
export function getRegion(region?: string | null): string {
  if (!region) {
    throw new Error("Регион обязателен для работы с 1С API");
  }
  return region;
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
  const url = new URL(`${BASE_URL}/${regionPath}/hs/WebAccounts/get_data`);
  
  url.searchParams.append("WaLsCode", accountNumber);
  url.searchParams.append("WaPass", password);
  
  if (dateFrom) {
    url.searchParams.append("WaDateFrom", formatDateFor1C(dateFrom));
  }
  if (dateTo) {
    url.searchParams.append("WaDateTo", formatDateFor1C(dateTo));
  }

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
  const url = new URL(`${BASE_URL}/${regionPath}/hs/WebAccounts/set_metering_device_indication`);
  
  url.searchParams.append("WaLsCode", accountNumber);
  url.searchParams.append("WaPass", password);
  url.searchParams.append("WaNumberOfDevice", deviceNumber);
  url.searchParams.append("WaReading", reading.toString());

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
 * Получить историю платежей из 1С
 * GET /prog/hs/WebAccounts/get_payment_history
 */
export async function getPaymentHistory(
  accountNumber: string,
  password: string,
  dateFrom: Date,
  dateTo: Date,
  region?: string
): Promise<any> {
  const regionPath = getRegion(region);
  const url = new URL(`${BASE_URL}/${regionPath}/hs/WebAccounts/get_payment_history`);
  
  url.searchParams.append("WaLsCode", accountNumber);
  url.searchParams.append("WaPass", password);
  url.searchParams.append("WaDateFrom", formatDateFor1C(dateFrom));
  url.searchParams.append("WaDateTo", formatDateFor1C(dateTo));

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
 */
export async function getMeteringDeviceHistory(
  accountNumber: string,
  password: string,
  region?: string
): Promise<any> {
  const regionPath = getRegion(region);
  const url = new URL(`${BASE_URL}/${regionPath}/hs/WebAccounts/get_metering_device_history`);
  
  url.searchParams.append("WaLsCode", accountNumber);
  url.searchParams.append("WaPass", password);

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


