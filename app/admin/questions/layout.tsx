"use client";

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-admin-questions className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
      {/* Хедер скрыт на этой странице */}
      <style jsx global>{`
        body:has([data-admin-questions]) .site-shell > header {
          display: none !important;
        }
        body:has([data-admin-questions]) .site-shell > footer {
          display: none !important;
        }
        body:has([data-admin-questions]) .site-shell {
          height: 100dvh;
          min-height: 0;
          overflow: hidden;
        }
        body:has([data-admin-questions]) .site-shell > main {
          padding-top: 0 !important;
          min-height: 0;
          overflow: hidden;
        }
        body:has([data-admin-questions]) .site-shell > main > div {
          height: 100%;
          min-height: 0;
          overflow: hidden;
        }
      `}</style>
      {children}
    </div>
  );
}
