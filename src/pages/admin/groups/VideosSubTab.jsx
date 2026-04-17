import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem,
  Alert, LinearProgress, Tooltip, Snackbar,
} from "@mui/material";
import PlayCircleOutlineIcon  from "@mui/icons-material/PlayCircleOutline";
import DeleteOutlineIcon       from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon        from "@mui/icons-material/EditOutlined";
import CloseRoundedIcon        from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon  from "@mui/icons-material/CloudUploadRounded";
import ArrowBackRoundedIcon    from "@mui/icons-material/ArrowBackRounded";
import OpenInFullRoundedIcon   from "@mui/icons-material/OpenInFullRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import AccessTimeRoundedIcon   from "@mui/icons-material/AccessTimeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { attendanceApi, lessonVideoApi, lessonApi } from "../../../api/apiService.js";
import { API_BASE } from "../../../utils/constants.js";

const ACCENT = "#10b981";
// API_BASE = "http://localhost:5005" (no /api suffix in constants.js)
const ROOT_BASE = API_BASE.replace(/\/api\/?$/, "");

// ── Helpers ────────────────────────────────────────────────────────────────
const buildVideoCandidates = (filePath) => {
  if (!filePath) return [];
  if (/^https?:\/\//i.test(filePath)) return [filePath];

  // Normalize: remove leading slashes and backslashes
  const clean = filePath.replace(/^[/\\]+/, "").replace(/\\/g, "/");

  // Strip leading "api/" if present
  const withoutApi = clean.replace(/^api\//i, "");
  // Strip leading "uploads/" to get the bare file path
  const withoutUploads = withoutApi.replace(/^uploads\//i, "");

  const list = [
    // Direct path (most likely correct when DB stores "uploads/videos/file.mp4")
    `${ROOT_BASE}/${encodeURI(withoutApi)}`,
    // Path with /uploads/ prefix (when DB stores "videos/file.mp4")
    `${ROOT_BASE}/uploads/${encodeURI(withoutUploads)}`,
    // Via API base
    `${API_BASE}/${encodeURI(withoutApi)}`,
    `${API_BASE}/uploads/${encodeURI(withoutUploads)}`,
  ];

  return [...new Set(list.filter(Boolean))];
};

// file path yoki originalName dan fayl nomini olib beradi
const getVideoName = (vid) => {
  if (vid.originalName) return vid.originalName;
  if (vid.file) {
    const parts = vid.file.replace(/\\/g, "/").split("/");
    return parts[parts.length - 1] || "video.mp4";
  }
  return "video.mp4";
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) : "—";

const fmtDatetime = (d) =>
  d ? new Date(d).toLocaleString("uz-UZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const isSameDay = (a, b) => {
  const da = a ? new Date(a) : null;
  const db = b ? new Date(b) : null;
  if (!da || !db || Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

// ── Upload Dialog ──────────────────────────────────────────────────────────
function UploadDialog({ open, onClose, lessons, existingLessonIds, defaultLessonId, onUploaded, onNotify }) {
  const [lessonId, setLessonId]   = useState("");
  const [file, setFile]           = useState(null);
  const [error, setError]         = useState("");
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (open) {
      setLessonId(defaultLessonId ? String(defaultLessonId) : "");
      setFile(null);
      setError("");
      setProgress(0);
      setUploading(false);
    }
  }, [open, defaultLessonId]);

  const handleUpload = () => {
    if (!lessonId || !file) { setError("Dars va video faylni tanlang"); return; }
    if (existingLessonIds.has(Number(lessonId))) {
      const msg = "Bu mavzuga video avval yuklangan.";
      setError(msg);
      onNotify?.(msg, "error");
      return;
    }
    setUploading(true); setError(""); setProgress(0);

    const fd = new FormData();
    fd.append("lessonId", String(lessonId));
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onUploaded(res?.data || res);
          onNotify?.("Video muvaffaqiyatli yuklandi.", "success");
          onClose();
        } else {
          setError(res?.message || "Video qo'shishda xatolik");
          onNotify?.(res?.message || "Video qo'shishda xatolik", "error");
        }
      } catch { setError("Javob o'qishda xatolik"); }
    };
    xhr.onerror = () => { setUploading(false); setError("Server bilan bog'lanib bo'lmadi"); };
    xhr.open("POST", `${API_BASE}/lesson-video/create`);
    xhr.send(fd);
  };

  return (
    <Dialog open={open} onClose={() => !uploading && onClose()} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${ACCENT}, #059669)` }} />
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Video qo'shish</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {lessons.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            Avval darsga yo'qlama qiling, keyin shu mavzuga video yuklash mumkin.
          </Alert>
        )}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Darsni tanlang</InputLabel>
          <Select value={lessonId} label="Darsni tanlang" disabled={lessons.length === 0}
            onChange={(e) => {
              const selectedId = e.target.value;
              if (existingLessonIds.has(Number(selectedId))) {
                const msg = "Bu mavzuga video avval yuklangan.";
                setError(msg);
                onNotify?.(msg, "error");
              }
              setLessonId(selectedId);
            }} sx={{ borderRadius: 2 }}>
            {lessons.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {l.title}{existingLessonIds.has(Number(l.id)) ? " - Yuklangan" : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box onClick={() => !uploading && fileRef.current?.click()}
          sx={{
            border: "2px dashed", borderColor: file ? ACCENT : "#d1d5db",
            borderRadius: 3, p: 3, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 1, cursor: uploading ? "not-allowed" : "pointer",
            bgcolor: file ? "#f0fdf4" : "#fafafa", transition: "all .2s",
            "&:hover": !uploading ? { borderColor: ACCENT, bgcolor: "#f0fdf4" } : {},
          }}>
          <CloudUploadRoundedIcon sx={{ fontSize: 36, color: file ? ACCENT : "#9ca3af" }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: file ? ACCENT : "#6b7280" }}>
            {file ? file.name : "Video faylni tanlang"}
          </Typography>
          <input ref={fileRef} hidden type="file" accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </Box>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Yuklanmoqda...</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress}
              sx={{ height: 8, borderRadius: 4, bgcolor: "#d1fae5",
                "& .MuiLinearProgress-bar": { bgcolor: ACCENT, borderRadius: 4 } }} />
            <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.5, textAlign: "center" }}>
              {progress < 100 ? `${progress}% yuklandi` : "Serverda qayta ishlanmoqda..."}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={uploading}
          sx={{ textTransform: "none", color: "#6b7280", borderRadius: 2 }}>Bekor</Button>
        <Button onClick={handleUpload} disabled={uploading || !file || !lessonId}
          variant="contained"
          sx={{ textTransform: "none", bgcolor: ACCENT, borderRadius: 2,
            "&:hover": { bgcolor: "#059669" }, boxShadow: "none", minWidth: 110 }}>
          {uploading
            ? <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} sx={{ color: "#fff" }} />{progress}%
              </Box>
            : "Yuklash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Update Dialog ──────────────────────────────────────────────────────────
function UpdateDialog({ open, onClose, video, lessons, onUpdated }) {
  const [lessonId, setLessonId]   = useState("");
  const [file, setFile]           = useState(null);
  const [error, setError]         = useState("");
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (open && video) {
      setLessonId(video.lessonId || "");
      setFile(null); setError(""); setProgress(0); setUploading(false);
    }
  }, [open, video]);

  const handleUpdate = () => {
    setUploading(true); setError(""); setProgress(0);
    const fd = new FormData();
    fd.append("lessonId", String(lessonId));
    if (file) fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          onUpdated(res?.data || res);
          onClose();
        } else {
          setError(res?.message || "Yangilashda xatolik");
        }
      } catch { setError("Javob o'qishda xatolik"); }
    };
    xhr.onerror = () => { setUploading(false); setError("Server bilan bog'lanib bo'lmadi"); };
    xhr.open("PATCH", `${API_BASE}/lesson-video/${video?.id}`);
    xhr.send(fd);
  };

  return (
    <Dialog open={open} onClose={() => !uploading && onClose()} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
      <Box sx={{ height: 4, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Videoni yangilash</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Darsni tanlang</InputLabel>
          <Select value={lessonId} label="Darsni tanlang"
            onChange={(e) => setLessonId(e.target.value)} sx={{ borderRadius: 2 }}>
            {lessons.map((l) => <MenuItem key={l.id} value={l.id}>{l.title}</MenuItem>)}
          </Select>
        </FormControl>
        <Box onClick={() => !uploading && fileRef.current?.click()}
          sx={{
            border: "2px dashed", borderColor: file ? "#f59e0b" : "#d1d5db",
            borderRadius: 3, p: 3, display: "flex", flexDirection: "column",
            alignItems: "center", gap: 1, cursor: uploading ? "not-allowed" : "pointer",
            bgcolor: file ? "#fffbeb" : "#fafafa", transition: "all .2s",
            "&:hover": !uploading ? { borderColor: "#f59e0b", bgcolor: "#fffbeb" } : {},
          }}>
          <CloudUploadRoundedIcon sx={{ fontSize: 32, color: file ? "#f59e0b" : "#9ca3af" }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: file ? "#f59e0b" : "#6b7280" }}>
            {file ? file.name : "Yangi video (ixtiyoriy)"}
          </Typography>
          <input ref={fileRef} hidden type="file" accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </Box>
        {uploading && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Yuklanmoqda...</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress}
              sx={{ height: 8, borderRadius: 4, bgcolor: "#fef3c7",
                "& .MuiLinearProgress-bar": { bgcolor: "#f59e0b", borderRadius: 4 } }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={uploading}
          sx={{ textTransform: "none", color: "#6b7280", borderRadius: 2 }}>Bekor</Button>
        <Button onClick={handleUpdate} disabled={uploading} variant="contained"
          sx={{ textTransform: "none", bgcolor: "#f59e0b", borderRadius: 2,
            "&:hover": { bgcolor: "#d97706" }, boxShadow: "none" }}>
          {uploading
            ? <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={14} sx={{ color: "#fff" }} />{progress}%
              </Box>
            : "Yangilash"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function VideosSubTab({ group }) {
  const [videos, setVideos]         = useState([]);
  const [lessons, setLessons]       = useState([]);
  const [assignableLessons, setAssignableLessons] = useState([]);
  const [lessonsMap, setLessonsMap] = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // Inline player
  const [activeVideo, setActiveVideo] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [inlineVideoError, setInlineVideoError] = useState(false);
  const [previewVideoError, setPreviewVideoError] = useState(false);
  const [videoSrcIndex, setVideoSrcIndex] = useState(0);

  // Dialogs
  const [uploadOpen, setUploadOpen]         = useState(false);
  const [updateOpen, setUpdateOpen]         = useState(false);
  const [updateTarget, setUpdateTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget]     = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

  useEffect(() => {
    if (group?.id) fetchData();
  }, [group?.id]);

  const showToast = (message, severity = "success") => {
    setToast({ open: true, severity, message });
  };

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [allL, allAttendances, data] = await Promise.all([
        lessonApi.getAll(),
        attendanceApi.getAll().catch(() => []),
        lessonVideoApi.getAll().catch(() => []),
      ]);
      const groupL = (allL || []).filter(l => Number(l.groupId) === Number(group.id));
      setLessons(groupL);

      const today = new Date();
      const attendedLessonIds = new Set((allAttendances || []).map((a) => Number(a.lessonId)).filter(Boolean));
      const todayLessons = groupL.filter((l) => isSameDay(l.created_at || l.date, today));
      const eligibleLessons = todayLessons.filter((l) => attendedLessonIds.has(Number(l.id)));
      const availableLessons = eligibleLessons.filter((l) => !data?.some((v) => Number(v.lessonId) === Number(l.id)));
      setAssignableLessons(availableLessons);

      const lMap = {};
      groupL.forEach(l => { lMap[l.id] = { title: l.title, date: l.created_at || l.date }; });
      setLessonsMap(lMap);

      const groupVids  = (data || []).filter(v => lMap[Number(v.lessonId)]);
      setVideos(groupVids);
    } catch (err) {
      setError(err.message || "Videolarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const existingVideoLessonIds = new Set(videos.map((v) => Number(v.lessonId)).filter(Boolean));
  const defaultAssignableLessonId = assignableLessons[0]?.id ? String(assignableLessons[0].id) : "";

  // ── Local state mutations (no full reload) ─────────────────────────────
  const handleUploaded = (newVid) => {
    if (!newVid?.id) { fetchData(); return; }
    setVideos(prev => [newVid, ...prev]);
  };

  const handleUpdated = (updated) => {
    if (!updated?.id) { fetchData(); return; }
    setVideos(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
    if (activeVideo?.id === updated.id) setActiveVideo(prev => ({ ...prev, ...updated }));
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await lessonVideoApi.delete(deleteTarget.id);
      setVideos(prev => prev.filter(v => v.id !== deleteTarget.id));
      if (activeVideo?.id === deleteTarget.id) setActiveVideo(null);
      setDeleteConfirmOpen(false);
    } catch (e) {
      setError(e.message || "O'chirishda xatolik");
      setDeleteConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading)
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <CircularProgress sx={{ color: ACCENT }} />
    </Box>;

  // ── Inline video player ───────────────────────────────────────────────
  if (activeVideo) {
    const videoCandidates = buildVideoCandidates(activeVideo.file);
    const videoUrl = videoCandidates[videoSrcIndex] || videoCandidates[0] || null;
    const hasNextCandidate = videoSrcIndex < videoCandidates.length - 1;

    const handleVideoSourceError = () => {
      if (hasNextCandidate) {
        setVideoSrcIndex((prev) => prev + 1);
        setInlineVideoError(false);
        setPreviewVideoError(false);
        return;
      }
      setInlineVideoError(true);
      setPreviewVideoError(true);
    };

    return (
      <Box sx={{ bgcolor: "#fff", borderRadius: 2, border: "1px solid #f3f4f6", overflow: "hidden" }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 2,
          borderBottom: "1px solid #f3f4f6" }}>
          <IconButton size="small" onClick={() => setActiveVideo(null)}
            sx={{ bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}>
            <ArrowBackRoundedIcon sx={{ fontSize: 18, color: "#374151" }} />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
              {activeVideo.originalName || "video.mp4"}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
              {lessonsMap[activeVideo.lessonId]?.title || "—"}
            </Typography>
          </Box>
          <Chip label="Tayyor" size="small"
            sx={{ bgcolor: "#ecfdf5", color: ACCENT, fontWeight: 600, fontSize: 11 }} />
          <Button
            startIcon={<OpenInFullRoundedIcon />}
            onClick={() => { setPreviewVideoError(false); setPreviewOpen(true); }}
            sx={{ textTransform: "none", fontWeight: 600, color: ACCENT }}
          >
            Katta oynada
          </Button>
        </Box>

        {/* Video */}
        <Box sx={{
          bgcolor: "#000",
          width: "100%",
          position: "relative",
          minHeight: { xs: 260, md: 420 },
          height: { xs: "42vh", md: "58vh" },
          maxHeight: 720,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {videoUrl && !inlineVideoError ? (
            <video
              controls
              autoPlay
              style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
              src={videoUrl}
              onLoadedData={() => setInlineVideoError(false)}
              onError={handleVideoSourceError}
            />
          ) : null}
          <Box sx={{
            display: (inlineVideoError || !videoUrl) ? "flex" : "none",
            justifyContent: "center",
            alignItems: "center",
            color: "#6b7280",
            flexDirection: "column",
            gap: 1,
            px: 2,
            textAlign: "center",
          }}>
            <Typography>Video yuklanmadi</Typography>
            <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>{videoUrl}</Typography>
            {videoCandidates.length > 1 && (
              <Typography sx={{ fontSize: 11, color: "#6b7280" }}>
                Sinab ko'rilgan manzillar: {videoSrcIndex + 1}/{videoCandidates.length}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Meta info */}
        <Box sx={{ px: 2.5, py: 2, display: "flex", gap: 3, flexWrap: "wrap",
          borderTop: "1px solid #f3f4f6" }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <CalendarTodayRoundedIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Dars sanasi</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {fmtDate(lessonsMap[activeVideo.lessonId]?.date)}
            </Typography>
          </Box>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Qo'shilgan vaqt</Typography>
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {fmtDatetime(activeVideo.created_at || activeVideo.createdAt)}
            </Typography>
          </Box>
        </Box>

        <Dialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          maxWidth="xl"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", bgcolor: "#000" } }}
        >
          <DialogTitle sx={{
            bgcolor: "#0b0b0b",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.5,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <OndemandVideoRoundedIcon sx={{ color: "#22c55e" }} />
              <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{getVideoName(activeVideo)}</Typography>
            </Box>
            <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: "#fff" }}>
              <CloseRoundedIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
            <Box sx={{
              width: "100%",
              minHeight: { xs: 300, md: 540 },
              height: { xs: "54vh", md: "76vh" },
              maxHeight: "82vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#000",
            }}>
              {videoUrl && !previewVideoError ? (
                <video
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
                  src={videoUrl}
                  onLoadedData={() => setPreviewVideoError(false)}
                  onError={handleVideoSourceError}
                />
              ) : (
                <Box sx={{ px: 3, textAlign: "center", color: "#9ca3af" }}>
                  <Typography sx={{ mb: 1 }}>Video topilmadi yoki yuklanmadi</Typography>
                  <Typography sx={{ fontSize: 12 }}>{videoUrl || "URL mavjud emas"}</Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  // ── Table view ────────────────────────────────────────────────────────
  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: 2, border: "1px solid #f3f4f6", overflow: "hidden", pb: 2 }}>
      {error && <Alert severity="error" sx={{ m: 2, borderRadius: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
        <Button variant="contained" onClick={() => setUploadOpen(true)} disabled={assignableLessons.length === 0}
          sx={{ bgcolor: ACCENT, "&:hover": { bgcolor: "#059669" }, textTransform: "none",
            boxShadow: "none", borderRadius: 2, fontWeight: 600 }}>
          Qo'shish
        </Button>
      </Box>

      {assignableLessons.length === 0 && (
        <Alert severity="info" sx={{ mx: 2, mb: 2, borderRadius: 2 }}>
          Bugun yo'qlama qilingan mavzu kerak. Faqat bugungi darsga video yuklash mumkin.
        </Alert>
      )}

      <TableContainer>
        <Table sx={{ minWidth: 640 }}>
          <TableHead sx={{ bgcolor: "#f9fafb" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Video nomi</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Dars nomi</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Dars sanasi</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "#6b7280" }}>Qo'shilgan vaqt</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: "#6b7280" }}>Harakatlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {videos.map((vid) => {
              const info = lessonsMap[vid.lessonId];
              return (
                <TableRow key={vid.id}
                  sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#f9fafb" } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton size="small" onClick={() => {
                        setVideoSrcIndex(0);
                        setInlineVideoError(false);
                        setPreviewVideoError(false);
                        setActiveVideo(vid);
                      }}
                        sx={{ color: ACCENT, "&:hover": { bgcolor: "#f0fdf4" } }}>
                        <PlayCircleOutlineIcon sx={{ fontSize: 22 }} />
                      </IconButton>
                      <Typography onClick={() => {
                        setVideoSrcIndex(0);
                        setInlineVideoError(false);
                        setPreviewVideoError(false);
                        setActiveVideo(vid);
                      }}
                        sx={{ color: "#374151", fontSize: 14, cursor: "pointer",
                          "&:hover": { color: ACCENT, textDecoration: "underline" } }}>
                        {vid.originalName || "video.mp4"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#111827", fontSize: 14 }}>{info?.title || "—"}</TableCell>
                  <TableCell>
                    <Chip label="Tayyor" size="small"
                      sx={{ bgcolor: "#ecfdf5", color: ACCENT, fontWeight: 600, fontSize: 11 }} />
                  </TableCell>
                  <TableCell sx={{ color: "#4b5563", fontSize: 13 }}>{fmtDate(info?.date)}</TableCell>
                  <TableCell sx={{ color: "#4b5563", fontSize: 13 }}>
                    {fmtDatetime(vid.created_at || vid.createdAt)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                      <Tooltip title="Yangilash">
                        <IconButton size="small"
                          onClick={() => { setUpdateTarget(vid); setUpdateOpen(true); }}
                          sx={{ color: "#f59e0b", "&:hover": { bgcolor: "#fffbeb" } }}>
                          <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="O'chirish">
                        <IconButton size="small"
                          onClick={() => { setDeleteTarget(vid); setDeleteConfirmOpen(true); }}
                          sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}>
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {videos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#9ca3af" }}>
                  Videolar yo'q
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload Dialog */}
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)}
        lessons={assignableLessons}
        existingLessonIds={existingVideoLessonIds}
        defaultLessonId={defaultAssignableLessonId}
        onUploaded={handleUploaded}
        onNotify={showToast}
      />

      {/* Update Dialog */}
      <UpdateDialog open={updateOpen} onClose={() => setUpdateOpen(false)}
        video={updateTarget} lessons={lessons} onUpdated={handleUpdated} />

      {/* Delete Confirm */}
      <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ height: 4, bgcolor: "#ef4444" }} />
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Videoni o'chirish</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "#374151" }}>
            <strong>"{deleteTarget?.originalName || "Video"}"</strong> ni o'chirishni tasdiqlaysizmi?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}
            sx={{ textTransform: "none", color: "#6b7280", borderRadius: 2 }}>Bekor</Button>
          <Button onClick={handleDeleteConfirm} disabled={deleting} variant="contained"
            sx={{ textTransform: "none", bgcolor: "#ef4444", borderRadius: 2,
              "&:hover": { bgcolor: "#dc2626" }, boxShadow: "none" }}>
            {deleting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "O'chirish"}
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
