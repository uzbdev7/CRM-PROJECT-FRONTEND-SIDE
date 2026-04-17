import React, { useEffect, useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Alert, Menu, MenuItem, ListItemIcon, ListItemText,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { lessonApi } from "../../../api/apiService.js";

const ACCENT = "#7c3aed";

const parseFlexibleDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  // Handles strings like: "2026 M03 12" or "2026 M3 12"
  const m = raw.match(/^(\d{4})\s+M(\d{1,2})\s+(\d{1,2})$/i);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    const parsed = new Date(year, month, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const pad2 = (n) => String(n).padStart(2, "0");

const fmtDate = (d) => {
  const date = parseFlexibleDate(d);
  if (!date) return "—";
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
};

export default function LessonListSubTab({ group }) {
  const [lessons, setLessons]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuLesson, setMenuLesson] = useState(null);

  // Create dialog
  const [createOpen, setCreateOpen]   = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError]   = useState("");
  const [editOpen, setEditOpen]   = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState("");

  // Delete dialog
  const [deleteOpen, setDeleteOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    if (group?.id) fetchLessons();
  }, [group?.id]);

  const fetchLessons = async () => {
    setLoading(true);
    try {
      const data = await lessonApi.getAll();
      const groupLessons = (data || []).filter(l => Number(l.groupId) === Number(group.id));
      setLessons(groupLessons);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSave = async () => {
    if (!createTitle.trim()) { setCreateError("Mavzu bo'sh bo'lmasin"); return; }
    setCreateSaving(true); setCreateError("");
    try {
      const res = await lessonApi.create({ title: createTitle.trim(), groupId: group.id });
      setLessons(prev => [...prev, { ...res, date: res.date || res.created_at }]);
      setCreateTitle("");
      setCreateOpen(false);
    } catch (e) {
      setCreateError(e.message || "Yaratishda xatolik");
    } finally {
      setCreateSaving(false);
    }
  };

  const openMenu = (e, lesson) => {
    setAnchorEl(e.currentTarget);
    setMenuLesson(lesson);
  };
  const closeMenu = () => { setAnchorEl(null); setMenuLesson(null); };

  const handleEditOpen = () => {
    setEditTarget(menuLesson || null);
    setEditTitle(menuLesson?.title || "");
    setEditError("");
    setEditOpen(true);
    closeMenu();
  };

  const handleEditSave = async () => {
    if (!editTarget?.id) { setEditError("Tahrirlanadigan dars topilmadi"); return; }
    if (!editTitle.trim()) { setEditError("Mavzu bo'sh bo'lmasin"); return; }
    setEditSaving(true); setEditError("");
    try {
      await lessonApi.update(editTarget.id, { title: editTitle.trim() });
      setLessons(prev => prev.map(l => l.id === editTarget.id ? { ...l, title: editTitle.trim() } : l));
      setEditOpen(false);
      setEditTarget(null);
    } catch (e) {
      setEditError(e.message || "Xatolik");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteOpen = () => {
    setDeleteTarget(menuLesson);
    setDeleteOpen(true);
    closeMenu();
  };

  const handleDeleteConfirm = async () => {
    setDeleteSaving(true);
    try {
      await lessonApi.delete(deleteTarget.id);
      setLessons(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteOpen(false);
    } catch (e) {
      alert(e.message || "O'chirishda xatolik");
    } finally {
      setDeleteSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: 2, border: "1px solid #f3f4f6", overflow: "hidden" }}>
      {/* Header toolbar */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1.5, borderBottom: "1px solid #f9fafb" }}>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => { setCreateTitle(""); setCreateError(""); setCreateOpen(true); }}
          sx={{
            bgcolor: ACCENT, "&:hover": { bgcolor: "#6d28d9" },
            textTransform: "none", borderRadius: 2, boxShadow: "none", fontWeight: 600, fontSize: 13,
          }}>
          Mavzu qo'shish
        </Button>
      </Box>
      <TableContainer>
        <Table sx={{ minWidth: 600 }}>
          <TableHead sx={{ bgcolor: "#f9fafb" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280", width: 50 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Mavzu</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280", width: 80 }}>👥</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280", width: 80 }}>⏱</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280", width: 80 }}>✅</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Dars sanasi</TableCell>
              <TableCell align="right" sx={{ width: 60 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lessons.map((lesson, idx) => (
              <TableRow key={lesson.id} sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#f9fafb" } }}>
                <TableCell sx={{ fontWeight: 500, color: "#6b7280" }}>{idx + 1}</TableCell>
                <TableCell sx={{ color: "#111827", fontWeight: 500 }}>{lesson.title}</TableCell>
                <TableCell align="center">
                  <Chip label={(group?.students || []).length} size="small"
                    sx={{ bgcolor: "#f0f9ff", color: "#0369a1", fontWeight: 600, fontSize: 11 }} />
                </TableCell>
                <TableCell align="center" sx={{ color: "#4b5563" }}>0</TableCell>
                <TableCell align="center" sx={{ color: "#4b5563" }}>0</TableCell>
                {/* Dars sanasi: created_at dan olinadi */}
                <TableCell sx={{ color: "#4b5563", fontSize: 13 }}>
                  {fmtDate(lesson.date || lesson.created_at)}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={(e) => openMenu(e, lesson)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {lessons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>
                  Mavzular yo'q
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}
        PaperProps={{ sx: { borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,.12)", minWidth: 160 } }}>
        <MenuItem onClick={handleEditOpen}>
          <ListItemIcon><EditRoundedIcon fontSize="small" sx={{ color: ACCENT }} /></ListItemIcon>
          <ListItemText primary="Tahrirlash" primaryTypographyProps={{ fontSize: 14 }} />
        </MenuItem>
        <MenuItem onClick={handleDeleteOpen}>
          <ListItemIcon><DeleteRoundedIcon fontSize="small" sx={{ color: "#ef4444" }} /></ListItemIcon>
          <ListItemText primary="O'chirish" primaryTypographyProps={{ fontSize: 14, color: "#ef4444" }} />
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ height: 4, background: `linear-gradient(90deg, ${ACCENT}, #b06ef3)` }} />
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Yangi mavzu qo'shish</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{createError}</Alert>}
          <TextField fullWidth size="small" label="Mavzu nomi *" value={createTitle}
            onChange={e => setCreateTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreateSave()}
            placeholder="Masalan: 1-dars Node.js ga kirish"
            sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)}
            sx={{ textTransform: "none", color: "#6b7280", borderRadius: 2 }}>Bekor</Button>
          <Button onClick={handleCreateSave} disabled={createSaving} variant="contained"
            sx={{ textTransform: "none", bgcolor: ACCENT, borderRadius: 2,
              "&:hover": { bgcolor: "#6d28d9" }, boxShadow: "none", minWidth: 90 }}>
            {createSaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Qo'shish"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ height: 4, background: `linear-gradient(90deg, ${ACCENT}, #b06ef3)` }} />
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Darsni tahrirlash</DialogTitle>
        <DialogContent>
          {editError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{editError}</Alert>}
          <TextField fullWidth size="small" label="Mavzu nomi" value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEditSave()}
            sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => { setEditOpen(false); setEditTarget(null); }}
            sx={{ textTransform: "none", color: "#6b7280", borderRadius: 2 }}>Bekor</Button>
          <Button onClick={handleEditSave} disabled={editSaving} variant="contained"
            sx={{ textTransform: "none", bgcolor: ACCENT, borderRadius: 2,
              "&:hover": { bgcolor: "#6d28d9" }, boxShadow: "none" }}>
            {editSaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ height: 4, bgcolor: "#ef4444" }} />
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Darsni o'chirish</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "#374151" }}>
            <strong>"{deleteTarget?.title}"</strong> darsini o'chirishni tasdiqlaysizmi?
            Bu amalni qaytarib bo'lmaydi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteOpen(false)}
            sx={{ textTransform: "none", color: "#6b7280", borderRadius: 2 }}>Bekor</Button>
          <Button onClick={handleDeleteConfirm} disabled={deleteSaving} variant="contained"
            sx={{ textTransform: "none", bgcolor: "#ef4444", borderRadius: 2,
              "&:hover": { bgcolor: "#dc2626" }, boxShadow: "none" }}>
            {deleteSaving ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
