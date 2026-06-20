export function AuthCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7">
          <p className="mb-2 text-sm font-semibold text-accent">AI PPT Analyzer</p>
          <h1 className="text-2xl font-semibold tracking-normal text-ink">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
        {children}
      </section>
    </main>
  );
}
