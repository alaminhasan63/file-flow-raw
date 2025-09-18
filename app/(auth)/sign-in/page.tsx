'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, ArrowRight, Shield, Zap, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ensureUserProfile } from '@/lib/supabase/profile-utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema, type SignInForm } from '@/lib/schemas'
import { toast } from 'sonner'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema)
  })

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true)

    try {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (authData.user) {
        // Ensure user profile exists
        const profileErr = await ensureUserProfile(supabase, authData.user);
        if (profileErr) {
          toast.error(`Profile creation failed: ${profileErr}`);
          return;
        }

        // Check user role to determine redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        const redirectPath = profile?.role === 'admin' || profile?.role === 'ops'
          ? '/admin/dashboard'
          : '/app/dashboard'

        toast.success('Signed in successfully!')
        // Force a full page refresh to update server-side authentication state
        window.location.href = redirectPath
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />

      {/* Content */}
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding & Features */}
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
                Welcome back to your
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> business hub</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                Continue managing your LLC formation and business documents with our automated platform.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Bank-level security for your business data" },
                { icon: Zap, text: "Instant access to your filing status" },
                { icon: FileText, text: "All documents organized in one place" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <feature.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
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
                  Welcome back
                </CardTitle>
                <CardDescription className="text-center text-gray-600">
                  Sign in to continue to your dashboard
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                        {...register('password')}
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
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </Label>
                    </div>

                    <Link
                      href="/reset-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="group w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Sign in
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
                    <span className="bg-white px-2 text-gray-500">New to FileFlow?</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link
                      href="/sign-up"
                      className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      Create account
                    </Link>
                  </span>
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
  )
}