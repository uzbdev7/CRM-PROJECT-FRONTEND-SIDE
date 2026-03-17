// src/pages/admin/StudentsTab.jsx
import { useEffect, useState } from "react";
import {
  Box, Typography, Avatar, Chip, IconButton,
  TextField, InputAdornment, Button, Drawer, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert, Tooltip, Divider,
} from "@mui/material";
import SearchRoundedIcon      from "@mui/icons-material/SearchRounded";
import DeleteRoundedIcon      from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon        from "@mui/icons-material/EditRounded";
import AddRoundedIcon         from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon     from "@mui/icons-material/RefreshRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import CloseRoundedIcon       from "@mui/icons-material/CloseRounded";
import PeopleAltRoundedIcon   from "@mui/icons-material/PeopleAltRounded";
import PersonRoundedIcon      from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon       from "@mui/icons-material/EmailRounded";
import LockRoundedIcon        from "@mui/icons-material/LockRounded";
import CakeRoundedIcon        from "@mui/icons-material/CakeRounded";
import { studentApi }         from "../../api/apiService.js";
import { API_BASE }           from "../../utils/constants.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";
const EMPTY_FORM = { fullName: "", email: "", password: "", birt_date: "", photo: null };

const toPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/\\/g, "/");
  const base  = API_BASE.replace("/api", "");
  return `${base}${clean}`;
};

export default function StudentsTab() {
  const [students,     setStudents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [search,       setSearch]       = useState("");
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [editId,       setEditId]       = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [formErr,      setFormErr]      = useState("");
  const [delId,        setDelId]        = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await studentApi.getAll();
      setStudents(Array.isArray(data) ? data : (data.data || []));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // ── Open create ───────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM);
    setPhotoPreview(null); setFormErr("");
    setDrawerOpen(true);
  };

  // ── Open edit ─────────────────────────────────────────────────────────────
  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      fullName:  s.fullName  || "",
      email:     s.email     || "",
      password:  "",
      birt_date: s.birt_date ? s.birt_date.split("T")[0] : "",
      photo:     null,
    });
    setPhotoPreview(s.photo ? toPhotoUrl(s.photo) : null);
    setFormErr(""); setDrawerOpen(true);
  };

  // ── Close drawer ──────────────────────────────────────────────────────────
  const handleClose = () => {
    setDrawerOpen(false); setForm(EMPTY_FORM);
    setPhotoPreview(null); setFormErr(""); setEditId(null);
  };

  // ── Photo change ──────────────────────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(p => ({ ...p, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) { setFormErr("Ism va email majburiy!"); return; }
    if (!editId && !form.password.trim())             { setFormErr("Parol majburiy!"); return; }
    if (!editId && !form.birt_date)                   { setFormErr("Tug'ilgan sana majburiy!"); return; }

    setSaving(true); setFormErr("");
    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("email",    form.email);
      if (form.password)  fd.append("password",  form.password);
      if (form.birt_date) fd.append("birt_date", new Date(form.birt_date).toISOString());
      if (form.photo)     fd.append("photo",     form.photo);

      if (editId) {
        await studentApi.update(editId, fd);
      } else {
        await studentApi.create(fd);
      }
      await load();    // ← ro'yxatni qayta yukla (rasm ham chiqadi)
      handleClose();
    } catch (e) { setFormErr(e.message); }
    finally { setSaving(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await studentApi.delete(delId);
      setStudents(p => p.filter(s => s.id !== delId));
      setDelId(null);
    } catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const filtered   = students.filter(s =>
    `${s.fullName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#111827", letterSpacing: "-.5px" }}>
            Talabalar
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af", mt: 0.3 }}>
            {students.length} ta talaba
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Yangilash">
            <IconButton onClick={load} sx={{ color: "#6b7280" }}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
          <Button onClick={openCreate} variant="contained" startIcon={<AddRoundedIcon />}
            sx={{
              bgcolor: ACCENT, textTransform: "none", borderRadius: 2.5,
              fontWeight: 700, fontSize: 13, px: 2.5, py: 1.2,
              boxShadow: `0 4px 14px ${ACCENT}40`,
              "&:hover": { bgcolor: "#6d28d9", boxShadow: `0 6px 20px ${ACCENT}50` },
            }}>
            Talaba qo'shish
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField fullWidth size="small" placeholder="Qidirish (ism, email)..."
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5, bgcolor: "#ecedef",
              "& fieldset": { borderColor: "#e5e7eb" },
              "&:hover fieldset": { borderColor: `${ACCENT}60` },
              "&.Mui-focused fieldset": { borderColor: ACCENT },
            },
          }}
        />
      </Box>

      {/* Table */}
      <Box sx={{ bgcolor: "#ecedef", borderRadius: 3, border: "1px solid #e5e7eb", overflow: "hidden" }}>

        {/* Table header */}
        <Box sx={{
          display: "grid", gridTemplateColumns: "50px 2fr 2fr 1.5fr 1fr 100px",
          px: 2.5, py: 1.5, bgcolor: "#e2e4e7", borderBottom: "1px solid #d1d5db",
        }}>
          {["#", "Talaba", "Email", "Tug'ilgan sana", "Holat", "Amallar"].map((h, i) => (
            <Typography key={i} sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>
              {h}
            </Typography>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <PeopleAltRoundedIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }} />
            <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
              {search ? "Natija topilmadi" : "Talabalar yo'q"}
            </Typography>
          </Box>
        ) : filtered.map((s, i) => (
          <Box key={s.id || i} sx={{
            display: "grid", gridTemplateColumns: "50px 2fr 2fr 1.5fr 1fr 100px",
            px: 2.5, py: 1.8, alignItems: "center",
            borderBottom: i < filtered.length - 1 ? "1px solid #d1d5db" : "none",
            transition: "background .15s",
            "&:hover": { bgcolor: "#e2e4e7" },
            animation: `fadeUp .35s ${i * 0.03}s both`,
            "@keyframes fadeUp": {
              from: { opacity: 0, transform: "translateY(8px)" },
              to:   { opacity: 1, transform: "translateY(0)" },
            },
          }}>
            <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>{i + 1}</Typography>

            {/* Talaba */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={toPhotoUrl(s.photo)}
                sx={{ width: 36, height: 36, bgcolor: "#3b82f6", fontSize: 13, fontWeight: 700 }}
              >
                {s.fullName?.[0] || "S"}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.fullName}</Typography>
                <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>ID: {s.id}</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>{s.email}</Typography>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>{formatDate(s.birt_date)}</Typography>

            <Chip label={s.status || "ACTIVE"} size="small" sx={{
              fontSize: 11, height: 22, fontWeight: 600, width: "fit-content",
              bgcolor: s.status === "INACTIVE" ? "#fef2f2" : "#f0fdf4",
              color:   s.status === "INACTIVE" ? "#dc2626"  : "#16a34a",
            }} />

            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Tahrirlash">
                <IconButton size="small" onClick={() => openEdit(s)}
                  sx={{ color: ACCENT, "&:hover": { bgcolor: ACCENT_BG } }}>
                  <EditRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="O'chirish">
                <IconButton size="small" onClick={() => setDelId(s.id)}
                  sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}>
                  <DeleteRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Drawer ── */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, borderRadius: "16px 0 0 16px", boxShadow: "-8px 0 40px rgba(0,0,0,0.12)" } }}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Drawer header */}
          <Box sx={{
            px: 3, py: 2.5, borderBottom: "1px solid #f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: `linear-gradient(135deg, #3b82f608, #3b82f604)`,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px #3b82f640",
              }}>
                <PeopleAltRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>
                  {editId ? "Talabani tahrirlash" : "Yangi talaba qo'shish"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                  {editId ? "Ma'lumotlarni yangilang" : "Yangi talaba ma'lumotlarini kiriting"}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClose} size="small"
              sx={{ color: "#9ca3af", "&:hover": { bgcolor: "#f3f4f6" } }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          {/* Form body */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>

            {/* Photo upload */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Box sx={{ position: "relative", mb: 1.5 }}>
                <Avatar src={photoPreview} sx={{
                  width: 88, height: 88, bgcolor: "#3b82f6", fontSize: 28, fontWeight: 700,
                  border: "3px solid #3b82f630", boxShadow: "0 4px 16px #3b82f640",
                }}>
                  {form.fullName?.[0] || <PersonRoundedIcon sx={{ fontSize: 36 }} />}
                </Avatar>
                <Box component="label" htmlFor="student-photo-drawer" sx={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: "50%",
                  bgcolor: "#3b82f6", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px #3b82f650",
                  "&:hover": { bgcolor: "#2563eb" }, transition: "background .15s",
                }}>
                  <PhotoCameraRoundedIcon sx={{ color: "#fff", fontSize: 14 }} />
                </Box>
                <input id="student-photo-drawer" type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </Box>
              <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>Profil rasmini yuklang</Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {formErr && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formErr}</Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <LabeledField
                label="To'liq ism *" placeholder="Jovohir Turg'unov"
                value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))}
                icon={<PersonRoundedIcon />}
              />
              <LabeledField
                label="Email *" placeholder="student@example.com" type="email"
                value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))}
                icon={<EmailRoundedIcon />}
              />
              <LabeledField
                label={editId ? "Yangi parol (ixtiyoriy)" : "Parol *"}
                placeholder="Kamida 8 ta belgi" type="password"
                value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))}
                icon={<LockRoundedIcon />}
              />
              <LabeledField
                label="Tug'ilgan sana *" type="date"
                value={form.birt_date} onChange={v => setForm(p => ({ ...p, birt_date: v }))}
                icon={<CakeRoundedIcon />}
              />
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ px: 3, py: 2.5, borderTop: "1px solid #f3f4f6", display: "flex", gap: 1.5 }}>
            <Button fullWidth onClick={handleClose} variant="outlined"
              sx={{
                borderRadius: 2.5, textTransform: "none", fontWeight: 600,
                borderColor: "#e5e7eb", color: "#374151",
                "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
              }}>
              Bekor qilish
            </Button>
            <Button fullWidth onClick={handleSave} disabled={saving} variant="contained"
              sx={{
                borderRadius: 2.5, textTransform: "none", fontWeight: 700,
                bgcolor: ACCENT, boxShadow: `0 4px 14px ${ACCENT}40`,
                "&:hover": { bgcolor: "#6d28d9" },
              }}>
              {saving
                ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                : editId ? "Saqlash" : "Qo'shish"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* ── Delete confirm ── */}
      <Dialog open={!!delId} onClose={() => setDelId(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "#374151" }}>
            Bu talabani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDelId(null)} sx={{ color: "#6b7280", textTransform: "none" }}>
            Bekor qilish
          </Button>
          <Button onClick={handleDelete} disabled={deleting} variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, textTransform: "none", borderRadius: 2 }}>
            {deleting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Reusable labeled input ────────────────────────────────────────────────────
function LabeledField({ label, placeholder, value, onChange, icon, type = "text" }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.8 }}>
        {label}
      </Typography>
      <TextField
        fullWidth size="small" type={type}
        placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        InputLabelProps={type === "date" ? { shrink: true } : undefined}
        InputProps={{
          startAdornment: icon
            ? <InputAdornment position="start"><Box sx={{ color: "#9ca3af", display: "flex" }}>{icon}</Box></InputAdornment>
            : undefined,
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2, bgcolor: "#fff",
            "& fieldset": { borderColor: "#e5e7eb" },
            "&:hover fieldset": { borderColor: "#7c3aed60" },
            "&.Mui-focused fieldset": { borderColor: "#7c3aed" },
          },
        }}
      />
    </Box>
  );
}