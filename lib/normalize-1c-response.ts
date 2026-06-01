/**
 * 1С иногда отдаёт объект, иногда массив из одного объекта, иногда { "Error": "..." }.
 */

export function normalize1CResponse(body: unknown): Record<string, unknown> {
  if (body == null) {
    throw new Error('1C_EMPTY: Пустой ответ от 1С');
  }

  if (Array.isArray(body)) {
    if (body.length === 0) {
      throw new Error('1C_EMPTY: Пустой массив в ответе 1С');
    }
    return normalize1CResponse(body[0]);
  }

  if (typeof body !== 'object') {
    throw new Error('1C_PARSE: Неожиданный формат ответа 1С');
  }

  const obj = body as Record<string, unknown>;

  const errMsg = obj.Error ?? obj.error;
  if (typeof errMsg === 'string' && errMsg.trim()) {
    const msg = errMsg.trim();
    if (/incoming data|входящ|неверн|password|pass|л\/с|лс/i.test(msg)) {
      throw new Error(`AUTH_ERROR: ${msg}`);
    }
    throw new Error(`1C_BUSINESS_ERROR: ${msg}`);
  }

  return obj;
}

/** Есть ли в ответе полезные поля лицевого счёта (не только Error). */
export function is1CAccountPayload(body: unknown): boolean {
  try {
    const o = normalize1CResponse(body);
    return (
      'CommonDuty' in o ||
      'commonDuty' in o ||
      'MeteringDevices' in o ||
      'ChargesAndPayments' in o ||
      'Address' in o
    );
  } catch {
    return false;
  }
}
