import { cn } from "@/lib/utils";
import {
  dashboardButtonClass,
  dashboardPageClass,
} from "@/components/dashboard/dashboard-styles";

export { dashboardPageClass as sitePageClass };

export const siteContainerClass = "container max-w-4xl px-4 py-8";

export const siteFieldClass =
  "h-10 rounded-none border-slate-200 bg-white focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

export const siteTextareaClass =
  "rounded-none border-slate-200 bg-white focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500";

export const sitePrimaryBtnClass = cn(
  dashboardButtonClass,
  "h-9 bg-blue-600 text-white hover:bg-blue-700"
);

export const siteOutlineBtnClass = cn(
  dashboardButtonClass,
  "h-9 border-slate-200 text-slate-700 hover:bg-slate-50"
);

export const siteSectionLabelClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-slate-500";
