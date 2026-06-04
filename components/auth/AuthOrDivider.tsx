export function AuthOrDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-gray-200" aria-hidden />
      <span className="text-xs uppercase tracking-wide text-gray-400">или</span>
      <span className="h-px flex-1 bg-gray-200" aria-hidden />
    </div>
  );
}
