import React, { useEffect, useState } from "react";
import { TrendingUp, AlertCircle } from "lucide-react";

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "brand",
  badge,
  onClick,
  isLive = true
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Smooth numeric counter animation
  useEffect(() => {
    if (typeof value === "number") {
      let start = 0;
      const duration = 600; // ms
      const steps = 25;
      const stepTime = duration / steps;
      const increment = value / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [value]);

  const variantStyles = {
    brand: {
      border: "border-brand-500/20 hover:border-brand-500/40",
      bg: "bg-slate-900/80 hover:bg-slate-900",
      iconBg: "bg-brand-500/10 text-brand-400",
      glow: "hover:shadow-brand-500/10"
    },
    critical: {
      border: "border-rose-500/30 hover:border-rose-500/60",
      bg: "bg-rose-950/20 hover:bg-rose-950/30",
      iconBg: "bg-rose-500/20 text-rose-400",
      glow: "hover:shadow-rose-500/20"
    },
    warning: {
      border: "border-amber-500/30 hover:border-amber-500/60",
      bg: "bg-amber-950/20 hover:bg-amber-950/30",
      iconBg: "bg-amber-500/20 text-amber-400",
      glow: "hover:shadow-amber-500/20"
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      bg: "bg-emerald-950/20 hover:bg-emerald-950/30",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      glow: "hover:shadow-emerald-500/10"
    }
  };

  const style = variantStyles[variant] || variantStyles.brand;

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl border backdrop-blur-md transition-all duration-200 hover-lift ${style.border} ${style.bg} ${style.glow} ${onClick ? "cursor-pointer active:scale-[0.98]" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              {typeof value === "number" ? displayValue : value}
            </span>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                badge === "CRITICAL" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse" :
                badge === "HIGH" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                "bg-brand-500/20 text-brand-300 border border-brand-500/30"
              }`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
          {isLive ? "Live Telemetry" : "Cached Model"}
        </span>
        <span className="text-slate-400 font-mono">Real-time DB</span>
      </div>
    </div>
  );
};
