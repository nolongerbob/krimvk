import { render, screen } from '@testing-library/react';
import { PaymentMetric } from '@/components/dashboard/QuickActionMetrics';

it.each([
  [100, 'text-red-600', 'К оплате по данным 1С'],
  [-100, 'text-emerald-600', 'Переплата по выбранному счёту'],
  [0, 'text-slate-900', 'Задолженности нет'],
] as const)('colors balance %s without changing its meaning', (balance, color, label) => {
  const { container } = render(<PaymentMetric data={{ balance, openingBalance: null, meters: [] }} loading={false} />);
  expect(container.querySelector('.text-3xl')).toHaveClass(color);
  expect(screen.getByText(label)).toBeInTheDocument();
});
