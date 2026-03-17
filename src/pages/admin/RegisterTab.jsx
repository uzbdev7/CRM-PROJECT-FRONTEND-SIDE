import { useState, useMemo } from "react";
import { teacherApi, studentApi } from "../../api/apiService.js";

const ROLES = [
  { value: "TEACHER", label: "O'qituvchi", color: "#6366f1" },
  { value: "STUDENT", label: "Talaba", color: "#22c55e" },
];

const EMPTY = {
  fullName: "", email: "", password: "", role: "TEACHER",
  experience: "", position: "", birt_date: "", photo: null,
};

export default function RegisterTab({ onUserAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k, v) => { 
    setForm(p => ({ ...p, [k]: v })); 
    if (error) setError(""); 
  };

  const applyPhoto = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    set("photo", file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const { fullName, email, password, role, photo, experience, position, birt_date } = form;
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Ism, email va parol majburiy!"); return;
    }

    setSaving(true); setError("");
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("email", email);
      fd.append("password", password);
      if (photo) fd.append("photo", photo);

      let created;
      if (role === "TEACHER") {
        if (experience) fd.append("experience", experience);
        if (position) fd.append("position", position);
        created = await teacherApi.create(fd);
      } else {
        if (birt_date) fd.append("birt_date", new Date(birt_date).toISOString());
        created = await studentApi.create(fd);
      }

      onUserAdded?.(created);
      setSuccess(true);
      setForm(EMPTY);
      setPhotoPreview(null);
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const activeRole = useMemo(() => ROLES.find(r => r.value === form.role), [form.role]);
  const C = activeRole?.color || "#6366f1";

  const fi = (e) => { e.target.style.borderColor = C; e.target.style.background = "#fff"; e.target.style.boxShadow = `0 0 0 4px ${C}15`; };
  const fo = (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none"; };

  return (
    <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "#f9fafb" }}>
      
      <div style={{
        width: "100%", maxWidth: 600, background: "#fff", borderRadius: 24, padding: "32px",
        boxShadow: "0 15px 60px rgba(1,5,6,0.04)", border: "1px solid #1116",
        animation: "cardIn .4s cubic-bezier(0, 0, 0.2, 1)"
      }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${C}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {form.role === "TEACHER" ? "👨‍🏫" : "🎓"}
          </div>
          <h2 style={{ margin: 0, color: "#1e293c", fontSize: 20, fontWeight: 800 }}>Yangi {activeRole?.label} qo'shish</h2>
        </div>

        {success && <div style={msgSuccess}>✅ Muvaffaqiyatli saqlandi!</div>}
        {error && <div style={msgError}>⚠️ {error}</div>}

        {/* Role Selector */}
        <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => set("role", r.value)} style={{
              flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14,
              transition: "all .2s", border: "2px solid",
              background: form.role === r.value ? `${r.color}10` : "transparent",
              borderColor: form.role === r.value ? r.color : "#f1f5f9",
              color: form.role === r.value ? r.color : "#94a3b8",
            }}>
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          
          {/* Photo Dropzone */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); applyPhoto(e.dataTransfer.files[0]); }} 
              style={{ ...dropzone, borderColor: dragOver ? C : "#e2e8f0", background: dragOver ? `${C}05` : "#fcfdfe" }}>
              <input type="file" hidden accept="image/*" onChange={e => applyPhoto(e.target.files[0])} />
              {photoPreview ? (
                <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                  <img src={photoPreview} style={{ width: 55, height: 55, borderRadius: "50%", objectFit: "cover", border: `3px solid ${C}` }} alt="P" />
                  <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>Rasm yuklandi ✓</span>
                </div>
              ) : <span style={{ color: "#94a3b8", fontSize: 14, fontWeight: 800 }}>📷 Profil rasmini yuklash</span>}
            </label>
          </div>

          <div style={{ gridColumn: form.role === "STUDENT" ? "1 / -1" : "span 1" }}>
            <label style={lab}>To'liq ism *</label>
            <input style={inp} placeholder="Axrorbek Mengilov" value={form.fullName} onChange={e => set("fullName", e.target.value)} onFocus={fi} onBlur={fo} />
          </div>

          <div style={{ gridColumn: form.role === "STUDENT" ? "1 / -1" : "span 1" }}>
            <label style={lab}>Email *</label>
            <input style={inp} placeholder="misol@tatu.uz" type="email" value={form.email} onChange={e => set("email", e.target.value)} onFocus={fi} onBlur={fo} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={lab}>Parol *</label>
            <input style={inp} type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} onFocus={fi} onBlur={fo} />
          </div>

          {form.role === "TEACHER" ? (
            <>
              <div>
                <label style={lab}>Lavozim</label>
                <input style={inp} placeholder="Senior Mentor" value={form.position} onChange={e => set("position", e.target.value)} onFocus={fi} onBlur={fo} />
              </div>
              <div>
                <label style={lab}>Tajriba (yil)</label>
                <input style={inp} type="number" placeholder="5" value={form.experience} onChange={e => set("experience", e.target.value)} onFocus={fi} onBlur={fo} />
              </div>
            </>
          ) : (
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lab}>Tug'ilgan sana</label>
              <input style={inp} type="date" value={form.birt_date} onChange={e => set("birt_date", e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
          )}

          <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
            <button onClick={handleSubmit} disabled={saving} style={{
              width: "100%", padding: "15px", borderRadius: 14, border: "none", fontWeight: 800, cursor: "pointer", fontSize: 15,
              background: saving ? "#e2e8f0" : C, color: "#fff", boxShadow: `0 8px 20px ${C}30`, transition: "all .2s"
            }}>
              {saving ? "Saqlanmoqda..." : `✓ ${activeRole?.label}ni saqlash`}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes cardIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:none; } }
        input::placeholder { color: #cbd5e1 !important; opacity: 1; }
      `}</style>
    </div>
  );
}

// Styles
const lab = { display: "block", fontSize: "11px", fontWeight: "800", color: "#64748b", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.5px" };
const inp = { width: "100%", padding: "13px 16px", borderRadius: "12px", border: "1.5px solid #e2e8f0", outline: "none", fontSize: "14px", background: "#f8fafc", color: "#1e293b", boxSizing: "border-box", transition: "all 0.2s" };
const dropzone = { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80px", borderRadius: "14px", border: "2px dashed #e2e8f0", cursor: "pointer", transition: "all 0.2s" };
const msgSuccess = { background: "#f0fdf4", color: "#166534", padding: "12px", borderRadius: "12px", marginBottom: "20px", fontSize: "14px", fontWeight: "600", border: "1px solid #bbf7d0" };
const msgError = { background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "12px", marginBottom: "20px", fontSize: "13px", border: "1px solid #fecaca" };