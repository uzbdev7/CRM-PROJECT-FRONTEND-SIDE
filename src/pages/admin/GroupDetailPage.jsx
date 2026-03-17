// src/pages/admin/GroupDetailPage.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Avatar, Chip, IconButton, Button,
  CircularProgress, Alert, Divider, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableHead, TableRow,
  Switch,
} from "@mui/material";
import ArrowBackRoundedIcon      from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import ChevronLeftRoundedIcon    from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon   from "@mui/icons-material/ChevronRightRounded";
import CheckRoundedIcon          from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon          from "@mui/icons-material/CloseRounded";
import CalendarMonthRoundedIcon  from "@mui/icons-material/CalendarMonthRounded";
import PeopleAltRoundedIcon      from "@mui/icons-material/PeopleAltRounded";
import SchoolRoundedIcon         from "@mui/icons-material/SchoolRounded";
import AccessTimeRoundedIcon     from "@mui/icons-material/AccessTimeRounded";

import {
  groupApi, lessonApi, attendanceApi,
  studentGroupApi,
} from "../../api/apiService.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const WEEKDAYS = [
  { key: "MONDAY",    short: "Du", num: 1 },
  { key: "TUESDAY",   short: "Se", num: 2 },
  { key: "WEDNESDAY", short: "Cho",num: 3 },
  { key: "THURSDAY",  short: "Pa", num: 4 },
  { key: "FRIDAY",    short: "Ju", num: 5 },
  { key: "SATURDAY",  short: "Sha",num: 6 },
  { key: "SUNDAY",    short: "Ya", num: 0 },
];

const MONTH_NAMES = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"
];

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString("uz-UZ", { day:"2-digit", month:"2-digit", year:"numeric" })
  : "—";

// Hafta kunlarini weekday raqamiga aylantirish
const getDayNums = (weeKDays = []) =>
  weeKDays.map(k => WEEKDAYS.find(w => w.key === k)?.num ?? -1).filter(n => n !== -1);

// Berilgan oy uchun dars sanalarini hisoblash
const getLessonDatesForMonth = (group, year, month) => {
  if (!group?.weeKDays?.length || !group?.startDate) return [];
  const dayNums  = getDayNums(group.weeKDays);
  const start    = new Date(group.startDate);
  const dates    = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date < start) continue;
    if (dayNums.includes(date.getDay())) {
      dates.push(new Date(year, month, d));
    }
  }
  return dates;
};

// Sanani YYYY-MM-DD formatga o'tkazish
const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ── Davomat Dialog ─────────────────────────────────────────────────────────
function AttendanceDialog({ open, onClose, lesson, students, token }) {
  const [attendances, setAttendances] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!open || !lesson) return;
    setLoading(true);
    attendanceApi.getByLessonId(lesson.id)
      .then(res => {
        const data = res?.data || res || [];
        setAttendances(Array.isArray(data) ? data : []);
      })
      .catch(() => setAttendances([]))
      .finally(() => setLoading(false));
  }, [open, lesson]);

  const isPresent = (studentId) => {
    const a = attendances.find(a => a.studentId === studentId);
    return a ? a.isPresent : null;
  };

  const handleMark = async (studentId, present) => {
    const existing = attendances.find(a => a.studentId === studentId);
    try {
      if (existing) {
        const updated = await attendanceApi.create({
          lessonId: lesson.id, studentId, isPresent: present,
        });
        setAttendances(p => p.map(a =>
          a.studentId === studentId ? { ...a, isPresent: present } : a
        ));
      } else {
        const created = await attendanceApi.create({
          lessonId: lesson.id, studentId, isPresent: present,
        });
        const newA = created?.data || created;
        setAttendances(p => [...p, { ...newA, studentId, isPresent: present }]);
      }
    } catch (e) { setError(e.message); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${ACCENT}, #b06ef3)` }} />
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CalendarMonthRoundedIcon sx={{ fontSize: 20, color: ACCENT }} />
          {lesson?.title || "Davomat"}
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} sx={{ color: ACCENT }} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#9ca3af", textTransform: "uppercase" }}>Talaba</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: "#9ca3af", textTransform: "uppercase" }}>Keldi</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: "#9ca3af", textTransform: "uppercase" }}>Kelmadi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map(s => {
                const present = isPresent(s.id);
                return (
                  <TableRow key={s.id} sx={{ "&:hover": { bgcolor: "#fafafa" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: ACCENT, fontSize: 11, fontWeight: 700 }}>
                          {s.fullName?.[0] || "S"}
                        </Avatar>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.fullName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small"
                        onClick={() => handleMark(s.id, true)}
                        sx={{
                          bgcolor: present === true ? "#dcfce7" : "#f3f4f6",
                          color:   present === true ? "#16a34a" : "#9ca3af",
                          "&:hover": { bgcolor: "#dcfce7", color: "#16a34a" },
                          transition: "all .15s",
                        }}>
                        <CheckRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small"
                        onClick={() => handleMark(s.id, false)}
                        sx={{
                          bgcolor: present === false ? "#fef2f2" : "#f3f4f6",
                          color:   present === false ? "#ef4444" : "#9ca3af",
                          "&:hover": { bgcolor: "#fef2f2", color: "#ef4444" },
                          transition: "all .15s",
                        }}>
                        <CloseRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} variant="contained"
          sx={{ bgcolor: ACCENT, borderRadius: 2, textTransform: "none", fontWeight: 600, boxShadow: "none",
            "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" } }}>
          Yopish
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Dars yaratish Dialog ───────────────────────────────────────────────────
function CreateLessonDialog({ open, onClose, onCreated, groupId, date }) {
  const [title,   setTitle]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) { setTitle(""); setError(""); setSuccess(false); }
  }, [open]);

  const handleCreate = async () => {
    if (!title.trim()) { setError("Mavzu nomi shart!"); return; }
    setSaving(true); setError("");
    try {
      const res = await lessonApi.create({ title: title.trim(), groupId });
      setSuccess(true);
      onCreated(res?.data || res, date);
      setTimeout(() => { setSuccess(false); onClose(); }, 1200);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${ACCENT}, #b06ef3)` }} />
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Yangi dars qo'shish</DialogTitle>
      <DialogContent>
        {success ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckRoundedIcon sx={{ fontSize: 28, color: "#16a34a" }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>Dars qo'shildi!</Typography>
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            <TextField fullWidth label="Dars mavzusi *" size="small"
              placeholder="1-dars: NodeJs ga kirish"
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            {date && (
              <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 1 }}>
                Sana: {fmtDate(date)}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      {!success && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={onClose} sx={{ color: "#6b7280", textTransform: "none", borderRadius: 2 }}>Bekor</Button>
          <Button onClick={handleCreate} disabled={saving} variant="contained"
            sx={{ bgcolor: ACCENT, borderRadius: 2, textTransform: "none", fontWeight: 600, boxShadow: "none",
              "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" } }}>
            {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Qo'shish"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ── Main GroupDetailPage ───────────────────────────────────────────────────
export default function GroupDetailPage({ groupId, onBack }) {
  const [group,    setGroup]    = useState(null);
  const [lessons,  setLessons]  = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  // Kalendar
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Dialogs
  const [createOpen,      setCreateOpen]      = useState(false);
  const [selectedDate,    setSelectedDate]     = useState(null);
  const [attendanceOpen,  setAttendanceOpen]   = useState(false);
  const [selectedLesson,  setSelectedLesson]   = useState(null);

  // Load data
 // GroupDetailPage.jsx ichida — useEffect ni toping va shu bilan almashtiring

useEffect(() => {
  if (!groupId) return;
  setLoading(true);
  Promise.all([
    groupApi.getById(groupId),
    lessonApi.getAll(),
    studentGroupApi.getAllFull().catch(() => ({ data: [] })),
  ])
    .then(([gRes, lRes, sgRes]) => {
      const g = gRes?.data || gRes;
      setGroup(g);

      const allLessons = lRes?.data || lRes || [];
      setLessons(Array.isArray(allLessons)
        ? allLessons.filter(l => Number(l.groupId) === Number(groupId))
        : []);

      const allSg = sgRes?.data || sgRes || [];
      const groupStudents = Array.isArray(allSg)
        ? allSg
            .filter(sg => Number(sg.group?.id) === Number(groupId))
            .map(sg => sg.student)
            .filter(Boolean)
        : [];
      setStudents(groupStudents);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, [groupId]);

  // Dars sanalarini hisoblash (oy uchun)
  const lessonDates = useMemo(
    () => getLessonDatesForMonth(group, calYear, calMonth),
    [group, calYear, calMonth]
  );

  // Sanaga mos dars topish
  const getLessonByDate = (date) => {
    const dateStr = toDateStr(date);
    return lessons.find(l => l.date === dateStr || l.created_at?.startsWith(dateStr));
  };

  // Kalendar headeridagi kunlar
  const calDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(calYear, calMonth, 1);
    const endOfWeek   = new Date(calYear, calMonth + 1, 0);

    // Haftaning birinchi kunidan boshlab
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - start.getDay() + 1);

    const end = new Date(endOfWeek);
    if (end.getDay() !== 0) end.setDate(end.getDate() + (7 - end.getDay()));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [calYear, calMonth]);

  const handleDateClick = (date) => {
    const lesson = getLessonByDate(date);
    if (lesson) {
      setSelectedLesson(lesson);
      setAttendanceOpen(true);
    } else {
      setSelectedDate(date);
      setCreateOpen(true);
    }
  };

  const handleLessonCreated = (lesson, date) => {
    if (lesson) {
      setLessons(p => [...p, { ...lesson, date: toDateStr(date) }]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  }

  // Hafta kunlari header
  const weekHeaders = (() => {
    const first = calDays[0];
    const week  = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() + i);
      week.push(d);
    }
    return week;
  })();

  // Jadval satrlari
  const calRows = [];
  for (let i = 0; i < calDays.length; i += 7) {
    calRows.push(calDays.slice(i, i + 7));
  }

  const isLessonDay = (date) =>
    lessonDates.some(d => toDateStr(d) === toDateStr(date));

  return (
    <Box>
      {/* Back button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={onBack} sx={{ bgcolor: "#f3f4f6", "&:hover": { bgcolor: ACCENT_BG } }}>
          <ArrowBackRoundedIcon sx={{ fontSize: 20, color: ACCENT }} />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>
          {group?.name || "Guruh"}
        </Typography>
        <Chip
          label={group?.status?.toUpperCase() === "ACTIVE" ? "Faol" : "Nofaol"}
          size="small"
          sx={{
            fontSize: 11, fontWeight: 700,
            bgcolor: group?.status?.toUpperCase() === "ACTIVE" ? "#dcfce7" : "#fef2f2",
            color:   group?.status?.toUpperCase() === "ACTIVE" ? "#16a34a" : "#dc2626",
          }}
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, gap: 3 }}>

        {/* ── Chap panel ── */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Guruh ma'lumotlari */}
          <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #f3f4f6", p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#111827", mb: 2 }}>
              Ma'lumotlar
            </Typography>
            {[
              { icon: <SchoolRoundedIcon sx={{ fontSize: 16, color: ACCENT }} />,       label: "Kurs",        value: group?.course?.name },
              { icon: <AccessTimeRoundedIcon sx={{ fontSize: 16, color: ACCENT }} />,   label: "Dars vaqti",  value: group?.startTime },
              { icon: <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: ACCENT }} />,label: "Boshlanish",  value: fmtDate(group?.startDate) },
            ].map((row, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: i < 2 ? "1px solid #f9fafb" : "none" }}>
                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: ACCENT_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {row.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{row.value || "—"}</Typography>
                </Box>
              </Box>
            ))}

            {/* Dars kunlari */}
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mb: 1 }}>Dars kunlari</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {(group?.weeKDays || []).map(k => {
                  const d = WEEKDAYS.find(w => w.key === k);
                  return (
                    <Chip key={k} label={d?.short || k} size="small"
                      sx={{ fontSize: 11, height: 22, fontWeight: 700, bgcolor: ACCENT_BG, color: ACCENT }} />
                  );
                })}
              </Box>
            </Box>
          </Box>

          {/* O'qituvchi */}
          {group?.teacher && (
            <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #f3f4f6", p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#111827", mb: 1.5 }}>O'qituvchi</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: ACCENT, fontWeight: 700 }}>
                  {group.teacher.fullName?.[0] || "T"}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{group.teacher.fullName}</Typography>
                  <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>{group.teacher.email || "—"}</Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Talabalar */}
          <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #f3f4f6", p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                Talabalar
              </Typography>
              <Chip label={students.length} size="small"
                sx={{ bgcolor: ACCENT_BG, color: ACCENT, fontWeight: 700, fontSize: 12 }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {students.map((s, i) => (
                <Box key={s?.id || i} sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  p: 1, borderRadius: 2, "&:hover": { bgcolor: "#fafafa" },
                }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: ACCENT, fontSize: 11, fontWeight: 700 }}>
                    {s?.fullName?.[0] || "S"}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s?.fullName}
                    </Typography>
                    <Chip label={s?.status || "ACTIVE"} size="small" sx={{
                      fontSize: 10, height: 16, fontWeight: 700,
                      bgcolor: s?.status === "INACTIVE" ? "#fef2f2" : "#f0fdf4",
                      color:   s?.status === "INACTIVE" ? "#dc2626"  : "#16a34a",
                    }} />
                  </Box>
                </Box>
              ))}
              {students.length === 0 && (
                <Typography sx={{ fontSize: 13, color: "#9ca3af", textAlign: "center", py: 2 }}>
                  Talabalar yo'q
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* ── O'ng panel — Kalendar ── */}
        <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #f3f4f6", p: 2.5 }}>

          {/* Kalendar header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
              Darslar jadvali
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton size="small" onClick={() => {
                if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                else setCalMonth(m => m - 1);
              }} sx={{ color: "#6b7280" }}>
                <ChevronLeftRoundedIcon />
              </IconButton>
              <Typography sx={{ fontWeight: 700, fontSize: 14, minWidth: 130, textAlign: "center" }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Typography>
              <IconButton size="small" onClick={() => {
                if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                else setCalMonth(m => m + 1);
              }} sx={{ color: "#6b7280" }}>
                <ChevronRightRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Hafta kunlari header */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
            {["Du","Se","Cho","Pa","Ju","Sha","Ya"].map(d => (
              <Typography key={d} sx={{
                textAlign: "center", fontSize: 11, fontWeight: 700,
                color: "#9ca3af", textTransform: "uppercase", py: 1,
              }}>{d}</Typography>
            ))}
          </Box>

          {/* Kalendar kunlar */}
          <Box>
            {calRows.map((week, wi) => (
              <Box key={wi} sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
                {week.map((date, di) => {
                  const isCurrentMonth = date.getMonth() === calMonth;
                  const isToday        = toDateStr(date) === toDateStr(today);
                  const isLesson       = isLessonDay(date);
                  const lesson         = getLessonByDate(date);
                  const hasLesson      = !!lesson;

                  return (
                    <Box key={di}
                      onClick={() => isLesson && isCurrentMonth && handleDateClick(date)}
                      sx={{
                        minHeight: 52, borderRadius: 2, p: 0.8,
                        border: isToday ? `2px solid ${ACCENT}` : "1px solid transparent",
                        bgcolor: !isCurrentMonth ? "transparent"
                          : hasLesson   ? ACCENT_BG
                          : isLesson    ? "#f0fdf4"
                          : "transparent",
                        cursor: isLesson && isCurrentMonth ? "pointer" : "default",
                        opacity: isCurrentMonth ? 1 : 0.3,
                        transition: "all .15s",
                        "&:hover": isLesson && isCurrentMonth ? {
                          bgcolor: ACCENT_BG,
                          transform: "scale(1.04)",
                          boxShadow: `0 4px 12px ${ACCENT}20`,
                        } : {},
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 0.3,
                      }}
                    >
                      <Typography sx={{
                        fontSize: 13, fontWeight: isToday ? 800 : 500,
                        color: !isCurrentMonth ? "#d1d5db"
                          : isToday  ? ACCENT
                          : "#374151",
                      }}>
                        {date.getDate()}
                      </Typography>

                      {isCurrentMonth && isLesson && (
                        <Box sx={{
                          width: hasLesson ? 20 : 6, height: 6,
                          borderRadius: hasLesson ? 1 : "50%",
                          bgcolor: hasLesson ? ACCENT : "#16a34a",
                          transition: "all .2s",
                        }} />
                      )}

                      {isCurrentMonth && hasLesson && (
                        <Typography sx={{
                          fontSize: 9, color: ACCENT, fontWeight: 700,
                          maxWidth: "100%", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap",
                          px: 0.3,
                        }}>
                          {lesson.title}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* Legend */}
          <Box sx={{ display: "flex", gap: 2, mt: 2, pt: 2, borderTop: "1px solid #f3f4f6" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#16a34a" }} />
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Dars kuni</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ width: 16, height: 8, borderRadius: 1, bgcolor: ACCENT }} />
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Dars qo'shilgan</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${ACCENT}` }} />
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Bugun</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Dars yaratish dialog */}
      <CreateLessonDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleLessonCreated}
        groupId={groupId}
        date={selectedDate}
      />

      {/* Davomat dialog */}
      <AttendanceDialog
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        lesson={selectedLesson}
        students={students}
      />
    </Box>
  );
}