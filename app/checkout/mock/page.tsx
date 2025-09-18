"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";

function MockCheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get URL parameters
    const sessionId = searchParams.get("session_id");
    const filingId = searchParams.get("filing_id");
    const amount = searchParams.get("amount");
    const businessName = searchParams.get("business_name");
    const state = searchParams.get("state");

    // Create filing data from URL parameters
    const filing = {
        id: filingId,
        quoted_total_cents: parseInt(amount || "52700"),
        business_id: `business-${filingId}`,
        businesses: {
            legal_name: decodeURIComponent(businessName || "Your LLC"),
            formation_state: state || "WY",
            entity_type: "LLC"
        }
    };

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
                window.location.href = data.redirectTo;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Payment processing failed");
        } finally {
            setLoading(false);
        }
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
                            <Button onClick={() => router.push("/start")} className="w-full">
                                Return to Filing
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <Card className="shadow-xl">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                                <CreditCard className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-center text-2xl">Secure Payment</CardTitle>
                        <CardDescription className="text-center">
                            Complete your LLC formation payment
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-6">
                            {/* Order Summary */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
                                <h4 className="font-semibold text-gray-900">Order Summary</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Business:</span>
                                        <span className="text-sm font-medium">{filing.businesses?.legal_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Formation State:</span>
                                        <span className="text-sm font-medium">{filing.businesses?.formation_state}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Filing Type:</span>
                                        <span className="text-sm font-medium">LLC Formation</span>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Total Amount:</span>
                                            <span className="text-lg font-bold text-green-600">
                                                ${(filing.quoted_total_cents / 100).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session Info */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>Session: {sessionId}</div>
                                    <div>Filing: {filingId?.slice(0, 8)}...</div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Payment Buttons */}
                            <div className="space-y-3">
                                <Button
                                    onClick={() => handlePayment(true)}
                                    disabled={loading}
                                    className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing Payment...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Complete Payment - ${(filing.quoted_total_cents / 100).toFixed(2)}
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => handlePayment(false)}
                                    disabled={loading}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Cancel Payment
                                </Button>
                            </div>

                            {/* Mock Notice */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <div className="text-xs text-yellow-800 text-center space-y-1">
                                    <p className="font-medium">🧪 Development Mode</p>
                                    <p>This is a mock payment for testing. No real charges will be made.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <Card className="shadow-xl">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                        </div>
                        <CardTitle className="text-center text-2xl">Loading...</CardTitle>
                        <CardDescription className="text-center">
                            Preparing your payment page
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}

export default function MockCheckoutPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <MockCheckoutContent />
        </Suspense>
    );
}