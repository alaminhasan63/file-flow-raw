"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, FileText, CreditCard, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = getBrowserSupabase();

  const [user, setUser] = useState<any>(null);
  const [filings, setFilings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Check authentication
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.replace("/sign-in?next=/app/dashboard");
          return;
        }
        setUser(currentUser);

        // Fetch user's filings with business details
        const { data: filingsData } = await supabase
          .from("filings")
          .select(`
            id, 
            stage, 
            state_code, 
            filing_type, 
            quoted_total_cents, 
            paid_total_cents,
            created_at,
            businesses (
              legal_name,
              formation_state,
              entity_type
            )
          `)
          .order("created_at", { ascending: false })
          .limit(5);

        // Fetch recent payments - try to get all payments first to debug
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("id, filing_id, status, amount_cents, created_at, provider")
          .order("created_at", { ascending: false })
          .limit(10);

        if (paymentsError) {
          console.error("Payments fetch error:", paymentsError);
        } else {
          console.log("All payments found:", paymentsData);
          const succeededPayments = (paymentsData || []).filter(p => p.status === 'succeeded');
          console.log("Succeeded payments:", succeededPayments);
        }

        // Fetch recent messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select("id, filing_id, body, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        setFilings(filingsData ?? []);
        setPayments(paymentsData ?? []);
        setMessages(messagesData ?? []);

        // Debug logging
        console.log("Dashboard loaded:");
        console.log("- Filings:", filingsData?.length || 0);
        console.log("- Payments:", paymentsData?.length || 0);
        console.log("- Messages:", messagesData?.length || 0);
        if (paymentsData && paymentsData.length > 0) {
          console.log("- Payment amounts:", paymentsData.map(p => p.amount_cents));
          const total = paymentsData
            .filter(p => p.status === 'succeeded')
            .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
          console.log("- Total paid cents:", total);
        }
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  // Calculate stats
  const totalPaid = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const activeFilings = filings.filter(f => !['approved', 'rejected', 'failed'].includes(f.stage));
  const completedFilings = filings.filter(f => f.stage === 'approved');

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'intake': 'Application Submitted',
      'ready': 'Payment Processed',
      'queued': 'Queued for Processing',
      'submitting': 'Submitting to State',
      'submitted': 'Submitted to State',
      'approved': 'Approved by State',
      'rejected': 'Rejected by State',
      'needs_info': 'Needs Additional Info',
      'failed': 'Processing Failed'
    };
    return labels[stage] || stage;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-muted-foreground">
            Track your LLC filings and manage your business formation.
          </p>
        </div>
        <Link href="/app/start">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Start New Filing
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>
              Total Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Active Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFilings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedFilings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPaid / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Filings */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Filings
              </div>
            </CardTitle>
            <CardDescription>
              Your latest LLC formation requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filings.length > 0 ? (
              <div className="space-y-3">
                {filings.slice(0, 3).map((filing) => (
                  <div key={filing.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getStageIcon(filing.stage)}
                      <div>
                        <div className="font-medium">
                          {(filing.businesses as any)?.legal_name || 'Unnamed LLC'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getStageLabel(filing.stage)} • {filing.state_code}
                        </div>
                      </div>
                    </div>
                    <Link href={`/app/filings/${filing.id}`}>
                      <Button variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
                <div className="pt-2">
                  <Link href="/app/filings">
                    <Button variant="ghost" className="w-full">
                      View All Filings
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No filings yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first LLC formation to see it here.
                </p>
                <Link href="/app/start">
                  <Button>
                    Start Your First Filing
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Recent Activity
              </div>
            </CardTitle>
            <CardDescription>
              Payments and important updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Payments */}
              {payments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3">Recent Payments</h4>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-2 rounded border">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">
                            Payment #{payment.id.slice(0, 8)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          ${(payment.amount_cents / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Messages */}
              {messages.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3">Recent Messages</h4>
                  <div className="space-y-2">
                    {messages.slice(0, 3).map((message) => (
                      <div key={message.id} className="p-2 rounded border">
                        <p className="text-sm">{message.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {payments.length === 0 && messages.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No recent activity. Your payments and updates will appear here.
                  </p>
                </div>
              )}

              <Link href="/app/billing">
                <Button variant="ghost" className="w-full">
                  View All Activity
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and helpful resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/app/start">
              <Button variant="ghost" className="h-auto p-4 flex-col">
                <Plus className="w-6 h-6 mb-2" />
                <span>Start New Filing</span>
              </Button>
            </Link>

            <Link href="/app/filings">
              <Button variant="ghost" className="h-auto p-4 flex-col">
                <FileText className="w-6 h-6 mb-2" />
                <span>View All Filings</span>
              </Button>
            </Link>

            <Link href="/app/billing">
              <Button variant="ghost" className="h-auto p-4 flex-col">
                <CreditCard className="w-6 h-6 mb-2" />
                <span>Billing History</span>
              </Button>
            </Link>

            <Link href="/app/support">
              <Button variant="ghost" className="h-auto p-4 flex-col">
                <AlertCircle className="w-6 h-6 mb-2" />
                <span>Get Support</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}