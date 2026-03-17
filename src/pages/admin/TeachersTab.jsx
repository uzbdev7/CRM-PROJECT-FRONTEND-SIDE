// src/pages/admin/TeachersTab.jsx
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
import SchoolRoundedIcon      from "@mui/icons-material/SchoolRounded";
import PersonRoundedIcon      from "@mui/icons-material/PersonRounded";
import EmailRoundedIcon       from "@mui/icons-material/EmailRounded";
import LockRoundedIcon        from "@mui/icons-material/LockRounded";
import WorkRoundedIcon        from "@mui/icons-material/WorkRounded";
import StarRoundedIcon        from "@mui/icons-material/StarRounded";
import { teacherApi } from "../../api/apiService.js";
import { API_BASE } from "../../utils/constants.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";
const EMPTY_FORM = { fullName: "", email: "", password: "", experience: "", position: "", photo: null };

const toPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/\\/g, "/");
  const base  = API_BASE.replace("/api", "");
  return `${base}${clean}`;   // ← StudentsTab bilan bir xil qilindi
};

export default function TeachersTab() {
  const [teachers,     setTeachers]     = useState([]);
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
      const data = await teacherApi.getAll();
      setTeachers(Array.isArray(data) ? data : (data.data || []));
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
  const openEdit = (t) => {
    setEditId(t.id);
    setForm({
      fullName:   t.fullName   || "",
      email:      t.email      || "",
      password:   "",
      experience: t.experience || "",
      position:   t.position   || "",
      photo:      null,
    });
    setPhotoPreview(t.photo ? toPhotoUrl(t.photo) : null);
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

  // ── SAVE (ENG MUHIM O‘ZGARISH — endi darrov yangilanadi!) ─────────────────
  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      setFormErr("Ism va email majburiy!");
      return;
    }
    if (!editId && !form.password.trim()) {
      setFormErr("Parol majburiy!");
      return;
    }

    setSaving(true); setFormErr("");
    try {
      const fd = new FormData();
      fd.append("fullName", form.fullName);
      fd.append("email",    form.email);
      if (form.password)   fd.append("password", form.password);
      if (form.experience) fd.append("experience", form.experience);
      if (form.position)   fd.append("position", form.position);
      if (form.photo)      fd.append("photo", form.photo);

      if (editId) {
        await teacherApi.update(editId, fd);
      } else {
        await teacherApi.create(fd);
      }

      await load();          // ← Student paneldagidek darrov yangilaydi
      handleClose();
    } catch (e) {
      setFormErr(e.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await teacherApi.delete(delId);
      setTeachers(p => p.filter(t => t.id !== delId));
      setDelId(null);
    } catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const filtered = teachers.filter(t =>
    `${t.fullName} ${t.email} ${t.position || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#111827", letterSpacing: "-.5px" }}>
            O'qituvchilar
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af", mt: 0.3 }}>
            {teachers.length} ta o'qituvchi
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
            O'qituvchi qo'shish
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
        <TextField fullWidth size="small" placeholder="Qidirish (ism, email, lavozim)..."
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
          display: "grid", gridTemplateColumns: "50px 2fr 2fr 1.5fr 1fr 1fr 100px",
          px: 2.5, py: 1.5, bgcolor: "#e2e4e7", borderBottom: "1px solid #d1d5db",
        }}>
          {["#", "O'qituvchi", "Email", "Lavozim", "Tajriba", "Holat", "Amallar"].map((h, i) => (
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
            <SchoolRoundedIcon sx={{ fontSize: 48, color: "#d1d5db", mb: 1 }} />
            <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>
              {search ? "Natija topilmadi" : "O'qituvchilar yo'q"}
            </Typography>
          </Box>
        ) : filtered.map((t, i) => (
          <Box key={t.id || i} sx={{
            display: "grid", gridTemplateColumns: "50px 2fr 2fr 1.5fr 1fr 1fr 100px",
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

            {/* O'qituvchi */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={toPhotoUrl(t.photo)}
                sx={{ width: 36, height: 36, bgcolor: ACCENT, fontSize: 13, fontWeight: 700, boxShadow: `0 2px 8px ${ACCENT}30` }}
              >
                {t.fullName?.[0] || "T"}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{t.fullName}</Typography>
                <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>ID: {t.id}</Typography>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>{t.email}</Typography>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>{t.position || "—"}</Typography>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>{t.experience ? `${t.experience} yil` : "—"}</Typography>

            <Chip label={t.status || "ACTIVE"} size="small" sx={{
              fontSize: 11, height: 22, fontWeight: 600, width: "fit-content",
              bgcolor: t.status === "INACTIVE" ? "#fef2f2" : "#f0fdf4",
              color:   t.status === "INACTIVE" ? "#dc2626"  : "#16a34a",
            }} />

            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="Tahrirlash">
                <IconButton size="small" onClick={() => openEdit(t)}
                  sx={{ color: ACCENT, "&:hover": { bgcolor: ACCENT_BG } }}>
                  <EditRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="O'chirish">
                <IconButton size="small" onClick={() => setDelId(t.id)}
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
            background: `linear-gradient(135deg, ${ACCENT}08, ${ACCENT}04)`,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: `linear-gradient(135deg, ${ACCENT}, #b06ef3)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 12px ${ACCENT}40`,
              }}>
                <SchoolRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>
                  {editId ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                  {editId ? "Ma'lumotlarni yangilang" : "O'qituvchi ma'lumotlarini kiriting"}
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
                  width: 88, height: 88, bgcolor: ACCENT, fontSize: 28, fontWeight: 700,
                  border: `3px solid ${ACCENT}30`, boxShadow: `0 4px 16px ${ACCENT}40`,
                }}>
                  {form.fullName?.[0] || <PersonRoundedIcon sx={{ fontSize: 36 }} />}
                </Avatar>
                <Box component="label" htmlFor="teacher-photo-drawer" sx={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: "50%",
                  bgcolor: ACCENT, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 8px ${ACCENT}50`,
                  "&:hover": { bgcolor: "#6d28d9" }, transition: "background .15s",
                }}>
                  <PhotoCameraRoundedIcon sx={{ color: "#fff", fontSize: 14 }} />
                </Box>
                <input id="teacher-photo-drawer" type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </Box>
              <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>Profil rasmini yuklang</Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {formErr && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formErr}</Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <LabeledField
                label="To'liq ism *" placeholder="Sardor Toshmatov"
                value={form.fullName} onChange={v => setForm(p => ({ ...p, fullName: v }))}
                icon={<PersonRoundedIcon />}
              />
              <LabeledField
                label="Email *" placeholder="teacher@example.com" type="email"
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
                label="Lavozim" placeholder="Senior Mentor"
                value={form.position} onChange={v => setForm(p => ({ ...p, position: v }))}
                icon={<WorkRoundedIcon />}
              />
              <LabeledField
                label="Tajriba (yil)" placeholder="5" type="number"
                value={form.experience} onChange={v => setForm(p => ({ ...p, experience: v }))}
                icon={<StarRoundedIcon />}
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
            Bu o'qituvchini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
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