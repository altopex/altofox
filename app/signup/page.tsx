"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { AuthBrandedPanel } from "@/components/auth/AuthBrandedPanel";
import { BRAND } from "@/config/brand";
import { RankLocalLogo } from "@/components/brand/RankLocalLogo";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  HelpCircle,
  CreditCard,
  Layers,
} from "lucide-react";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan") === "agency" ? "agency" : "starter";
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "agency">(initialPlan);

  const { signUp, user, isApproved, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Settings
  const [signupMode, setSignupMode] = useState<"approval_required" | "invite_only" | "open">("approval_required");
  const [contactEmail, setContactEmail] = useState(BRAND.supportEmail);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetch("/api/auth/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.signup_mode) setSignupMode(data.signup_mode);
        if (data.contact_email) setContactEmail(data.contact_email);
      })
      .catch(() => {})
      .finally(() => setLoadingSettings(false));
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (isApproved) {
        router.replace("/dashboard");
      } else {
        router.replace("/pending");
      }
    }
  }, [user, isApproved, authLoading, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password strength calculation
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = "Too Weak";
    let color = "bg-rose-500";
    let width = "25%";

    if (score === 2) {
      label = "Fair";
      color = "bg-amber-500";
      width = "50%";
    } else if (score === 3) {
      label = "Good";
      color = "bg-indigo-500";
      width = "75%";
    } else if (score === 4) {
      label = "Strong";
      color = "bg-emerald-500";
      width = "100%";
    }

    return { score, label, color, width };
  };

  const strength = getPasswordStrength();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (signupMode === "invite_only") {
      setErrorMessage(`${BRAND.name} is currently invite-only. Please contact ${contactEmail} for access.`);
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (password.length < 12) {
      setErrorMessage("Password must be at least 12 characters long for team workspace security.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    setLoading(true);

    try {
      const res = await signUp({
        email,
        password,
        fullName,
        companyName,
        plan: selectedPlan,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      if (res.requiresEmailConfirmation) {
        setRequiresConfirmation(true);
        setResendCooldown(60);
        setLoading(false);
      } else {
        // Direct session created - redirect according to approval status
        if (res.status === "approved" || isApproved) {
          router.replace("/dashboard");
        } else {
          router.replace("/pending");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await signUp({
        email,
        password,
        fullName,
        companyName,
      });
      setResendCooldown(60);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        {/* Left Column: Sign Up Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl flex flex-col justify-between">
          <div>
            {/* Top Brand Logo */}
            <div className="flex items-center space-x-3 mb-8">
              <RankLocalLogo size="sm" showTagline />
            </div>

            {requiresConfirmation ? (
              /* Confirmation Screen */
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <Mail className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Check your email
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                    We sent a confirmation link to <span className="font-semibold text-slate-900 dark:text-white">{email}</span>. Click the link to verify your email and complete your account request.
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-800 dark:text-slate-200 transition disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>
                      {resendCooldown > 0
                        ? `Resend email in ${resendCooldown}s`
                        : "Resend confirmation email"}
                    </span>
                  </button>

                  <div>
                    <Link
                      href="/login"
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block"
                    >
                      ← Return to sign in
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Sign Up Form */
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Create your {BRAND.name} account
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {signupMode === "open"
                      ? "Get instant access to the website builder and team dashboard."
                      : "Submit your account request to access the private website builder."}
                  </p>
                </div>

                {/* Invite-Only Banner if mode is active */}
                {signupMode === "invite_only" && (
                  <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-800 dark:text-amber-200 text-xs space-y-2">
                    <div className="flex items-center space-x-2 font-bold">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>{BRAND.name} is currently invite-only</span>
                    </div>
                    <p>
                      Public registration is closed. To request an invitation for your business or agency, please contact our team at:
                    </p>
                    <a
                      href={`mailto:${contactEmail}?subject=${encodeURIComponent(`${BRAND.name} Access Request`)}`}
                      className="inline-block font-semibold underline text-amber-900 dark:text-amber-100"
                    >
                      {contactEmail}
                    </a>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1">{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Plan Selection Widget */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Choose Workspace Plan:</span>
                      </span>
                      <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Compare plans →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlan("starter")}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          selectedPlan === "starter"
                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-1 ring-indigo-500 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>Starter</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">$99</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Up to 5 static websites
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan("agency")}
                        className={`p-2.5 rounded-xl border text-left transition relative ${
                          selectedPlan === "agency"
                            ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-white ring-1 ring-indigo-500 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-[9px] font-bold shadow-xs">
                          Best value
                        </span>
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>Agency</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">$499</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Up to 30 static websites
                        </div>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 pt-1">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>Payment integration coming soon — quota unlocks upon approval!</span>
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        disabled={signupMode === "invite_only"}
                        placeholder="John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Work or business email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        disabled={signupMode === "invite_only"}
                        autoComplete="email"
                        placeholder="john@lonestarplumbing.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Business / Company Name (Optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Company or trade business name
                      </label>
                      <span className="text-[11px] text-slate-400">Optional</span>
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        disabled={signupMode === "invite_only"}
                        placeholder="Lone Star Plumbing LLC"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Password with Strength Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password (min 12 chars)
                      </label>
                      {password.length > 0 && (
                        <span className="text-[11px] font-semibold text-slate-500">
                          {strength.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={signupMode === "invite_only"}
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {password.length > 0 && (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        disabled={signupMode === "invite_only"}
                        autoComplete="new-password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start space-x-2 pt-1">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      disabled={signupMode === "invite_only"}
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" target="_blank" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || signupMode === "invite_only"}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account…</span>
                      </>
                    ) : (
                      <>
                        <span>{signupMode === "open" ? "Create Account & Start Building" : "Submit Account Request"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Bottom Login Link */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center mt-6">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column: Branded Panel */}
        <AuthBrandedPanel />
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SignUpForm />
    </React.Suspense>
  );
}
