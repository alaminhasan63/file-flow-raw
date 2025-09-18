"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ArrowRight, CheckCircle, Mail, Eye, EyeOff, Users, Clock, Shield } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase/client'
import { ensureUserProfile } from '@/lib/supabase/profile-utils'

export default function SignUpPage() {
  const supabase = getBrowserSupabase()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [pwd, setPwd] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const checkPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    setPasswordStrength(strength)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);

    const { data, error } = await supabase.auth.signUp({ email, password: pwd });
    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    if (data.user && data.session) {
      // Email confirmations are disabled, user is signed in immediately
      // Ensure user profile exists
      const profileErr = await ensureUserProfile(supabase, data.user);
      if (profileErr) {
        setMsg(`Profile creation failed: ${profileErr}`);
        return;
      }
      router.replace("/app/dashboard");
    } else if (data.user && !data.session) {
      // Email confirmations are enabled, user needs to confirm
      // Create profile immediately for confirmed users
      if (data.user.email_confirmed_at) {
        const profileErr = await ensureUserProfile(supabase, data.user);
        if (profileErr) {
          console.error('Profile creation failed:', profileErr);
        }
      }
      setMsg("Signup successful. Check your email to confirm, then sign in.");
      setTimeout(() => router.push("/sign-in"), 800);
    }
  }

  // Success state
  if (msg && !msg.toLowerCase().includes("error")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />

        <div className="relative flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                FileFlow
              </span>
            </div>

            <Card className="border-0 shadow-2xl shadow-blue-500/10 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Check your email
                </CardTitle>
                <CardDescription className="text-gray-600">
                  We&apos;ve sent a confirmation link to your email address
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-sm text-green-800">
                    {msg}
                  </p>
                </div>
                <Link href="/sign-in">
                  <Button variant="outline" className="w-full h-11 border-gray-300 hover:bg-gray-50">
                    Back to sign in
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

      {/* Content */}
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding & Benefits */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12">
          <div className="mx-auto max-w-xl">
            {/* Logo */}
            <div className="flex items-center mb-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                FileFlow
              </span>
            </div>

            {/* Headline */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Start your
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> LLC journey</span> today
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Join thousands of entrepreneurs who trust FileFlow to handle their business formation and compliance needs.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: Users, text: "Join 500+ successful business owners" },
                { icon: Clock, text: "Get started in less than 10 minutes" },
                { icon: Shield, text: "Your data is protected and secure" }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <benefit.icon className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-12 rounded-2xl bg-white/60 backdrop-blur-sm p-6 border border-white/20">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="h-4 w-4 fill-green-500 text-green-500" />
                ))}
              </div>
              <p className="text-gray-700 text-sm italic mb-3">
                &ldquo;FileFlow made starting my LLC incredibly simple. Everything was handled professionally and quickly.&rdquo;
              </p>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">Sarah Chen</span> · Tech Startup Founder
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile Logo */}
            <div className="flex items-center justify-center mb-8 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                FileFlow
              </span>
            </div>

            <Card className="border-0 shadow-2xl shadow-blue-500/10 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-8">
                <CardTitle className="text-2xl font-bold text-center text-gray-900">
                  Create your account
                </CardTitle>
                <CardDescription className="text-center text-gray-600">
                  Start your LLC formation journey in minutes
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        value={pwd}
                        onChange={(e) => {
                          setPwd(e.target.value)
                          checkPasswordStrength(e.target.value)
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {pwd.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength
                                ? passwordStrength <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength === 3
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                : 'bg-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">
                          Password strength: {
                            passwordStrength <= 2 ? 'Weak' :
                              passwordStrength === 3 ? 'Good' : 'Strong'
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Terms and Privacy */}
                  <div className="flex items-start gap-3">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  {msg && msg.toLowerCase().includes("error") && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-800">{msg}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="group w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {busy ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Creating account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Create account
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link
                    href="/sign-in"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Sign in instead
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Protected by industry-standard encryption
              </p>
              <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>SSL Secured</span>
                <span>•</span>
                <span>GDPR Compliant</span>
                <span>•</span>
                <span>SOC 2 Type II</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}