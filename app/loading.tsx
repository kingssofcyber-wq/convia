export default function Loading() {
  return (
    <main className="grid min-h-[55vh] place-items-center bg-background px-4 py-12" aria-live="polite" aria-busy="true">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" aria-hidden="true" />
        <h1 className="text-lg font-bold tracking-tight">Loading your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">Preparing this Convia page. Please wait a moment.</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-2/3 animate-pulse rounded-full bg-primary" /></div>
      </div>
    </main>
  );
}
