import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-bg text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3 font-bold">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-sm text-white shadow-sm">
            CB
          </span>
          <span className="text-lg tracking-tight">CUNY Buddies</span>
        </Link>
        <a
          href="/auth/sign-in"
          className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Sign in
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-8 sm:px-10 sm:pb-20 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:pb-24 lg:pt-12">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand-soft px-4 py-2 text-sm font-semibold text-brand-soft-fg">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Made for CUNY students
          </p>
          <h1 className="mt-7 text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Find your people between classes.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">
            Meet classmates who share your courses and free time. Make campus
            feel smaller, one connection at a time.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="/auth/sign-up"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              Get started
              <span aria-hidden="true" className="ml-2 text-lg">→</span>
            </a>
            <span className="text-sm text-muted">Free to join · Built around your schedule</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-soft blur-2xl" />
          <div className="absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-[#e6e1ff] blur-2xl" />
          <div className="relative rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_24px_80px_rgba(56,45,130,0.14)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-brand">A week with room to connect</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">Your schedule</h2>
              </div>
              <span className="rounded-full bg-[#f0edff] px-3 py-1.5 text-xs font-semibold text-brand-soft-fg">
                Sample week
              </span>
            </div>

            <div className="mt-7 grid grid-cols-[3.2rem_repeat(5,minmax(0,1fr))] gap-2 text-center text-[.65rem] font-semibold text-muted sm:gap-3 sm:text-xs">
              <span />
              {[
                ["M", "Mon"],
                ["T", "Tue"],
                ["W", "Wed"],
                ["T", "Thu"],
                ["F", "Fri"],
              ].map(([short, day]) => (
                <span key={day}>
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{day}</span>
                </span>
              ))}
            </div>

            <div className="mt-3 space-y-2.5">
              {[
                { time: "10 AM", cells: ["class", "free", "class", "free", "class"] },
                { time: "12 PM", cells: ["free", "class", "together", "class", "free"] },
                { time: "2 PM", cells: ["class", "free", "class", "class", "free"] },
              ].map((row) => (
                <div key={row.time} className="grid grid-cols-[3.2rem_repeat(5,minmax(0,1fr))] items-center gap-2 sm:gap-3">
                  <span className="text-[.65rem] font-medium text-muted sm:text-xs">{row.time}</span>
                  {row.cells.map((cell, index) => (
                    <div
                      key={`${row.time}-${index}`}
                      className={`flex h-11 items-center justify-center rounded-lg sm:h-12 ${
                        cell === "class"
                          ? "bg-[#e9e6fb]"
                          : cell === "together"
                            ? "border-2 border-brand bg-brand-soft text-[.6rem] font-bold text-brand-soft-fg sm:text-xs"
                            : "border border-dashed border-border bg-[#fcfbff]"
                      }`}
                    >
                      {cell === "together" ? "Free together" : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-2xl bg-bg p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#dcd6ff] text-sm font-bold text-brand-soft-fg">
                MR
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">A classmate with a matching break</p>
                <p className="mt-0.5 text-sm text-muted">A little time to study or grab coffee</p>
              </div>
              <span aria-hidden="true" className="text-xl text-brand">↗</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-border/80 px-6 py-6 text-sm text-muted sm:px-10 lg:justify-start lg:px-12">
        <span>Shared classes</span>
        <span>Overlapping free time</span>
        <span>More campus connections</span>
      </footer>
    </main>
  );
}
