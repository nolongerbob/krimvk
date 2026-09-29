/** Preparation only: no provider, token exchange, database writes or auth cookies. */
export function isEsiaPreviewEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV === 'development' && env.ESIA_DEV_PREVIEW === 'true';
}

export type EsiaPreviewStep = 'start' | 'consent' | 'link' | 'done' | 'cancelled';
export type EsiaPreviewAction = 'continue' | 'cancel' | 'restart';

export function nextEsiaPreviewStep(step: EsiaPreviewStep, action: EsiaPreviewAction): EsiaPreviewStep {
  if (action === 'restart') return 'start';
  if (action === 'cancel') return 'cancelled';
  if (step === 'start') return 'consent';
  if (step === 'consent') return 'link';
  return step;
}

export const ESIA_PREVIEW_COPY: Record<EsiaPreviewStep, { title: string; description: string; button?: string }> = {
  start: {
    title: 'Вход через Госуслуги',
    description: 'Дополнительный способ входа в КрымВК. Вход по почте и паролю останется доступен.',
    button: 'Посмотреть сценарий входа',
  },
  consent: {
    title: 'Подтверждение личности',
    description: 'После подключения здесь будет переход на официальный сайт Госуслуг. Пароль Госуслуг на сайте КрымВК вводить не потребуется. Сейчас это только макет — перехода и передачи данных нет.',
    button: 'Далее в макете',
  },
  link: {
    title: 'Такой пользователь уже существует',
    description: 'Это пример, без проверки базы. Войдите по почте и паролю и привяжите Госуслуги в настройках личного кабинета. Автоматического объединения аккаунтов нет.',
  },
  done: {
    title: 'Макет привязки завершён',
    description: 'В готовой интеграции Госуслуги станут ещё одним способом входа. Привязка лицевого счёта останется отдельной проверкой. Сейчас аккаунт и сессия не изменены.',
  },
  cancelled: {
    title: 'Вход отменён',
    description: 'Можно повторить попытку или войти обычным способом. Данные кабинета не изменены.',
  },
};
