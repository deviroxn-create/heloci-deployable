export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6 text-center">
      <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
      <span className="relative inline-flex bg-white px-4 text-sm text-slate-500">{label}</span>
    </div>
  );
}
