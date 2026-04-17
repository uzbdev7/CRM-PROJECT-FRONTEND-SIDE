import React, { useState, useEffect } from "react";
import { Drawer, Box, Typography, IconButton, TextField, InputAdornment, Button, List, ListItem, Checkbox, Avatar, CircularProgress, Alert, Snackbar } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { studentApi, studentGroupApi } from "../../../api/apiService.js";

export default function StudentDrawer({ open, onClose, groupId, currentStudents = [], onAdded }) {
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, msg: "", sev: "success" });

  useEffect(() => {
    if (open) {
      fetchStudents();
      setSelectedIds([]);
      setSearch("");
    }
  }, [open]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getAll();
      setAllStudents(data || []);
    } catch (err) {
      console.error(err);
      setToast({ open: true, msg: "Talabalarni yuklashda xatolik", sev: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setSaving(true);
    try {
      for (const studentId of selectedIds) {
        await studentGroupApi.create({ groupId: Number(groupId), studentId: Number(studentId) });
      }
      setToast({ open: true, msg: "Talabalar guruhga qo'shildi!", sev: "success" });
      if (onAdded) onAdded();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setToast({ open: true, msg: "Qo'shishda xatolik ro'y berdi", sev: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Filter out students already in the group
  const currentStudentIds = currentStudents.map((cs) => cs.student?.id || cs.studentId);
  const availableStudents = allStudents.filter((s) => !currentStudentIds.includes(s.id));
  const filtered = availableStudents.filter((s) => 
    (s.fullName || "").toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 400 } } }}>
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 16 }}>O'quvchi qo'shish</Typography>
          <IconButton onClick={onClose} size="small"><CloseRoundedIcon fontSize="small" /></IconButton>
        </Box>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth size="small" placeholder="O'quvchi ismi yoki emaili..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" color="action" /></InputAdornment> }}
            sx={{ mb: 2 }}
          />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={24} /></Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 4, color: "#9ca3af", fontSize: 14 }}>Mos keluvchi o'quvchi topilmadi.</Typography>
          ) : (
            <List sx={{ px: 0 }}>
              {filtered.map((student) => (
                <ListItem key={student.id} disablePadding sx={{ mb: 1, border: "1px solid #f3f4f6", borderRadius: 2, p: 1 }}>
                  <Checkbox checked={selectedIds.includes(student.id)} onChange={() => handleToggle(student.id)} color="primary" />
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "#f5f3ff", color: "#7c3aed", fontSize: 14, mr: 1, fontWeight: 600 }}>
                    {student.fullName?.split(" ").map((n) => n[0]).join("") || "S"}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>
                      {student.fullName || "Noma'lum"}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{student.email}</Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}

          <Button
            variant="contained" fullWidth disabled={selectedIds.length === 0 || saving}
            onClick={handleAdd}
            sx={{ mt: 2, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" }, textTransform: "none", py: 1 }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : `Tanlanganlarni qo'shish (${selectedIds.length})`}
          </Button>
        </Box>
      </Drawer>
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.sev} sx={{ width: "100%", boxShadow: 3 }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
