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

type Filing = {
  id: string;
  state_code: string;
  filing_type: string;
  stage: string | null;
  business_id: string | null;
};

export default function StartFilingPage() {
  const supabase = getBrowserSupabase();
  const router = useRouter();

  // stepper: 1=Business, 2=Address, 3=Registered Agent, 4=Add-ons, 5=Review
  const [step, setStep] = useState(1);
  const [filing, setFiling] = useState<Filing | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [allStates, setAllStates] = useState<{ code: string; display_name: string }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserEmail, setLoggedInUserEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [totalAmountCents, setTotalAmountCents] = useState(0);

  // form fields (MVP)
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
    // Load states from database
    (async () => {
      const { data: states } = await supabase
        .from("states")
        .select("code, display_name")
        .order("display_name", { ascending: true });
      setAllStates(states || []);
    })();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setLoggedInUserEmail(user.email || "");
        setNewEmail(user.email || "");
      } else {
        setIsLoggedIn(false);
      }

      // try to find the latest in-progress filing for this user
      const { data: f } = await supabase
        .from("filings")
        .select("id, state_code, filing_type, stage, business_id")
        .eq("stage", "intake")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (f) {
        setFiling(f as any);
        if (f.business_id) {
          setBusinessId(f.business_id);
          // Load business data to populate form
          const { data: biz } = await supabase
            .from("businesses")
            .select("legal_name, formation_state, address_line1, address_city, address_region, address_postal")
            .eq("id", f.business_id)
            .single();
          if (biz) {
            setBizName(biz.legal_name || "");
            setStateCode(biz.formation_state || "WY");
            setAddr1(biz.address_line1 || "");
            setCity(biz.address_city || "");
            setRegion(biz.address_region || "");
            setPostal(biz.address_postal || "");
          }
        }

        // Load registered agent data  
        if (typeof f.use_fileflow_registered_agent === 'boolean') {
          setRegisteredAgent(f.use_fileflow_registered_agent ? "fileflow" : "custom");
          if (!f.use_fileflow_registered_agent && f.registered_agent_address) {
            setCustomAgent({
              name: "",
              address: f.registered_agent_address
            });
          }
        }

        // Load EIN service data
        if (f.ein_service !== undefined && f.ein_service !== null) {
          setEinService(f.ein_service);
        }

        // Load mail forwarding data
        if (typeof f.mail_forwarding === 'boolean') {
          setMailForwarding(f.mail_forwarding);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ensureDraft() {
    if (filing) return filing;
    setBusy(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); router.push("/sign-in?next=/app/start"); throw new Error("No user"); }

    const { data: f, error } = await supabase
      .from("filings")
      .insert({
        user_id: user.id,          // IMPORTANT for RLS
        state_code: stateCode,
        filing_type: "LLC_FORMATION",
        stage: "intake",
        quoted_total_cents: 29900
      })
      .select("id, state_code, filing_type, stage, business_id")
      .single();

    setBusy(false);
    if (error) { setNotice(error.message); throw error; }
    setFiling(f as any);
    return f as Filing;
  }

  async function saveFormationState() {
    setBusy(true); setNotice(null);

    try {
      const currentFiling = await ensureDraft();

      const { error: updateErr } = await supabase
        .from("filings")
        .update({ state_code: stateCode })
        .eq("id", currentFiling.id);

      if (updateErr) {
        setNotice(updateErr.message);
        setBusy(false);
        return;
      }

      // Update local filing state
      setFiling(prev => prev ? { ...prev, state_code: stateCode } : null);
      setBusy(false);
      setStep(2);
    } catch (error: any) {
      setNotice(error.message || "Failed to save formation state");
      setBusy(false);
    }
  }

  async function saveBusinessName() {
    if (!filing) {
      setNotice("No filing found. Please refresh and try again.");
      return;
    }

    setBusy(true); setNotice(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/sign-in?next=/app/start");
      setBusy(false);
      return;
    }

    // Ensure user profile exists before creating business
    const profileErr = await ensureUserProfile(supabase, user);
    if (profileErr) {
      setNotice(profileErr);
      setBusy(false);
      return;
    }

    let currentBusinessId = businessId;

    if (!currentBusinessId) {
      // Create new business
      const { data: newBiz, error: createBizErr } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          legal_name: bizName,
          formation_state: filing.state_code,
          entity_type: "LLC"
        })
        .select("id")
        .single();

      if (createBizErr) {
        setNotice(createBizErr.message);
        setBusy(false);
        return;
      }

      currentBusinessId = newBiz.id;
      setBusinessId(currentBusinessId);

      // Link business to filing
      const { error: linkErr } = await supabase
        .from("filings")
        .update({ business_id: currentBusinessId })
        .eq("id", filing.id);

      if (linkErr) {
        setNotice(linkErr.message);
        setBusy(false);
        return;
      }
    } else {
      // Update existing business
      const { error: updateErr } = await supabase
        .from("businesses")
        .update({
          legal_name: bizName,
          entity_type: "LLC"
        })
        .eq("id", currentBusinessId)
        .eq("owner_id", user.id);

      if (updateErr) {
        setNotice(updateErr.message);
        setBusy(false);
        return;
      }
    }

    setBusy(false);
    setStep(3);
  }

  async function saveAddress() {
    if (!filing || !businessId) {
      setNotice("No business found. Please go back to Step 1.");
      return;
    }

    setBusy(true); setNotice(null);

    const { error: updateErr } = await supabase
      .from("businesses")
      .update({
        address_line1: addr1,
        address_city: city,
        address_region: region,
        address_postal: postal,
      })
      .eq("id", businessId);

    if (updateErr) {
      setNotice(updateErr.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    setStep(4);
  }

  async function saveRegisteredAgent() {
    if (!filing) {
      setNotice("No filing found. Please refresh and try again.");
      return;
    }

    setBusy(true); setNotice(null);

    const useFileFlow = registeredAgent === "fileflow";
    const agentAddress = useFileFlow
      ? "123 Main St, Cheyenne, WY 82001"  // Default FileFlow address
      : customAgent.address;

    const { error: updateErr } = await supabase
      .from("filings")
      .update({
        use_fileflow_registered_agent: useFileFlow,
        registered_agent_address: agentAddress,
      })
      .eq("id", filing.id);

    if (updateErr) {
      setNotice(updateErr.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    setStep(5);
  }

  async function saveEinService() {
    if (!filing) {
      setNotice("No filing found. Please refresh and try again.");
      return;
    }

    setBusy(true); setNotice(null);

    const { data, error: updateErr } = await supabase
      .from("filings")
      .update({
        ein_service: einService,
      })
      .eq("id", filing.id)
      .select("id")
      .single();

    if (updateErr) {
      setNotice(updateErr.message);
      setBusy(false);
      return;
    }

    // Update local filing state optimistically
    setFiling(prev => prev ? { ...prev, ein_service: einService } : null);

    setBusy(false);
    setStep(6);
  }

  async function saveMailForwarding() {
    if (!filing) {
      setNotice("No filing found. Please refresh and try again.");
      return;
    }

    setBusy(true); setNotice(null);

    const { data, error: updateErr } = await supabase
      .from("filings")
      .update({
        mail_forwarding: mailForwarding,
      })
      .eq("id", filing.id)
      .select("id")
      .single();

    if (updateErr) {
      setNotice(updateErr.message);
      setBusy(false);
      return;
    }

    // Update local filing state optimistically
    setFiling(prev => prev ? { ...prev, mail_forwarding: mailForwarding } : null);
    setBusy(false);
    setStep(7);
  }

  async function saveAddons() {
    if (!filing) {
      setNotice("No filing found. Please refresh and try again.");
      return;
    }

    setBusy(true); setNotice(null);

    const extra = [
      addons.oa ? "OperatingAgreement" : null,
    ].filter(Boolean);

    const calculatedTotal = 29900 + (registeredAgent === "fileflow" ? 9900 : 0) + (einService ? 7900 : 0) + (mailForwarding ? 19900 : 0) + (addons.oa ? 5000 : 0);
    setTotalAmountCents(calculatedTotal);

    const { error: updateErr } = await supabase
      .from("filings")
      .update({ quoted_total_cents: calculatedTotal, external_ref: { addons: extra } })
      .eq("id", filing.id);

    if (updateErr) {
      setNotice(updateErr.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    setStep(8);
  }

  async function handleFinalSubmission() {
    if (!filing) {
      setNotice("No filing found. Please refresh and try again.");
      return;
    }

    setPaymentProcessing(true);
    setNotice(null);

    try {
      // If user is not logged in, create account first
      if (!isLoggedIn) {
        if (!newEmail.trim() || !newPassword.trim()) {
          setNotice("Please provide email and password to create your account.");
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: newEmail,
          password: newPassword,
        });

        if (signUpError) {
          setNotice(`Account creation failed: ${signUpError.message}`);
          return;
        }

        setIsLoggedIn(true);
      }

      // Create mock Stripe checkout session
      const response = await fetch('/api/public/checkout/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filingId: filing.id,
          amount: totalAmountCents,
          successUrl: `${window.location.origin}/app/filings/${filing.id}?payment=success`,
          cancelUrl: `${window.location.origin}/app/start?step=9`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { session } = await response.json();

      // Update filing to ready status before redirecting to payment
      await supabase
        .from("filings")
        .update({ stage: "ready" })
        .eq("id", filing.id);

      // Redirect to mock Stripe checkout
      window.location.href = session.url;

    } catch (error: any) {
      setNotice(`Payment setup failed: ${error.message}`);
    } finally {
      setPaymentProcessing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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

          {notice && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">{notice}</div>}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Formation State</h3>
                <p className="text-sm text-muted-foreground">Where would you like to form your LLC?</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Formation State</Label>
                <Select value={stateCode} onValueChange={setStateCode}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStates.map((state) => (
                      <SelectItem
                        key={state.code}
                        value={state.code}
                        disabled={state.code !== "WY"}
                        className={state.code !== "WY" ? "text-muted-foreground" : ""}
                      >
                        {state.display_name} {state.code !== "WY" && "(Coming Soon)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">State where your LLC will be formed</p>
                {stateCode !== "WY" && stateCode && (
                  <p className="text-xs text-amber-600 mt-1">
                    We currently only support Wyoming formations. Other states coming soon!
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveFormationState}
                  disabled={busy || !stateCode.trim()}
                  className="flex-1"
                >
                  {busy ? "Saving..." : "Continue"}
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
              <div>
                <Label htmlFor="bizName" className="text-sm font-medium">Business Name</Label>
                <Input
                  id="bizName"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  placeholder="Example Ventures LLC"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter your desired LLC name</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={saveBusinessName}
                  disabled={busy || !bizName.trim()}
                  className="flex-1"
                >
                  {busy ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {!businessId && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm text-amber-800">
                    <strong>No business linked to this filing.</strong>
                    <button
                      onClick={() => setStep(2)}
                      className="ml-2 underline hover:no-underline"
                    >
                      Go back to Step 2 to fix this
                    </button>
                  </div>
                </div>
              )}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Business Address</h3>
                <p className="text-sm text-muted-foreground">Where is your business located?</p>
              </div>
              <div>
                <Label htmlFor="addr1" className="text-sm font-medium">Street Address</Label>
                <Input
                  id="addr1"
                  value={addr1}
                  onChange={e => setAddr1(e.target.value)}
                  placeholder="123 Main St"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Cheyenne"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="region" className="text-sm font-medium">State</Label>
                  <Input
                    id="region"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    placeholder="WY"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postal" className="text-sm font-medium">ZIP Code</Label>
                  <Input
                    id="postal"
                    value={postal}
                    onChange={e => setPostal(e.target.value)}
                    placeholder="82001"
                    className="mt-1"
                  />
                </div>
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
                  {busy ? "Saving..." : "Continue"}
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
                      ✅ We'll handle all legal documents and compliance notices for you
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
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium">Registered Agent Address</h4>
                  <div>
                    <Label htmlFor="agent-address" className="text-sm font-medium">Complete Address</Label>
                    <Input
                      id="agent-address"
                      value={customAgent.address}
                      onChange={e => setCustomAgent(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Agent St, Cheyenne, WY 82001"
                      className="mt-1"
                    />
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
                  {busy ? "Saving..." : "Continue"}
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
                      ✅ We'll handle the IRS application process and get your Federal Tax ID number
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
                      No, I'll handle this myself
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
                  {busy ? "Saving..." : "Continue"}
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
                      ✅ We'll receive, scan, and forward your business mail digitally
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
                      No, I'll handle my own mail
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      You'll manage your business mail directly
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(5)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={saveMailForwarding} disabled={busy} className="flex-1">
                  {busy ? "Saving..." : "Continue"}
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
                  {busy ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Review & Submit</h3>
                <p className="text-sm text-muted-foreground">Review your information and submit your filing</p>
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
                <Button onClick={() => setStep(9)} disabled={busy} className="flex-1">
                  {busy ? "Saving..." : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Payment & Account</h3>
                <p className="text-sm text-muted-foreground">Complete your filing with payment</p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg space-y-4 shadow-sm">
                <h4 className="font-semibold">
                  {isLoggedIn ? "Account Information" : "Create Your Account"}
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newEmail" className="text-sm font-medium">Email</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="mt-1"
                      disabled={isLoggedIn}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium">
                      {isLoggedIn ? "Password (verified)" : "Password"}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={isLoggedIn ? "Account verified" : "Create a secure password"}
                      className="mt-1"
                      disabled={isLoggedIn}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold mb-3">Order Summary</h4>
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
                    <p className="font-medium mb-1">Secure Payment Processing</p>
                    <p>Your payment will be processed securely through Stripe. You'll be redirected to complete your payment and then returned to track your filing status.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={() => setStep(8)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleFinalSubmission}
                  disabled={paymentProcessing || (!isLoggedIn && (!newEmail.trim() || !newPassword.trim()))}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  {paymentProcessing ? "🚀 Processing..." : "🚀 Pay & Launch My LLC"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}