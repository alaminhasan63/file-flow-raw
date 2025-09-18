"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, XCircle, FileText, CreditCard, Building } from "lucide-react";

const FILING_STAGES = [
  { key: 'intake', label: 'Application Submitted', icon: FileText },
  { key: 'ready', label: 'Payment Processed', icon: CreditCard },
  { key: 'queued', label: 'Queued for Processing', icon: Clock },
  { key: 'submitting', label: 'Submitting to State', icon: Building },
  { key: 'submitted', label: 'Submitted to State', icon: CheckCircle },
  { key: 'approved', label: 'Approved by State', icon: CheckCircle },
];

const ERROR_STAGES = ['rejected', 'needs_info', 'failed'];

function CustomerFilingStatusContent({ params }: { params: Promise<{ filingId: string }> }) {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const resolvedParams = use(params);
  const filingId = resolvedParams.filingId;
  const [mounted, setMounted] = useState(false);

  const [filing, setFiling] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  async function load(isRefresh = false) {
    // Only show loading on initial load, not on refresh
    if (!isRefresh && !initialLoadComplete) {
      setLoading(true);
    }

    try {
      const { data: f } = await supabase.from("filings").select("*").eq("id", filingId).maybeSingle();

      // If filing not found, check if this is a mock filing from payment success
      if (!f && !initialLoadComplete && mounted) {
        const urlParams = new URLSearchParams(window.location.search);
        const isPaymentSuccess = urlParams.get('payment') === 'success';

        if (isPaymentSuccess) {
          console.log('Creating mock filing data for', filingId);
          // Create mock filing data for display
          const mockFiling = {
            id: filingId,
            stage: 'queued',
            state_code: 'WY',
            filing_type: 'LLC_FORMATION',
            quoted_total_cents: 29900,
            paid_total_cents: 29900,
            created_at: new Date().toISOString(),
            business_id: `mock-business-${filingId}`,
            external_ref: { test: true, mock: true },
            ein_service: false,
            mail_forwarding: false,
            registered_agent_address: '123 Main St, Cheyenne, WY 82001',
            use_fileflow_registered_agent: true,
            ein_status: 'pending',
            ein_payload: {},
            mail_forwarding_status: 'pending',
            mail_forwarding_payload: {}
          };
          setFiling(mockFiling);
          setInitialLoadComplete(true);
          setLoading(false);
          console.log('Mock filing created successfully');
          return;
        }
      }

      setFiling(f || null);

      // Only load related data if we have a real filing
      if (f) {
        const { data: r } = await supabase.from("filing_runs").select("*").eq("filing_id", filingId).order("created_at", { ascending: false });
        setRuns(r ?? []);
        const { data: m } = await supabase.from("messages").select("*").eq("filing_id", filingId).order("created_at", { ascending: false });
        setMsgs(m ?? []);
        const { data: d } = await supabase.from("documents").select("*").eq("filing_id", filingId).order("created_at", { ascending: false });
        setDocs(d ?? []);
      } else {
        // Clear related data for non-existent filings
        setRuns([]);
        setMsgs([]);
        setDocs([]);
      }

    } catch (error) {
      console.error('Error loading filing:', error);
      setFiling(null);
    }

    if (!initialLoadComplete) {
      setInitialLoadComplete(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      load(false); // Initial load
      // Reduce refresh frequency to prevent constant loading
      const t = setInterval(() => load(true), 10000); // Refresh every 10 seconds instead of 4
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filingId, mounted]);

  // Show loading only on initial load
  if (loading && !initialLoadComplete) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  // If no filing found after initial load, show not found message
  if (!filing && initialLoadComplete) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-sm text-red-500">Filing not found.</div>
        <div className="space-x-2">
          <Button onClick={() => router.push("/app/start")} size="sm">
            Start New Filing
          </Button>
          <Button onClick={() => router.push("/app/dashboard")} variant="outline" size="sm">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If still loading initial request, show loading
  if (!filing) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }

  const getStageStatus = (stageKey: string) => {
    const currentStageIndex = FILING_STAGES.findIndex(s => s.key === filing.stage);
    const stageIndex = FILING_STAGES.findIndex(s => s.key === stageKey);

    if (ERROR_STAGES.includes(filing.stage)) {
      return stageIndex <= currentStageIndex ? 'completed' : 'pending';
    }

    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-800">Filing Submitted Successfully!</h2>
            <p className="text-green-700">Your LLC formation is now being processed. We&apos;ll keep you updated on the progress.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Your LLC Filing</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">State:</span>
                <span className="font-medium">{filing.state_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">LLC Formation</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filing ID:</span>
                <span className="font-mono text-xs">{filing.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted:</span>
                <span className="font-medium">{new Date(filing.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Processing Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FILING_STAGES.map((stage, index) => {
              const status = getStageStatus(stage.key);
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500 text-white' :
                    status === 'current' ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className={`font-medium ${status === 'current' ? 'text-blue-600' :
                      status === 'completed' ? 'text-green-600' :
                        'text-gray-400'
                      }`}>
                      {stage.label}
                    </div>
                    {status === 'current' && (
                      <div className="text-sm text-blue-500">In progress...</div>
                    )}
                    {status === 'completed' && stage.key === 'intake' && (
                      <div className="text-sm text-gray-500">
                        {new Date(filing.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {index < FILING_STAGES.length - 1 && (
                    <div className={`w-px h-8 ml-4 ${status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              );
            })}

            {ERROR_STAGES.includes(filing.stage) && (
              <div className="flex items-center space-x-4 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-red-600">
                    {filing.stage === 'rejected' ? 'Filing Rejected' :
                      filing.stage === 'needs_info' ? 'Additional Information Required' :
                        'Processing Failed'}
                  </div>
                  <div className="text-sm text-red-500">
                    We&apos;ll contact you with next steps.
                  </div>
                </div>
              </div>
            )}
          </div>

          {runs.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Processing Details</h4>
              <div className="space-y-2">
                {runs.map((r) => (
                  <div key={r.id} className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    Run {r.id.slice(0, 6)} — {r.status}
                    {r.started_at && ` — started ${new Date(r.started_at).toLocaleString()}`}
                    {r.finished_at && ` — finished ${new Date(r.finished_at).toLocaleString()}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Updates & Messages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {msgs.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-muted-foreground text-sm">
                No updates yet. We&apos;ll notify you of any important developments.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {msgs.map((m) => (
                <div key={m.id} className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm">{m.body}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Your Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <div className="text-muted-foreground text-sm">
                Your documents will appear here once processing begins.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{d.label || d.storage_path || d.id}</span>
                  </div>
                  <div>
                    {d.public_url ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={d.public_url} target="_blank" rel="noreferrer">Download</a>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Processing...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => router.push("/app/start")} className="flex-1">
          Start Another Filing
        </Button>
        <Button onClick={() => router.push("/app/dashboard")} variant="outline" className="flex-1">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

// Export with dynamic import to prevent hydration issues
export default dynamic(() => Promise.resolve(CustomerFilingStatusContent), {
  ssr: false,
  loading: () => <div className="p-6 text-sm text-muted-foreground">Loading…</div>
});