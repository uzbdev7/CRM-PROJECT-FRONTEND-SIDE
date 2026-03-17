// src/pages/admin/DashboardTab.jsx
import {
  Box, Card, CardContent, Typography, Grid, Divider,
  Avatar, Chip, LinearProgress, List, ListItem,
  ListItemAvatar, ListItemText,
} from "@mui/material";
import SchoolRoundedIcon         from "@mui/icons-material/SchoolRounded";
import PeopleAltRoundedIcon      from "@mui/icons-material/PeopleAltRounded";
import GroupsRoundedIcon         from "@mui/icons-material/GroupsRounded";
import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import TrendingUpRoundedIcon     from "@mui/icons-material/TrendingUpRounded";
import { ADMIN_ROLES } from "../../utils/constants.js";

const ACCENT = "#7c3aed";

// Stat card ranglari
const STAT_COLORS = [
  { accent: "#7c3aed", light: "#f5f3ff", grad: "135deg, #7c3aed, #b06ef3" },
  { accent: "#0ea5e9", light: "#f0f9ff", grad: "135deg, #0ea5e9, #38bdf8" },
  { accent: "#16a34a", light: "#f0fdf4", grad: "135deg, #16a34a, #22d3a0" },
  { accent: "#f59e0b", light: "#fefce8", grad: "135deg, #f59e0b, #fbbf24" },
];

// ── Katta Stat Card ────────────────────────────────────────────────────────
function StatCard({ Icon, label, value, sub, colorIdx, animDelay, onClick }) {
  const c = STAT_COLORS[colorIdx];
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: "1px solid #f3f4f6",
        borderRadius: 3,
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "transform .22s, box-shadow .22s, border-color .22s",
        "&:hover": onClick ? {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 32px ${c.accent}22`,
          borderColor: `${c.accent}40`,
        } : {},
        animation: `statPop .5s ${animDelay}s both`,
        "@keyframes statPop": {
          from: { opacity: 0, transform: "translateY(20px) scale(.96)" },
          to:   { opacity: 1, transform: "translateY(0)   scale(1)"   },
        },
      }}
    >
      {/* Top gradient bar */}
      <Box sx={{ height: 4, background: `linear-gradient(${c.grad})` }} />

      <CardContent sx={{ p: 3 }}>
        {/* Icon + value row */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: 2.5,
            background: `linear-gradient(${c.grad})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 6px 20px ${c.accent}35`,
          }}>
            <Icon sx={{ color: "#fff", fontSize: 26 }} />
          </Box>

          {sub && (
            <Box sx={{
              display: "flex", alignItems: "center", gap: 0.4,
              bgcolor: c.light, borderRadius: 99, px: 1.2, py: 0.4,
            }}>
              <TrendingUpRoundedIcon sx={{ fontSize: 13, color: c.accent }} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: c.accent }}>{sub}</Typography>
            </Box>
          )}
        </Box>

        {/* Number */}
        <Typography sx={{
          fontSize: 42, fontWeight: 900, color: "#111827",
          lineHeight: 1, letterSpacing: "-2px", mb: 0.5,
          fontVariantNumeric: "tabular-nums",
          animation: `countIn .6s ${animDelay + 0.1}s both`,
          "@keyframes countIn": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to:   { opacity: 1, transform: "translateY(0)" },
          },
        }}>
          {value}
        </Typography>

        <Typography sx={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>
          {label}
        </Typography>

        {/* Bottom accent line */}
        <Box sx={{ mt: 2, height: 3, bgcolor: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
          <Box sx={{
            height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, ${c.accent}, ${c.accent}66)`,
            width: value > 0 ? "60%" : "10%",
            transition: `width 1s cubic-bezier(.4,0,.2,1) ${animDelay + 0.3}s`,
          }} />
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Role Badge ─────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  TEACHER:       { bg: "#eff6ff", color: "#2563eb" },
  STUDENT:       { bg: "#f5f3ff", color: "#7c3aed" },
  ADMIN:         { bg: "#fefce8", color: "#ca8a04" },
  SUPERADMIN:    { bg: "#fef2f2", color: "#dc2626" },
  ADMINISTRATOR: { bg: "#f0fdf4", color: "#16a34a" },
};
const roleBadge = (role) => ROLE_COLORS[role] || { bg: "#f3f4f6", color: "#6b7280" };

// ──────────────────────────────────────────────────────────────────────────
// groups prop qo'shildi
export default function DashboardTab({ users, groups, setTab }) {
  const teachers   = users.filter(u => u.role === "TEACHER").length;
  const students   = users.filter(u => u.role === "STUDENT").length;
  const admins     = users.filter(u => ADMIN_ROLES.includes(u.role)).length;
  const active     = users.filter(u => u.status === "ACTIVE").length;
  const total      = users.length;
  const groupCount = Array.isArray(groups) ? groups.length : 0; // ← real data

  const STATS = [
    { Icon: PeopleAltRoundedIcon,      label: "Talabalar",     value: students,   sub: `${active} faol`, colorIdx: 0, tab: "students" },
    { Icon: GroupsRoundedIcon,         label: "Guruhlar",      value: groupCount,                        colorIdx: 1, tab: "groups"   },
    { Icon: SchoolRoundedIcon,         label: "O'qituvchilar", value: teachers,                          colorIdx: 2, tab: "teachers" },
    { Icon: AdminPanelSettingsRounded, label: "Adminlar",      value: admins,                            colorIdx: 3, tab: null       },
  ];
  // ... qolgan kod o'zgarishsiz

  const roleData = [
    { label: "Student", color: "#7c3aed", value: students, light: "#f5f3ff" },
    { label: "Teacher", color: "#0ea5e9", value: teachers, light: "#f0f9ff" },
    { label: "Admin",   color: "#f59e0b", value: admins,   light: "#fefce8" },
  ];

  // Greeting qismi uchun vaqt
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Xayrli tong" : hour < 17 ? "Xayrli kun" : "Xayrli kech";

  return (
    <Box>
      {/* ── Greeting ── */}
      <Box sx={{
        mb: 4,
        animation: "fadeDown .5s both",
        "@keyframes fadeDown": {
          from: { opacity: 0, transform: "translateY(-12px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      }}>
        <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-.5px" }}>
          {greeting}, {JSON.parse(localStorage.getItem('_edu_crm_session_') || '{}')?.fullName?.split(" ")[0] || "SuperAdmin"}! 👋
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#9ca3af", mt: 0.5 }}>
          EduFlow boshqaruv paneliga xush kelibsiz — bugun ham samarali kun bo'lsin!
        </Typography>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {STATS.map((s, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <StatCard
              {...s}
              animDelay={i * 0.08}
              onClick={s.tab ? () => setTab(s.tab) : undefined}
            />
          </Grid>
        ))}
      </Grid>

      {/* ── Bottom row ── */}
      <Grid container spacing={2.5}>

        {/* So'nggi foydalanuvchilar */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{
            border: "1px solid #f3f4f6", borderRadius: 3,
            animation: "fadeUp .5s .32s both",
            "@keyframes fadeUp": {
              from: { opacity: 0, transform: "translateY(16px)" },
              to:   { opacity: 1, transform: "translateY(0)" },
            },
          }}>
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, pt: 2.5, pb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
                    So'nggi foydalanuvchilar
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 0.2 }}>
                    Jami {total} ta foydalanuvchi
                  </Typography>
                </Box>
                <Typography
                  onClick={() => setTab("teachers")}
                  sx={{ fontSize: 12, color: ACCENT, cursor: "pointer", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                >
                  Barchasi →
                </Typography>
              </Box>
              <Divider />

              {users.length === 0 ? (
                <Typography sx={{ textAlign: "center", py: 6, color: "#9ca3af", fontSize: 13 }}>
                  Ma'lumot yuklanmoqda...
                </Typography>
              ) : (
                <List disablePadding>
                  {users.slice(0, 7).map((u, i) => {
                    const rb = roleBadge(u.role);
                    return (
                      <ListItem
                        key={i}
                        disablePadding
                        sx={{
                          px: 2.5, py: 1.2,
                          borderBottom: i < 6 ? "1px solid #f9fafb" : "none",
                          transition: "background .15s",
                          "&:hover": { bgcolor: "#fafafa" },
                          animation: `fadeUp .4s ${0.35 + i * 0.05}s both`,
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 46 }}>
                          <Avatar sx={{
                            width: 36, height: 36,
                            background: `linear-gradient(135deg, ${ACCENT}, #b06ef3)`,
                            fontSize: 13, fontWeight: 700,
                            boxShadow: `0 2px 8px ${ACCENT}30`,
                          }}>
                            {u.fullName?.[0]?.toUpperCase() || "?"}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={u.fullName}
                          secondary={u.email}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                          secondaryTypographyProps={{ fontSize: 11, color: "#9ca3af" }}
                        />
                        <Chip
                          label={u.role}
                          size="small"
                          sx={{ fontSize: 10, height: 20, fontWeight: 700, bgcolor: rb.bg, color: rb.color }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Rol taqsimoti */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{
            border: "1px solid #f3f4f6", borderRadius: 3, height: "100%",
            animation: "fadeUp .5s .4s both",
          }}>
            <CardContent sx={{ p: 2.5 }}>
              {/* Header */}
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#111827", mb: 0.3 }}>
                Rol taqsimoti
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#9ca3af", mb: 2 }}>
                Jami {total} ta foydalanuvchi
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              {/* Total donut-style display */}
              <Box sx={{
                textAlign: "center", py: 2, mb: 2.5,
                bgcolor: "#fafafa", borderRadius: 2,
              }}>
                <Typography sx={{ fontSize: 44, fontWeight: 900, color: "#111827", lineHeight: 1, letterSpacing: "-2px" }}>
                  {total}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 0.5 }}>Barcha foydalanuvchilar</Typography>
              </Box>

              {/* Role rows */}
              {roleData.map((x, i) => (
                <Box key={x.label} sx={{
                  mb: 2.5,
                  animation: `fadeUp .4s ${0.45 + i * 0.08}s both`,
                }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: x.color }} />
                      <Typography sx={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{x.label}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{x.value}</Typography>
                      <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                        ({total ? Math.round(x.value / total * 100) : 0}%)
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={total ? Math.round(x.value / total * 100) : 0}
                    sx={{
                      height: 8, borderRadius: 99, bgcolor: x.light,
                      "& .MuiLinearProgress-bar": {
                        bgcolor: x.color, borderRadius: 99,
                        transition: `transform 1s cubic-bezier(.4,0,.2,1) ${0.5 + i * 0.1}s`,
                      },
                    }}
                  />
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Active badge */}
              <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                bgcolor: "#f0fdf4", borderRadius: 2, px: 2, py: 1.5,
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#16a34a", boxShadow: "0 0 6px #16a34a" }} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Faol</Typography>
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{active}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}