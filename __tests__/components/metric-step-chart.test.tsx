import { fireEvent, render, screen } from '@testing-library/react';
import { MetricStepChart } from '@/components/dashboard/MetricStepChart';

it('shows six interactive bars with hover, keyboard and touch tooltips', () => {
  render(<MetricStepChart points={Array.from({ length: 6 }, (_, i) => ({ month: `2026-0${i + 1}`, value: i * 10 }))} label="Баланс" unit="₽" />);
  const bars = screen.getAllByRole('button');
  expect(bars).toHaveLength(6);
  fireEvent.mouseEnter(bars[1]);
  expect(screen.getByRole('tooltip')).toHaveTextContent('10 ₽');
  fireEvent.keyDown(bars[1], { key: 'Escape' });
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  fireEvent.focus(bars[2]);
  expect(screen.getByRole('tooltip')).toHaveTextContent('20 ₽');
  fireEvent.click(bars[3]);
  expect(screen.getByRole('tooltip')).toHaveTextContent('30 ₽');
});
