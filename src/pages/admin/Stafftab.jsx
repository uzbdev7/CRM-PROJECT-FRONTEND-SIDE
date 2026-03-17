// src/pages/admin/StaffTab.jsx
import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Avatar, Chip, Drawer,
  TextField, MenuItem, IconButton, Divider, CircularProgress,
  InputAdornment, Tooltip,
} from "@mui/material";
import AddRoundedIcon           from "@mui/icons-material/AddRounded";
import CloseRoundedIcon         from "@mui/icons-material/CloseRounded";
import BadgeRoundedIcon         from "@mui/icons-material/BadgeRounded";
import EmailRoundedIcon         from "@mui/icons-material/EmailRounded";
import LockRoundedIcon          from "@mui/icons-material/LockRounded";
import WorkRoundedIcon          from "@mui/icons-material/WorkRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PersonRoundedIcon        from "@mui/icons-material/PersonRounded";
import UploadRoundedIcon        from "@mui/icons-material/UploadRounded";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import DeleteRoundedIcon        from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import { userApi, registerUser } from "../../api/apiService.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const ROLES = [
  { value: "ADMIN",         label: "Admin",         color: "#f59e0b", bg: "#fefce8" },
  { value: "ADMINISTRATOR", label: "Administrator", color: "#16a34a", bg: "#f0fdf4" },
  { value: "MANAGEMENT",    label: "Management",    color: "#0ea5e9", bg: "#f0f9ff" },
];

const roleStyle = (role) =>
  ROLES.find(r => r.value === role) || { color: "#6b7280", bg: "#f3f4f6", label: role };

const INIT_FORM = {
  fullName: "", email: "", password: "",
  position: "", role: "", hire_date: "",
};

export default function StaffTab() {
  const [staff,    setStaff]    = useState([]);
  const [load,     setLoad]     = useState(true);
  const [search,   setSearch]   = useState("");
  const [open,     setOpen]     = useState(false);
  const [form,     setForm]     = useState(INIT_FORM);
  const [photo,    setPhoto]    = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});

  // ── Load staff ──────────────────────────────────────────────────────────
  useEffect(() => {
    userApi.getAll()
      .then(data => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setStaff(list.filter(u =>
          ["ADMIN", "ADMINISTRATOR", "MANAGEMENT"].includes(u.role)
        ));
      })
      .catch(() => setStaff([]))
      .finally(() => setLoad(false));
  }, []);

  // ── Filtered ────────────────────────────────────────────────────────────
  const filtered = staff.filter(u =>
    u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Photo change ────────────────────────────────────────────────────────
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  // ── Validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "To'liq ism kiritilsin";
    if (!form.email.trim())    e.email    = "Email kiritilsin";
    if (!form.password)        e.password = "Parol kiritilsin";
    if (!form.role)            e.role     = "Rol tanlansin";
    if (!form.hire_date)       e.hire_date= "Sana kiritilsin";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append("photo", photo);

      const newUser = await registerUser(fd);

      // Yangi hodimni listga qo'shish
      setStaff(p => [{
        id: newUser.userId,
        fullName: form.fullName,
        email: form.email,
        role: form.role,
        position: form.position,
        hire_date: form.hire_date,
        photo: preview,
      }, ...p]);

      setOpen(false);
      setForm(INIT_FORM);
      setPhoto(null);
      setPreview(null);
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.message || "Xato yuz berdi" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setForm(INIT_FORM);
    setPhoto(null);
    setPreview(null);
    setErrors({});
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-.5px" }}>
            Hodimlar
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af", mt: 0.3 }}>
            Jami {staff.length} ta hodim
          </Typography>
        </Box>
        <Button
          onClick={() => setOpen(true)}
          startIcon={<AddRoundedIcon />}
          variant="contained"
          sx={{
            bgcolor: ACCENT, borderRadius: 2.5, textTransform: "none",
            fontWeight: 700, fontSize: 14, px: 2.5, py: 1.2,
            boxShadow: `0 4px 14px ${ACCENT}40`,
            "&:hover": { bgcolor: "#6d28d9", boxShadow: `0 6px 20px ${ACCENT}50` },
          }}
        >
          Hodim qo'shish
        </Button>
      </Box>

      {/* ── Search ── */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Ism, email yoki rol bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: "#9ca3af", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5, bgcolor: "#ecedef",
              "& fieldset": { borderColor: "#e5e7eb" },
              "&:hover fieldset": { borderColor: ACCENT + "60" },
              "&.Mui-focused fieldset": { borderColor: ACCENT },
            },
          }}
        />
      </Box>

      {/* ── Staff list ── */}
      {load ? (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
          <CircularProgress sx={{ color: ACCENT }} size={32} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{
          textAlign: "center", py: 10,
          bgcolor: "#ecedef", borderRadius: 3, border: "1px solid #e5e7eb",
        }}>
          <BadgeRoundedIcon sx={{ fontSize: 48, color: "#e5e7eb", mb: 1 }} />
          <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>
            {search ? "Hodim topilmadi" : "Hodimlar yo'q"}
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          bgcolor: "#ecedef", borderRadius: 3,
          border: "1px solid #e5e7eb", overflow: "hidden",
        }}>
          {/* Table header */}
          <Box sx={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.5fr 100px",
            px: 2.5, py: 1.5,
            bgcolor: "#e2e4e7", borderBottom: "1px solid #d1d5db",
          }}>
            {["Hodim", "Email", "Rol", ""].map((h, i) => (
              <Typography key={i} sx={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".5px" }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Rows */}
          {filtered.map((u, i) => {
            const rs = roleStyle(u.role);
            return (
              <Box
                key={u.id || i}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1.5fr 100px",
                  px: 2.5, py: 1.8,
                  borderBottom: i < filtered.length - 1 ? "1px solid #d1d5db" : "none",
                  alignItems: "center",
                  transition: "background .15s",
                  "&:hover": { bgcolor: "#e2e4e7" },
                  animation: `fadeUp .35s ${i * 0.04}s both`,
                  "@keyframes fadeUp": {
                    from: { opacity: 0, transform: "translateY(8px)" },
                    to:   { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                {/* Hodim */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar
                    src={u.photo ? `http://localhost:5005${u.photo}` : undefined}
                    sx={{
                      width: 38, height: 38, fontSize: 14, fontWeight: 700,
                      bgcolor: ACCENT, boxShadow: `0 2px 8px ${ACCENT}30`,
                    }}
                  >
                    {u.fullName?.[0]?.toUpperCase() || "?"}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                      {u.fullName}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                      #{u.id}
                    </Typography>
                  </Box>
                </Box>

                {/* Email */}
                <Typography sx={{ fontSize: 13, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.email}
                </Typography>

                {/* Rol */}
                <Chip
                  label={rs.label}
                  size="small"
                  sx={{
                    fontSize: 11, height: 22, fontWeight: 700,
                    bgcolor: rs.bg, color: rs.color,
                    width: "fit-content",
                  }}
                />

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Tahrirlash">
                    <IconButton size="small" sx={{ color: ACCENT, "&:hover": { bgcolor: ACCENT_BG } }}>
                      <EditRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="O'chirish">
                    <IconButton size="small" sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}>
                      <DeleteRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* ── Add Drawer ── */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 440 },
            borderRadius: "16px 0 0 16px",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

          {/* Drawer header */}
          <Box sx={{
            px: 3, py: 2.5,
            borderBottom: "1px solid #f3f4f6",
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
                <BadgeRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>
                  Yangi hodim qo'shish
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                  Admin panel foydalanuvchisi
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleClose} size="small" sx={{ color: "#9ca3af", "&:hover": { bgcolor: "#f3f4f6" } }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          {/* Form body */}
          <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 3 }}>

            {/* Photo upload */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Box sx={{ position: "relative", mb: 1.5 }}>
                <Avatar
                  src={preview}
                  sx={{
                    width: 88, height: 88, fontSize: 28, fontWeight: 700,
                    bgcolor: ACCENT, boxShadow: `0 4px 16px ${ACCENT}40`,
                    border: `3px solid ${ACCENT}30`,
                  }}
                >
                  {form.fullName?.[0]?.toUpperCase() || <PersonRoundedIcon sx={{ fontSize: 36 }} />}
                </Avatar>
                <Box
                  component="label"
                  htmlFor="photo-upload"
                  sx={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 28, height: 28, borderRadius: "50%",
                    bgcolor: ACCENT, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 2px 8px ${ACCENT}50`,
                    "&:hover": { bgcolor: "#6d28d9" },
                    transition: "background .15s",
                  }}
                >
                  <UploadRoundedIcon sx={{ color: "#fff", fontSize: 14 }} />
                </Box>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhoto}
                />
              </Box>
              <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>
                Profil rasmini yuklang
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Fields */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

              {/* Full name */}
              <InputField
                label="To'liq ism *"
                placeholder="Sardor Toshmatov"
                value={form.fullName}
                onChange={v => setForm(p => ({ ...p, fullName: v }))}
                error={errors.fullName}
                icon={<PersonRoundedIcon />}
              />

              {/* Email */}
              <InputField
                label="Email *"
                placeholder="sardor@example.com"
                value={form.email}
                onChange={v => setForm(p => ({ ...p, email: v }))}
                error={errors.email}
                icon={<EmailRoundedIcon />}
                type="email"
              />

              {/* Password */}
              <InputField
                label="Parol *"
                placeholder="Kamida 8 ta belgi"
                value={form.password}
                onChange={v => setForm(p => ({ ...p, password: v }))}
                error={errors.password}
                icon={<LockRoundedIcon />}
                type="password"
              />

              {/* Role */}
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.8 }}>
                  Rol *
                </Typography>
                <TextField
                  select fullWidth size="small"
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  error={!!errors.role}
                  helperText={errors.role}
                  sx={inputSx}
                >
                  {ROLES.map(r => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: r.color }} />
                        {r.label}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Position */}
              <InputField
                label="Lavozim"
                placeholder="Senior Mentor"
                value={form.position}
                onChange={v => setForm(p => ({ ...p, position: v }))}
                icon={<WorkRoundedIcon />}
              />

              {/* Hire date */}
              <InputField
                label="Ishga kirish sanasi *"
                value={form.hire_date}
                onChange={v => setForm(p => ({ ...p, hire_date: v }))}
                error={errors.hire_date}
                icon={<CalendarMonthRoundedIcon />}
                type="date"
              />

            </Box>

            {/* Submit error */}
            {errors.submit && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "#fef2f2", borderRadius: 2, border: "1px solid #fecaca" }}>
                <Typography sx={{ fontSize: 13, color: "#dc2626" }}>{errors.submit}</Typography>
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box sx={{
            px: 3, py: 2.5,
            borderTop: "1px solid #f3f4f6",
            display: "flex", gap: 1.5,
          }}>
            <Button
              fullWidth
              onClick={handleClose}
              variant="outlined"
              sx={{
                borderRadius: 2.5, textTransform: "none", fontWeight: 600,
                borderColor: "#e5e7eb", color: "#374151",
                "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
              }}
            >
              Bekor qilish
            </Button>
            <Button
              fullWidth
              onClick={handleSubmit}
              variant="contained"
              disabled={saving}
              sx={{
                borderRadius: 2.5, textTransform: "none", fontWeight: 700,
                bgcolor: ACCENT, boxShadow: `0 4px 14px ${ACCENT}40`,
                "&:hover": { bgcolor: "#6d28d9" },
                "&:disabled": { bgcolor: ACCENT + "60" },
              }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Saqlash"}
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}

// ── Reusable input ──────────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#7c3aed60" },
    "&.Mui-focused fieldset": { borderColor: "#7c3aed" },
  },
};

function InputField({ label, placeholder, value, onChange, error, icon, type = "text" }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#374151", mb: 0.8 }}>
        {label}
      </Typography>
      <TextField
        fullWidth size="small"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {icon && <Box sx={{ color: "#9ca3af", display: "flex", fontSize: 18 }}>{icon}</Box>}
            </InputAdornment>
          ),
        }}
        InputLabelProps={type === "date" ? { shrink: true } : undefined}
        sx={inputSx}
      />
    </Box>
  );
}