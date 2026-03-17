// src/pages/admin/RatingsTab.jsx
import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, IconButton,
  TextField, InputAdornment, CircularProgress, Alert, Tooltip,
} from "@mui/material";
import SearchRoundedIcon  from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StarRoundedIcon    from "@mui/icons-material/StarRounded";
import { ratingApi }      from "../../api/apiService.js";

const MEDAL = ["🥇", "🥈", "🥉"];

// 1–5 yulduz uchun rang
const scoreColor = (score) => {
  if (score === 5) return { bg: "#fefce8", color: "#ca8a04" }; // oltin
  if (score === 4) return { bg: "#f0fdf4", color: "#16a34a" }; // yashil
  if (score === 3) return { bg: "#eff6ff", color: "#2563eb" }; // ko'k
  if (score === 2) return { bg: "#fff7ed", color: "#ea580c" }; // to'q sariq
  return                  { bg: "#fef2f2", color: "#dc2626" }; // qizil (1)
};

// Yulduzcha render
function Stars({ score }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <StarRoundedIcon
          key={i}
          sx={{
            fontSize: 16,
            color: i <= score ? "#f59e0b" : "#e5e7eb",
            transition: "color .15s",
          }}
        />
      ))}
    </Box>
  );
}

export default function RatingsTab() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [search,  setSearch]  = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await ratingApi.getAll();
      const list = Array.isArray(data) ? data : (data.data || []);
      // score desc tartibda saralash
      setRatings(list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = ratings.filter(r =>
    `${r.student?.fullName || ""} ${r.lesson?.title || ""} ${r.teacher?.fullName || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20, color: "#111827" }}>Reytinglar</Typography>
          <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
            {ratings.length} ta yozuv
          </Typography>
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

          {/* Search */}
          <TextField
            fullWidth size="small"
            placeholder="Talaba ismi bo'yicha qidirish..."
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
              <CircularProgress size={28} sx={{ color: "#7c3aed" }} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 6, color: "#9ca3af", fontSize: 13 }}>
              {search ? "Natija topilmadi" : "Reytinglar yo'q"}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { borderBottom: "1px solid #f3f4f6" } }}>
                    {["#", "Talaba", "Dars", "O'qituvchi", "Ball", "Sana"].map(h => (
                      <TableCell
                        key={h}
                        sx={{
                          fontSize: 11, fontWeight: 700, color: "#9ca3af",
                          textTransform: "uppercase", letterSpacing: ".05em", py: 1.2,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r, i) => {
                    const score      = r.score ?? 0;
                    const sc         = scoreColor(score);
                    const studentName = r.student?.fullName || "Noma'lum";
                    const teacherName = r.teacher?.fullName || "—";
                    const lessonTitle = r.lesson?.title    || "—";

                    // created_at yoki createdAt
                    const rawDate = r.created_at || r.createdAt;
                    const dateStr = rawDate
                      ? new Date(rawDate).toLocaleDateString("uz-UZ", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })
                      : "—";

                    return (
                      <TableRow
                        key={r.id || i}
                        hover
                        sx={{ "&:last-child td": { border: 0 }, "&:hover": { bgcolor: "#fafafa" } }}
                      >
                        {/* # */}
                        <TableCell sx={{ fontSize: 15, width: 50 }}>
                          {MEDAL[i] ?? i + 1}
                        </TableCell>

                        {/* Talaba */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              src={r.student?.photo}
                              sx={{ width: 32, height: 32, bgcolor: "#7c3aed", fontSize: 12, fontWeight: 700 }}
                            >
                              {studentName[0]}
                            </Avatar>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                              {studentName}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Dars */}
                        <TableCell sx={{ fontSize: 13, color: "#374151", maxWidth: 220 }}>
                          {lessonTitle}
                        </TableCell>

                        {/* O'qituvchi */}
                        <TableCell sx={{ fontSize: 13, color: "#6b7280" }}>
                          {teacherName}
                        </TableCell>

                        {/* Ball — yulduzcha + chip */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Stars score={score} />
                            <Chip
                              label={score}
                              size="small"
                              sx={{
                                fontSize: 12, height: 22, fontWeight: 700,
                                bgcolor: sc.bg, color: sc.color,
                              }}
                            />
                          </Box>
                        </TableCell>

                        {/* Sana */}
                        <TableCell sx={{ fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                          {dateStr}
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
    </Box>
  );
}