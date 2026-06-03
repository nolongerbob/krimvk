import { Badge } from '@/components/ui/badge';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status;
  return <Badge variant="outline">{label}</Badge>;
}
