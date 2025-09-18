import { ArrowRight, CheckCircle, Clock, FileText, Shield, Users, Zap, Star, Building, CreditCard, Mail, Phone } from "lucide-react";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
        <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

        <div className="container-wide relative">
          <div className="py-24 sm:py-32 lg:py-40">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 backdrop-blur-sm px-6 py-3 text-sm font-medium text-indigo-700 shadow-lg">
                <Zap className="h-4 w-4" />
                <span>Wyoming first</span>
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  More states soon
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="mb-8 text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
                Launch your{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  LLC
                </span>{" "}
                on autopilot
              </h1>

              {/* Subheadline */}
              <p className="mx-auto mb-12 max-w-2xl text-xl leading-8 text-gray-600">
                A guided intake, live status tracking, and all documents in one place.
                We automate filings so you can focus on building your business.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                <a
                  href="/app/start"
                  className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-1"
                >
                  Get started now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  View pricing
                </a>
              </div>

              {/* Social Proof */}
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Trusted by <span className="font-semibold text-gray-900">500+</span> entrepreneurs
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-gray-50">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to launch
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From formation to compliance, we handle the paperwork so you can focus on growth.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Automated Filing",
                description: "AI-powered document preparation and state submission with real-time tracking."
              },
              {
                icon: Shield,
                title: "Compliance Ready",
                description: "Built-in compliance tools and reminders to keep your business in good standing."
              },
              {
                icon: Clock,
                title: "Fast Processing",
                description: "Most filings processed within 24-48 hours with priority state handling."
              },
              {
                icon: Users,
                title: "Expert Support",
                description: "Direct access to business formation experts whenever you need help."
              },
              {
                icon: Building,
                title: "All-in-One Dashboard",
                description: "Manage documents, track status, and access services from one central hub."
              },
              {
                icon: CheckCircle,
                title: "Guaranteed Accuracy",
                description: "100% accuracy guarantee with free corrections if we make an error."
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 sm:py-32">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the package that fits your business needs. No hidden fees, ever.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 max-w-5xl mx-auto">
            {/* Basic Plan */}
            <div className="group relative rounded-3xl bg-white p-8 shadow-lg ring-1 ring-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
                <p className="mt-2 text-gray-600">Perfect for getting started quickly</p>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">$299</span>
                  <span className="text-lg text-gray-600 ml-2">one-time</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Articles of Organization filing",
                  "Digital document delivery",
                  "Email support",
                  "Status tracking dashboard",
                  "Basic compliance reminders"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/app/start"
                className="block w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-3 text-center font-semibold text-gray-700 transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                Choose Basic
              </a>
            </div>

            {/* Premium Plan */}
            <div className="group relative rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-xl ring-2 ring-blue-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                  Most Popular
                </span>
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-blue-900">Premium</h3>
                <p className="mt-2 text-blue-700">Complete business formation package</p>
                <div className="mt-6">
                  <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">$499</span>
                  <span className="text-lg text-blue-600 ml-2">one-time</span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                    Save $200+ vs individual services
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Everything in Basic",
                  { text: "EIN application", savings: "Save $79" },
                  { text: "Operating Agreement template", savings: "Save $50" },
                  { text: "Priority support", badge: "Exclusive" },
                  "Advanced compliance tools",
                  "Phone support included"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      {typeof feature === 'string' ? (
                        <span className="text-blue-900">{feature}</span>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-blue-900 font-medium">{feature.text}</span>
                          {feature.savings && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                              {feature.savings}
                            </span>
                          )}
                          {feature.badge && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                              {feature.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <a
                href="/app/start"
                className="group block w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-center font-bold text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5"
              >
                Choose Premium
                <ArrowRight className="ml-2 inline h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* Additional Services */}
          <div className="mt-16 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-8">Additional Services</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-3xl mx-auto">
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <Building className="mx-auto h-8 w-8 text-gray-600 mb-3" />
                <h4 className="font-semibold text-gray-900">Registered Agent</h4>
                <p className="text-sm text-gray-600 mt-1">$99/year</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-6 text-center">
                <Mail className="mx-auto h-8 w-8 text-gray-600 mb-3" />
                <h4 className="font-semibold text-gray-900">Mail Forwarding</h4>
                <p className="text-sm text-gray-600 mt-1">$199/year</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-24 sm:py-32">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to launch your LLC?
          </h2>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Join hundreds of entrepreneurs who&apos;ve simplified their business formation with FileFlow.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/app/start"
              className="group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:bg-gray-50 hover:shadow-xl hover:-translate-y-1"
            >
              Start your filing
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/20"
            >
              Learn more
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}