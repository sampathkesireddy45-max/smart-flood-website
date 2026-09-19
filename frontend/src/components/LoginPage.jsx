import React, { useState } from "react";
import {
  ShieldAlert,
  Smartphone,
  AlertTriangle,
  Lock,
  ArrowRight,
  ShieldCheck,
  Users,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import { api } from "../services/api";
import { useToast } from "./Toast";

export const LoginPage = ({ onLoginSuccess }) => {
  const { addToast } = useToast();

  // Portals: "citizen" | "admin"
  const [portal, setPortal] = useState("citizen");

  // Citizen Form State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [dispatchedOtp, setDispatchedOtp] = useState(null);
  const [citizenLoading, setCitizenLoading] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Admin Form State (Password Authentication - Confidential & Not Visible to Public)
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const handleSwitchPortal = (newPortal) => {
    setPortal(newPortal);
    setStep("phone");
    setOtp("");
    setDispatchedOtp(null);
    setErrorMsg("");
    setPhone("");
    setAdminUsername("");
    setAdminPassword("");
  };

  // 1-Click Instant Emergency Citizen Access (Zero Data / Transmits Distress Location to Admin)
  const handleEmergencyAccess = async () => {
    setErrorMsg("");
    setEmergencyLoading(true);

    // Capture real-time GPS coordinates of the evacuating citizen
    let locationPayload = { latitude: 13.0827, longitude: 80.2707 };
    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 3500,
            enableHighAccuracy: true,
          });
        });
        if (pos?.coords) {
          locationPayload = {
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          };
        }
      } catch (_) {
        // Fallback to default metropolitan flood-basin center
      }
    }

    try {
      const res = await api.emergencyAccess(locationPayload);
      if (res?.access_token && res?.user) {
        localStorage.setItem("suraksha_token", res.access_token);
        localStorage.setItem("suraksha_user", JSON.stringify(res.user));
        localStorage.setItem("suraksha_role", "citizen");
        addToast("🚨 Live Evacuation Pass Activated! Distress beacon received at Command Center.", "success");
        onLoginSuccess(res.user);
      } else {
        throw new Error("Could not initialize emergency pass");
      }
    } catch (err) {
      setErrorMsg("Failed to generate emergency pass. Please try again.");
      addToast("Emergency pass activation failed", "error");
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Citizen Standard Phone Verification Request
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg("");
    setDispatchedOtp(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setCitizenLoading(true);
    try {
      const res = await api.requestOtp(cleanPhone, "citizen");
      if (res.success) {
        if (res.dev_otp) {
          setDispatchedOtp(res.dev_otp);
        }
        setStep("otp");
        addToast(`Verification code dispatched for +91 ${cleanPhone}!`, "success");
      } else {
        setErrorMsg(res.message || "Failed to dispatch verification code.");
      }
    } catch (err) {
      const detail = err?.message || "Failed to send code.";
      setErrorMsg(detail.replace("API error: 403 ", "").replace("API error: 400 ", ""));
      addToast("Failed to request code", "error");
    } finally {
      setCitizenLoading(false);
    }
  };

  // Citizen OTP Verification
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    if (!otp.trim()) {
      setErrorMsg("Please enter the verification code.");
      return;
    }

    setCitizenLoading(true);
    try {
      const res = await api.verifyOtp(phone.replace(/\D/g, ""), otp.trim(), "citizen", false);
      if (res.access_token && res.user) {
        localStorage.setItem("suraksha_token", res.access_token);
        localStorage.setItem("suraksha_user", JSON.stringify(res.user));
        localStorage.setItem("suraksha_role", res.user.role);
        addToast("Authenticated as Citizen", "success");
        onLoginSuccess(res.user);
      }
    } catch (err) {
      const detail = err?.message || "Invalid or expired code.";
      setErrorMsg(detail.replace("API error: 400 ", ""));
      addToast("Verification failed", "error");
    } finally {
      setCitizenLoading(false);
    }
  };

  // Admin Confidential Password Authentication (NO OTP, Private Credentials)
  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    setErrorMsg("");

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setErrorMsg("Please enter administrator username/email and password.");
      return;
    }

    setAdminLoading(true);
    try {
      const res = await api.adminLogin(adminUsername.trim(), adminPassword.trim());
      if (res?.access_token && res?.user) {
        localStorage.setItem("suraksha_token", res.access_token);
        localStorage.setItem("suraksha_user", JSON.stringify(res.user));
        localStorage.setItem("suraksha_role", res.user.role);
        addToast("Authority Clearance Verified: Welcome to Command Center", "success");
        onLoginSuccess(res.user);
      }
    } catch (err) {
      const detail = err?.message || "Invalid administrative credentials. Access denied.";
      setErrorMsg(detail.replace("API error: 401 ", ""));
      addToast("Access Denied: Invalid Credentials", "error");
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-4">

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 shadow-xl shadow-brand-500/25 ring-1 ring-white/20 mb-1">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Urban Flood Nowcasting System
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Smart Urban Flood Nowcasting & Decision Platform
          </p>

          <div className="flex items-center justify-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Radar & Hydrological Telemetry</span>
            </div>
          </div>
        </div>

        {/* Portal Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSwitchPortal("citizen")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              portal === "citizen"
                ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Citizen Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchPortal("admin")}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
              portal === "admin"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-5">

          {/* CITIZEN PORTAL */}
          {portal === "citizen" ? (
            <div className="space-y-4">
              
              {/* PRIMARY FEATURE: 1-Click Instant Emergency Pass */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-950/70 via-slate-900 to-slate-950 border border-brand-500/40 shadow-lg shadow-brand-500/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-brand-400" />
                    Life-Safety Priority
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                    <Shield className="w-3 h-3" />
                    100% Private
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Instant Emergency Evacuation Pass
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    Zero personal data required. Transmits your distress beacon to the Municipal Command Center and opens live safe evacuation routes immediately.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEmergencyAccess}
                  disabled={emergencyLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {emergencyLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enter Live Evacuation Map Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* DIVIDER */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                  Or Standard Citizen Access
                </span>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">{errorMsg}</div>
                </div>
              )}

              {/* Phone Verification Step */}
              {step === "phone" ? (
                <form onSubmit={handleRequestOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Mobile Number (Optional Link)
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
                        placeholder="Enter 10-digit number"
                        className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white font-mono tracking-wider placeholder:text-slate-600 focus:border-brand-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={citizenLoading || phone.length < 10}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    {citizenLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Get Verification Code</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: OTP Verification */
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                    <span className="font-mono font-bold text-white">+91 {phone}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setOtp("");
                        setDispatchedOtp(null);
                        setErrorMsg("");
                      }}
                      className="text-[11px] text-brand-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {dispatchedOtp && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-brand-500/40 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Verification Code:</span>
                        <span className="text-base font-black tracking-widest text-brand-300 font-mono">
                          {dispatchedOtp}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtp(dispatchedOtp);
                          addToast("Code auto-filled!", "success");
                        }}
                        className="py-1 px-2.5 rounded-lg bg-brand-600/30 hover:bg-brand-600/50 text-brand-300 text-[11px] font-semibold flex items-center gap-1 border border-brand-500/40"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Fill</span>
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm font-mono tracking-widest text-center text-white placeholder:text-slate-600 focus:border-brand-500 focus:outline-none transition-all"
                    autoFocus
                    required
                  />

                  <button
                    type="submit"
                    disabled={citizenLoading || otp.length < 4}
                    className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {citizenLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & Continue"}
                  </button>
                </form>
              )}

            </div>
          ) : (
            /* ADMIN / AUTHORITY PORTAL (CONFIDENTIAL PASSWORD AUTHENTICATION - NO OTP) */
            <div className="space-y-4">
              <div className="space-y-1.5 text-center">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Restricted Access
                </div>
                <h2 className="text-base font-bold text-white">
                  Command Center Authentication
                </h2>
                <p className="text-[11px] text-slate-400">
                  Authorized personnel only. Enter your administrator ID and secure password to access disaster dispatch operations.
                </p>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">{errorMsg}</div>
                </div>
              )}

              {/* Secure Password-Based Admin Form */}
              <form onSubmit={handleAdminLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Administrator ID / Email
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Enter administrator ID"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none transition-all"
                      required
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none transition-all"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading || !adminUsername.trim() || !adminPassword.trim()}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50 mt-2"
                >
                  {adminLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Authenticate & Open Command Center</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 space-y-0.5">
          <p>Urban Flood Nowcasting System • Zero-Knowledge Emergency Disaster Network</p>
          <p className="text-slate-600">Disaster Emergency Helpline: 112 / 1077</p>
        </div>

      </div>
    </div>
  );
};
