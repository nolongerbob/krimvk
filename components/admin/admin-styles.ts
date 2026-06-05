import { cn } from "@/lib/utils";
import {
  dashboardButtonClass,
  dashboardPageClass,
} from "@/components/dashboard/dashboard-styles";

export { dashboardPageClass };

export const adminContainerClass = "container max-w-7xl px-4 py-8";

export const adminFieldClass =
  "h-10 rounded-none border-slate-200 bg-white focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

export const adminPrimaryBtnClass = cn(
  dashboardButtonClass,
  "h-9 bg-blue-600 text-white hover:bg-blue-700"
);

export const adminOutlineBtnClass = cn(
  dashboardButtonClass,
  "h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
);

export const adminSectionLabelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-slate-500";
