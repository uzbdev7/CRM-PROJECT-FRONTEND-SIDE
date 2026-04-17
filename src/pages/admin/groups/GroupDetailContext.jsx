import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  TextField,
  Select,
  MenuItem,
  Switch,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";

import { attendanceApi, groupApi, lessonApi } from "../../../api/apiService.js";
import GroupInfoTab from "./GroupInfoTab.jsx";
import GroupLessonsTab from "./GroupLessonsTab.jsx";

const ACCENT = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const WEEKDAYS = [
  { key: "MONDAY", short: "Du", num: 1 },
  { key: "TUESDAY", short: "Se", num: 2 },
  { key: "WEDNESDAY", short: "Cho", num: 3 },
  { key: "THURSDAY", short: "Pa", num: 4 },
  { key: "FRIDAY", short: "Ju", num: 5 },
  { key: "SATURDAY", short: "Sha", num: 6 },
  { key: "SUNDAY", short: "Ya", num: 0 },
];

const MONTH_NAMES = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

const toDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDayNums = (weekDays = []) =>
  weekDays.map((k) => WEEKDAYS.find((w) => w.key === k)?.num ?? -1).filter((n) => n !== -1);

const getLessonDatesForMonth = (group, year, month) => {
  if (!group?.weeKDays?.length || !group?.startDate) return [];
  const dayNums = getDayNums(group.weeKDays);
  const start = new Date(group.startDate);
  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date < start) continue;
    if (dayNums.includes(date.getDay())) dates.push(new Date(year, month, d));
  }
  return dates;
};

const findLessonByDate = (lessons, date) => {
  const key = toDateStr(date);
  return (lessons || []).find((l) => {
    const created = l?.created_at ? toDateStr(new Date(l.created_at)) : null;
    const explicit = l?.date ? toDateStr(new Date(l.date)) : null;
    return created === key || explicit === key;
  });
};

function CreateLessonDialog({ open, onClose, groupId, date, onCreated }) {
  const [topic, setTopic] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTopic("");
      setError("");
    }
  }, [open]);

  const handleCreate = async () => {
    if (!topic.trim()) {
      setError("Mavzu kiriting");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const lesson = await lessonApi.create({ title: topic.trim(), groupId });
      onCreated?.(lesson);
      onClose();
    } catch (e) {
      setError(e.message || "Dars yaratishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Mavzu kiritish</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 1 }}>
          Sana: {date ? new Date(date).toLocaleDateString("uz-UZ") : "-"}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
        <TextField
          fullWidth
          size="small"
          label="Mavzu"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Masalan: 1-dars Node.js kirish"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>Bekor</Button>
        <Button onClick={handleCreate} disabled={saving} variant="contained" sx={{ textTransform: "none", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AttendanceDialog({ open, onClose, lesson, students, onSaved }) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    if (!open || !lesson) return;
    setLoading(true);
    setError("");
    setTopic(lesson.title || "");
    attendanceApi.getByLessonId(lesson.id)
      .then((rows) => {
        const existing = {};
        const next = {};
        (students || []).forEach((s) => {
          next[s.id] = false;
        });
        (rows || []).forEach((r) => {
          existing[r.studentId] = r;
          next[r.studentId] = !!r.isPresent;
        });
        setAttendanceMap(existing);
        setStatusMap(next);
      })
      .catch(() => {
        const next = {};
        (students || []).forEach((s) => {
          next[s.id] = false;
        });
        setAttendanceMap({});
        setStatusMap(next);
      })
      .finally(() => setLoading(false));
  }, [open, lesson, students]);

  const handleToggle = (studentId) => {
    setStatusMap((p) => ({ ...p, [studentId]: !p[studentId] }));
  };

  const handleSave = async () => {
    if (!topic.trim()) {
      setError("Mavzu bo'sh bo'lmasin");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (topic.trim() !== (lesson.title || "").trim()) {
        await lessonApi.update(lesson.id, { title: topic.trim() });
      }

      const jobs = (students || []).map((s) => {
        const studentId = s.id;
        const isPresent = !!statusMap[studentId];
        const existing = attendanceMap[studentId];
        if (existing?.id) {
          return attendanceApi.update(existing.id, {
            lessonId: lesson.id,
            studentId,
            isPresent,
          });
        }
        return attendanceApi.create({
          lessonId: lesson.id,
          studentId,
          isPresent,
        });
      });

      await Promise.all(jobs);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message || "Davomatni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Yo'qlama va mavzu kiritish</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 1 }}>
          Sana: {lesson?.created_at ? new Date(lesson.created_at).toLocaleDateString("uz-UZ") : "-"}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

        <TextField
          fullWidth
          size="small"
          label="Mavzu"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>O'quvchi ismi</TableCell>
                <TableCell align="center">Vaqti</TableCell>
                <TableCell align="right">Keldi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(students || []).map((s, idx) => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ color: "#9ca3af" }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "#ecfdf5", color: "#10b981" }}>
                        {s.fullName?.[0] || "S"}
                      </Avatar>
                      <Typography sx={{ fontSize: 14, color: "#111827" }}>{s.fullName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ color: "#6b7280" }}>{lesson?.startTime?.slice(0, 5) || "19:00"}</TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={!!statusMap[s.id]}
                      onChange={() => handleToggle(s.id)}
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>Bekor</Button>
        <Button onClick={handleSave} disabled={saving || loading} variant="contained" sx={{ textTransform: "none", bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
          {saving ? "Saqlanmoqda..." : "Saqlash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AttendanceCalendarTab({ group, lessons, students, onRefresh }) {
  const today = new Date();
  const todayStr = toDateStr(today);
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [localLessons, setLocalLessons] = useState(Array.isArray(lessons) ? lessons : []);
  const [topic, setTopic]             = useState("");
  const [selectedPlanLessonId, setSelectedPlanLessonId] = useState("");
  const [attendanceMap, setAttendanceMap] = useState({});
  const [statusMap, setStatusMap]     = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  // "plan" = O'quv reja asosida, "new" = Yangi mavzu qo'shish
  const [mode, setMode]               = useState("plan");
  const [newTopic, setNewTopic]       = useState("");
  // Qaysi sanalar saqlanganligi: { "2026-04-14": true }
  const [savedDates, setSavedDates]   = useState({});

  useEffect(() => {
    setLocalLessons(Array.isArray(lessons) ? lessons : []);
  }, [lessons]);

  // Joriy oy uchun dars kunlari
  const lessonDates = useMemo(
    () => getLessonDatesForMonth(group, calYear, calMonth),
    [group, calYear, calMonth]
  );

  // Oy o'zgarganda avtomatik birinchi dars kunini tanla
  useEffect(() => {
    if (lessonDates.length === 0) { setSelectedDate(null); return; }
    // Bugun shu oyda va dars kuni bo'lsa shuni tanla, aks holda 1-dars kuni
    const todayStr = toDateStr(today);
    const todayInMonth = lessonDates.find(d => toDateStr(d) === todayStr);
    setSelectedDate(todayInMonth || lessonDates[0]);
  }, [calYear, calMonth, lessonDates.length]);

  const selectedLesson = useMemo(
    () => selectedDate ? findLessonByDate(localLessons, selectedDate) : null,
    [localLessons, selectedDate]
  );

  const lessonsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const key = toDateStr(selectedDate);
    return (localLessons || []).filter((l) => {
      const created = l?.created_at ? toDateStr(new Date(l.created_at)) : null;
      const explicit = l?.date ? toDateStr(new Date(l.date)) : null;
      return created === key || explicit === key;
    });
  }, [localLessons, selectedDate]);

  const selectableLessons = useMemo(() => {
    // Agar tanlangan sana uchun mavzu topilmasa ham, guruh darsliklaridagi mavzularni ko'rsatamiz.
    return (lessonsForSelectedDate || []).length > 0
      ? lessonsForSelectedDate
      : (localLessons || []);
  }, [lessonsForSelectedDate, localLessons]);

  const selectedPlanLesson = useMemo(
    () => (selectableLessons || []).find((l) => Number(l.id) === Number(selectedPlanLessonId)) || null,
    [selectableLessons, selectedPlanLessonId]
  );

  const selectedDateStr = selectedDate ? toDateStr(selectedDate) : "";

  useEffect(() => {
    const byDate = selectedLesson?.id ? String(selectedLesson.id) : "";
    if (byDate) {
      setSelectedPlanLessonId(byDate);
      return;
    }
    const firstForDate = selectableLessons?.[0]?.id;
    setSelectedPlanLessonId(firstForDate ? String(firstForDate) : "");
  }, [selectedLesson?.id, selectableLessons]);

  // Tanlangan sana/dars o'zgarganda davomat ma'lumotlarini yuklash
  useEffect(() => {
    const next = {};
    (students || []).forEach(s => { next[s.id] = false; });
    setStatusMap(next);
    setAttendanceMap({});
    setError("");
    const lessonForPlan = selectedPlanLesson?.id ? selectedPlanLesson : selectedLesson;
    setTopic(lessonForPlan?.title || "");

    if (!lessonForPlan?.id) return;

    setLoadingAttendance(true);
    attendanceApi.getByLessonId(lessonForPlan.id)
      .then(rows => {
        const existing = {};
        const merged   = { ...next };
        (rows || []).forEach(r => {
          existing[r.studentId] = r;
          merged[r.studentId]   = !!r.isPresent;
        });
        setAttendanceMap(existing);
        setStatusMap(merged);
        // Agar API dan davomat ma'lumotlari kelsa → sana avval saqlangan deb belgilaymiz
        // Bu page refresh bo'lganda ham "Yangilash" tugmasi ko'rinishi uchun
        if (rows && rows.length > 0 && selectedDateStr) {
          setSavedDates(prev => ({ ...prev, [selectedDateStr]: true }));
        }
      })
      .catch((e) => {
        setAttendanceMap({});
        setStatusMap(next);
        const msg = String(e?.message || "");
        if (msg.includes("404")) {
          setSelectedPlanLessonId("");
          setError("Tanlangan mavzu topilmadi. Iltimos, shu sana uchun mavjud mavzuni qayta tanlang.");
        }
      })
      .finally(() => setLoadingAttendance(false));
  }, [selectedLesson?.id, selectedPlanLesson?.id, selectedDate]);

  // Dars yaratish
  const handleCreateLesson = async () => {
    if (!topic.trim()) { setError("Mavzu kiriting"); return; }
    setSaving(true); setError("");
    try {
      const created = await lessonApi.create({ title: topic.trim(), groupId: group?.id });
      const withDate = { ...created, startTime: group?.startTime, date: selectedDateStr };
      setLocalLessons(prev => [...prev, withDate]);
    } catch (e) {
      setError(e.message || "Dars yaratishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  // Davomatni saqlash
  const handleSaveAttendance = async () => {
    const lessonForPlan = selectedPlanLesson?.id ? selectedPlanLesson : selectedLesson;
    if (!lessonForPlan?.id) { setError("Avval dars mavzusini tanlang yoki yarating"); return; }
    if (!topic.trim())        { setError("Mavzu bo'sh bo'lmasin"); return; }
    setSaving(true); setError("");
    try {
      if ((lessonForPlan.title || "").trim() !== topic.trim()) {
        await lessonApi.update(lessonForPlan.id, { title: topic.trim() });
        setLocalLessons(prev =>
          prev.map(l => l.id === lessonForPlan.id ? { ...l, title: topic.trim() } : l)
        );
      }
      const jobs = (students || []).map(s => {
        const studentId = s.id;
        const isPresent = !!statusMap[studentId];
        const existing  = attendanceMap[studentId];
        if (existing?.id) {
          return attendanceApi.update(existing.id, { lessonId: lessonForPlan.id, studentId, isPresent });
        }
        return attendanceApi.create({ lessonId: lessonForPlan.id, studentId, isPresent });
      });
      await Promise.all(jobs);
      // Sanani saqlangan deb belgilaymiz → "Saqlash" o'rniga "Yangilash" chiqadi
      setSavedDates(prev => ({ ...prev, [selectedDateStr]: true }));
    } catch (e) {
      setError(e.message || "Davomatni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  // "Yangilash" bosilganda qayta tahrirlash holatiga qaytish
  const handleEnableUpdate = () => {
    setSavedDates(prev => ({ ...prev, [selectedDateStr]: false }));
  };

  const isCurrentDateSaved = savedDates[selectedDateStr] === true;
  // Kelajak kun ekanligini tekshirish
  const isFutureDate = (date) => toDateStr(date) > todayStr;

  // Hafta kuni qisqa nomi
  const WEEK_SHORT = ["Ya", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];

  // Yangi mavzu qo'shib davomat
  const handleAddNewTopic = async () => {
    if (!newTopic.trim()) { setError("Mavzu kiriting"); return; }
    setSaving(true); setError("");
    try {
      const created = await lessonApi.create({ title: newTopic.trim(), groupId: group?.id });
      const withDate = { ...created, startTime: group?.startTime, date: selectedDateStr };
      setLocalLessons(prev => [...prev, withDate]);
      setNewTopic("");
      setMode("plan"); // dars qo'shildi, endi davomat qilish uchun plan modega qayt
    } catch (e) {
      setError(e.message || "Dars yaratishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#fff", border: "1px solid #f3f4f6", borderRadius: 3, p: 2.5 }}>

      {/* ── Kalendar header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>Akademik davomat</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={() => {
            if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
            else setCalMonth(m => m - 1);
          }} sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5 }}>
            <ChevronLeftRoundedIcon fontSize="small" />
          </IconButton>
          <Typography sx={{ minWidth: 120, textAlign: "center", fontWeight: 700, fontSize: 15, color: "#111827" }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </Typography>
          <IconButton size="small" onClick={() => {
            if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
            else setCalMonth(m => m + 1);
          }} sx={{ border: "1px solid #e5e7eb", borderRadius: 1.5 }}>
            <ChevronRightRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* ── Gorizontal dars kunlari ── */}
      {lessonDates.length === 0 ? (
        <Box sx={{ py: 3, textAlign: "center", color: "#9ca3af", fontSize: 14,
          border: "1px dashed #e5e7eb", borderRadius: 2 }}>
          Bu oyda dars kunlari yo'q
        </Box>
      ) : (
        <Box sx={{
          overflowX: "auto", pb: 1,
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "#f3f4f6", borderRadius: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#d1d5db", borderRadius: 4 },
        }}>
          <Box sx={{ display: "flex", gap: 1, py: 1, minWidth: "max-content" }}>
            {lessonDates.map(date => {
              const dStr      = toDateStr(date);
              const isSelected = dStr === selectedDateStr;
              const isToday   = dStr === todayStr;
              const isFuture  = dStr > todayStr;
              const hasLesson = !!findLessonByDate(localLessons, date);
              const isSaved   = savedDates[dStr] === true;
              return (
                <Tooltip key={dStr} title={isFuture ? "Hali o'tmagan kun" : ""} arrow>
                  <Box
                    onClick={() => !isFuture && setSelectedDate(date)}
                    sx={{
                      minWidth: 64, px: 1.5, py: 1.2,
                      borderRadius: 2.5,
                      cursor: isFuture ? "not-allowed" : "pointer",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 0.4,
                      opacity: isFuture ? 0.38 : 1,
                      border: isSelected
                        ? "2px solid #7c3aed"
                        : isToday
                          ? "2px solid #10b981"
                          : "1px solid #e5e7eb",
                      bgcolor: isSelected ? "#f5f3ff"
                        : isFuture ? "#f9fafb"
                        : hasLesson ? "#f0fdf4"
                        : "#fafafa",
                      boxShadow: isSelected ? "0 2px 12px #7c3aed22" : "none",
                      transition: "all .15s",
                      "&:hover": !isFuture ? { borderColor: "#7c3aed", bgcolor: "#f5f3ff" } : {},
                    }}
                  >
                    <Typography sx={{
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                      color: isFuture ? "#d1d5db" : isSelected ? "#7c3aed" : "#9ca3af",
                      letterSpacing: 0.5,
                    }}>
                      {WEEK_SHORT[date.getDay()]}
                    </Typography>
                    <Typography sx={{
                      fontSize: 18, fontWeight: isSelected ? 800 : 600,
                      color: isFuture ? "#d1d5db" : isSelected ? "#7c3aed" : isToday ? "#10b981" : "#111827",
                      lineHeight: 1.1,
                    }}>
                      {date.getDate()}
                    </Typography>
                    <Box sx={{
                      width: 8, height: 8, borderRadius: "50%",
                      bgcolor: isFuture ? "#e5e7eb" : isSaved ? "#7c3aed" : hasLesson ? "#10b981" : "#d1d5db",
                      transition: "all .2s",
                    }} />
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mt: 1, mb: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
          <Typography sx={{ fontSize: 11, color: "#6b7280" }}>Dars kuni</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", border: "2px solid #10b981" }} />
          <Typography sx={{ fontSize: 11, color: "#6b7280" }}>Bugun</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#7c3aed" }} />
          <Typography sx={{ fontSize: 11, color: "#6b7280" }}>Saqlangan</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#e5e7eb" }} />
          <Typography sx={{ fontSize: 11, color: "#6b7280" }}>Kelajak kun</Typography>
        </Box>
      </Box>

      {/* ── Tanlangan kun bo'limi ── */}
      {selectedDate && !isFutureDate(selectedDate) && (
        <Box sx={{ mt: 1, p: 2.5, border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff" }}>
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>
              {group?.name} · {selectedDateStr}
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>}

          {/* ── Radio tugmalar ── */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb" }}>
            <RadioGroup row value={mode} onChange={(e) => { setMode(e.target.value); setError(""); }}
              sx={{ gap: 2 }}>
              <FormControlLabel
                value="plan"
                control={<Radio size="small" sx={{ color: "#7c3aed", "&.Mui-checked": { color: "#7c3aed" } }} />}
                label={
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: mode === "plan" ? "#7c3aed" : "#374151" }}>
                    O'quv reja asosida
                  </Typography>
                }
              />
              <FormControlLabel
                value="new"
                control={<Radio size="small" sx={{ color: "#10b981", "&.Mui-checked": { color: "#10b981" } }} />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AddCircleOutlineRoundedIcon sx={{ fontSize: 16, color: mode === "new" ? "#10b981" : "#9ca3af" }} />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: mode === "new" ? "#10b981" : "#374151" }}>
                      Yangi mavzu qo'shish
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </Box>

          {/* ── Yangi mavzu qo'shish mode ── */}
          {mode === "new" && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField fullWidth size="small" label="Yangi mavzu nomi" value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddNewTopic()}
                  placeholder="Masalan: 15-dars: React Hooks"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
                <Button onClick={handleAddNewTopic} disabled={saving || !newTopic.trim()}
                  variant="contained" sx={{
                    textTransform: "none", bgcolor: "#10b981",
                    "&:hover": { bgcolor: "#059669" },
                    borderRadius: 2, boxShadow: "none", whiteSpace: "nowrap",
                  }}>
                  {saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Qo'shish"}
                </Button>
              </Box>
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.8 }}>
                Qo'shilgan mavzu darsliklar bo'limida ham ko'rinadi.
              </Typography>
            </Box>
          )}

          {/* ── O'quv reja mode — mavzu tanlash va davomat ── */}
          {mode === "plan" && (
            <>
              {/* Mavzu ro'yxati */}
              <Select
                fullWidth
                size="small"
                value={selectedPlanLessonId}
                onChange={(e) => setSelectedPlanLessonId(String(e.target.value))}
                disabled={isCurrentDateSaved}
                displayEmpty
                sx={{ mb: 1.2, borderRadius: 2 }}
              >
                {(selectableLessons || []).length === 0 && (
                  <MenuItem value="" disabled>Mavzu topilmadi</MenuItem>
                )}
                {(selectableLessons || []).map((lesson) => (
                  <MenuItem key={lesson.id} value={String(lesson.id)}>{lesson.title}</MenuItem>
                ))}
              </Select>

              <TextField
                fullWidth
                size="small"
                label="Tanlangan mavzu nomi"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={isCurrentDateSaved || !selectedPlanLessonId}
                helperText={!selectedPlanLessonId ? "Avval ro'yxatdan mavzuni tanlang" : ""}
                sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />

              {loadingAttendance ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress sx={{ color: "#7c3aed" }} />
                </Box>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, fontSize: 12, color: "#9ca3af", textTransform: "uppercase" } }}>
                        <TableCell>#</TableCell>
                        <TableCell>O'quvchi ismi</TableCell>
                        <TableCell align="center">Vaqti</TableCell>
                        <TableCell align="right">Keldi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(students || []).map((s, idx) => (
                        <TableRow key={s.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ color: "#9ca3af", fontSize: 13 }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                              <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "#ede9fe", color: "#7c3aed", fontWeight: 700 }}>
                                {s.fullName?.[0] || "S"}
                              </Avatar>
                              <Typography sx={{ fontSize: 14, color: "#111827", fontWeight: 500 }}>{s.fullName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ color: "#6b7280", fontSize: 13 }}>
                            {group?.startTime?.slice(0, 5) || "19:00"}
                          </TableCell>
                          <TableCell align="right">
                            <Switch
                              checked={!!statusMap[s.id]}
                              onChange={() => !isCurrentDateSaved && setStatusMap(p => ({ ...p, [s.id]: !p[s.id] }))}
                              disabled={isCurrentDateSaved || !selectedPlanLessonId}
                              color="success"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {students?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ textAlign: "center", py: 3, color: "#9ca3af" }}>
                            Talabalar yo'q
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Saqlash / Yangilash */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
                    {isCurrentDateSaved ? (
                      <Button onClick={handleEnableUpdate} variant="contained" sx={{
                        textTransform: "none", borderRadius: 2, boxShadow: "none",
                        bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" },
                        fontWeight: 600, px: 3,
                      }}>
                        Yangilash
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSaveAttendance}
                        disabled={saving || loadingAttendance || !selectedPlanLessonId}
                        variant="contained"
                        sx={{
                          textTransform: "none", borderRadius: 2, boxShadow: "none",
                          bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" },
                          fontWeight: 600, px: 3,
                        }}>
                        {saving ? "Saqlanmoqda..." : "Saqlash"}
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* Kelajak kun tanlanganda xabar */}
      {selectedDate && isFutureDate(selectedDate) && (
        <Box sx={{ mt: 1, p: 2.5, border: "1px dashed #e5e7eb", borderRadius: 2.5,
          bgcolor: "#fafafa", textAlign: "center" }}>
          <Typography sx={{ color: "#9ca3af", fontSize: 14 }}>
            Bu kun hali kelmagan. Davomat faqat o'tgan va bugungi kunlar uchun qilinadi.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function GroupDetailContext({ groupId, onBack, canManageStudents = true }) {
  const [group, setGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [g, allLessons] = await Promise.all([
        groupApi.getById(groupId),
        lessonApi.getAll(),
      ]);
      const normalized = {
        ...g,
        students: Array.isArray(g?.studentGroups) ? g.studentGroups : [],
      };
      setGroup(normalized);
      setLessons(Array.isArray(allLessons) ? allLessons.filter((l) => Number(l.groupId) === Number(groupId)) : []);
    } catch (e) {
      setError(e.message || "Guruh ma'lumotlarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!groupId) return;
    fetchAll();
  }, [groupId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #f3f4f6", overflow: "hidden" }}>
      <Box sx={{ p: 3, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button onClick={onBack} variant="outlined" size="small" sx={{ textTransform: "none", color: "#6b7280", borderColor: "#e5e7eb", borderRadius: 2 }}>
            <ArrowBackRoundedIcon sx={{ mr: 0.5, fontSize: 18 }} /> Orqaga
          </Button>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{group?.name}</Typography>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Guruh ma'lumotlari</Typography>
          </Box>
        </Box>
        <Chip label={group?.status || "ACTIVE"} size="small" sx={{ bgcolor: ACCENT_BG, color: ACCENT, fontWeight: 700 }} />
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 15, color: "#6b7280", py: 2 },
            "& .Mui-selected": { color: "#10b981" },
            "& .MuiTabs-indicator": { backgroundColor: "#10b981", height: 3 },
          }}
        >
          <Tab label="Ma'lumotlar" />
          <Tab label="Guruh darsliklari" />
          <Tab label="Akademik davomat" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3, bgcolor: "#f9fafb" }}>
        {activeTab === 0 && <GroupInfoTab group={group} refreshGroup={fetchAll} canManageStudents={canManageStudents} />}
        {activeTab === 1 && <GroupLessonsTab group={group} />}
        {activeTab === 2 && (
          <AttendanceCalendarTab
            group={group}
            lessons={lessons}
            students={(group?.students || []).map((s) => s.student || s).filter(Boolean)}
            onRefresh={fetchAll}
          />
        )}
      </Box>
    </Box>
  );
}
