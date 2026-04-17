import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Chip,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { attendanceApi, homeworkApi, lessonApi, homeworkResponseApi, homeworkResultApi } from "../../../api/apiService.js";
import { API_BASE } from "../../../utils/constants.js";

const ROOT_BASE = API_BASE.replace(/\/api\/?$/, "");

const toDateSafe = (d) => {
  if (!d) return null;
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pad2 = (n) => String(n).padStart(2, "0");

const fmtDate = (d) => {
  const date = toDateSafe(d);
  if (!date) return "—";
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const fmtOnlyDate = (d) => {
  const date = toDateSafe(d);
  if (!date) return "—";
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
};

const isSameDay = (a, b) => {
  const da = toDateSafe(a);
  const db = toDateSafe(b);
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const calcDeadline = (createdAt, durationTime = 16) => {
  const dt = new Date(createdAt);
  dt.setHours(dt.getHours() + Number(durationTime || 16));
  return dt;
};

const calcXp = (score) => Math.max(0, Math.floor(Number(score || 0) / 20));
const calcSilver = (score) => Math.max(0, Math.floor(Number(score || 0) / 3));

const buildPathCandidates = (filePath) => {
  if (!filePath) return [];
  if (/^https?:\/\//i.test(filePath)) return [filePath];

  const clean = String(filePath).trim().replace(/^[/\\]+/, "").replace(/\\/g, "/");
  const withoutApi = clean.replace(/^api\//i, "");
  const withoutUploads = withoutApi.replace(/^uploads\//i, "");

  const encodedClean = encodeURI(clean);
  const encodedWithoutApi = encodeURI(withoutApi);
  const encodedWithoutUploads = encodeURI(withoutUploads);

  const list = [
    `${ROOT_BASE}/${encodedClean}`,
    `${ROOT_BASE}/${encodedWithoutApi}`,
    `${ROOT_BASE}/uploads/${encodedWithoutUploads}`,
    `${API_BASE}/${encodedClean}`,
    `${API_BASE}/${encodedWithoutApi}`,
    `${API_BASE}/uploads/${encodedWithoutUploads}`,
  ];

  return [...new Set(list.filter(Boolean))];
};

const getFileUrl = (filePath) => buildPathCandidates(filePath)[0] || null;

export default function HomeworkSubTab({ group }) {
  const [lessons, setLessons] = useState([]);
  const [assignableLessons, setAssignableLessons] = useState([]);
  const [homeworks, setHomeworks] = useState([]);
  const [responsesByHomework, setResponsesByHomework] = useState({});
  const [resultsByHomework, setResultsByHomework] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeHomework, setActiveHomework] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hwForm, setHwForm] = useState({ lessonId: "", title: "", durationTime: 16, file: null });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionTarget, setActionTarget] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", durationTime: 16, file: null });
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  const studentsCount = (group?.students || []).length;

  useEffect(() => {
    if (group?.id) fetchData();
  }, [group?.id]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, severity, message });
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [allLessons, allHw, allResults, allAttendances] = await Promise.all([
        lessonApi.getAll(),
        homeworkApi.getAll(),
        homeworkResultApi.getAll().catch(() => []),
        attendanceApi.getAll().catch(() => []),
      ]);

      const gLessons = (allLessons || []).filter((l) => Number(l.groupId) === Number(group.id));
      setLessons(gLessons);

      const today = new Date();
      const attendedLessonIds = new Set((allAttendances || []).map((a) => Number(a.lessonId)).filter(Boolean));
      const todayLessons = gLessons.filter((l) => isSameDay(l.created_at || l.date, today));
      const eligible = todayLessons.filter((l) => attendedLessonIds.has(Number(l.id)));
      const available = eligible.filter((l) => !allHw?.some((hw) => Number(hw.lessonId) === Number(l.id)));
      setAssignableLessons(available);

      setHwForm((prev) => {
        const stillEligible = available.some((l) => Number(l.id) === Number(prev.lessonId));
        if (stillEligible) return prev;
        const defaultLessonId = available[0]?.id ? String(available[0].id) : "";
        return { ...prev, lessonId: defaultLessonId };
      });

      const gHw = (allHw || []).filter((hw) => gLessons.some((l) => Number(l.id) === Number(hw.lessonId)));
      const enrichedHw = gHw.map((hw) => {
        const lesson = gLessons.find((l) => Number(l.id) === Number(hw.lessonId));
        return { ...hw, lessonTitle: lesson?.title || hw.title, lessonDate: lesson?.created_at };
      });
      setHomeworks(enrichedHw);

      const responsesEntries = await Promise.all(
        enrichedHw.map(async (hw) => {
          const rs = await homeworkResponseApi.getByHomeworkId(hw.id).catch(() => []);
          return [hw.id, Array.isArray(rs) ? rs : []];
        })
      );
      setResponsesByHomework(Object.fromEntries(responsesEntries));

      const groupedResults = {};
      (allResults || []).forEach((r) => {
        const hId = Number(r.homeworkId || r?.homework?.id);
        if (!hId) return;
        if (!groupedResults[hId]) groupedResults[hId] = [];
        groupedResults[hId].push(r);
      });
      setResultsByHomework(groupedResults);
    } catch (err) {
      setError(err.message || "Uy vazifalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const isEligible = assignableLessons.some((l) => Number(l.id) === Number(hwForm.lessonId));
    if (!isEligible) {
      showToast("Faqat bugungi yo'qlama qilingan mavzuga uyga vazifa qo'shish mumkin.", "error");
      return;
    }
    const alreadyExists = homeworks.some((hw) => Number(hw.lessonId) === Number(hwForm.lessonId));
    if (alreadyExists) {
      showToast("Bu mavzuga uyga vazifa avval yuklangan.", "error");
      return;
    }
    if (!hwForm.lessonId || !hwForm.title.trim()) {
      showToast("Mavzu va darsni tanlang", "error");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("lessonId", hwForm.lessonId);
      fd.append("title", hwForm.title.trim());
      fd.append("durationTime", String(hwForm.durationTime || 16));
      if (hwForm.file) fd.append("file", hwForm.file);
      await homeworkApi.create(fd);
      setOpenModal(false);
      setHwForm({ lessonId: "", title: "", durationTime: 16, file: null });
      showToast("Uyga vazifa muvaffaqiyatli yuklandi.", "success");
      fetchData();
    } catch (e) {
      showToast(e.message || "Yaratishda xatolik", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenModal = () => {
    const defaultLessonId = assignableLessons[0]?.id ? String(assignableLessons[0].id) : "";
    setHwForm((prev) => ({ ...prev, lessonId: defaultLessonId }));
    setOpenModal(true);
  };

  const handleOpenEdit = (hw) => {
    setActionTarget(hw);
    setEditForm({
      title: hw?.title || "",
      durationTime: Number(hw?.durationTime || 16),
      file: null,
    });
    setEditOpen(true);
  };

  const handleOpenDelete = (hw) => {
    setActionTarget(hw);
    setDeleteOpen(true);
  };

  const handleEditSave = async () => {
    if (!actionTarget?.id) return;
    if (!editForm.title.trim()) {
      showToast("Mavzu bo'sh bo'lmasin", "error");
      return;
    }

    setActionSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", editForm.title.trim());
      fd.append("durationTime", String(Number(editForm.durationTime || 16)));
      if (editForm.file) fd.append("file", editForm.file);

      await homeworkApi.update(actionTarget.id, fd);
      setEditOpen(false);
      setActionTarget(null);
      showToast("Uyga vazifa yangilandi", "success");
      await fetchData();
    } catch (e) {
      showToast(e.message || "Yangilashda xatolik", "error");
    } finally {
      setActionSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!actionTarget?.id) return;
    setActionSaving(true);
    try {
      await homeworkApi.delete(actionTarget.id);
      setDeleteOpen(false);
      setActionTarget(null);
      showToast("Uyga vazifa o'chirildi", "success");
      await fetchData();
    } catch (e) {
      showToast(e.message || "O'chirishda xatolik", "error");
    } finally {
      setActionSaving(false);
    }
  };

  if (activeHomework) {
    return (
      <HomeworkDetail
        hw={activeHomework}
        onBack={() => setActiveHomework(null)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleOpenModal}
          disabled={assignableLessons.length === 0}
          sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, textTransform: "none" }}
        >
          Uyga vazifa qo'shish
        </Button>
      </Box>

      {assignableLessons.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Bugungi darsda yo'qlama qiling, keyin faqat shu bugungi mavzuga uyga vazifa qo'shish mumkin.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ bgcolor: "#fff", borderRadius: 2, border: "1px solid #f3f4f6", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: "#f9fafb" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Mavzu</TableCell>
                  <TableCell align="center" sx={{ color: "#6b7280" }}><PersonOutlineIcon fontSize="small" /></TableCell>
                  <TableCell align="center" sx={{ color: "#6b7280" }}><AccessTimeIcon fontSize="small" /></TableCell>
                  <TableCell align="center" sx={{ color: "#6b7280" }}><CheckCircleOutlineIcon fontSize="small" /></TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Berilgan vaqt</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Tugash vaqti</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Dars sanasi</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {homeworks.map((hw, idx) => {
                  const responses = responsesByHomework[hw.id] || [];
                  const results = resultsByHomework[hw.id] || [];
                  const approved = results.filter((r) => r.status === "APPROVED").length;
                  const deadline = calcDeadline(hw.created_at || hw.createdAt, hw.durationTime);
                  return (
                    <TableRow key={hw.id} hover onClick={() => setActiveHomework(hw)} sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ color: "#111827", fontWeight: 500 }}>{hw.title || hw.lessonTitle}</TableCell>
                      <TableCell align="center" sx={{ color: "#4b5563" }}>{studentsCount}</TableCell>
                      <TableCell align="center" sx={{ color: "#4b5563" }}>{responses.length}</TableCell>
                      <TableCell align="center" sx={{ color: "#4b5563" }}>{approved}</TableCell>
                      <TableCell sx={{ color: "#4b5563", fontSize: 13 }}>{fmtDate(hw.created_at || hw.createdAt)}</TableCell>
                      <TableCell sx={{ color: "#4b5563", fontSize: 13 }}>{fmtDate(deadline)}</TableCell>
                      <TableCell sx={{ color: "#4b5563", fontSize: 13 }}>{fmtOnlyDate(hw.lessonDate)}</TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <IconButton size="small" onClick={() => handleOpenEdit(hw)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(hw)}>
                          <DeleteRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {homeworks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>Uy vazifalari yo'q</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Uy vazifa qo'shish</DialogTitle>
        <DialogContent dividers>
          {assignableLessons.length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bugun yo'qlama qilingan dars topilmadi. Avval bugungi darsga yo'qlama qiling.
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Mavzuni tanlang</InputLabel>
            <Select
              label="Mavzuni tanlang"
              value={hwForm.lessonId}
              disabled={assignableLessons.length === 0}
              onChange={(e) => {
                const selectedId = e.target.value;
                const duplicate = homeworks.some((hw) => Number(hw.lessonId) === Number(selectedId));
                if (duplicate) {
                  showToast("Bu mavzuga uyga vazifa avval yuklangan.", "error");
                }
                setHwForm({ ...hwForm, lessonId: selectedId });
              }}
            >
              {assignableLessons.map((l) => {
                const duplicate = homeworks.some((hw) => Number(hw.lessonId) === Number(l.id));
                return (
                  <MenuItem key={l.id} value={l.id}>
                    {l.title} ({fmtOnlyDate(l.created_at)}){duplicate ? " - Yuklangan" : ""}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Uy vazifa mavzusi"
            sx={{ mb: 2 }}
            value={hwForm.title}
            onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
          />
          <TextField
            fullWidth
            type="number"
            label="Muddat (soat)"
            sx={{ mb: 2 }}
            value={hwForm.durationTime}
            onChange={(e) => setHwForm({ ...hwForm, durationTime: e.target.value })}
          />
          <Button component="label" variant="outlined" sx={{ textTransform: "none" }}>
            Fayl biriktirish
            <input
              hidden
              type="file"
              onChange={(e) => setHwForm({ ...hwForm, file: e.target.files?.[0] || null })}
            />
          </Button>
          {hwForm.file && <Typography sx={{ mt: 1, fontSize: 12, color: "#6b7280" }}>{hwForm.file.name}</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} color="inherit">Bekor qilish</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={saving || assignableLessons.length === 0}
            sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => !actionSaving && setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Uyga vazifani tahrirlash</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Uy vazifa mavzusi"
            sx={{ mb: 2 }}
            value={editForm.title}
            onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
          />
          <TextField
            fullWidth
            type="number"
            label="Muddat (soat)"
            sx={{ mb: 2 }}
            value={editForm.durationTime}
            onChange={(e) => setEditForm((p) => ({ ...p, durationTime: e.target.value }))}
          />
          <Button component="label" variant="outlined" sx={{ textTransform: "none" }}>
            Yangi fayl biriktirish (ixtiyoriy)
            <input
              hidden
              type="file"
              onChange={(e) => setEditForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
            />
          </Button>
          {editForm.file && <Typography sx={{ mt: 1, fontSize: 12, color: "#6b7280" }}>{editForm.file.name}</Typography>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={actionSaving}>Bekor qilish</Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={actionSaving}
            sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
          >
            {actionSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => !actionSaving && setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Uyga vazifani o'chirish</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: "#374151" }}>
            "{actionTarget?.title || "Ushbu vazifa"}" ni o'chirmoqchimisiz?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="inherit" disabled={actionSaving}>Bekor qilish</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={actionSaving}
          >
            {actionSaving ? "O'chirilmoqda..." : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function HomeworkDetail({ hw, onBack, onRefresh }) {
  const [tab, setTab] = useState(0);
  const [responses, setResponses] = useState([]);
  const [results, setResults] = useState([]);
  const [missed, setMissed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: "", title: "" });
  const [activeSubmission, setActiveSubmission] = useState(null);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const [resps, allResults, missedStudents] = await Promise.all([
        homeworkResponseApi.getByHomeworkId(hw.id).catch(() => []),
        homeworkResultApi.getAll().catch(() => []),
        homeworkResponseApi.getMissedStudents(hw.id).catch(() => []),
      ]);
      setResponses(Array.isArray(resps) ? resps : []);
      setResults((allResults || []).filter((r) => Number(r.homeworkId || r?.homework?.id) === Number(hw.id)));
      setMissed(Array.isArray(missedStudents) ? missedStudents : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetail(); }, [hw?.id]);

  const resultByStudent = useMemo(() => {
    const map = {};
    results.forEach((r) => { map[Number(r.studentId)] = r; });
    return map;
  }, [results]);

  const pendingRows = responses.filter((r) => !resultByStudent[Number(r.studentId)]);
  const checkedRows = responses.filter((r) => !!resultByStudent[Number(r.studentId)]);
  const rejectedRows = responses.filter((r) => resultByStudent[Number(r.studentId)]?.status === "REJECTED");
  const assignedAt = hw.created_at || hw.createdAt;
  const deadlineAt = calcDeadline(assignedAt, hw.durationTime);
  const attachedHomeworkFileUrl = getFileUrl(hw.file);
  const reviewProgress = responses.length > 0 ? Math.round((checkedRows.length / responses.length) * 100) : 0;

  const openGradeModal = (row) => {
    const existing = resultByStudent[Number(row.studentId)];
    setActiveRow({ ...row, existingResult: existing || null });
    setGradeForm({ score: existing?.score || "", title: existing?.title || "" });
    setGradeOpen(true);
  };

  const openSubmissionPage = (row) => {
    const existing = resultByStudent[Number(row.studentId)] || null;
    setActiveSubmission({ row, existingResult: existing });
  };

  const submitGrade = async () => {
    if (!activeRow) return;
    const fd = new FormData();
    fd.append("homeworkId", String(hw.id));
    fd.append("studentId", String(activeRow.studentId));
    fd.append("score", String(Number(gradeForm.score || 0)));
    fd.append("title", gradeForm.title || "Tekshirildi");

    if (activeRow.existingResult?.id) {
      await homeworkResultApi.update(activeRow.existingResult.id, fd);
    } else {
      await homeworkResultApi.create(fd);
    }
    setGradeOpen(false);
    await loadDetail();
    onRefresh?.();
  };

  const renderRows = () => {
    if (tab === 1) {
      if (!missed.length) {
        return (
          <TableRow>
            <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>Ma'lumot topilmadi</TableCell>
          </TableRow>
        );
      }
      return missed.map((s, idx) => (
        <TableRow key={s.id || idx}>
          <TableCell>{s.fullName || "Noma'lum"}</TableCell>
          <TableCell>—</TableCell>
          <TableCell>—</TableCell>
          <TableCell align="center">—</TableCell>
          <TableCell align="center">—</TableCell>
          <TableCell align="center">—</TableCell>
          <TableCell align="center">
            <Chip label="Bajarmagan" size="small" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 600 }} />
          </TableCell>
        </TableRow>
      ));
    }

    const rows = tab === 0 ? pendingRows : tab === 2 ? checkedRows : rejectedRows;
    if (!rows.length) {
      return (
        <TableRow>
          <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>Ma'lumot topilmadi</TableCell>
        </TableRow>
      );
    }

    return rows.map((r) => {
      const result = resultByStudent[Number(r.studentId)];
      const submissionUrl = getFileUrl(r.file);
      return (
        <TableRow key={r.id} hover>
          <TableCell>
            <Button
              onClick={() => openSubmissionPage(r)}
              sx={{ textTransform: "none", p: 0, minWidth: 0, fontWeight: 700, color: "#111827" }}
            >
              {r.student?.fullName || "Noma'lum"}
            </Button>
          </TableCell>
          <TableCell>{fmtDate(r.created_at || r.createdAt)}</TableCell>
          <TableCell>{result ? fmtDate(result.created_at || result.createdAt) : "—"}</TableCell>
          <TableCell align="center">{result?.score ?? "—"}</TableCell>
          <TableCell align="center">{result ? calcXp(result.score) : "—"}</TableCell>
          <TableCell align="center">{result ? calcSilver(result.score) : "—"}</TableCell>
          <TableCell align="center">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
              {result && (
                <Chip
                  size="small"
                  label={result.status === "REJECTED" ? "Qaytarilgan" : "Tekshirilgan"}
                  sx={{
                    height: 22,
                    fontWeight: 600,
                    bgcolor: result.status === "REJECTED" ? "#fee2e2" : "#dcfce7",
                    color: result.status === "REJECTED" ? "#b91c1c" : "#166534",
                  }}
                />
              )}
              {submissionUrl && (
                <IconButton size="small" component="a" href={submissionUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  <OpenInNewRoundedIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton size="small" onClick={() => openGradeModal(r)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
      );
    });
  };

  if (activeSubmission) {
    return (
      <StudentSubmissionPage
        hw={hw}
        submission={activeSubmission.row}
        existingResult={activeSubmission.existingResult}
        onBack={() => setActiveSubmission(null)}
        onSaved={async () => {
          await loadDetail();
          onRefresh?.();
          setActiveSubmission(null);
        }}
      />
    );
  }

  return (
    <Box sx={{ border: "1px solid #f3f4f6", borderRadius: 3, bgcolor: "#fff", p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button onClick={onBack} size="small" variant="text" sx={{ textTransform: "none", color: "#6b7280", mb: 2 }}>
          ← Orqaga
        </Button>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: "#6b7280", fontSize: 13 }}>Vazifa mavzusi</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mb: 0.75 }}>{hw.title || hw.lessonTitle}</Typography>
            <Typography sx={{ color: "#6b7280", fontSize: 12 }}>
              Dars: {hw.lessonTitle || hw.lesson?.title || "—"}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ color: "#6b7280", fontSize: 13 }}>Vazifa tafsiloti</Typography>
            <Typography sx={{ color: "#111827", fontWeight: 500 }}>
              {hw.title || "Vazifa tavsifi kiritilmagan"}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ color: "#6b7280", fontSize: 13 }}>Berilgan vaqti</Typography>
            <Typography sx={{ fontWeight: 600, color: "#111827" }}>{fmtDate(assignedAt)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: "#6b7280", fontSize: 13 }}>Tugash vaqti</Typography>
            <Typography sx={{ fontWeight: 600, color: "#111827" }}>{fmtDate(deadlineAt)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: "#6b7280", fontSize: 13 }}>Dars sanasi</Typography>
            <Typography sx={{ fontWeight: 600, color: "#111827" }}>{fmtOnlyDate(hw.lessonDate || hw.lesson?.created_at)}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          <Chip label={`Kutayotganlar: ${pendingRows.length}`} size="small" sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 600 }} />
          <Chip label={`Bajarmaganlar: ${missed.length}`} size="small" sx={{ bgcolor: "#fee2e2", color: "#b91c1c", fontWeight: 600 }} />
          <Chip label={`Tekshirilganlar: ${checkedRows.length}`} size="small" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 600 }} />
          <Chip label={`Qaytarilganlar: ${rejectedRows.length}`} size="small" sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 600 }} />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
            <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Tekshirish progressi</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
              {checkedRows.length}/{responses.length || 0} ({reviewProgress}%)
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={reviewProgress}
            sx={{
              height: 10,
              borderRadius: 999,
              bgcolor: "#f3f4f6",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                bgcolor: "#10b981",
              },
            }}
          />
        </Box>

        {attachedHomeworkFileUrl && (
          <Button
            component="a"
            href={attachedHomeworkFileUrl}
            target="_blank"
            rel="noreferrer"
            startIcon={<OpenInNewRoundedIcon />}
            variant="outlined"
            size="small"
            sx={{ textTransform: "none" }}
          >
            Biriktirilgan vazifa fayli
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          sx={{
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 14, color: "#6b7280" },
            "& .Mui-selected": { color: "#10b981", fontWeight: 600 },
            "& .MuiTabs-indicator": { backgroundColor: "#10b981" },
          }}
        >
          <Tab label={<TabWithCount label="Kutayotganlar" count={pendingRows.length} />} />
          <Tab label={<TabWithCount label="Bajarmaganlar" count={missed.length} />} />
          <Tab label={<TabWithCount label="Tekshirilganlar" count={checkedRows.length} />} />
          <Tab label={<TabWithCount label="Qaytarilganlar" count={rejectedRows.length} />} />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: "#f9fafb" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>O'quvchi ismi</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Topshirilgan vaqti</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Tekshirilgan vaqti</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280" }}>Ball</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280" }}>XP</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280" }}>Kumush</TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Holat / Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderRows()}</TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={gradeOpen} onClose={() => setGradeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{activeRow?.existingResult ? "Bahoni tahrirlash" : "Baholash"}</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            type="number"
            label="Ball"
            value={gradeForm.score}
            onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Izoh"
            value={gradeForm.title}
            onChange={(e) => setGradeForm((p) => ({ ...p, title: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeOpen(false)} color="inherit">Bekor</Button>
          <Button variant="contained" onClick={submitGrade} sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>Saqlash</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function StudentSubmissionPage({ hw, submission, existingResult, onBack, onSaved }) {
  const [score, setScore] = useState(existingResult?.score || "");
  const [title, setTitle] = useState(existingResult?.title || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submissionUrl = getFileUrl(submission?.file);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("homeworkId", String(hw.id));
      fd.append("studentId", String(submission.studentId));
      fd.append("score", String(Number(score || 0)));
      fd.append("title", title || "Tekshirildi");

      if (existingResult?.id) {
        await homeworkResultApi.update(existingResult.id, fd);
      } else {
        await homeworkResultApi.create(fd);
      }
      await onSaved?.();
    } catch (e) {
      setError(e.message || "Baholashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ border: "1px solid #f3f4f6", borderRadius: 3, bgcolor: "#fff", p: 3 }}>
      <Button onClick={onBack} size="small" variant="text" sx={{ textTransform: "none", color: "#6b7280", mb: 2 }}>
        ← Ro'yxatga qaytish
      </Button>

      <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
        {submission?.student?.fullName || "Talaba"}
      </Typography>
      <Typography sx={{ color: "#6b7280", fontSize: 13, mb: 2 }}>
        Vazifa: {hw.title || hw.lessonTitle}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Topshirilgan vaqti</Typography>
          <Typography sx={{ fontWeight: 600, color: "#111827" }}>{fmtDate(submission?.created_at || submission?.createdAt)}</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Status</Typography>
          <Typography sx={{ fontWeight: 600, color: "#111827" }}>{submission?.status || "PENDING"}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>Yuklangan fayl</Typography>
      {submissionUrl ? (
        <Button
          component="a"
          href={submissionUrl}
          target="_blank"
          rel="noreferrer"
          startIcon={<OpenInNewRoundedIcon />}
          variant="outlined"
          sx={{ textTransform: "none", mb: 2 }}
        >
          Faylni ochish
        </Button>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>Talaba fayl yuklamagan yoki fayl manzili topilmadi.</Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        fullWidth
        type="number"
        label="Ball"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Izoh"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving}
        sx={{ bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, textTransform: "none" }}
      >
        {saving ? "Saqlanmoqda..." : "Bahoni saqlash"}
      </Button>
    </Box>
  );
}

function TabWithCount({ label, count }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <span>{label}</span>
      <Chip size="small" label={count} sx={{ height: 18, fontSize: 11, bgcolor: "#fbbf24", color: "#111827" }} />
    </Box>
  );
}
