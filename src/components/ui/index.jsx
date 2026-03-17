// src/components/ui/index.jsx
import { getInitials, getAvatarColor } from "../../utils/helpers.js";
import { ROLE_COLORS } from "../../utils/constants.js";
import { useEffect } from "react";

export function Avatar({ name = "", size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: getAvatarColor(name), color: "#07091A",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.36,
    }}>
      {getInitials(name)}
    </div>
  );
}

export function Badge({ role }) {
  const c = ROLE_COLORS[role] || { bg: "rgba(100,100,100,.1)", text: "#94A3B8", border: "rgba(100,100,100,.2)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: "nowrap",
    }}>{role}</span>
  );
}

export function Spinner({ size = 20, color = "#63DAB1" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}`, borderTopColor: "transparent",
      animation: "spin .8s linear infinite", flexShrink: 0,
    }} />
  );
}

export function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  const ok = msg.startsWith("✅");
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 500,
      border: "1px solid", animation: "fadeUp .3s ease",
      backdropFilter: "blur(12px)", maxWidth: 340,
      background: ok ? "rgba(99,218,177,.1)" : "rgba(239,68,68,.1)",
      color: ok ? "#63DAB1" : "#F87171",
      borderColor: ok ? "rgba(99,218,177,.25)" : "rgba(239,68,68,.25)",
    }}>{msg}</div>
  );
}

export function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.2)",
      borderRadius: 9, padding: "10px 13px", color: "#F87171",
      fontSize: 13, display: "flex", alignItems: "center", gap: 8,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {msg}
    </div>
  );
}

export function Card({ children, style = {}, className = "" }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, accent = "#63DAB1" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
      <div style={{ width: 3, height: 14, background: accent, borderRadius: 2 }} />
      <span style={{ color: "#E2E8F0", fontWeight: 600, fontSize: 14 }}>{children}</span>
    </div>
  );
}