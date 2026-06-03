'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail } from 'lucide-react';

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
    <Card className="mb-6 border-2 border-amber-200 bg-amber-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
            <Mail className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-2">
              Подтвердите ваш email адрес
            </h3>
            <p className="text-sm text-amber-800 mb-4">
              Для полного доступа к функциям личного кабинета необходимо подтвердить
              ваш email адрес: <strong>{userEmail}</strong>
            </p>

            {emailMessage && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  emailMessage.includes('отправлено') || emailMessage.includes('изменен')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {emailMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onResend}
                disabled={resendingEmail}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {resendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Отправить письмо повторно
                  </>
                )}
              </Button>

              <div className="flex-1 flex gap-2">
                <Input
                  type="email"
                  placeholder="Новый email адрес"
                  value={newEmail}
                  onChange={(e) => onNewEmailChange(e.target.value)}
                  className="flex-1"
                  disabled={changingEmail}
                />
                <Button
                  onClick={onChangeEmail}
                  disabled={changingEmail || !newEmail.trim()}
                  variant="outline"
                >
                  {changingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Изменение...
                    </>
                  ) : (
                    'Изменить email'
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-amber-700 mt-3">
              Не получили письмо? Проверьте папку «Спам» или измените email, если он
              указан неверно.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
