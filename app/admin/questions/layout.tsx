"use client";

export default function QuestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер скрыт на этой странице */}
      <style jsx global>{`
        header {
          display: none !important;
        }
        footer {
          display: none !important;
        }
        main {
          padding-top: 0 !important;
        }
      `}</style>
      {children}
    </div>
  );
}
