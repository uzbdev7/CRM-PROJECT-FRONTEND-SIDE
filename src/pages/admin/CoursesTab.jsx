// src/pages/admin/CoursesTab.jsx
import { useEffect, useState } from "react";
import {
  Box, Typography, Chip, IconButton, TextField, InputAdornment,
  CircularProgress, Alert, Tooltip, Card, CardContent, Grid,
  Divider, Collapse, Button, Modal, Avatar, Slide,
  Select, MenuItem, FormControl, InputLabel, FormHelperText,
} from "@mui/material";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon       from "@mui/icons-material/RefreshRounded";
import ExpandMoreRoundedIcon    from "@mui/icons-material/ExpandMoreRounded";
import GroupsRoundedIcon        from "@mui/icons-material/GroupsRounded";
import AccessTimeRoundedIcon    from "@mui/icons-material/AccessTimeRounded";
import AttachMoneyRoundedIcon   from "@mui/icons-material/AttachMoneyRounded";
import SchoolRoundedIcon        from "@mui/icons-material/SchoolRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import MenuBookRoundedIcon      from "@mui/icons-material/MenuBookRounded";
import CloseRoundedIcon         from "@mui/icons-material/CloseRounded";
import AddRoundedIcon           from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon     from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import OpenInNewRoundedIcon     from "@mui/icons-material/OpenInNewRounded";
import { courseApi }            from "../../api/apiService.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const WEEKDAY_UZ = {
  MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Cho",
  THURSDAY: "Pa", FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Ya",
};

const fmtPrice = (p) => {
  if (!p) return "—";
  return Number(p).toLocaleString("uz-UZ") + " so'm";
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

const COURSE_COLORS = [
  { accent: "#7c3aed", light: "#f5f3ff" },
  { accent: "#0ea5e9", light: "#f0f9ff" },
  { accent: "#16a34a", light: "#f0fdf4" },
  { accent: "#ea580c", light: "#fff7ed" },
  { accent: "#db2777", light: "#fdf2f8" },
  { accent: "#ca8a04", light: "#fefce8" },
];
const courseColor = (i) => COURSE_COLORS[i % COURSE_COLORS.length];

const StatusChip = ({ status }) => {
  const cfg =
    status === "ACTIVE"   ? { bg: "#f0fdf4", color: "#16a34a", label: "Faol"    } :
    status === "INACTIVE" ? { bg: "#f3f4f6", color: "#6b7280", label: "Nofaol"  } :
                            { bg: "#fefce8", color: "#ca8a04", label: status     };
  return (
    <Chip label={cfg.label} size="small"
      sx={{ fontSize: 11, height: 20, fontWeight: 700, bgcolor: cfg.bg, color: cfg.color }} />
  );
};

// ── Group Detail Modal ─────────────────────────────────────────────────────
function GroupModal({ group, c, onClose }) {
  if (!group) return null;
  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.2, borderBottom: "1px solid #f9fafb" }}>
      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: c.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{value}</Typography>
      </Box>
    </Box>
  );
  return (
    <Modal open onClose={onClose}>
      <Box sx={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: { xs: "92vw", sm: 420 },
        bgcolor: "#fff", borderRadius: 3,
        boxShadow: "0 24px 64px rgba(0,0,0,0.14)",
        outline: "none", overflow: "hidden",
      }}>
        <Box sx={{ bgcolor: c.light, px: 3, pt: 3, pb: 2, borderBottom: `1px solid ${c.accent}22` }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ width: 38, height: 38, bgcolor: c.accent, fontWeight: 800, fontSize: 15 }}>
                {group.name[0]}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{group.name}</Typography>
                <StatusChip status={group.status} />
              </Box>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af" }}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 1 }}>
          <InfoRow icon={<CalendarMonthRoundedIcon sx={{ fontSize: 16, color: c.accent }} />} label="Boshlanish" value={fmtDate(group.startDate)} />
          <InfoRow icon={<AccessTimeRoundedIcon sx={{ fontSize: 16, color: c.accent }} />} label="Dars vaqti" value={group.startTime || "—"} />
          <Box sx={{ py: 1.2, borderBottom: "1px solid #f9fafb" }}>
            <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, mb: 0.8 }}>Dars kunlari</Typography>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
              {(group.weeKDays || []).map(d => (
                <Chip key={d} label={WEEKDAY_UZ[d] || d} size="small"
                  sx={{ fontSize: 11, height: 24, fontWeight: 700, bgcolor: c.light, color: c.accent }} />
              ))}
            </Box>
          </Box>
        </Box>
        <Box sx={{ px: 3, pb: 2.5, pt: 1.5 }}>
          <Button fullWidth variant="contained" onClick={onClose}
            sx={{ borderRadius: 2, textTransform: "none", bgcolor: c.accent, fontWeight: 600, boxShadow: "none",
              "&:hover": { bgcolor: c.accent, filter: "brightness(.9)", boxShadow: "none" } }}>
            Yopish
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ── Course Card ────────────────────────────────────────────────────────────
function CourseCard({ course, index, animDelay }) {
  const [expanded,   setExpanded]   = useState(false);
  const [groupModal, setGroupModal] = useState(null);
  const c = courseColor(index);
  return (
    <>
      <Card elevation={0} sx={{
        border: "1px solid #f3f4f6", borderRadius: 3, overflow: "hidden",
        transition: "transform .2s, box-shadow .2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: `0 8px 24px ${c.accent}18`, borderColor: `${c.accent}30` },
        animation: `fadeUp .4s ${animDelay}s both`,
        "@keyframes fadeUp": {
          from: { opacity: 0, transform: "translateY(16px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      }}>
        <Box sx={{ height: 3, bgcolor: c.accent }} />
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: c.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MenuBookRoundedIcon sx={{ fontSize: 22, color: c.accent }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{course.name}</Typography>
                <StatusChip status={course.status} />
              </Box>
              {course.description && (
                <Typography sx={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {course.description}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 1, mb: 2 }}>
            {[
              { Icon: AccessTimeRoundedIcon,  label: "Davomiylik", value: `${course.durationMonth} oy` },
              { Icon: SchoolRoundedIcon,       label: "Darslar",    value: `${course.durationLesson} ta` },
              { Icon: AttachMoneyRoundedIcon,  label: "Narx",       value: fmtPrice(course.price) },
              { Icon: GroupsRoundedIcon,       label: "Guruhlar",   value: `${course.groups?.length || 0} ta` },
            ].map(({ Icon, label, value }) => (
              <Box key={label} sx={{ bgcolor: c.light, borderRadius: 2, p: 1.2, textAlign: "center" }}>
                <Icon sx={{ fontSize: 16, color: c.accent, mb: 0.3 }} />
                <Typography sx={{ fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>{label}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{value}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Box onClick={() => setExpanded(p => !p)} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", py: 0.5, "&:hover .tl": { color: c.accent } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <GroupsRoundedIcon sx={{ fontSize: 16, color: c.accent }} />
              <Typography className="tl" sx={{ fontSize: 13, fontWeight: 600, color: "#374151", transition: "color .15s" }}>Guruhlar</Typography>
              <Chip label={course.groups?.length || 0} size="small"
                sx={{ fontSize: 11, height: 20, fontWeight: 700, bgcolor: c.light, color: c.accent }} />
            </Box>
            <ExpandMoreRoundedIcon sx={{ fontSize: 20, color: "#9ca3af", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .25s cubic-bezier(.4,0,.2,1)" }} />
          </Box>

          <Collapse in={expanded} timeout={280}>
            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
              {(course.groups || []).length === 0 ? (
                <Typography sx={{ fontSize: 12, color: "#9ca3af", textAlign: "center", py: 1.5 }}>Guruhlar yo'q</Typography>
              ) : (
                (course.groups || []).map(g => (
                  <Box key={g.id} onClick={(e) => { e.stopPropagation(); setGroupModal(g); }}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.2, borderRadius: 2, border: "1px solid #f3f4f6", cursor: "pointer", transition: "all .15s", "&:hover": { bgcolor: c.light, borderColor: `${c.accent}30` } }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: c.accent, fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{g.name[0]}</Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.name}</Typography>
                        <StatusChip status={g.status} />
                      </Box>
                      <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                        {g.startTime} • {(g.weeKDays || []).map(d => WEEKDAY_UZ[d] || d).join(", ")}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{fmtDate(g.startDate)}</Typography>
                  </Box>
                ))
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {groupModal && <GroupModal group={groupModal} c={c} onClose={() => setGroupModal(null)} />}
    </>
  );
}

// ── Add Course Page (slide-in) ─────────────────────────────────────────────
const EMPTY_FORM = { name: "", durationMonth: "", durationLesson: "", status: "ACTIVE", price: "", description: "" };

function AddCoursePage({ onBack, onAdded }) {
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name          = "Kurs nomi kiritilishi shart";
    if (!form.durationMonth)        e.durationMonth  = "Davomiylik (oy) kiritilishi shart";
    if (!form.durationLesson)       e.durationLesson = "Darslar soni kiritilishi shart";
    if (!form.price)                e.price          = "Narx kiritilishi shart";
    if (Number(form.durationMonth) <= 0) e.durationMonth = "0 dan katta bo'lishi kerak";
    if (Number(form.durationLesson) <= 0) e.durationLesson = "0 dan katta bo'lishi kerak";
    if (Number(form.price) <= 0)    e.price          = "0 dan katta bo'lishi kerak";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true); setSaveErr("");
    try {
      const body = {
        name:           form.name.trim(),
        durationMonth:  Number(form.durationMonth),
        durationLesson: Number(form.durationLesson),
        status:         form.status,
        price:          Number(form.price),
        description:    form.description.trim(),
      };
      const res = await courseApi.create(body);
      const newCourse = res?.data || res;
      setSuccess(true);
      onAdded(newCourse);
      setTimeout(() => { setSuccess(false); setForm(EMPTY_FORM); onBack(); }, 1800);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2, fontSize: 14,
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
  };

  return (
    <Box sx={{
      animation: "slideIn .3s cubic-bezier(.4,0,.2,1) both",
      "@keyframes slideIn": {
        from: { opacity: 0, transform: "translateX(32px)" },
        to:   { opacity: 1, transform: "translateX(0)" },
      },
    }}>
      {/* Page header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton onClick={onBack} sx={{ color: "#6b7280", "&:hover": { bgcolor: ACCENT_BG, color: ACCENT } }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>Yangi kurs qo'shish</Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>Kurs ma'lumotlarini to'ldiring</Typography>
        </Box>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid #f3f4f6", borderRadius: 3, maxWidth: 640 }}>
        {/* Card top bar */}
        <Box sx={{ height: 3, bgcolor: ACCENT, borderRadius: "12px 12px 0 0" }} />
        <CardContent sx={{ p: 3 }}>

          {/* Success state */}
          {success && (
            <Box sx={{
              display: "flex", flexDirection: "column", alignItems: "center",
              py: 5, gap: 1.5,
              animation: "popIn .3s cubic-bezier(.4,0,.2,1) both",
              "@keyframes popIn": {
                from: { opacity: 0, transform: "scale(.85)" },
                to:   { opacity: 1, transform: "scale(1)" },
              },
            }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 52, color: "#16a34a" }} />
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Kurs muvaffaqiyatli qo'shildi!</Typography>
              <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>Kurslar ro'yxatiga qaytmoqda...</Typography>
            </Box>
          )}

          {!success && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

              {/* Kurs nomi */}
              <TextField
                label="Kurs nomi *"
                placeholder="Masalan: Node.js, React, Python..."
                value={form.name}
                onChange={e => set("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth size="small"
                sx={fieldSx}
              />

              {/* Davomiylik + Darslar */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="Davomiylik (oy) *"
                  placeholder="Masalan: 8"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.durationMonth}
                  onChange={e => set("durationMonth", e.target.value)}
                  error={!!errors.durationMonth}
                  helperText={errors.durationMonth}
                  size="small" sx={fieldSx}
                />
                <TextField
                  label="Darslar soni *"
                  placeholder="Masalan: 180"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.durationLesson}
                  onChange={e => set("durationLesson", e.target.value)}
                  error={!!errors.durationLesson}
                  helperText={errors.durationLesson}
                  size="small" sx={fieldSx}
                />
              </Box>

              {/* Narx + Status */}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="Narx (so'm) *"
                  placeholder="Masalan: 3000000"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={form.price}
                  onChange={e => set("price", e.target.value)}
                  error={!!errors.price}
                  helperText={errors.price || (form.price ? fmtPrice(form.price) : "")}
                  size="small" sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoneyRoundedIcon sx={{ fontSize: 17, color: "#9ca3af" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl size="small" sx={fieldSx}>
                  <InputLabel sx={{ "&.Mui-focused": { color: ACCENT } }}>Status *</InputLabel>
                  <Select
                    value={form.status}
                    label="Status *"
                    onChange={e => set("status", e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="ACTIVE">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a" }} />
                        Faol
                      </Box>
                    </MenuItem>
                    <MenuItem value="INACTIVE">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#6b7280" }} />
                        Nofaol
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Tavsif */}
              <TextField
                label="Tavsif"
                placeholder="Kurs haqida qisqacha ma'lumot..."
                value={form.description}
                onChange={e => set("description", e.target.value)}
                multiline rows={3}
                fullWidth size="small"
                sx={fieldSx}
              />

              {saveErr && (
                <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>{saveErr}</Alert>
              )}

              {/* Buttons */}
              <Box sx={{ display: "flex", gap: 1.5, pt: 0.5 }}>
                <Button
                  variant="outlined"
                  onClick={onBack}
                  disabled={saving}
                  sx={{
                    borderRadius: 2, textTransform: "none", fontWeight: 600,
                    borderColor: "#e5e7eb", color: "#6b7280",
                    "&:hover": { borderColor: "#9ca3af", bgcolor: "#f9fafb" },
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <AddRoundedIcon />}
                  sx={{
                    flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 600,
                    bgcolor: ACCENT, boxShadow: "none",
                    "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
                  }}
                >
                  {saving ? "Saqlanmoqda..." : "Kurs qo'shish"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CoursesTab() {
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [addPage,  setAddPage]  = useState(false); // slide-in page

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await courseApi.getAll();
      setCourses(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdded = (newCourse) => {
    if (newCourse?.id) setCourses(p => [newCourse, ...p]);
    else load(); // fallback: reload
  };

  const filtered = courses.filter(c =>
    `${c.name || ""} ${c.description || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const totalGroups   = courses.reduce((s, c) => s + (c.groups?.length || 0), 0);
  const activeCourses = courses.filter(c => c.status === "ACTIVE").length;

  // ── Add Course page ──
  if (addPage) {
    return <AddCoursePage onBack={() => setAddPage(false)} onAdded={handleAdded} />;
  }

  // ── Courses list ──
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>Kurslar</Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
            {courses.length} ta kurs • {activeCourses} ta faol • {totalGroups} ta guruh
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Yangilash">
            <IconButton onClick={load} sx={{ color: "#6b7280" }}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setAddPage(true)}
            sx={{
              borderRadius: 2, textTransform: "none", fontWeight: 600,
              fontSize: 13, bgcolor: ACCENT, boxShadow: "none",
              px: 2, py: 0.9,
              "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
              animation: "fadeIn .4s both",
              "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
            }}
          >
            Kurs qo'shish
          </Button>
        </Box>
      </Box>

      {/* Summary chips */}
      {!loading && courses.length > 0 && (
        <Box sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: `${courses.length} ta kurs`,  bg: ACCENT_BG, color: ACCENT },
            { label: `${totalGroups} ta guruh`,     bg: "#f0fdf4", color: "#16a34a" },
            { label: `${activeCourses} ta faol`,    bg: "#eff6ff", color: "#2563eb" },
          ].map(({ label, bg, color }) => (
            <Chip key={label} label={label} size="small"
              sx={{ fontSize: 12, height: 26, fontWeight: 700, bgcolor: bg, color }} />
          ))}
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Search */}
      <TextField
        fullWidth size="small"
        placeholder="Kurs nomi bo'yicha qidirish..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={30} sx={{ color: ACCENT }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <MenuBookRoundedIcon sx={{ fontSize: 40, color: "#e5e7eb", mb: 1 }} />
          <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>
            {search ? "Natija topilmadi" : "Kurslar yo'q"}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((course, i) => (
            <Grid item xs={12} md={6} key={course.id}>
              <CourseCard course={course} index={i} animDelay={i * 0.07} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}