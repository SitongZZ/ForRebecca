type Card = {
  title: string;
  description: string;
  status: "Live" | "In Progress" | "Planned";
};

const tools: Card[] = [
  {
    title: "Coffee Bot",
    description:
      "Menu extraction + order parsing pipeline. Track coverage, mismatch rate, and rollout status.",
    status: "In Progress",
  },
  {
    title: "Voice Inbox",
    description:
      "Drop audio notes and auto-transcribe into actionable tasks for fast follow-up.",
    status: "In Progress",
  },
  {
    title: "Weekly Ops Review",
    description:
      "Single-page summary of experiments, wins, blockers, and next high-ROI moves.",
    status: "Planned",
  },
  {
    title: "Mission Log",
    description:
      "Chronological execution log so decisions and context don’t get lost.",
    status: "Live",
  },
];

const statusClass: Record<Card["status"], string> = {
  Live: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "In Progress": "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Planned: "bg-zinc-500/15 text-zinc-700 border-zinc-500/30",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900 md:p-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-wider text-zinc-500">Mission Control</p>
          <h1 className="mt-2 text-3xl font-bold">Freddie × Pablo Operating Console 🫡</h1>
          <p className="mt-2 max-w-3xl text-zinc-600">
            Custom workspace for building productivity tools, running experiments, and shipping high-ROI automation.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Top Priority</p>
            <p className="mt-2 text-xl font-semibold">Ship usable tools weekly</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Current Focus</p>
            <p className="mt-2 text-xl font-semibold">Coffee Bot hardening</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Target</p>
            <p className="mt-2 text-xl font-semibold">£10k/year AI side income</p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Tool Stack</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {tools.map((tool) => (
              <article key={tool.title} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{tool.title}</h3>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass[tool.status]}`}
                  >
                    {tool.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">{tool.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Quick Commands</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>• “继续 coffee bot 第2项”</li>
            <li>• “汇报一下当前进度”</li>
            <li>• “转发给main session：&lt;指令&gt;”</li>
            <li>• “停止推送 / 改成10分钟推送”</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
