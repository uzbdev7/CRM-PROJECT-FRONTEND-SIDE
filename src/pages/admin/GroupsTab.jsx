// src/pages/admin/GroupsTab.jsx
import GroupDetailPage from "./GroupDetailPage.jsx";
import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  InputAdornment, CircularProgress, Alert, Tooltip, Button, Avatar,
  AvatarGroup, Switch, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, FormControl, InputLabel, Select, MenuItem,
  Divider, Modal,
} from "@mui/material";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import DeleteRoundedIcon        from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon       from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon           from "@mui/icons-material/AddRounded";
import PeopleAltRoundedIcon     from "@mui/icons-material/PeopleAltRounded";
import SchoolRoundedIcon        from "@mui/icons-material/SchoolRounded";
import GroupsRoundedIcon        from "@mui/icons-material/GroupsRounded";
import CloseRoundedIcon         from "@mui/icons-material/CloseRounded";
import MeetingRoomRoundedIcon   from "@mui/icons-material/MeetingRoomRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AccessTimeRoundedIcon    from "@mui/icons-material/AccessTimeRounded";
import CheckRoundedIcon         from "@mui/icons-material/CheckRounded";
import MenuBookRoundedIcon      from "@mui/icons-material/MenuBookRounded";
import PersonRoundedIcon        from "@mui/icons-material/PersonRounded";
import {
  groupApi, courseApi, studentApi,
  teacherApi, studentGroupApi, roomApi,
} from "../../api/apiService.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const WEEKDAYS = [
  { key: "MONDAY",    uz: "Dushanba",  short: "Du"  },
  { key: "TUESDAY",   uz: "Seshanba",  short: "Se"  },
  { key: "WEDNESDAY", uz: "Chorshanba",short: "Cho" },
  { key: "THURSDAY",  uz: "Payshanba", short: "Pa"  },
  { key: "FRIDAY",    uz: "Juma",      short: "Ju"  },
  { key: "SATURDAY",  uz: "Shanba",    short: "Sha" },
  { key: "SUNDAY",    uz: "Yakshanba", short: "Ya"  },
];

const COURSE_COLORS = [
  { bg: "#ede9fe", color: "#5b21b6", grad: "135deg,#7c3aed,#b06ef3" },
  { bg: "#dbeafe", color: "#1e40af", grad: "135deg,#2563eb,#60a5fa" },
  { bg: "#dcfce7", color: "#166534", grad: "135deg,#16a34a,#4ade80" },
  { bg: "#fef3c7", color: "#92400e", grad: "135deg,#d97706,#fbbf24" },
  { bg: "#fce7f3", color: "#9d174d", grad: "135deg,#db2777,#f472b6" },
  { bg: "#e0f2fe", color: "#0369a1", grad: "135deg,#0891b2,#38bdf8" },
];

const getCourseColor = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("node"))                        return COURSE_COLORS[0];
  if (n.includes("react") || n.includes("frontend")) return COURSE_COLORS[1];
  if (n.includes("python"))                      return COURSE_COLORS[2];
  if (n.includes("math"))                        return COURSE_COLORS[3];
  if (n.includes("ielts"))                       return COURSE_COLORS[4];
  return COURSE_COLORS[5];
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" })
  : "—";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2, fontSize: 14,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: ACCENT },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: ACCENT },
};

const EMPTY_FORM = {
  name: "", courseId: "", teacherId: "", roomId: "",
  startDate: "", startTime: "", weeKDays: [],
};

// ── Group Detail Modal ─────────────────────────────────────────────────────
function GroupDetailModal({ group, onClose }) {
  if (!group) return null;
  const cc   = getCourseColor(group.course?.name || "");
  const days = (group.weeKDays || group.daysOfWeek || []);
  const daysArr = Array.isArray(days) ? days : [];

  const InfoRow = ({ icon, label, value }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.2, borderBottom: "1px solid #f9fafb" }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: ACCENT_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{value || "—"}</Typography>
      </Box>
    </Box>
  );

  return (
    <Modal open onClose={onClose}>
      <Box sx={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: { xs: "92vw", sm: 480 },
        bgcolor: "#fff", borderRadius: 3,
        boxShadow: "0 32px 80px rgba(0,0,0,0.18)",
        outline: "none", overflow: "hidden",
        animation: "modalIn .25s cubic-bezier(.4,0,.2,1) both",
        "@keyframes modalIn": {
          from: { opacity: 0, transform: "translate(-50%,-48%) scale(.96)" },
          to:   { opacity: 1, transform: "translate(-50%,-50%) scale(1)" },
        },
      }}>
        {/* Header */}
        <Box sx={{ height: 4, background: `linear-gradient(${cc.grad})` }} />
        <Box sx={{
          px: 3, pt: 2.5, pb: 2,
          borderBottom: "1px solid #f3f4f6",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: 2.5,
              background: `linear-gradient(${cc.grad})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${cc.color}30`,
            }}>
              <GroupsRoundedIcon sx={{ fontSize: 26, color: "#fff" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-.3px" }}>
                {group.name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                <Chip
                  label={group.status?.toUpperCase() === "ACTIVE" ? "Faol" : "Nofaol"}
                  size="small"
                  sx={{
                    fontSize: 11, height: 20, fontWeight: 700,
                    bgcolor: group.status?.toUpperCase() === "ACTIVE" ? "#dcfce7" : "#fef2f2",
                    color:   group.status?.toUpperCase() === "ACTIVE" ? "#16a34a" : "#dc2626",
                  }}
                />
                {group.course?.name && (
                  <Chip label={group.course.name} size="small"
                    sx={{ fontSize: 11, height: 20, fontWeight: 700, bgcolor: cc.bg, color: cc.color }} />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af" }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, py: 1 }}>
          <InfoRow
            icon={<CalendarMonthRoundedIcon sx={{ fontSize: 17, color: ACCENT }} />}
            label="Boshlanish sanasi"
            value={fmtDate(group.startDate)}
          />
          <InfoRow
            icon={<AccessTimeRoundedIcon sx={{ fontSize: 17, color: ACCENT }} />}
            label="Dars vaqti"
            value={group.startTime || group.lessonTime || "—"}
          />
          <InfoRow
            icon={<SchoolRoundedIcon sx={{ fontSize: 17, color: ACCENT }} />}
            label="O'qituvchi"
            value={group.teacher?.fullName || "—"}
          />
          <InfoRow
            icon={<MeetingRoomRoundedIcon sx={{ fontSize: 17, color: ACCENT }} />}
            label="Xona"
            value={group.room?.name || "—"}
          />
          <InfoRow
            icon={<MenuBookRoundedIcon sx={{ fontSize: 17, color: ACCENT }} />}
            label="Kurs"
            value={group.course?.name || "—"}
          />

          {/* Dars kunlari */}
          <Box sx={{ py: 1.5, borderBottom: "1px solid #f9fafb" }}>
            <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, mb: 1 }}>Dars kunlari</Typography>
            {daysArr.length > 0 ? (
              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                {daysArr.map(k => {
                  const d = WEEKDAYS.find(w => w.key === k);
                  return (
                    <Chip key={k} label={d ? d.uz : k} size="small"
                      sx={{ fontSize: 11, height: 24, fontWeight: 700, bgcolor: ACCENT_BG, color: ACCENT }} />
                  );
                })}
              </Box>
            ) : (
              <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>—</Typography>
            )}
          </Box>

          {/* Talabalar soni */}
          <Box sx={{ py: 1.5 }}>
            <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, mb: 0.5 }}>Talabalar</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 1.5, bgcolor: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <PeopleAltRoundedIcon sx={{ fontSize: 18, color: "#16a34a" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
                {group._count?.studentGroups ?? group.studentCount ?? group.students?.length ?? 0}
                <Typography component="span" sx={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, ml: 0.5 }}>
                  ta talaba
                </Typography>
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button fullWidth variant="contained" onClick={onClose}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, bgcolor: ACCENT, boxShadow: "none",
              "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" } }}>
            Yopish
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ── Create / Edit Dialog ───────────────────────────────────────────────────
function GroupFormDialog({ open, onClose, onSaved, courses, teachers, rooms, editData }) {
  const isEdit = !!editData;
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      if (isEdit && editData) {
        setForm({
          name:      editData.name      || "",
          courseId:  editData.courseId  || editData.course?.id  || "",
          teacherId: editData.teacherId || editData.teacher?.id || "",
          roomId:    editData.roomId    || editData.room?.id    || "",
          startDate: editData.startDate ? editData.startDate.slice(0, 10) : "",
          startTime: editData.startTime || "",
          weeKDays:  editData.weeKDays  || [],
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({}); setSaveErr(""); setSuccess(false);
    }
  }, [open, editData]);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: "" })); };

  const toggleDay = (day) => {
    setForm(p => ({
      ...p,
      weeKDays: p.weeKDays.includes(day)
        ? p.weeKDays.filter(d => d !== day)
        : [...p.weeKDays, day],
    }));
    setErrors(p => ({ ...p, weeKDays: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name      = "Guruh nomi shart";
    if (!form.courseId)          e.courseId  = "Kurs tanlang";
    if (!form.teacherId)         e.teacherId = "O'qituvchi tanlang";
    if (!form.startDate)         e.startDate = "Boshlanish sanasi shart";
    if (!form.startTime)         e.startTime = "Dars vaqti shart";
    if (!form.weeKDays.length)   e.weeKDays  = "Kamida 1 kun tanlang";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true); setSaveErr("");
    try {
      const body = {
        name:      form.name.trim(),
        courseId:  Number(form.courseId),
        teacherId: Number(form.teacherId),
        startDate: form.startDate,
        startTime: form.startTime,
        weeKDays:  form.weeKDays,
        ...(form.roomId ? { roomId: Number(form.roomId) } : {}),
      };
      let res;
      if (isEdit) res = await groupApi.update(String(editData.id), body);
      else        res = await groupApi.create(body);
      const saved = res?.data || res;
      setSuccess(true);
      onSaved(saved, isEdit);
      setTimeout(() => { setSuccess(false); onClose(); }, 1600);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.18)" } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${ACCENT}, #b06ef3)` }} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, pt: 2.5, pb: 2, borderBottom: "1px solid #f3f4f6" }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 17, color: "#111827" }}>
            {isEdit ? "Guruhni tahrirlash" : "Yangi guruh qo'shish"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 0.2 }}>
            {isEdit ? "Ma'lumotlarni yangilang" : "Guruh ma'lumotlarini to'ldiring"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af" }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {success ? (
          <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", py: 5, gap: 1.5,
            animation: "popIn .3s cubic-bezier(.4,0,.2,1) both",
            "@keyframes popIn": { from: { opacity: 0, transform: "scale(.85)" }, to: { opacity: 1, transform: "scale(1)" } },
          }}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckRoundedIcon sx={{ fontSize: 34, color: "#16a34a" }} />
            </Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
              {isEdit ? "Guruh yangilandi!" : "Guruh muvaffaqiyatli qo'shildi!"}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {/* Guruh nomi */}
            <Grid item xs={12}>
              <TextField fullWidth label="Guruh nomi *" size="small"
                placeholder="N25, A1..."
                value={form.name} onChange={e => set("name", e.target.value)}
                error={!!errors.name} helperText={errors.name} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><GroupsRoundedIcon sx={{ fontSize: 17, color: "#9ca3af" }} /></InputAdornment> }}
              />
            </Grid>

            {/* Kurs */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!errors.courseId} sx={fieldSx}>
                <InputLabel sx={{ "&.Mui-focused": { color: ACCENT } }}>Kurs *</InputLabel>
                <Select value={form.courseId} label="Kurs *" onChange={e => set("courseId", e.target.value)} sx={{ borderRadius: 2 }}>
                  {courses.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ACCENT }} />
                        {c.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.courseId && <Typography sx={{ fontSize: 11, color: "#dc2626", mt: 0.5, ml: 1.5 }}>{errors.courseId}</Typography>}
              </FormControl>
            </Grid>

            {/* O'qituvchi */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!errors.teacherId} sx={fieldSx}>
                <InputLabel sx={{ "&.Mui-focused": { color: ACCENT } }}>O'qituvchi *</InputLabel>
                <Select value={form.teacherId} label="O'qituvchi *" onChange={e => set("teacherId", e.target.value)} sx={{ borderRadius: 2 }}>
                  {teachers.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 22, height: 22, bgcolor: ACCENT, fontSize: 10, fontWeight: 700 }}>{t.fullName?.[0] || "T"}</Avatar>
                        <Typography sx={{ fontSize: 13 }}>{t.fullName}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.teacherId && <Typography sx={{ fontSize: 11, color: "#dc2626", mt: 0.5, ml: 1.5 }}>{errors.teacherId}</Typography>}
              </FormControl>
            </Grid>

            {/* Xona */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel sx={{ "&.Mui-focused": { color: ACCENT } }}>Xona</InputLabel>
                <Select value={form.roomId} label="Xona" onChange={e => set("roomId", e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value=""><Typography sx={{ fontSize: 13, color: "#9ca3af" }}>— Tanlang —</Typography></MenuItem>
                  {rooms.map(r => (
                    <MenuItem key={r.id} value={r.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <MeetingRoomRoundedIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                        {r.name}
                        {r.capacity && <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>({r.capacity} kishi)</Typography>}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Boshlanish */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Boshlanish sanasi *" size="small" type="date"
                value={form.startDate} onChange={e => set("startDate", e.target.value)}
                error={!!errors.startDate} helperText={errors.startDate}
                InputLabelProps={{ shrink: true }} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthRoundedIcon sx={{ fontSize: 17, color: "#9ca3af" }} /></InputAdornment> }}
              />
            </Grid>

            {/* Dars vaqti */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Dars vaqti *" size="small" type="time"
                value={form.startTime} onChange={e => set("startTime", e.target.value)}
                error={!!errors.startTime} helperText={errors.startTime}
                InputLabelProps={{ shrink: true }} sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeRoundedIcon sx={{ fontSize: 17, color: "#9ca3af" }} /></InputAdornment> }}
              />
            </Grid>

            {/* Hafta kunlari */}
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151", mb: 1 }}>Dars kunlari *</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {WEEKDAYS.map(d => {
                  const sel = form.weeKDays.includes(d.key);
                  return (
                    <Box key={d.key} onClick={() => toggleDay(d.key)} sx={{
                      px: 1.8, py: 1, borderRadius: 2, minWidth: 52, textAlign: "center",
                      border: `1.5px solid ${sel ? ACCENT : "#e5e7eb"}`,
                      bgcolor: sel ? ACCENT_BG : "#fff", cursor: "pointer",
                      transition: "all .15s",
                      "&:hover": { borderColor: ACCENT, bgcolor: sel ? ACCENT_BG : "#fafafa" },
                    }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: sel ? ACCENT : "#374151", lineHeight: 1.2 }}>{d.short}</Typography>
                      <Typography sx={{ fontSize: 9, color: sel ? ACCENT : "#9ca3af", mt: 0.2 }}>{d.uz.slice(0, 3)}</Typography>
                    </Box>
                  );
                })}
              </Box>
              {errors.weeKDays && <Typography sx={{ fontSize: 11, color: "#dc2626", mt: 0.8 }}>{errors.weeKDays}</Typography>}
              {form.weeKDays.length > 0 && (
                <Box sx={{ mt: 1.2, display: "flex", alignItems: "center", gap: 0.8, bgcolor: ACCENT_BG, borderRadius: 1.5, px: 1.5, py: 0.8 }}>
                  <CheckRoundedIcon sx={{ fontSize: 14, color: ACCENT }} />
                  <Typography sx={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                    {form.weeKDays.map(k => WEEKDAYS.find(d => d.key === k)?.uz).join(", ")}
                  </Typography>
                </Box>
              )}
            </Grid>

            {saveErr && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>{saveErr}</Alert>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={onClose} disabled={saving}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, color: "#6b7280", "&:hover": { bgcolor: "#f9fafb" } }}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={saving} variant="contained"
            startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : isEdit ? <EditRoundedIcon /> : <AddRoundedIcon />}
            sx={{ flex: 1, borderRadius: 2, textTransform: "none", fontWeight: 600, bgcolor: ACCENT, boxShadow: "none", "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" } }}>
            {saving ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Guruh qo'shish"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function GroupsTab() {
  const [groups,        setGroups]        = useState([]);
  const [courses,       setCourses]       = useState([]);
  const [allStudents,   setAllStudents]   = useState([]);
  const [allTeachers,   setAllTeachers]   = useState([]);
  const [allRooms,      setAllRooms]      = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [search,        setSearch]        = useState("");
  const [activeTab,     setActiveTab]     = useState("active");
  const [formOpen,      setFormOpen]      = useState(false);
  const [editData,      setEditData]      = useState(null);
  const [detailGroup,   setDetailGroup]   = useState(null); // { id, name }
  const [groupDetailId, setGroupDetailId] = useState(null); // full detail page
  const [delId,         setDelId]         = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [gRaw, cRaw, sRaw, tRaw, sgRaw, rRaw] = await Promise.all([
        groupApi.getAll(),
        courseApi.getAll(),
        studentApi.getAll(),
        teacherApi.getAll(),
        studentGroupApi.getAll(),
        roomApi.getAll().catch(() => []),
      ]);
      setGroups(        Array.isArray(gRaw)  ? gRaw  : (gRaw?.data  ?? []));
      setCourses(       Array.isArray(cRaw)  ? cRaw  : (cRaw?.data  ?? []));
      setAllStudents(   Array.isArray(sRaw)  ? sRaw  : (sRaw?.data  ?? []));
      setAllTeachers(   Array.isArray(tRaw)  ? tRaw  : (tRaw?.data  ?? []));
      setStudentGroups( Array.isArray(sgRaw) ? sgRaw : (sgRaw?.data ?? []));
      setAllRooms(      Array.isArray(rRaw)  ? rRaw  : (rRaw?.data  ?? []));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggleStatus = async (g) => {
    const isActive  = !g.status || g.status?.toUpperCase() === "ACTIVE";
    const newStatus = isActive ? "INACTIVE" : "ACTIVE";
    setGroups(p => p.map(x => x.id === g.id ? { ...x, status: newStatus } : x));
    try { await groupApi.update(String(g.id), { status: newStatus }); }
    catch (e) { setGroups(p => p.map(x => x.id === g.id ? { ...x, status: g.status } : x)); setError(e.message); }
  };

  const handleSaved = (saved, isEdit) => {
    if (isEdit) setGroups(p => p.map(g => g.id === saved.id ? { ...g, ...saved } : g));
    else        { if (saved?.id) setGroups(p => [saved, ...p]); else load(); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await groupApi.delete(String(delId));
      setGroups(p => p.filter(g => g.id !== delId));
      setDelId(null);
    } catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const studentCountMap = studentGroups.reduce((acc, sg) => {
    const gId = sg.groupId ?? sg.group?.id ?? sg.group_id;
    if (gId) acc[gId] = (acc[gId] || 0) + 1;
    return acc;
  }, {});

  const filtered = groups.filter(g => {
    const matchSearch = `${g.name || ""} ${g.course?.name || ""}`.toLowerCase().includes(search.toLowerCase());
    const isActive    = !g.status || g.status?.toUpperCase() === "ACTIVE";
    const matchTab    = activeTab === "active" ? isActive : !isActive;
    return matchSearch && matchTab;
  });

  const STAT_CARDS = [
    { Icon: GroupsRoundedIcon,    label: "Jami guruhlar", value: groups.length,      color: ACCENT,    bg: ACCENT_BG,  grad: "135deg,#7c3aed,#b06ef3" },
    { Icon: SchoolRoundedIcon,    label: "O'qituvchilar", value: allTeachers.length, color: "#0ea5e9", bg: "#f0f9ff",  grad: "135deg,#0ea5e9,#38bdf8"  },
    { Icon: PeopleAltRoundedIcon, label: "O'quvchilar",   value: allStudents.length, color: "#16a34a", bg: "#f0fdf4",  grad: "135deg,#16a34a,#22d3a0"  },
  ];

  return (
    <Box sx={{
      animation: "fadeUp .3s ease",
      "@keyframes fadeUp": { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "none" } },
    }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 22, color: "#111827" }}>Guruhlar</Typography>
        <Button onClick={() => { setEditData(null); setFormOpen(true); }} variant="contained"
          startIcon={<AddRoundedIcon />}
          sx={{ bgcolor: ACCENT, textTransform: "none", borderRadius: 2.5, fontWeight: 600, fontSize: 14, px: 2.5, py: 1.2, boxShadow: "none",
            "&:hover": { bgcolor: "#6d28d9", boxShadow: "0 6px 20px rgba(124,58,237,0.35)", transform: "translateY(-1px)" }, transition: "all .2s" }}>
          Guruh qo'shish
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2.5, mb: 3 }}>
        {STAT_CARDS.map((s, i) => (
          <Card key={i} elevation={0} sx={{
            border: "1.5px solid #f0f0f0",
            borderRadius: 3, overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            transition: "transform .22s, box-shadow .22s, border-color .22s",
            "&:hover": { transform: "translateY(-3px)", boxShadow: `0 10px 28px ${s.color}20`, borderColor: `${s.color}30` },
            animation: `statPop .45s ${i * 0.09}s both`,
            "@keyframes statPop": { from: { opacity: 0, transform: "translateY(16px)" }, to: { opacity: 1, transform: "translateY(0)" } },
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(${s.grad})` }} />
            <CardContent sx={{ p: 3 }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: 2.5,
                background: `linear-gradient(${s.grad})`,
                display: "flex", alignItems: "center", justifyContent: "center", mb: 2,
                boxShadow: `0 6px 18px ${s.color}35`,
              }}>
                <s.Icon sx={{ color: "#fff", fontSize: 26 }} />
              </Box>
              <Typography sx={{ color: "#6b7280", fontSize: 13, mb: 0.4 }}>{s.label}</Typography>
              <Typography sx={{ color: "#111827", fontWeight: 900, fontSize: 38, lineHeight: 1, letterSpacing: "-1.5px" }}>
                {s.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Table card */}
      <Card elevation={0} sx={{
        border: "1.5px solid #f0f0f0", borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
        animation: "fadeUp .4s .22s both",
      }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Tabs + Search */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", gap: 0.5, bgcolor: "#f9fafb", borderRadius: 2, p: 0.5, border: "1px solid #f0f0f0" }}>
              {[{ key: "active", label: "Guruhlar" }, { key: "archive", label: "Arxiv" }].map(t => (
                <Button key={t.key} onClick={() => setActiveTab(t.key)} size="small" sx={{
                  borderRadius: 1.5, textTransform: "none", fontWeight: 600, fontSize: 13, px: 2.5, py: 0.8,
                  bgcolor:   activeTab === t.key ? "#fff" : "transparent",
                  color:     activeTab === t.key ? "#111827" : "#6b7280",
                  boxShadow: activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  "&:hover": { bgcolor: activeTab === t.key ? "#fff" : "#f3f4f6" },
                }}>{t.label}</Button>
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField size="small" placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 17, color: "#9ca3af" }} /></InputAdornment> }}
                sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }}
              />
              <Tooltip title="Yangilash">
                <IconButton onClick={load} sx={{ color: "#6b7280" }}><RefreshRoundedIcon /></IconButton>
              </Tooltip>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={28} sx={{ color: ACCENT }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <GroupsRoundedIcon sx={{ fontSize: 44, color: "#e5e7eb", mb: 1 }} />
              <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>{search ? "Natija topilmadi" : "Guruhlar yo'q"}</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { borderBottom: "2px solid #f3f4f6", py: 1.4 } }}>
                    {["Status", "Guruh", "Kurs", "Boshlanish", "Dars vaqti", "Xona", "O'qituvchi", "Talabalar", ""].map((h, i) => (
                      <TableCell key={i} sx={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((g, i) => {
                    const cc      = getCourseColor(g.course?.name);
                    const students = g.students || [];
                    const count   = studentCountMap[g.id] ?? g._count?.studentGroups ?? students.length ?? 0;
                    const isAct   = !g.status || g.status?.toUpperCase() === "ACTIVE";

                    return (
                      <TableRow key={g.id || i}
                        onClick={() => setGroupDetailId(g.id)}
                        hover
                        sx={{
                          "&:last-child td": { border: 0 },
                          "&:hover": { bgcolor: "#fafafa" },
                          cursor: "pointer",
                          animation: `rowIn .25s ${i * 0.04}s both`,
                          "@keyframes rowIn": { from: { opacity: 0, transform: "translateX(-6px)" }, to: { opacity: 1, transform: "none" } },
                        }}>
                        {/* Status */}
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Switch size="small" checked={isAct} onChange={() => handleToggleStatus(g)}
                              sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: ACCENT }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: ACCENT } }}
                            />
                            <Chip label={isAct ? "ACTIVE" : "INACTIVE"} size="small" sx={{
                              fontSize: 10, height: 20, fontWeight: 700,
                              bgcolor: isAct ? "#dcfce7" : "#fef2f2",
                              color:   isAct ? "#16a34a" : "#dc2626",
                            }} />
                          </Box>
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{g.name}</Typography>
                        </TableCell>

                        {/* Course */}
                        <TableCell>
                          {g.course?.name
                            ? <Chip label={g.course.name} size="small" sx={{ fontSize: 11, height: 22, fontWeight: 600, bgcolor: cc.bg, color: cc.color }} />
                            : <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>—</Typography>}
                        </TableCell>

                        {/* Boshlanish */}
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#374151" }}>{fmtDate(g.startDate)}</Typography>
                        </TableCell>

                        {/* Dars vaqti */}
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {g.startTime || g.lessonTime || "—"}
                          </Typography>
                        </TableCell>

                        {/* Xona */}
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#374151" }}>{g.room?.name || "—"}</Typography>
                        </TableCell>

                        {/* Teacher */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {g.teacher?.fullName ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Avatar sx={{ width: 26, height: 26, bgcolor: ACCENT, fontSize: 11, fontWeight: 700 }}>{g.teacher.fullName[0]}</Avatar>
                              <Typography sx={{ fontSize: 13, color: "#374151" }}>{g.teacher.fullName}</Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Yo'q</Typography>
                          )}
                        </TableCell>

                        {/* Students */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {students.length > 0 && (
                              <AvatarGroup max={3} sx={{ "& .MuiAvatar-root": { width: 22, height: 22, fontSize: 9, border: "1.5px solid #fff" } }}>
                                {students.slice(0, 3).map((st, si) => (
                                  <Avatar key={si} sx={{ bgcolor: "#e0e7ff", color: "#4338ca", fontSize: 9 }}>{st.fullName?.[0] || "S"}</Avatar>
                                ))}
                              </AvatarGroup>
                            )}
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{count}</Typography>
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Tahrirlash">
                              <IconButton size="small"
                                onClick={() => { setEditData(g); setFormOpen(true); }}
                                sx={{ color: ACCENT, "&:hover": { bgcolor: ACCENT_BG } }}>
                                <EditRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="O'chirish">
                              <IconButton size="small" onClick={() => setDelId(g.id)}
                                sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}>
                                <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Group Detail Page — slide in */}
      {groupDetailId && (
        <Box sx={{
          position: "fixed", inset: 0, zIndex: 200,
          bgcolor: "#f9fafb", overflowY: "auto",
          animation: "pageSlideIn .3s cubic-bezier(.4,0,.2,1) both",
          "@keyframes pageSlideIn": {
            from: { opacity: 0, transform: "translateX(40px)" },
            to:   { opacity: 1, transform: "translateX(0)" },
          },
        }}>
          <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
            <GroupDetailPage
              groupId={groupDetailId}
              onBack={() => setGroupDetailId(null)}
            />
          </Box>
        </Box>
      )}

      {detailGroup && (
        <GroupDetailModal group={detailGroup} onClose={() => setDetailGroup(null)} />
      )}

      {/* Create / Edit Dialog */}
      <GroupFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSaved={handleSaved}
        courses={courses}
        teachers={allTeachers}
        rooms={allRooms}
        editData={editData}
      />

      {/* Delete Confirm */}
      <Dialog open={!!delId} onClose={() => setDelId(null)} PaperProps={{ sx: { borderRadius: 3, p: 1, minWidth: 320, overflow: "hidden" } }}>
        <Box sx={{ height: 3, bgcolor: "#ef4444" }} />
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pt: 2.5 }}>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "#374151" }}>Bu guruhni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDelId(null)} sx={{ color: "#6b7280", textTransform: "none", borderRadius: 2 }}>Bekor qilish</Button>
          <Button onClick={handleDelete} disabled={deleting} variant="contained"
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" }, textTransform: "none", borderRadius: 2, boxShadow: "none" }}>
            {deleting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}