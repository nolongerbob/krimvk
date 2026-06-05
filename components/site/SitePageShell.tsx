import { cn } from "@/lib/utils";
import { siteContainerClass, sitePageClass } from "@/components/site/site-styles";

type SitePageShellProps = {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  maxWidth?: string;
};

export function SitePageShell({
  children,
  className,
  containerClassName,
  maxWidth = "max-w-4xl",
}: SitePageShellProps) {
  return (
    <div
      className={cn(
        sitePageClass,
        "[&_button]:!rounded-none [&_input]:!rounded-none [&_select]:!rounded-none [&_textarea]:!rounded-none",
        className
      )}
    >
      <div className={cn(siteContainerClass, maxWidth, containerClassName)}>
        {children}
      </div>
    </div>
  );
}
