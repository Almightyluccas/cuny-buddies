import SignInForm from "@/components/SignInForm";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const ROWS = ["10a", "12p", "2p"];

// Static decorative mini-schedule for the hero.
function MiniSchedule() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-6 gap-2 text-center text-xs font-semibold text-muted">
        <span />
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {ROWS.map((row, r) => (
        <div key={row} className="mt-2 grid grid-cols-6 items-center gap-2">
          <span className="text-xs font-semibold text-muted">{row}</span>
          {DAYS.map((d, c) => {
            const free = r === 1 && c === 1; // "3 free" highlight
            const empty = r === 1 && c !== 1;
            return (
              <div
                key={d}
                className={`flex h-7 items-center justify-center rounded-md text-xs font-semibold ${
                  free
                    ? "border-2 border-brand bg-surface text-foreground"
                    : empty
                      ? "border border-dashed border-border"
                      : "bg-brand-soft"
                }`}
              >
                {free ? "3 free" : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: hero */}
      <section className="flex flex-col justify-between bg-brand p-8 sm:p-12">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
            CB
          </span>
          <span className="text-lg font-bold">CUNY Buddies</span>
        </div>

        <div className="max-w-xl py-12">
          <h1 className="text-5xl font-bold leading-tight sm:text-6xl">
            Find classmates who are free when you are.
          </h1>
          <p className="mt-6 max-w-md text-lg text-foreground/80">
            Upload your CUNYfirst schedule. We show who shares your classes and
            your breaks, and suggest something to do together.
          </p>
        </div>

        <MiniSchedule />
      </section>

      {/* Right: sign in */}
      <section className="flex items-center justify-center bg-bg p-8 sm:p-12">
        <SignInForm />
      </section>
    </div>
  );
}
