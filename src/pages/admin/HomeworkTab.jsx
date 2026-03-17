// src/pages/admin/HomeworkTab.jsx
import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  InputAdornment, CircularProgress, Alert, Tooltip, Modal,
  Divider, Button, Select, MenuItem, FormControl,
} from "@mui/material";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon       from "@mui/icons-material/RefreshRounded";
import AttachFileRoundedIcon    from "@mui/icons-material/AttachFileRounded";
import AccessTimeRoundedIcon    from "@mui/icons-material/AccessTimeRounded";
import CloseRoundedIcon         from "@mui/icons-material/CloseRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ClassRoundedIcon         from "@mui/icons-material/ClassRounded";
import GroupsRoundedIcon        from "@mui/icons-material/GroupsRounded";
import OpenInNewRoundedIcon     from "@mui/icons-material/OpenInNewRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import { homeworkApi }          from "../../api/apiService.js";
import { API_BASE }             from "../../utils/constants.js";

const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:  { bg: "#fefce8", color: "#ca8a04", label: "Kutilmoqda" },
  APPROVED: { bg: "#f0fdf4", color: "#16a34a", label: "Tasdiqlangan" },
  REJECTED: { bg: "#fef2f2", color: "#dc2626", label: "Rad etilgan" },
  MISSED:   { bg: "#f3f4f6", color: "#6b7280", label: "O'tkazib yuborilgan" },
  DELAY:    { bg: "#fff7ed", color: "#ea580c", label: "Kechiktirilgan" },
};

const getStatus = (status) =>
  STATUS_CONFIG[status] || { bg: "#f0fdf4", color: "#16a34a", label: "Faol" };

// Deadline hisoblash
const calcDeadline = (createdAt, durationHours) => {
  if (!createdAt || !durationHours) return null;
  const d = new Date(createdAt);
  d.setHours(d.getHours() + durationHours);
  return d;
};

const shortFileName = (path) => {
  if (!path) return null;
  return path.replace(/\\/g, "/").split("/").pop();
};

const fileUrl = (path) => {
  if (!path) return null;
  return `${API_BASE}/${path.replace(/\\/g, "/")}`;
};

const fmtDate = (iso, withTime = false) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

// ── Detail Modal ───────────────────────────────────────────────────────────
function HomeworkModal({ hw, onClose, onStatusChange }) {
  const [status,  setStatus]  = useState(hw?.status || "PENDING");
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveOk,  setSaveOk]  = useState(false);

  if (!hw) return null;

  const deadline = calcDeadline(hw.created_at, hw.durationTime);
  const sc       = getStatus(status);
  const fileName = shortFileName(hw.file);
  const fUrl     = fileUrl(hw.file);

  const handleSave = async () => {
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      await homeworkApi.update(hw.id, { status });
      setSaveOk(true);
      onStatusChange(hw.id, status);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (e) {
      setSaveErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({ icon, iconBg, iconColor, label, children }) => (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 1.5,
        bgcolor: iconBg, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, mt: 0.3,
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, mb: 0.3 }}>
          {label}
        </Typography>
        {children}
      </Box>
    </Box>
  );

  return (
    <Modal open onClose={onClose}>
      <Box sx={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: { xs: "95vw", sm: 560 },
        maxHeight: "90vh", overflowY: "auto",
        bgcolor: "#fff", borderRadius: 3,
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
        outline: "none",
      }}>

        {/* Header */}
        <Box sx={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          px: 3, pt: 3, pb: 2, borderBottom: "1px solid #f3f4f6",
        }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.4, mb: 1 }}>
              {hw.title}
            </Typography>
            <Chip
              label={sc.label}
              size="small"
              sx={{ fontSize: 11, height: 22, fontWeight: 700, bgcolor: sc.bg, color: sc.color }}
            />
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "#9ca3af", flexShrink: 0 }}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, py: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>

          <InfoRow
            icon={<ClassRoundedIcon sx={{ fontSize: 17, color: ACCENT }} />}
            iconBg={ACCENT_BG} label="Dars"
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {hw.lesson?.title || "—"}
            </Typography>
          </InfoRow>

          <InfoRow
            icon={<GroupsRoundedIcon sx={{ fontSize: 17, color: "#2563eb" }} />}
            iconBg="#eff6ff" label="Guruh"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {hw.lesson?.group?.name || "—"}
              </Typography>
              {hw.lesson?.group?.status && (
                <Chip
                  label={hw.lesson.group.status}
                  size="small"
                  sx={{
                    fontSize: 10, height: 18, fontWeight: 600,
                    bgcolor: hw.lesson.group.status === "ACTIVE" ? "#f0fdf4" : "#f3f4f6",
                    color:   hw.lesson.group.status === "ACTIVE" ? "#16a34a" : "#6b7280",
                  }}
                />
              )}
            </Box>
          </InfoRow>

          <InfoRow
            icon={<AccessTimeRoundedIcon sx={{ fontSize: 17, color: "#ca8a04" }} />}
            iconBg="#fefce8" label="Muddat"
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {hw.durationTime ? `${hw.durationTime} soat` : "—"}
            </Typography>
            {deadline && (
              <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.2 }}>
                Deadline: {fmtDate(deadline.toISOString())}
              </Typography>
            )}
          </InfoRow>

          <InfoRow
            icon={<CalendarTodayRoundedIcon sx={{ fontSize: 17, color: "#16a34a" }} />}
            iconBg="#f0fdf4" label="Yaratilgan sana"
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {fmtDate(hw.created_at, true)}
            </Typography>
          </InfoRow>

          {fileName && (
            <InfoRow
              icon={<AttachFileRoundedIcon sx={{ fontSize: 17, color: "#ea580c" }} />}
              iconBg="#fff7ed" label="Yuklangan fayl"
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{
                  fontSize: 13, fontWeight: 600, color: ACCENT,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  maxWidth: 340,
                }}>
                  {fileName}
                </Typography>
                {fUrl && (
                  <Tooltip title="Faylni ochish">
                    <IconButton
                      size="small"
                      onClick={() => window.open(fUrl, "_blank")}
                      sx={{ color: "#9ca3af", "&:hover": { color: ACCENT } }}
                    >
                      <OpenInNewRoundedIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </InfoRow>
          )}

          <Divider />

          {/* Status o'zgartirish */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <EditRoundedIcon sx={{ fontSize: 16, color: "#9ca3af" }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Statusni o'zgartirish
              </Typography>
            </Box>

            <FormControl fullWidth size="small">
              <Select
                value={status}
                onChange={e => setStatus(e.target.value)}
                sx={{ borderRadius: 2, fontSize: 13 }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cfg.color, flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 13 }}>{cfg.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {saveErr && (
              <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, py: 0.5 }}>
                {saveErr}
              </Alert>
            )}
            {saveOk && (
              <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2, py: 0.5 }}>
                Status muvaffaqiyatli yangilandi!
              </Alert>
            )}

            <Button
              fullWidth variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{
                mt: 2, borderRadius: 2, textTransform: "none",
                bgcolor: ACCENT, fontWeight: 600, fontSize: 14,
                boxShadow: "none",
                "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
              }}
            >
              {saving
                ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                : "Saqlash"
              }
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function HomeworkTab() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await homeworkApi.getAll();
      setHomeworks(Array.isArray(data) ? data : (data.data || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = (id, newStatus) => {
    setHomeworks(prev =>
      prev.map(h => h.id === id ? { ...h, status: newStatus } : h)
    );
    // modal ichidagi selected ni ham yangilash
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
  };

  const filtered = homeworks.filter(h =>
    `${h.title || ""} ${h.lesson?.title || ""} ${h.lesson?.group?.name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>Uy vazifalari</Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>{homeworks.length} ta vazifa</Typography>
        </Box>
        <Tooltip title="Yangilash">
          <IconButton onClick={load} sx={{ color: "#6b7280" }}>
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card elevation={0} sx={{ border: "1px solid #f3f4f6", borderRadius: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <TextField
            fullWidth size="small"
            placeholder="Vazifa nomi bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: "#9ca3af" }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13 } }}
          />

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} sx={{ color: ACCENT }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 6, color: "#9ca3af", fontSize: 13 }}>
              {search ? "Natija topilmadi" : "Uy vazifalari yo'q"}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { borderBottom: "1px solid #f3f4f6" } }}>
                    {["#", "Sarlavha", "Dars", "Guruh", "Muddat", "Fayl", "Holat"].map(h => (
                      <TableCell key={h} sx={{
                        fontSize: 11, fontWeight: 700, color: "#9ca3af",
                        textTransform: "uppercase", letterSpacing: ".05em", py: 1.2,
                      }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filtered.map((h, i) => {
                    const deadline   = calcDeadline(h.created_at, h.durationTime);
                    const sc         = getStatus(h.status);
                    const fileName   = shortFileName(h.file);
                    const deadlineStr = deadline ? fmtDate(deadline.toISOString()) : "—";
                    const createdStr  = fmtDate(h.created_at);

                    return (
                      <TableRow
                        key={h.id || i}
                        hover
                        onClick={() => setSelected(h)}
                        sx={{
                          "&:last-child td": { border: 0 },
                          "&:hover": { bgcolor: "#fafafa" },
                          cursor: "pointer",
                        }}
                      >
                        <TableCell sx={{ fontSize: 12, color: "#9ca3af", width: 40 }}>
                          {i + 1}
                        </TableCell>

                        <TableCell sx={{ maxWidth: 240 }}>
                          <Typography sx={{
                            fontSize: 13, fontWeight: 600, color: "#111827",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {h.title || "—"}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.3 }}>
                            {createdStr}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography sx={{
                            fontSize: 13, color: "#374151",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {h.lesson?.title || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {h.lesson?.group?.name ? (
                            <Chip
                              label={h.lesson.group.name}
                              size="small"
                              sx={{ fontSize: 11, height: 22, fontWeight: 700, bgcolor: ACCENT_BG, color: ACCENT }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>—</Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <AccessTimeRoundedIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                            <Typography sx={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
                              {h.durationTime ? `${h.durationTime} soat` : "—"}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: 11, color: "#9ca3af", mt: 0.3 }}>
                            {deadlineStr}
                          </Typography>
                        </TableCell>

                        {/* Fayl — row click'ni bloklash */}
                        <TableCell onClick={e => e.stopPropagation()}>
                          {fileName ? (
                            <Tooltip title={fileName}>
                              <Box
                                onClick={() => window.open(fileUrl(h.file), "_blank")}
                                sx={{
                                  display: "flex", alignItems: "center", gap: 0.5,
                                  cursor: "pointer",
                                  "&:hover .fn": { color: ACCENT },
                                }}
                              >
                                <AttachFileRoundedIcon sx={{ fontSize: 15, color: "#9ca3af" }} />
                                <Typography className="fn" sx={{
                                  fontSize: 11, color: "#6b7280",
                                  maxWidth: 100, overflow: "hidden",
                                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                                  transition: "color .15s",
                                }}>
                                  {fileName}
                                </Typography>
                              </Box>
                            </Tooltip>
                          ) : (
                            <Typography sx={{ fontSize: 12, color: "#d1d5db" }}>—</Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={sc.label}
                            size="small"
                            sx={{ fontSize: 11, height: 22, fontWeight: 600, bgcolor: sc.bg, color: sc.color }}
                          />
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

      {/* Detail Modal */}
      {selected && (
        <HomeworkModal
          hw={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </Box>
  );
}