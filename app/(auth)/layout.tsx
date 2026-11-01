export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden sidebar flex-col justify-between p-12">
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #14a085, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #c9a15a, transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Personal Finance
              </span>
              <span className="ml-2 text-[0.65rem] font-extrabold bg-gradient-to-br from-gold-light to-gold-dark text-[#2a1f0c] px-2 py-0.5 rounded-md align-middle">
                Pro
              </span>
            </div>
          </div>
          <p className="text-white/50 text-xs mt-3 uppercase tracking-widest">
            Income • Expenses • Accounts • Lending
          </p>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Every rupee,
            <br />
            <span className="text-gradient-gold">accounted for.</span>
          </h2>
          <ul className="space-y-4">
            {[
              ["📊", "A live dashboard of income, expenses and net worth", ""],
              ["🏦", "Accounts that stay in sync automatically", "gold"],
              ["🤝", "Track money lent to friends and family", ""],
              ["🔒", "Your data, encrypted and yours alone", "gold"],
            ].map(([icon, text, variant]) => (
              <li key={text} className="flex items-center gap-3 text-white/80 text-sm">
                <span className={`icon-chip ${variant}`}>{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-white/35 text-xs">
          © {new Date().getFullYear()} Personal Finance Manager Pro
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center app-bg px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-extrabold text-text-primary mt-2">
              Personal Finance <span className="text-gold-dark">Pro</span>
            </h1>
          </div>
          <div className="card border-primary/20! shadow-xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
