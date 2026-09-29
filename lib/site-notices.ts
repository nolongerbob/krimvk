import { z } from 'zod';
// Admin inputs always represent Moscow wall time, regardless of browser timezone.
export function moscowInputToDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Некорректная дата');
  const date = new Date(`${value}:00+03:00`);
  if (!Number.isFinite(date.getTime()) || dateToMoscowInput(date) !== value) throw new Error('Некорректная дата');
  return date;
}
export function dateToMoscowInput(value: Date | string): string {
  return new Date(new Date(value).getTime() + 10800000).toISOString().slice(0, 16);
}
export const noticeSchema = z.object({
  id: z.string().min(1).optional(), text: z.string().trim().min(1).max(200),
  buttonLabel: z.string().trim().min(1).max(40), newsId: z.string().min(1),
  startsAt: z.string(), endsAt: z.string(), enabled: z.boolean(),
}).strict();
export function parseNotice(value: unknown) {
  const input = noticeSchema.parse(value);
  const startsAt = moscowInputToDate(input.startsAt), endsAt = moscowInputToDate(input.endsAt);
  if (endsAt <= startsAt) throw new Error('Окончание показа должно быть позже начала');
  return { ...input, startsAt, endsAt };
}
export function activeNoticeWhere(now: Date) {
  return { enabled: true, startsAt: { lte: now }, endsAt: { gt: now }, news: { published: true } };
}
