import React, { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Chip, TextField,
  InputAdornment, CircularProgress, Button, Avatar, Grid,
  Alert, FormControl, InputLabel, Select, MenuItem,
  FormGroup, FormControlLabel, Checkbox, IconButton
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { groupApi, courseApi, roomApi, teacherApi } from "../../api/apiService.js";
import GroupDetailContext from "./groups/GroupDetailContext.jsx";

const ACCENT = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

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
  if (n.includes("node")) return COURSE_COLORS[0];
  if (n.includes("react") || n.includes("frontend")) return COURSE_COLORS[1];
  if (n.includes("python")) return COURSE_COLORS[2];
  if (n.includes("math")) return COURSE_COLORS[3];
  if (n.includes("ielts")) return COURSE_COLORS[4];
  return COURSE_COLORS[5];
};

const WEEK_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const WEEK_DAYS_LABEL = {
  MONDAY: "Dushanba",
  TUESDAY: "Seshanba",
  WEDNESDAY: "Chorshanba",
  THURSDAY: "Payshanba",
  FRIDAY: "Juma",
  SATURDAY: "Shanba",
  SUNDAY: "Yakshanba",
};

function AddGroupPage({ onBack, onAdded }) {
  const [form, setForm] = useState({
    name: "",
    courseId: "",
    teacherId: "",
    roomId: "",
    startDate: "",
    startTime: "",
    weeKDays: [],
  });
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      courseApi.getAll(),
      teacherApi.getAll(),
      roomApi.getAll(),
    ])
      .then(([c, t, r]) => {
        setCourses(Array.isArray(c) ? c : []);
        setTeachers(Array.isArray(t) ? t : []);
        setRooms(Array.isArray(r) ? r : []);
      })
      .catch((e) => setError(e.message || "Ma'lumotlarni yuklashda xatolik"))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      weeKDays: prev.weeKDays.includes(day)
        ? prev.weeKDays.filter((d) => d !== day)
        : [...prev.weeKDays, day],
    }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.courseId || !form.teacherId || !form.roomId || !form.startDate || !form.startTime || form.weeKDays.length === 0) {
      setError("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        courseId: Number(form.courseId),
        teacherId: Number(form.teacherId),
        roomId: Number(form.roomId),
        startDate: form.startDate,
        startTime: form.startTime,
        weeKDays: form.weeKDays,
      };
      await groupApi.create(payload);
      onAdded();
    } catch (e) {
      setError(e.message || "Guruh yaratishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f9fafb", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={onBack} sx={{ bgcolor: "#fff", border: "1px solid #e5e7eb" }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>Yangi guruh qo'shish</Typography>
          <Typography sx={{ color: "#6b7280", fontSize: 14 }}>Guruh ma'lumotlarini to'ldiring</Typography>
        </Box>
      </Box>

      <Card sx={{ maxWidth: 760, borderRadius: 3 }}>
        <CardContent sx={{ p: 3, display: "grid", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Guruh nomi"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            fullWidth
            size="small"
          />

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Kurs</InputLabel>
              <Select
                value={form.courseId}
                label="Kurs"
                onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value }))}
              >
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>O'qituvchi</InputLabel>
              <Select
                value={form.teacherId}
                label="O'qituvchi"
                onChange={(e) => setForm((p) => ({ ...p, teacherId: e.target.value }))}
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Xona</InputLabel>
              <Select
                value={form.roomId}
                label="Xona"
                onChange={(e) => setForm((p) => ({ ...p, roomId: e.target.value }))}
              >
                {rooms.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Boshlanish sanasi"
              type="date"
              size="small"
              value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Boshlanish vaqti"
              type="time"
              size="small"
              value={form.startTime}
              onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <Typography sx={{ mb: 1, fontSize: 14, fontWeight: 600, color: "#374151" }}>Hafta kunlari</Typography>
            <FormGroup row>
              {WEEK_DAYS.map((d) => (
                <FormControlLabel
                  key={d}
                  control={<Checkbox checked={form.weeKDays.includes(d)} onChange={() => toggleDay(d)} />}
                  label={WEEK_DAYS_LABEL[d]}
                />
              ))}
            </FormGroup>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
            <Button variant="outlined" onClick={onBack} disabled={saving}>Bekor</Button>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <AddRoundedIcon />}
              sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#6d28d9" }, textTransform: "none" }}
            >
              {saving ? "Saqlanmoqda..." : "Guruh qo'shish"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [mode, setMode] = useState("list");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const gList = await groupApi.getAll();
      setGroups(gList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = groups.filter((g) =>
    (g.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (mode === "create") {
    return (
      <AddGroupPage
        onBack={() => setMode("list")}
        onAdded={() => {
          setMode("list");
          fetchGroups();
        }}
      />
    );
  }

  if (mode === "detail" && selectedGroupId) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f9fafb", minHeight: "100vh" }}>
        <GroupDetailContext
          groupId={selectedGroupId}
          onBack={() => {
            setMode("list");
            setSelectedGroupId(null);
            fetchGroups();
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f9fafb", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "space-between", alignItems: "flex-end", mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#111827", mb: 1, letterSpacing: "-0.5px" }}>
            Guruhlar
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: 15 }}>
            Barcha guruhlarni boshqarish, darslar va davomatni nazorat qilish
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Guruh nomini qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "#9ca3af" }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: 280 }, bgcolor: "#fff", borderRadius: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <Button
            variant="outlined"
            onClick={fetchGroups}
            sx={{ borderColor: "#e5e7eb", color: "#374151", textTransform: "none", borderRadius: 2, minWidth: 40 }}
          >
            <RefreshRoundedIcon fontSize="small" />
          </Button>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setMode("create")}
            sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#6d28d9" }, textTransform: "none", borderRadius: 2, boxShadow: "0 4px 12px rgba(124,58,237,0.2)" }}
          >
            Guruh qo'shish
          </Button>
        </Box>
      </Box>

      {/* Ro'yxat */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filtered.map((g) => {
            const cc = getCourseColor(g.course?.name || "");
            const isFinished = g.status === "FINISHED";
            const daysCount = Array.isArray(g.weeKDays || g.daysOfWeek) ? (g.weeKDays || g.daysOfWeek).length : 0;
            return (
              <Grid item xs={12} sm={6} lg={4} key={g.id}>
                <Card
                  onClick={() => {
                    setSelectedGroupId(g.id);
                    setMode("detail");
                  }}
                  sx={{
                    borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
                    border: "1px solid #f3f4f6", boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 24px rgba(0,0,0,0.06)", borderColor: "#e5e7eb" },
                  }}
                >
                  <CardContent sx={{ p: "0 !important" }}>
                    <Box sx={{ p: 3, background: `linear-gradient(${cc.grad})`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", overflow: "hidden" }}>
                      <Box sx={{ position: "absolute", right: -20, top: -20, opacity: 0.1, transform: "scale(2)" }}>
                        <GroupsRoundedIcon sx={{ fontSize: 100, color: "#fff" }} />
                      </Box>
                      <Box sx={{ position: "relative", zIndex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", mb: 0.5, letterSpacing: "-0.5px" }}>
                          {g.name}
                        </Typography>
                        <Chip label={g.course?.name || "Noma'lum"} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", backdropFilter: "blur(4px)", fontWeight: 600, border: "1px solid rgba(255,255,255,0.3)" }} />
                      </Box>
                      <Chip
                        label={isFinished ? "Tugagan" : (g.status || "Faol")}
                        size="small"
                        sx={{ bgcolor: isFinished ? "#fee2e2" : "#fff", color: isFinished ? "#ef4444" : cc.color, fontWeight: 700, fontSize: 11, zIndex: 1 }}
                      />
                    </Box>

                    <Box sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                        <Box>
                          <Typography sx={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>Dars kunlari</Typography>
                          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{daysCount} kun/hafta</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography sx={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", mb: 0.5 }}>Vaqti</Typography>
                          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{g.startTime?.slice(0, 5) || "—"}</Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 2, borderTop: "1px dashed #e5e7eb" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: cc.bg, color: cc.color, fontSize: 13, fontWeight: 700 }}>
                            {g.teacher?.fullName?.split(' ').map(n => n[0]).join('') || "?"}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                              {g.teacher?.fullName || "O'qituvchi yo'q"}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <GroupsRoundedIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{g.studentGroups?.length || 0}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: "center", py: 8, bgcolor: "#fff", borderRadius: 4, border: "1px dashed #d1d5db" }}>
                <Typography sx={{ color: "#6b7280", fontSize: 15 }}>Guruhlar topilmadi</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

    </Box>
  );
}
