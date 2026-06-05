import { Calendar, Download, FileText } from "lucide-react";
import { publicFileHref } from "@/lib/public-file-url";
import { formatFileSizeRu, getFileTypeLabel } from "@/lib/format-file";
import { cn } from "@/lib/utils";

export interface DisclosureDocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DisclosureDocumentCard({
  doc,
  className,
}: {
  doc: DisclosureDocumentItem;
  className?: string;
}) {
  const fileLabel = getFileTypeLabel(doc.fileName, doc.mimeType);
  const sizeLabel = formatFileSizeRu(doc.fileSize);

  return (
    <a
      href={publicFileHref(doc.fileUrl)}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={cn(
        "group relative block rounded-none border border-slate-200 bg-white p-5 transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md",
        className
      )}
    >
      <Download
        className="absolute right-4 top-4 h-5 w-5 text-slate-400 transition-colors group-hover:text-blue-600"
        aria-hidden
      />
      <div className="flex items-start gap-4 pr-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none bg-blue-100">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug text-slate-900">{doc.title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {fileLabel}, {sizeLabel}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(doc.createdAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
