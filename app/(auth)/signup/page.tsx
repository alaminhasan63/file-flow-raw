"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText } from 'lucide-react'
import { getBrowserSupabase } from '@/lib/supabase/client'

export default function SignUpPage() {
  const supabase = getBrowserSupabase()
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErr(null)
    setNotice(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") || "")
    const password = String(form.get("password") || "")

    const { data, error } = await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setErr(error.message)
      return
    }

    if (data.user && data.session) {
      // Email confirmations are disabled, user is signed in immediately
      router.replace("/app")
    } else if (data.user && !data.session) {
      // Email confirmations are enabled, user needs to confirm
      setNotice("Check your email to confirm your account, then sign in.")
    }
  }

  if (notice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <FileText className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold">FileFlow</span>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle>Check your email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {notice}
                </p>
                <Link href="/sign-in">
                  <Button variant="outline" className="w-full">
                    Back to sign in
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <FileText className="h-8 w-8 text-primary mr-2" />
          <span className="text-2xl font-bold">FileFlow</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Enter your details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  required
                />
              </div>

              {err && (
                <p className="text-sm text-destructive">{err}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/sign-in" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}