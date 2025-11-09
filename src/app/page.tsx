export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
        <p className="text-sm tracking-[0.5em] text-slate-400 uppercase">Schultz Hockey League</p>
        <h1 className="text-4xl font-semibold text-white">Project Scaffold Ready</h1>
        <p className="text-lg text-slate-300">
          All requested tooling, dependencies, and configuration layers (Next.js, HeroUI, Tailwind,
          Effect, GraphQL, Prisma, PostgreSQL, ESLint, Prettier, Jest, Husky) are installed. Start
          building your custom UI and API modules inside <code className="font-mono">src/</code>{" "}
          whenever you are ready.
        </p>
      </div>
    </main>
  );
}
