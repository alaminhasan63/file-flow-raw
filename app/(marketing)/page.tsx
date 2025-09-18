export default function MarketingPage() {
  return (
    <div className="container-wide bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-3xl"></div>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-2 text-sm text-muted-foreground">
            <span>Wyoming first</span>
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1 text-xs font-medium text-white shadow-lg">
              More states soon
            </span>
          </div>
          <h1 className="mt-6 text-6xl font-bold leading-tight tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Launch your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">LLC</span> on autopilot.
          </h1>
          <p className="mt-6 text-xl text-muted-foreground leading-relaxed">
            A guided intake, live status, and all documents in one place. We automate filings so you can focus on the business.
          </p>
          <div className="mt-8 flex gap-4">
            <a href="/app/start" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Get started
            </a>
            <a href="/pricing" className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
              See pricing
            </a>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-2xl font-semibold">Basic</h3>
              <p className="text-muted-foreground">Formation filing + digital documents.</p>
            </div>
            <div className="card-body">
              <div className="text-4xl font-bold text-gray-900">$299</div>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Articles of Organization filing
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Digital document delivery
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  Email support
                </li>
              </ul>
              <a href="/app/start" className="mt-8 inline-flex w-full items-center justify-center rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                Choose Basic
              </a>
            </div>
          </div>
          <div className="card premium-glow border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-blue-900">Premium</h3>
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg animate-pulse">
                  Popular
                </span>
              </div>
              <p className="text-blue-700">Formation + EIN + Operating Agreement template.</p>
            </div>
            <div className="card-body">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">$499</div>
              <div className="text-sm text-green-600 font-semibold">Save $200+ vs individual services</div>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  Everything in Basic
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span><strong>EIN application</strong> <span className="text-green-600 font-semibold">(Save $79)</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span><strong>Operating Agreement template</strong> <span className="text-green-600 font-semibold">(Save $50)</span></span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span><strong>Priority support</strong> <span className="text-blue-600 font-semibold">(Exclusive)</span></span>
                </li>
              </ul>
              <a href="/app/start" className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Choose Premium
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}