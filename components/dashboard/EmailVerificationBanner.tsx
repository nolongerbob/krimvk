'use client';

import { Button } from '@/components/ui/button';
import { DashboardCard, DashboardCardBody } from '@/components/dashboard/DashboardCard';
import { Input } from '@/components/ui/input';
import { Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardButtonClass } from '@/components/dashboard/dashboard-styles';

type Props = {
  userEmail: string;
  emailMessage: string;
  resendingEmail: boolean;
  changingEmail: boolean;
  newEmail: string;
  onNewEmailChange: (value: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
};

export function EmailVerificationBanner({
  userEmail,
  emailMessage,
  resendingEmail,
  changingEmail,
  newEmail,
  onNewEmailChange,
  onResend,
  onChangeEmail,
}: Props) {
  return (
    <DashboardCard className="mb-5 border-amber-200/90 bg-amber-50/60">
      <DashboardCardBody className="space-y-3 p-4 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center">
            <Mail
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 sm:mt-0"
              strokeWidth={1.75}
            />
            <p className="min-w-0 text-sm leading-snug text-amber-950">
              <span className="font-semibold">Подтвердите email</span>
              <span className="text-amber-800/90">
                {' '}
                — для полного доступа к кабинету:{' '}
                <span className="font-medium text-amber-950">{userEmail}</span>
              </span>
            </p>
          </div>
          <Button
            onClick={onResend}
            disabled={resendingEmail}
            size="sm"
            className={cn(
              dashboardButtonClass,
              'h-9 shrink-0 bg-blue-600 px-3 text-xs hover:bg-blue-700 sm:ml-4'
            )}
          >
            {resendingEmail ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Отправка…
              </>
            ) : (
              'Отправить письмо'
            )}
          </Button>
        </div>

        {emailMessage ? (
          <p
            className={cn(
              'rounded-none border px-3 py-2 text-xs leading-snug',
              emailMessage.includes('отправлено') || emailMessage.includes('изменен')
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            )}
          >
            {emailMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-amber-200/60 pt-3 sm:flex-row sm:items-center">
          <p className="shrink-0 text-xs text-amber-800/85 sm:max-w-[14rem]">
            Не пришло письмо? Проверьте «Спам» или укажите другой адрес.
          </p>
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <Input
              type="email"
              placeholder="Новый email"
              value={newEmail}
              onChange={(e) => onNewEmailChange(e.target.value)}
              className="h-9 flex-1 rounded-none text-sm sm:max-w-xs"
              disabled={changingEmail}
            />
            <Button
              onClick={onChangeEmail}
              disabled={changingEmail || !newEmail.trim()}
              variant="outline"
              size="sm"
              className={cn(dashboardButtonClass, 'h-9 shrink-0 px-3 text-xs')}
            >
              {changingEmail ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Сохранение…
                </>
              ) : (
                'Изменить'
              )}
            </Button>
          </div>
        </div>
      </DashboardCardBody>
    </DashboardCard>
  );
}
