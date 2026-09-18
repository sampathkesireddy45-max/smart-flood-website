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
  RefreshCw
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
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Auth Config from backend
  const [adminPhone, setAdminPhone] = useState("9876543210");
  const [systemMode, setSystemMode] = useState("LIVE");

  useEffect(() => {
    // Fetch backend auth config for exact designated admin phone
    api.getAuthConfig()
      .then((cfg) => {
        if (cfg?.admin_phone) setAdminPhone(cfg.admin_phone);
        if (cfg?.mode) setSystemMode(cfg.mode.toUpperCase());
      })
      .catch(() => {
        // Default admin phone 9876543210
      });
  }, []);

  const handleSwitchPortal = (newPortal) => {
    setPortal(newPortal);
    setStep("phone");
    setOtp("");
    setDevOtp(null);
    setErrorMsg("");
    if (newPortal === "admin") {
      setPhone(""); // Clear for user to enter
    } else {
      setPhone("");
    }
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
        setDevOtp(res.dev_otp);
        setStep("otp");
        addToast(res.message || "OTP sent successfully!", "success");
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mode: <strong className="text-emerald-400">{systemMode} TELEMETRY</strong></span>
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
                Log in via Mobile OTP to view safe navigation routes and submit real-time waterlogging reports.
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
              <div className="mt-2 text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/40 rounded-xl p-2 flex items-center justify-between">
                <span>Designated Admin: <strong>+91 {adminPhone}</strong></span>
                <button
                  type="button"
                  onClick={handleQuickFillAdmin}
                  className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all"
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
                  <span className="text-slate-500 block text-[10px]">Verifying</span>
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
                  Change
                </button>
              </div>

              {/* Dev helper code banner */}
              {devOtp && (
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>OTP Sent: <strong className="font-mono tracking-widest text-white text-sm">{devOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtp)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] transition-all"
                  >
                    Auto-Fill
                  </button>
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
                    placeholder="e.g. 123456"
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
                  Didn't receive code? <span className="text-brand-400 underline">Resend OTP</span>
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
    </div>
  );
};
