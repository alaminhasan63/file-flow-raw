"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/profile-utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock } from "lucide-react";

type Filing = {
    id: string;
    state_code: string;
    filing_type: string;
    stage: string | null;
    business_id: string | null;
};

export default function PublicStartFilingPage() {
    const supabase = getBrowserSupabase();
    const router = useRouter();

    // stepper: 1=Formation State, 2=Business Name, 3=Address, 4=Registered Agent, 5=EIN, 6=Mail, 7=Addons, 8=Review, 9=Auth & Payment
    const [step, setStep] = useState(1);
    const [notice, setNotice] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [allStates, setAllStates] = useState<{ code: string; display_name: string }[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loggedInUserEmail, setLoggedInUserEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [totalAmountCents, setTotalAmountCents] = useState(29900); // Base price

    // form fields - stored in local state until final submission
    const [bizName, setBizName] = useState("");
    const [stateCode, setStateCode] = useState("WY");
    const [addr1, setAddr1] = useState("");
    const [city, setCity] = useState("");
    const [region, setRegion] = useState("");
    const [postal, setPostal] = useState("");
    const [registeredAgent, setRegisteredAgent] = useState<"fileflow" | "custom">("fileflow");
    const [customAgent, setCustomAgent] = useState({
        name: "",
        address: ""
    });
    const [einService, setEinService] = useState(true);
    const [mailForwarding, setMailForwarding] = useState(false);
    const [addons, setAddons] = useState<{ oa: boolean }>({ oa: true });

    useEffect(() => {
        // Load states from database (public access)
        (async () => {
            console.log('Loading states...');
            const { data: states, error } = await supabase
                .from("states")
                .select("code, display_name")
                .order("display_name", { ascending: true });
            console.log('States result:', { data: states, error });
            setAllStates(states || []);
        })();

        // Check if user is already logged in
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsLoggedIn(true);
                setLoggedInUserEmail(user.email || "");
                setNewEmail(user.email || "");
            }
        })();
    }, [supabase]);

    // Calculate total price whenever services change
    useEffect(() => {
        let total = 29900; // Base LLC formation
        if (registeredAgent === "fileflow") total += 9900; // $99
        if (einService) total += 7900; // $79
        if (mailForwarding) total += 19900; // $199
        if (addons.oa) total += 5000; // $50
        setTotalAmountCents(total);
    }, [registeredAgent, einService, mailForwarding, addons.oa]);

    const saveFormationState = () => {
        // No database save needed - just local state
        setStep(2);
    };

    const saveBusinessName = () => {
        if (!bizName.trim()) {
            setNotice("Business name is required");
            return;
        }
        setNotice(null);
        setStep(3);
    };

    const saveAddress = () => {
        if (!addr1.trim() || !city.trim() || !region.trim() || !postal.trim()) {
            setNotice("All address fields are required");
            return;
        }
        setNotice(null);
        setStep(4);
    };

    const saveRegisteredAgent = () => {
        if (registeredAgent === "custom" && !customAgent.address.trim()) {
            setNotice("Custom agent address is required");
            return;
        }
        setNotice(null);
        setStep(5);
    };

    const saveEinService = () => {
        setStep(6);
    };

    const saveMailForwarding = () => {
        setStep(7);
    };

    const saveAddons = () => {
        setStep(8);
    };

    const proceedToAuth = () => {
        setStep(9);
    };

    const handleFinalSubmission = async () => {
        // Prevent double submissions
        if (paymentProcessing) return;

        setPaymentProcessing(true);
        setNotice(null);

        try {
            // Validate account creation fields
            if (!isLoggedIn) {
                if (!newEmail.trim() || !newPassword.trim()) {
                    setNotice("Please provide email and password to create your account.");
                    setPaymentProcessing(false);
                    return;
                }
            }

            // Step 1: Create Account First
            let user = null;

            if (!isLoggedIn) {
                setNotice("Creating your account...");

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Use client-side signup for better session handling
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: newEmail,
                    password: newPassword,
                });

                console.log('Signup result:', { data: signUpData, error: signUpError });

                if (signUpError) {
                    // Handle existing user case
                    if (signUpError.message.includes("already registered") || signUpError.message.includes("already been taken")) {
                        setNotice("Account already exists. Signing you in...");

                        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                            email: newEmail,
                            password: newPassword,
                        });

                        if (signInError) {
                            setNotice(`Account exists but sign-in failed: ${signInError.message}. Please check your password.`);
                            setPaymentProcessing(false);
                            return;
                        }

                        if (signInData?.user && signInData?.session) {
                            user = signInData.user;
                            setIsLoggedIn(true);
                            console.log('Existing user signed in with session:', user.email);
                        } else {
                            setNotice("Sign-in succeeded but session not established. Please try again.");
                            setPaymentProcessing(false);
                            return;
                        }
                    } else if (signUpError.message.includes("security purposes") || signUpError.message.includes("3 seconds")) {
                        setNotice("Please wait a moment... Creating account...");
                        await new Promise(resolve => setTimeout(resolve, 4000));

                        const { data: retryData, error: retryError } = await supabase.auth.signUp({
                            email: newEmail,
                            password: newPassword,
                        });

                        if (retryError) {
                            setNotice(`Account creation failed: ${retryError.message}. Please try again.`);
                            setPaymentProcessing(false);
                            return;
                        }

                        if (retryData?.user) {
                            if (retryData.session) {
                                user = retryData.user;
                            } else {
                                // Confirm and sign in
                                await fetch('/api/confirm-user', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ userId: retryData.user.id }),
                                });

                                const { data: confirmSignIn } = await supabase.auth.signInWithPassword({
                                    email: newEmail,
                                    password: newPassword,
                                });

                                if (confirmSignIn?.user && confirmSignIn?.session) {
                                    user = confirmSignIn.user;
                                }
                            }
                        }
                    } else {
                        setNotice(`Account creation failed: ${signUpError.message}. Please try again.`);
                        setPaymentProcessing(false);
                        return;
                    }
                } else if (signUpData?.user) {
                    // Account created successfully
                    if (signUpData.session) {
                        // Has session immediately, ready to go
                        user = signUpData.user;
                        setIsLoggedIn(true);
                        setNotice("Account created with session!");
                        console.log('New user created with immediate session:', user.email);
                    } else {
                        // No session, need to confirm and sign in
                        setNotice("Account created! Confirming and signing you in...");

                        // Confirm user via admin API
                        await fetch('/api/confirm-user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: signUpData.user.id }),
                        });

                        // Wait a moment then sign in to establish session
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                            email: newEmail,
                            password: newPassword,
                        });

                        if (signInError || !signInData?.session) {
                            setNotice("Account created but session setup failed. Please sign in manually.");
                            setPaymentProcessing(false);
                            return;
                        }

                        user = signInData.user;
                        setIsLoggedIn(true);
                        setNotice("Account ready with active session!");
                        console.log('New user confirmed and signed in with session:', user.email);
                    }
                }

                if (!user) {
                    setNotice("Account creation failed. Please try again.");
                    setPaymentProcessing(false);
                    return;
                }

                setNotice("Account ready! You'll stay signed in after payment.");

                // Small delay to show success
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // User is already logged in
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (!currentUser) {
                    setNotice("Please sign in to continue.");
                    setPaymentProcessing(false);
                    return;
                }
                user = currentUser;
            }

            // Step 2: Create Business and Filing via Server-Side API (bypasses RLS)
            setNotice("Preparing your LLC filing for payment...");

            const filingResponse = await fetch('/api/create-filing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    userEmail: user.email || newEmail,
                    bizName,
                    stateCode,
                    addr1,
                    city,
                    region,
                    postal,
                    registeredAgent,
                    customAgent,
                    einService,
                    mailForwarding,
                    addons,
                    totalAmountCents
                }),
            });

            const filingResult = await filingResponse.json();

            if (!filingResponse.ok) {
                setNotice(`Setup failed: ${filingResult.error}`);
                setPaymentProcessing(false);
                return;
            }

            const { business: newBiz, filing } = filingResult;

            // Step 3: Redirect to Stripe Checkout
            setNotice("Redirecting to secure payment...");

            // Create Stripe checkout session
            const checkoutResponse = await fetch('/api/public/checkout/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filingId: filing.id,
                    amount: totalAmountCents,
                    businessName: bizName,
                    state: stateCode,
                    successUrl: `${window.location.origin}/app/filings/${filing.id}?payment=success`,
                    cancelUrl: `${window.location.origin}/start?step=9&error=payment_cancelled`,
                }),
            });

            if (!checkoutResponse.ok) {
                setNotice('Failed to create payment session. Please try again.');
                setPaymentProcessing(false);
                return;
            }

            const { session } = await checkoutResponse.json();

            // Redirect to Stripe checkout
            window.location.href = session.url;

        } catch (error: any) {
            setNotice(`Setup failed: ${error.message}`);
            setPaymentProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #dbeafe, #ffffff, #e0e7ff)' }}>
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-20" />

            {/* Header */}
            <header className="relative border-b bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600" />
                        <span className="text-xl font-bold">FileFlow</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Already have an account? <a href="/sign-in" className="text-blue-600 hover:underline">Sign in</a>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="relative max-w-2xl mx-auto px-4 py-8 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Start Your LLC Filing</CardTitle>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Step {step} of 9</span>
                                <span className="font-semibold text-blue-600">{Math.round((step / 9) * 100)}% Complete</span>
                            </div>
                            <Progress value={(step / 9) * 100} className="w-full h-3" />
                        </div>
                    </CardHeader>
                    <CardContent>

                        {notice && (
                            <div className={`mb-3 rounded border p-2 text-sm ${notice.includes("failed") || notice.includes("error") || notice.includes("Error")
                                ? "border-red-200 bg-red-50 text-red-800"
                                : notice.includes("Creating") || notice.includes("Processing") || notice.includes("Setting up")
                                    ? "border-blue-200 bg-blue-50 text-blue-800"
                                    : notice.includes("created") || notice.includes("successfully")
                                        ? "border-green-200 bg-green-50 text-green-800"
                                        : "border-yellow-200 bg-yellow-50 text-yellow-800"
                                }`}>
                                {notice}
                                {(notice.includes("failed") || notice.includes("error")) && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => {
                                                setNotice(null);
                                                setPaymentProcessing(false);
                                            }}
                                            className="text-xs underline hover:no-underline"
                                        >
                                            Try again
                                        </button>
                                        {" | "}
                                        <a href="/sign-in" className="text-xs underline hover:no-underline">
                                            Sign in instead
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Formation State</h3>
                                    <p className="text-sm text-muted-foreground">Where would you like to form your LLC?</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                        Formation State
                                    </Label>
                                    <Select value={stateCode} onValueChange={setStateCode}>
                                        <SelectTrigger className="mt-1 h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm">
                                            <SelectValue placeholder="Select your formation state" />
                                        </SelectTrigger>
                                        <SelectContent className="border-2 border-gray-100 shadow-xl">
                                            {allStates.map((state) => (
                                                <SelectItem
                                                    key={state.code}
                                                    value={state.code}
                                                    disabled={state.code !== "WY"}
                                                    className={`py-3 px-4 ${state.code !== "WY" ? "text-gray-400 bg-gray-50" : "hover:bg-blue-50 focus:bg-blue-50"}`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span className="font-medium">{state.display_name}</span>
                                                        {state.code === "WY" ? (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Available
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                                                <Clock className="w-3 h-3" />
                                                                Coming Soon
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex items-start gap-2 mt-2">
                                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                                            <span className="text-blue-600 text-xs">i</span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">State where your LLC will be legally formed and registered</p>
                                    </div>
                                    {stateCode !== "WY" && stateCode && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center mt-0.5">
                                                <span className="text-white text-xs">!</span>
                                            </div>
                                            <p className="text-xs text-amber-700 font-medium">
                                                We currently only support Wyoming formations. Other states coming soon!
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button
                                        onClick={saveFormationState}
                                        disabled={busy || !stateCode.trim()}
                                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            Continue to Business Details
                                            <span className="text-lg">→</span>
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Business Name</h3>
                                    <p className="text-sm text-muted-foreground">What will your LLC be called?</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bizName" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        Business Name
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="bizName"
                                            value={bizName}
                                            onChange={e => setBizName(e.target.value)}
                                            placeholder="Enter your LLC name (e.g., Acme Ventures LLC)"
                                            className="mt-1 h-12 border-2 border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-12 text-gray-900 placeholder:text-gray-400"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            {bizName.trim() ? (
                                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">?</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 mt-2">
                                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                            <span className="text-green-600 text-xs">i</span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">Choose a unique name for your LLC. Must end with &quot;LLC&quot; or &quot;Limited Liability Company&quot;</p>
                                    </div>
                                    {bizName.trim() && !bizName.toLowerCase().includes('llc') && (
                                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                                                <span className="text-white text-xs">!</span>
                                            </div>
                                            <p className="text-xs text-blue-700 font-medium">
                                                Consider adding &quot;LLC&quot; to your business name for clarity
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-medium">
                                        <span className="flex items-center gap-2">
                                            <span className="text-lg">←</span>
                                            Back
                                        </span>
                                    </Button>
                                    <Button
                                        onClick={saveBusinessName}
                                        disabled={busy || !bizName.trim()}
                                        className="flex-1 h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        <span className="flex items-center gap-2">
                                            Continue to Address
                                            <span className="text-lg">→</span>
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Business Address</h3>
                                    <p className="text-sm text-muted-foreground">Where is your business located?</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="addr1" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                        Street Address
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="addr1"
                                            value={addr1}
                                            onChange={e => setAddr1(e.target.value)}
                                            placeholder="123 Main Street, Suite 100"
                                            className="h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-12 text-gray-900 placeholder:text-gray-400"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            {addr1.trim() ? (
                                                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <CheckCircle className="w-3 h-3 text-purple-600" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-gray-400 text-xs">📍</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            City
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="city"
                                                value={city}
                                                onChange={e => setCity(e.target.value)}
                                                placeholder="Cheyenne"
                                                className="h-12 border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-10 text-gray-900 placeholder:text-gray-400"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                {city.trim() ? (
                                                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-orange-600" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">🏙️</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="region" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            State
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="region"
                                                value={region}
                                                onChange={e => setRegion(e.target.value)}
                                                placeholder="WY"
                                                className="h-12 border-2 border-gray-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-10 text-gray-900 placeholder:text-gray-400"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                {region.trim() ? (
                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-indigo-600" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">🗺️</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="postal" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                                            ZIP Code
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="postal"
                                                value={postal}
                                                onChange={e => setPostal(e.target.value)}
                                                placeholder="82001"
                                                className="h-12 border-2 border-gray-200 hover:border-pink-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-10 text-gray-900 placeholder:text-gray-400"
                                            />
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                {postal.trim() ? (
                                                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
                                                        <CheckCircle className="w-3 h-3 text-pink-600" />
                                                    </div>
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <span className="text-gray-400 text-xs">#</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 mt-4">
                                    <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                                        <span className="text-purple-600 text-xs">i</span>
                                    </div>
                                    <p className="text-xs text-gray-600 leading-relaxed">This will be your business&apos;s principal address for legal and tax purposes</p>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                                        Back
                                    </Button>
                                    <Button
                                        onClick={saveAddress}
                                        disabled={busy || !addr1.trim() || !city.trim() || !region.trim() || !postal.trim()}
                                        className="flex-1"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Registered Agent</h3>
                                    <p className="text-sm text-muted-foreground">Who will serve as your registered agent?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="upsell-highlight flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <input
                                            type="radio"
                                            id="fileflow-agent"
                                            name="registered-agent"
                                            checked={registeredAgent === "fileflow"}
                                            onChange={() => setRegisteredAgent("fileflow")}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="fileflow-agent" className="text-sm font-bold cursor-pointer text-blue-900">
                                                ⭐ Use FileFlow as my registered agent <span className="price-highlight">($99/year)</span>
                                            </Label>
                                            <p className="text-xs text-blue-700 font-medium">
                                                ✅ We&apos;ll handle all legal documents and compliance notices for you
                                            </p>
                                            <p className="text-xs text-green-600 font-semibold">
                                                🎯 Recommended - Stay compliant automatically!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <input
                                            type="radio"
                                            id="custom-agent"
                                            name="registered-agent"
                                            checked={registeredAgent === "custom"}
                                            onChange={() => setRegisteredAgent("custom")}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1 flex-1">
                                            <Label htmlFor="custom-agent" className="text-sm font-medium cursor-pointer">
                                                Provide my own registered agent address
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Enter the address of your registered agent
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {registeredAgent === "custom" && (
                                    <div className="space-y-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
                                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                            Registered Agent Address
                                        </h4>
                                        <div className="space-y-2">
                                            <Label htmlFor="agent-address" className="text-sm font-medium text-gray-600">Complete Address</Label>
                                            <div className="relative">
                                                <Input
                                                    id="agent-address"
                                                    value={customAgent.address}
                                                    onChange={e => setCustomAgent(prev => ({ ...prev, address: e.target.value }))}
                                                    placeholder="123 Agent Street, Cheyenne, WY 82001"
                                                    className="h-12 border-2 border-gray-200 hover:border-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-12 text-gray-900 placeholder:text-gray-400"
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    {customAgent.address.trim() ? (
                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <CheckCircle className="w-3 h-3 text-gray-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-gray-400 text-xs">📍</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 mt-2">
                                                <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                                                    <span className="text-gray-600 text-xs">i</span>
                                                </div>
                                                <p className="text-xs text-gray-600 leading-relaxed">Must be a valid Wyoming address for your registered agent</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                                        Back
                                    </Button>
                                    <Button
                                        onClick={saveRegisteredAgent}
                                        disabled={busy || (registeredAgent === "custom" && !customAgent.address.trim())}
                                        className="flex-1"
                                    >
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Employer Identification Number (EIN)</h3>
                                    <p className="text-sm text-muted-foreground">Would you like FileFlow to obtain your EIN from the IRS?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="upsell-highlight flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <input
                                            type="radio"
                                            id="ein-yes"
                                            name="ein-service"
                                            checked={einService === true}
                                            onChange={() => setEinService(true)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="ein-yes" className="text-sm font-bold cursor-pointer text-blue-900">
                                                ⭐ Yes, obtain my EIN <span className="price-highlight">($79)</span>
                                            </Label>
                                            <p className="text-xs text-blue-700 font-medium">
                                                ✅ We&apos;ll handle the IRS application process and get your Federal Tax ID number
                                            </p>
                                            <p className="text-xs text-green-600 font-semibold">
                                                🎯 Required for business banking - Let us handle the paperwork!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <input
                                            type="radio"
                                            id="ein-no"
                                            name="ein-service"
                                            checked={einService === false}
                                            onChange={() => setEinService(false)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="ein-no" className="text-sm font-medium cursor-pointer">
                                                No, I&apos;ll handle this myself
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                You can apply for an EIN directly with the IRS at no cost
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(4)} variant="outline" className="flex-1">
                                        Back
                                    </Button>
                                    <Button onClick={saveEinService} disabled={busy} className="flex-1">
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Mail Forwarding</h3>
                                    <p className="text-sm text-muted-foreground">Would you like FileFlow to handle your business mail forwarding?</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="upsell-highlight flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <input
                                            type="radio"
                                            id="mail-yes"
                                            name="mail-forwarding"
                                            checked={mailForwarding === true}
                                            onChange={() => setMailForwarding(true)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="mail-yes" className="text-sm font-bold cursor-pointer text-blue-900">
                                                ⭐ Yes, handle my business mail forwarding <span className="price-highlight">($199/year)</span>
                                            </Label>
                                            <p className="text-xs text-blue-700 font-medium">
                                                ✅ We&apos;ll receive, scan, and forward your business mail digitally
                                            </p>
                                            <p className="text-xs text-green-600 font-semibold">
                                                🎯 Never miss important documents - Go paperless!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                                        <input
                                            type="radio"
                                            id="mail-no"
                                            name="mail-forwarding"
                                            checked={mailForwarding === false}
                                            onChange={() => setMailForwarding(false)}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="mail-no" className="text-sm font-medium cursor-pointer">
                                                No, I&apos;ll handle my own mail
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                You&apos;ll manage your business mail directly
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(5)} variant="outline" className="flex-1">
                                        Back
                                    </Button>
                                    <Button onClick={saveMailForwarding} disabled={busy} className="flex-1">
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 7 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Add-on Services</h3>
                                    <p className="text-sm text-muted-foreground">Choose additional services for your LLC</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="upsell-highlight flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <Checkbox
                                            id="oa"
                                            checked={addons.oa}
                                            onCheckedChange={(checked) => setAddons(v => ({ ...v, oa: !!checked }))}
                                            className="mt-1"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="oa" className="text-sm font-bold cursor-pointer text-blue-900">
                                                ⭐ Operating Agreement Template <span className="price-highlight">(+$50)</span>
                                            </Label>
                                            <p className="text-xs text-blue-700 font-medium">
                                                ✅ Professional template to govern your LLC operations
                                            </p>
                                            <p className="text-xs text-green-600 font-semibold">
                                                🎯 Protect your business - Essential legal foundation!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-700">Total Investment:</span>
                                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                            ${(totalAmountCents / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-green-600 font-semibold mt-1 text-center">
                                        🚀 Everything you need to launch your LLC successfully!
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(6)} variant="outline" className="flex-1">
                                        Back
                                    </Button>
                                    <Button onClick={saveAddons} disabled={busy} className="flex-1">
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 8 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Review & Summary</h3>
                                    <p className="text-sm text-muted-foreground">Review your information before proceeding to payment</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Business Information */}
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-3">Business Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Business Name:</span>
                                                <span className="text-sm font-medium">{bizName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Formation State:</span>
                                                <span className="text-sm font-medium">{stateCode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Business Address:</span>
                                                <span className="text-sm font-medium text-right">{addr1}, {city}, {region} {postal}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Registered Agent */}
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-3">Registered Agent</h4>
                                        <div className="space-y-2">
                                            {registeredAgent === "fileflow" ? (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Service:</span>
                                                    <span className="text-sm font-medium">FileFlow Registered Agent</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Agent Address:</span>
                                                    <span className="text-sm font-medium text-right">
                                                        {customAgent.address}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Services */}
                                    <div className="bg-muted/50 p-4 rounded-lg">
                                        <h4 className="font-semibold mb-3">Services</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">EIN Service:</span>
                                                <span className="text-sm font-medium">
                                                    {einService ? "Yes - FileFlow will obtain your EIN" : "No - I'll handle this myself"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Mail Forwarding:</span>
                                                <span className="text-sm font-medium">
                                                    {mailForwarding ? "Yes - FileFlow will handle mail forwarding" : "No - I'll handle my own mail"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Operating Agreement:</span>
                                                <span className="text-sm font-medium">
                                                    {addons.oa ? "Yes - Include template" : "No"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Summary */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg shadow-sm">
                                        <h4 className="font-semibold mb-3">Pricing Summary</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm">LLC Formation Filing</span>
                                                <span className="text-sm font-semibold">$299.00</span>
                                            </div>
                                            {registeredAgent === "fileflow" && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm">⭐ Registered Agent Service (1 year)</span>
                                                    <span className="text-sm font-semibold text-blue-600">$99.00</span>
                                                </div>
                                            )}
                                            {einService && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm">⭐ EIN Application Service</span>
                                                    <span className="text-sm font-semibold text-blue-600">$79.00</span>
                                                </div>
                                            )}
                                            {mailForwarding && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm">⭐ Mail Forwarding Service (1 year)</span>
                                                    <span className="text-sm font-semibold text-blue-600">$199.00</span>
                                                </div>
                                            )}
                                            {addons.oa && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm">⭐ Operating Agreement Template</span>
                                                    <span className="text-sm font-semibold text-blue-600">$50.00</span>
                                                </div>
                                            )}
                                            <div className="border-t pt-2 mt-2">
                                                <div className="flex justify-between font-bold text-lg">
                                                    <span>Total:</span>
                                                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                                        ${(totalAmountCents / 100).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(7)} variant="outline" className="flex-1">
                                        Back
                                    </Button>
                                    <Button onClick={proceedToAuth} disabled={busy} className="flex-1">
                                        Continue to Payment
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 9 && (
                            <div className="space-y-6">
                                <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">Account & Payment</h3>
                                    <p className="text-sm text-muted-foreground">Create your account and proceed to secure payment</p>
                                </div>

                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg space-y-4 shadow-sm">
                                    <h4 className="font-semibold">
                                        {isLoggedIn ? "Account Verified ✅" : "Create Your Account"}
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newEmail" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                Email Address
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="newEmail"
                                                    type="email"
                                                    value={newEmail}
                                                    onChange={e => setNewEmail(e.target.value)}
                                                    placeholder="your@business-email.com"
                                                    className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-12 text-gray-900 placeholder:text-gray-400"
                                                    disabled={isLoggedIn}
                                                />
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    {isLoggedIn ? (
                                                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                                        </div>
                                                    ) : newEmail.includes('@') && newEmail.includes('.') ? (
                                                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <CheckCircle className="w-3 h-3 text-blue-600" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <span className="text-gray-400 text-xs">@</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!isLoggedIn && (
                                            <div className="space-y-2">
                                                <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    Password
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="newPassword"
                                                        type="password"
                                                        value={newPassword}
                                                        onChange={e => setNewPassword(e.target.value)}
                                                        placeholder="Create a strong password (min 6 characters)"
                                                        className="h-12 border-2 border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 bg-white shadow-sm pl-4 pr-12 text-gray-900 placeholder:text-gray-400"
                                                    />
                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                        {newPassword.length >= 6 ? (
                                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                                <CheckCircle className="w-3 h-3 text-green-600" />
                                                            </div>
                                                        ) : newPassword.length > 0 ? (
                                                            <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                                                                <span className="text-yellow-600 text-xs">!</span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                                <span className="text-gray-400 text-xs">🔒</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-2 mt-2">
                                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                        <span className="text-green-600 text-xs">i</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        Account created instantly - no email confirmation needed. You&apos;ll stay signed in after payment.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-4 rounded-lg shadow-sm">
                                    <h4 className="font-semibold mb-3">Final Order Summary</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm">LLC Formation Filing</span>
                                            <span className="text-sm font-semibold">$299.00</span>
                                        </div>
                                        {registeredAgent === "fileflow" && (
                                            <div className="flex justify-between">
                                                <span className="text-sm">⭐ Registered Agent Service (1 year)</span>
                                                <span className="text-sm font-semibold text-blue-600">$99.00</span>
                                            </div>
                                        )}
                                        {einService && (
                                            <div className="flex justify-between">
                                                <span className="text-sm">⭐ EIN Application Service</span>
                                                <span className="text-sm font-semibold text-blue-600">$79.00</span>
                                            </div>
                                        )}
                                        {mailForwarding && (
                                            <div className="flex justify-between">
                                                <span className="text-sm">⭐ Mail Forwarding Service (1 year)</span>
                                                <span className="text-sm font-semibold text-blue-600">$199.00</span>
                                            </div>
                                        )}
                                        {addons.oa && (
                                            <div className="flex justify-between">
                                                <span className="text-sm">⭐ Operating Agreement Template</span>
                                                <span className="text-sm font-semibold text-blue-600">$50.00</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-2 mt-2">
                                            <div className="flex justify-between font-bold text-xl">
                                                <span>Total:</span>
                                                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                                    ${(totalAmountCents / 100).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-white text-xs">i</span>
                                        </div>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Instant Account Creation</p>
                                            <p>We&apos;ll create your account instantly (no email confirmation), set up your LLC filing, then redirect you to secure payment. After payment, you&apos;ll access your dashboard.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button onClick={() => setStep(8)} variant="outline" className="flex-1 h-14 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold">
                                        <span className="flex items-center gap-2">
                                            <span className="text-xl">←</span>
                                            Back to Review
                                        </span>
                                    </Button>
                                    <Button
                                        onClick={handleFinalSubmission}
                                        disabled={paymentProcessing || (!isLoggedIn && (!newEmail.trim() || !newPassword.trim()))}
                                        className="flex-1 h-14 bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 hover:from-green-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg border-0 relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                        {paymentProcessing ? (
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span className="text-lg">Processing Your LLC...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 relative z-10">
                                                <span className="text-2xl">🚀</span>
                                                <span className="text-lg font-bold">Pay & Create My LLC</span>
                                                <span className="text-xl">→</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
