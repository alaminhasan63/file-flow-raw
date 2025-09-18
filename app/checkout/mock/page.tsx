"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import dynamic from "next/dynamic";

// Dynamic component to avoid hydration issues
const MockCheckoutContent = () => {
    const router = useRouter();
    const supabase = getBrowserSupabase();

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [filingId, setFilingId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filing, setFiling] = useState<any>(null);

    // Extract URL parameters after component mounts to avoid hydration issues
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setSessionId(urlParams.get("session_id"));
        setFilingId(urlParams.get("filing_id"));
        setMounted(true);
    }, []);

    const loadFilingData = useCallback(async () => {
        if (!filingId) return;

        const { data, error } = await supabase
            .from("filings")
            .select(`
        id,
        quoted_total_cents,
        business_id,
        businesses (
          legal_name,
          formation_state
        )
      `)
            .eq("id", filingId)
            .single();

        if (error) {
            setError("Failed to load filing data");
        } else {
            setFiling(data);
        }
    }, [filingId, supabase]);

    useEffect(() => {
        if (mounted && filingId) {
            loadFilingData();
        }
    }, [mounted, filingId, loadFilingData]);

    async function handlePayment(success: boolean) {
        if (!filingId || !sessionId) return;

        setLoading(true);
        setError(null);

        try {
            // Call server-side API to process payment
            const response = await fetch('/api/checkout/mock/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    filingId,
                    success
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment processing failed');
            }

            // Redirect based on response
            if (data.redirectTo) {
                router.push(data.redirectTo);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment processing failed");
        } finally {
            setLoading(false);
        }
    }

    // Show loading state until component is mounted and params are extracted
    if (!mounted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!sessionId || !filingId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invalid Request</CardTitle>
                            <CardDescription>Missing required parameters</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => router.push("/app")} className="w-full">
                                Return to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <Card>
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CreditCard className="h-12 w-12 text-blue-600" />
                        </div>
                        <CardTitle>Mock Stripe Checkout</CardTitle>
                        <CardDescription>
                            This is a mock payment page for testing purposes
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-6">
                            {filing && (
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Business:</span>
                                        <span className="text-sm font-medium">{filing.businesses?.legal_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">State:</span>
                                        <span className="text-sm font-medium">{filing.businesses?.formation_state}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Amount:</span>
                                        <span className="text-sm font-medium">
                                            ${(filing.quoted_total_cents / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Session ID:</span>
                                        <span className="text-sm font-mono">{sessionId}</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button
                                    onClick={() => handlePayment(true)}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Simulate Successful Payment
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => handlePayment(false)}
                                    disabled={loading}
                                    variant="ghost"
                                    className="w-full"
                                >
                                    Cancel Payment
                                </Button>
                            </div>

                            <div className="text-xs text-muted-foreground text-center">
                                <p>🧪 This is a mock checkout for development/testing purposes.</p>
                                <p>No real payment will be processed.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

// Export with dynamic import to prevent hydration issues
export default dynamic(() => Promise.resolve(MockCheckoutContent), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center">Loading...</div>
        </div>
    )
});