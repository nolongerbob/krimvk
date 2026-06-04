import { cn } from "@/lib/utils";
import { dashboardCardClass } from "@/components/dashboard/dashboard-styles";

type DashboardCardProps = React.HTMLAttributes<HTMLDivElement>;

export function DashboardCard({ className, children, ...props }: DashboardCardProps) {
  return (
    <div className={cn(dashboardCardClass, className)} {...props}>
      {children}
    </div>
  );
}

export function DashboardCardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}
