import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Smartphone,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Compass,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  RefreshCw,
  Settings,
  X,
  Radio,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";

export const LoginPage = ({ onLoginSuccess }) => {
  const { addToast } = useToast();
  
  // Portals: "citizen" | "admin"
  const [portal, setPortal] = useState("citizen");
  
  // Form State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [realSmsSent, setRealSmsSent] = useState(false);
  const [smsProvider, setSmsProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Auth & SMS Config from backend
  const [adminPhone, setAdminPhone] = useState("9573198929");
  const [systemMode, setSystemMode] = useState("LIVE");
  const [smsGatewayConfigured, setSmsGatewayConfigured] = useState(false);
  const [activeGatewayName, setActiveGatewayName] = useState(null);
  
  // SMS Gateway Settings Modal
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [fast2smsKey, setFast2smsKey] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState("");
  const [savingSmsConfig, setSavingSmsConfig] = useState(false);

  const fetchConfig = () => {
    api.getAuthConfig()
      .then((cfg) => {
        if (cfg?.admin_phone) setAdminPhone(cfg.admin_phone);
        if (cfg?.mode) setSystemMode(cfg.mode.toUpperCase());
        if (cfg?.sms_configured !== undefined) setSmsGatewayConfigured(cfg.sms_configured);
        if (cfg?.active_sms_provider) setActiveGatewayName(cfg.active_sms_provider);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSwitchPortal = (newPortal) => {
    setPortal(newPortal);
    setStep("phone");
    setOtp("");
    setRealSmsSent(false);
    setErrorMsg("");
    setPhone("");
  };

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg("");
    
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (portal === "admin" && cleanPhone !== adminPhone) {
      setErrorMsg(
        `ACCESS DENIED: Mobile number (+91 ${cleanPhone}) is NOT authorized for Municipal Authority Administration. Authorized Admin line only (+91 ${adminPhone}).`
      );
      addToast("Unauthorized admin mobile number", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestOtp(cleanPhone, portal);
      if (res.success) {
        setRealSmsSent(Boolean(res.real_sms_sent));
        setSmsProvider(res.sms_provider || null);
        setStep("otp");
        if (res.real_sms_sent) {
          addToast(`📲 Verification code sent via SMS to +91 ${cleanPhone}!`, "success");
        } else {
          addToast("Verification code dispatched!", "info");
        }
      } else {
        setErrorMsg(res.message || "Failed to dispatch OTP.");
      }
    } catch (err) {
      const detail = err?.message || "Failed to send OTP.";
      setErrorMsg(detail.replace("API error: 403 ", "").replace("API error: 400 ", ""));
      addToast("Failed to request OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    if (!otp.trim()) {
      setErrorMsg("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(phone.replace(/\D/g, ""), otp.trim(), portal);
      if (res.access_token && res.user) {
        localStorage.setItem("suraksha_token", res.access_token);
        localStorage.setItem("suraksha_user", JSON.stringify(res.user));
        localStorage.setItem("suraksha_role", res.user.role);
        addToast(`Authenticated as ${res.user.role === "authority" ? "Municipal Authority Admin" : "Citizen"}`, "success");
        onLoginSuccess(res.user);
      }
    } catch (err) {
      const detail = err?.message || "Invalid or expired OTP.";
      setErrorMsg(detail.replace("API error: 400 ", "").replace("API error: 403 ", ""));
      addToast("Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setPhone(adminPhone);
    setErrorMsg("");
  };

  const handleQuickFillCitizen = () => {
    setPhone("9876501234");
    setErrorMsg("");
  };

  const handleSaveSmsConfig = async (e) => {
    e.preventDefault();
    setSavingSmsConfig(true);
    try {
      const payload = {};
      if (fast2smsKey.trim()) payload.fast2sms_api_key = fast2smsKey.trim();
      if (twilioSid.trim()) payload.twilio_account_sid = twilioSid.trim();
      if (twilioToken.trim()) payload.twilio_auth_token = twilioToken.trim();
      if (twilioFrom.trim()) payload.twilio_phone_number = twilioFrom.trim();

      const res = await api.updateSmsConfig(payload);
      setSmsGatewayConfigured(res.sms_configured);
      setActiveGatewayName(res.active_sms_provider);
      addToast(res.message || "SMS Gateway configuration updated!", "success");
      setIsSmsModalOpen(false);
    } catch (err) {
      addToast("Failed to save SMS credentials: " + err.message, "error");
    } finally {
      setSavingSmsConfig(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-xl shadow-brand-500/25 ring-1 ring-white/20 mb-2">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            SURAKSHA-FLOOD
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Urban Flood Management & Decision Support Platform
          </p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mode: <strong className="text-emerald-400">{systemMode} TELEMETRY</strong></span>
            </div>

            {/* Live SMS Gateway Indicator */}
            <button
              type="button"
              onClick={() => setIsSmsModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
                smsGatewayConfigured
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>
                SMS: <strong>{activeGatewayName || "Setup Real SMS"}</strong>
              </span>
              <Settings className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          </div>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSwitchPortal("citizen")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              portal === "citizen"
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Citizen Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchPortal("admin")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
              portal === "admin"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
          
          {/* Portal Context Banner */}
          {portal === "citizen" ? (
            <div className="space-y-1 text-center">
              <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <Compass className="w-4 h-4 text-brand-400" />
                Public & Citizen Access
              </h2>
              <p className="text-xs text-slate-400">
                Log in via Mobile OTP to access live street flood maps, dynamic safe routing, and community hazard reporting.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                Restricted Clearance
              </div>
              <h2 className="text-base font-bold text-white">
                Municipal Authority Operations
              </h2>
              <p className="text-xs text-slate-400">
                Authorized for Municipal Disaster Leads only. Opens exclusively for the designated authority mobile number.
              </p>
              <div className="mt-2 text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/40 rounded-xl p-2.5 flex items-center justify-between">
                <span>Designated Admin: <strong>+91 {adminPhone}</strong></span>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all shadow-sm"
                >
                  Fill Number
                </button>
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Step 1: Mobile Number Input */}
          {step === "phone" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Mobile Phone Number</span>
                  {portal === "citizen" && (
                    <button
                      type="button"
                      onClick={handleQuickFillCitizen}
                      className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Use Demo (+91 9876501234)
                    </button>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-400">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-16 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white font-mono tracking-wider placeholder:text-slate-600 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  portal === "admin"
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 disabled:opacity-50"
                    : "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30 disabled:opacity-50"
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code (OTP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification Input */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">Verifying Number</span>
                  <span className="font-mono font-bold text-white">+91 {phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setErrorMsg("");
                  }}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  Change Number
                </button>
              </div>

              {/* Verification Delivery Notification */}
              {realSmsSent ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>SMS OTP DISPATCHED</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-200/90">
                    A 6-digit verification code has been sent via SMS to <strong>+91 {phone}</strong> ({smsProvider}). Please check your phone's SMS messages and enter the code below.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-brand-400" />
                      <span>Verification Code Sent</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSmsModalOpen(true)}
                      className="text-[11px] text-brand-400 hover:text-brand-300 underline flex items-center gap-1 font-medium"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Configure Real SMS</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enter the 6-digit verification code dispatched for <strong>+91 {phone}</strong>.
                  </p>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span>Testing fallback code: <code className="text-slate-300 font-mono bg-slate-800 px-1 py-0.5 rounded">123456</code></span>
                    <span className="text-slate-500">Valid for 10 mins</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter received 6-digit code"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm font-mono tracking-widest text-center text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                  portal === "admin"
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 disabled:opacity-50"
                    : "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30 disabled:opacity-50"
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Enter {portal === "admin" ? "Authority Command" : "Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Didn't receive code? <span className="text-brand-400 underline">Resend Code</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Live GIS & Real-World Telemetry Notice */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Real-World Radar Telemetry • Open-Meteo & OpenStreetMap Feeds</p>
          <p className="text-[10px] text-slate-600">
            Emergency helpline: 112 / 1077 • Municipal Disaster Management Cell
          </p>
        </div>

      </div>

      {/* SMS Gateway Settings Modal */}
      {isSmsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Real SMS Gateway Setup</h3>
                  <p className="text-[11px] text-slate-400">Deliver genuine OTP SMS to any Indian mobile number</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSmsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Gateway:</span>
                <span className="font-bold text-emerald-400">
                  {activeGatewayName || "None (Simulation Mode)"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 pt-1">
                Indian telecom rules (TRAI) require registered gateways to deliver SMS. For zero-setup testing, Fast2SMS Quick OTP route works instantly without DLT paperwork.
              </p>
            </div>

            <form onSubmit={handleSaveSmsConfig} className="space-y-4 text-xs">
              {/* Option 1: Fast2SMS */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Fast2SMS (Recommended for India)</span>
                  <a
                    href="https://www.fast2sms.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>fast2sms.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[10px] text-slate-400">
                  Free signup credits provided. Enter your <strong>Dev API Authorization Key</strong>:
                </p>
                <input
                  type="text"
                  value={fast2smsKey}
                  onChange={(e) => setFast2smsKey(e.target.value)}
                  placeholder="Paste Fast2SMS API Key"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Option 2: Twilio */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Twilio (International)</span>
                  <a
                    href="https://www.twilio.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-brand-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>twilio.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="Twilio Account SID"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    placeholder="Twilio Auth Token"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={twilioFrom}
                    onChange={(e) => setTwilioFrom(e.target.value)}
                    placeholder="Twilio Phone Number (e.g. +1234567890)"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSmsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSmsConfig}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-1.5"
                >
                  {savingSmsConfig ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Enable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
