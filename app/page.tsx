export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-between gap-12">
        <div className="flex items-center justify-between border-b border-foreground/10 pb-5">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-foreground/55">
            Production app
          </p>
          <p className="rounded-full border border-foreground/15 px-3 py-1 text-sm text-foreground/65">
            /api/health
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal sm:text-6xl">
              Birth Chart Generator
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-foreground/65">
              The root app is ready for chart workflows, API routes, services,
              workers, database package code, production deployment contracts,
              and focused tests.
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.03] p-4">
            {[
              ["App", "Next.js App Router"],
              ["Runtime", "Production only"],
              ["Workspace", "packages/database"],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between gap-4 border-b border-foreground/10 py-3 last:border-b-0"
                key={label}
              >
                <span className="text-sm text-foreground/55">{label}</span>
                <span className="text-right font-mono text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            "app, components, hooks, lib, services",
            "workers for daemons, scripts for one-shot tasks",
            "production infrastructure, secrets contracts, docs, tests",
          ].map((item) => (
            <div
              className="rounded-lg border border-foreground/10 p-5 text-sm leading-6 text-foreground/70"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
