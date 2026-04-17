import { useState, useEffect, useRef } from "react";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, AppBar, Toolbar,
  IconButton, Tooltip, Drawer, Grid, Paper, CircularProgress,
  TextField, Button, Snackbar, Alert
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import { groupApi, lessonApi, homeworkApi, homeworkResponseApi, homeworkResultApi } from "../../api/apiService.js";
import TeacherGroupsPage from "./TeacherGroupsPage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { teacherApi } from "../../api/apiService.js";
import { API_BASE } from "../../utils/constants.js";

const FULL_W = 240;
const MINI_W = 68;
const ACCENT = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const NAV = [
  { id: "dashboard", label: "Asosiy", Icon: DashboardRoundedIcon },
  { id: "groups", label: "Guruhlarim", Icon: GroupsRoundedIcon },
  { id: "settings", label: "Sozlamalar (Profil)", Icon: SettingsRoundedIcon },
];

const TAB_TITLES = {
  dashboard: "O'qituvchi Paneli",
  groups: "Mening Guruhlarim",
  settings: "Shaxsiy Sozlamalar",
};

const MONTH_NAMES_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

const toPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE.replace(/\/api\/?$/, "")}/${clean}`;
};

function Sidebar({ user, tab, setTab, collapsed, setCollapsed, onLogout, onClose }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fff" }}>
      {/* Logo */}
      <Box sx={{
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        px: collapsed ? 1 : 2, py: 1.8,
        borderBottom: "1px solid #f3f4f6", minHeight: 60,
      }}>
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: 1.5, bgcolor: ACCENT,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>N</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: "#111827", letterSpacing: "-.4px" }}>
              EDU<span style={{ color: ACCENT }}>FLOW</span>
            </Typography>
          </Box>
        )}
        <IconButton
          size="small"
          onClick={() => setCollapsed(p => !p)}
          sx={{ color: "#9ca3af", "&:hover": { bgcolor: "#f3f4f6", color: ACCENT } }}
        >
          {collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
        </IconButton>
      </Box>

      {/* User */}
      {!collapsed ? (
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f3f4f6" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.2, borderRadius: 2, bgcolor: "#fafafa" }}>
            <Avatar src={toPhotoUrl(user?.photo) || undefined} sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, fontWeight: 700 }}>
              {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "T") : null}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{
                fontSize: 13, fontWeight: 600, color: "#111827",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.fullName}
              </Typography>
              <Chip label={user?.role || "TEACHER"} size="small" sx={{
                height: 17, fontSize: 10, fontWeight: 700,
                bgcolor: ACCENT + "18", color: ACCENT,
                "& .MuiChip-label": { px: 0.8 },
              }} />
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ py: 1.5, display: "flex", justifyContent: "center", borderBottom: "1px solid #f3f4f6" }}>
          <Avatar src={toPhotoUrl(user?.photo) || undefined} sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, fontWeight: 700 }}>
            {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "T") : null}
          </Avatar>
        </Box>
      )}

      {/* Nav */}
      <List sx={{ flex: 1, py: 1.5, overflowY: "auto" }} disablePadding>
        {NAV.map(item => {
          const isSelected = tab === item.id;
          return (
            <Tooltip key={item.id} title={collapsed ? item.label : ""} placement="right">
              <ListItemButton
                onClick={() => { setTab(item.id); onClose?.(); }}
                selected={isSelected}
                sx={{
                  borderRadius: 2, mx: 1, mb: 0.5,
                  px: collapsed ? 0 : 1.5, py: 1,
                  justifyContent: collapsed ? "center" : "flex-start",
                  bgcolor: isSelected ? ACCENT_BG : "transparent",
                  color: isSelected ? ACCENT : "#374151",
                  "&.Mui-selected": { bgcolor: ACCENT_BG, color: ACCENT },
                  "&.Mui-selected:hover": { bgcolor: ACCENT_BG },
                  "&:hover": { bgcolor: isSelected ? ACCENT_BG : "#f9fafb" },
                  transition: "all .15s",
                }}
              >
                <ListItemIcon sx={{
                  minWidth: collapsed ? 0 : 36,
                  color: isSelected ? ACCENT : "#6b7280",
                  justifyContent: "center",
                }}>
                  <item.Icon sx={{ fontSize: 20 }} />
                </ListItemIcon>
                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: isSelected ? 600 : 500 }}
                    />
                    {isSelected && (
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: ACCENT, flexShrink: 0 }} />
                    )}
                  </>
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* Logout */}
      <Divider />
      <Box sx={{ py: 1.5 }}>
        <Tooltip title={collapsed ? "Chiqish" : ""} placement="right">
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: 2, mx: 1,
              px: collapsed ? 0 : 1.5, py: 1,
              justifyContent: collapsed ? "center" : "flex-start",
              color: "#ef4444",
              "&:hover": { bgcolor: "#fef2f2" },
              transition: "all .15s",
            }}
          >
            <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: "#ef4444", justifyContent: "center" }}>
              <LogoutRoundedIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Chiqish"
                primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default function TeacherDashboard({ user, onLogout }) {
  const { updateUser } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const fileInputRef = useRef(null);

  const [stats, setStats] = useState({
    groupsCount: 0,
    lessonsCount: 0,
    homeworksCount: 0,
    pendingTasks: 0,
    approvedCount: 0,
    reviewRate: 0,
  });
  const [weeklyLoad, setWeeklyLoad] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [monthlyLoad, setMonthlyLoad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(user);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ open: false, severity: "success", text: "" });
  const [profileError, setProfileError] = useState("");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  const sidebarW = collapsed ? MINI_W : FULL_W;

  const buildProfileForm = (source) => ({
    fullName: source?.fullName || "",
    email: source?.email || "",
    password: "",
    experience: source?.experience ?? "",
    position: source?.position || "",
    photo: null,
  });

  useEffect(() => {
    setProfileData(user);
    setProfilePhotoPreview(toPhotoUrl(user?.photo));
  }, [user]);

  useEffect(() => {
    if (tab !== "settings" || !user?.id) return;
    setProfileLoading(true);
    teacherApi.getById(user.id)
      .then((res) => {
        const data = res?.data || res;
        if (!data) return;
        setProfileData((prev) => ({ ...prev, ...data }));
        setProfilePhotoPreview(toPhotoUrl(data.photo) || toPhotoUrl(user?.photo));
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [tab, user?.id, user?.photo]);

  useEffect(() => {
    if (tab !== "settings") return;
    setProfileForm(buildProfileForm(profileData));
    setProfileError("");
    setProfileEdit(false);
  }, [tab, profileData]);

  const showProfileMessage = (text, severity = "success") => {
    setProfileMessage({ open: true, severity, text });
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileForm((prev) => ({ ...prev, photo: file }));
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async () => {
    if (!profileForm?.fullName?.trim() || !profileForm?.email?.trim()) {
      setProfileError("Ism va email majburiy.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    try {
      const fd = new FormData();
      fd.append("fullName", profileForm.fullName.trim());
      fd.append("email", profileForm.email.trim());
      fd.append("experience", String(profileForm.experience ?? ""));
      fd.append("position", profileForm.position || "");
      if (profileForm.password) fd.append("password", profileForm.password);
      if (profileForm.photo) fd.append("photo", profileForm.photo);

      const updated = await teacherApi.update(user.id, fd);
      const nextUser = updated?.data || updated;
      updateUser(nextUser);
      setProfileData((prev) => ({ ...prev, ...nextUser }));
      setProfileForm((prev) => ({ ...prev, password: "", photo: null }));
      setProfilePhotoPreview(toPhotoUrl(nextUser.photo) || profilePhotoPreview);
      setProfileEdit(false);
      showProfileMessage("Profil muvaffaqiyatli yangilandi.", "success");
    } catch (e) {
      setProfileError(e.message || "Profilni saqlashda xatolik");
      showProfileMessage(e.message || "Profilni saqlashda xatolik", "error");
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (tab !== "dashboard") return;
    setLoading(true);
    Promise.all([
      groupApi.getAll().catch(() => []),
      lessonApi.getAll().catch(() => []),
      homeworkApi.getAll().catch(() => []),
      homeworkResultApi.getAll().catch(() => []),
    ])
      .then(async ([groupsRes, lessonsRes, homeworksRes, resultsRes]) => {
        const allGroups = groupsRes?.data || groupsRes || [];
        const currentTeacherId = Number(user?.id ?? user?.userId);
        const myGroups = Array.isArray(allGroups)
          ? allGroups.filter((g) => Number(g.teacher?.id ?? g.teacherId) === currentTeacherId)
          : [];

        const groupIds = new Set(myGroups.map((g) => Number(g.id)));

        const allLessons = lessonsRes?.data || lessonsRes || [];
        const myLessons = Array.isArray(allLessons)
          ? allLessons.filter((l) => groupIds.has(Number(l.groupId)))
          : [];

        const lessonIds = new Set(myLessons.map((l) => Number(l.id)));

        const allHomeworks = homeworksRes?.data || homeworksRes || [];
        const myHomeworks = Array.isArray(allHomeworks)
          ? allHomeworks.filter((h) => lessonIds.has(Number(h.lessonId)))
          : [];

        const responseGroups = await Promise.all(
          myHomeworks.map(async (hw) => {
            const rows = await homeworkResponseApi.getByHomeworkId(hw.id).catch(() => []);
            return [hw.id, Array.isArray(rows) ? rows : []];
          })
        );

        const responsesByHw = Object.fromEntries(responseGroups);
        const totalResponses = Object.values(responsesByHw).reduce((sum, rows) => sum + rows.length, 0);

        const allResults = resultsRes?.data || resultsRes || [];
        const myHomeworkIds = new Set(myHomeworks.map((h) => Number(h.id)));
        const myResults = Array.isArray(allResults)
          ? allResults.filter((r) => myHomeworkIds.has(Number(r.homeworkId || r?.homework?.id)))
          : [];

        const resultKeys = new Set(
          myResults.map((r) => `${Number(r.homeworkId || r?.homework?.id)}-${Number(r.studentId)}`)
        );

        let pendingTasks = 0;
        Object.entries(responsesByHw).forEach(([hwId, rows]) => {
          rows.forEach((row) => {
            if (!resultKeys.has(`${Number(hwId)}-${Number(row.studentId)}`)) {
              pendingTasks += 1;
            }
          });
        });

        const approvedCount = myResults.filter((r) => r.status === "APPROVED").length;
        const reviewRate = totalResponses > 0 ? Math.round((myResults.length / totalResponses) * 100) : 0;

        const weekly = [0, 0, 0, 0, 0, 0, 0];
        myLessons.forEach((l) => {
          const d = new Date(l.created_at || l.createdAt || Date.now());
          const idx = d.getDay();
          weekly[idx] += 1;
        });

        const now = new Date();
        const months = Array.from({ length: 6 }).map((_, i) => {
          const dt = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const key = `${dt.getFullYear()}-${dt.getMonth()}`;
          const label = MONTH_NAMES_SHORT[dt.getMonth()];
          return { key, label, value: 0 };
        });

        myLessons.forEach((l) => {
          const d = new Date(l.created_at || l.createdAt || Date.now());
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const month = months.find((m) => m.key === key);
          if (month) month.value += 1;
        });

        setStats({
          groupsCount: myGroups.length,
          lessonsCount: myLessons.length,
          homeworksCount: myHomeworks.length,
          pendingTasks,
          approvedCount,
          reviewRate,
        });
        setWeeklyLoad(weekly);
        setMonthlyLoad(months);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id, tab]);

  const weekLabels = ["Ya", "Du", "Se", "Cho", "Pa", "Ju", "Sha"];
  const maxWeekly = Math.max(1, ...weeklyLoad);
  const maxMonthly = Math.max(1, ...(monthlyLoad.map((m) => m.value)));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f9fafb" }}>
      {/* Desktop sidebar */}
      <Box sx={{
        display: { xs: "none", md: "block" },
        width: sidebarW, flexShrink: 0,
        transition: "width .22s cubic-bezier(.4,0,.2,1)",
      }}>
        <Box sx={{
          position: "fixed", top: 0, left: 0,
          width: sidebarW, height: "100vh",
          bgcolor: "#fff", borderRight: "1px solid #f3f4f6",
          transition: "width .22s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden", zIndex: 100,
        }}>
          <Sidebar
            user={user} tab={tab} setTab={setTab}
            collapsed={collapsed} setCollapsed={setCollapsed}
            onLogout={onLogout}
          />
        </Box>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: FULL_W },
        }}
      >
        <Sidebar
          user={user} tab={tab} setTab={setTab}
          collapsed={false} setCollapsed={() => {}}
          onLogout={onLogout} onClose={() => setMobileOpen(false)}
        />
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppBar position="sticky" elevation={0}
          sx={{ bgcolor: "#fff", borderBottom: "1px solid #f3f4f6", color: "#111827", zIndex: 99 }}
        >
          <Toolbar sx={{ minHeight: "58px !important", gap: 1.5 }}>
            <IconButton sx={{ display: { md: "none" }, color: "#6b7280" }} onClick={() => setMobileOpen(true)}>
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
                {TAB_TITLES[tab] || "Dashboard"}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>
                O'qituvchi boshqaruv paneli
              </Typography>
            </Box>
            <Chip label="● Online" size="small" sx={{
              bgcolor: "#f0fdf4", color: "#16a34a",
              fontWeight: 700, fontSize: 11,
              border: "1px solid #bbf7d0",
            }} />
            <Avatar src={toPhotoUrl(user?.photo) || undefined} sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, fontWeight: 700 }}>
              {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "T") : null}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: "auto" }}>
          
          {tab === "dashboard" && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 1 }}>
                  Xush kelibsiz, {user.fullName}!
                </Typography>
                <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                  Dars, vazifa va baholash jarayonlarining tezkor holati.
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2.4, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography sx={{ color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Guruhlar</Typography>
                      <GroupsRoundedIcon sx={{ color: "#7c3aed", fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#7c3aed" }}>
                      {loading ? <CircularProgress size={22} /> : stats.groupsCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2.4, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography sx={{ color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Darslar</Typography>
                      <QueryStatsRoundedIcon sx={{ color: "#2563eb", fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#2563eb" }}>
                      {loading ? <CircularProgress size={22} /> : stats.lessonsCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2.4, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography sx={{ color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Baholanmagan</Typography>
                      <AssignmentTurnedInRoundedIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#f59e0b" }}>
                      {loading ? <CircularProgress size={22} /> : stats.pendingTasks}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 2.4, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography sx={{ color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>Qabul qilingan</Typography>
                      <TaskAltRoundedIcon sx={{ color: "#16a34a", fontSize: 20 }} />
                    </Box>
                    <Typography sx={{ fontSize: 30, fontWeight: 800, color: "#16a34a" }}>
                      {loading ? <CircularProgress size={22} /> : stats.approvedCount}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                    <Typography sx={{ fontWeight: 700, color: "#111827", mb: 1.6 }}>Haftalik dars faolligi</Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-end", gap: { xs: 0.6, md: 1.2 }, height: 250 }}>
                      {weeklyLoad.map((v, i) => (
                        <Box key={i} sx={{ flex: 1, textAlign: "center" }}>
                          <Box
                            sx={{
                              mx: "auto",
                              width: { xs: "72%", md: "78%" },
                              minWidth: 18,
                              height: `${Math.max(14, Math.round((v / maxWeekly) * 200))}px`,
                              borderRadius: 2,
                              bgcolor: i % 2 ? "#7c3aed" : "#a78bfa",
                              transition: "all .25s",
                            }}
                          />
                          <Typography sx={{ mt: 1, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{weekLabels[i]}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb", mb: 3 }}>
                    <Typography sx={{ fontWeight: 700, color: "#111827", mb: 1.2 }}>Baholash progress</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.8 }}>
                      <Typography sx={{ color: "#6b7280", fontSize: 13 }}>Tekshiruv darajasi</Typography>
                      <Typography sx={{ color: "#111827", fontWeight: 800 }}>{loading ? "..." : `${stats.reviewRate}%`}</Typography>
                    </Box>
                    <Box sx={{ height: 10, borderRadius: 10, bgcolor: "#ede9fe", overflow: "hidden" }}>
                      <Box sx={{ width: `${stats.reviewRate}%`, height: "100%", bgcolor: "#7c3aed" }} />
                    </Box>
                    <Box sx={{ mt: 1.4, display: "flex", alignItems: "center", gap: 1, color: "#6b7280", fontSize: 12 }}>
                      <TrendingUpRoundedIcon sx={{ fontSize: 16, color: "#10b981" }} />
                      O'z vaqtida tekshiruvni oshirish tavsiya etiladi.
                    </Box>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <Typography sx={{ fontWeight: 700, color: "#111827", mb: 1.2 }}>6 oylik dars dinamikasi</Typography>
                    {(monthlyLoad || []).map((m) => (
                      <Box key={m.key} sx={{ display: "grid", gridTemplateColumns: "44px 1fr 24px", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{m.label}</Typography>
                        <Box sx={{ height: 8, borderRadius: 8, bgcolor: "#f3f4f6", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", width: `${Math.max(6, Math.round((m.value / maxMonthly) * 100))}%`, bgcolor: "#10b981" }} />
                        </Box>
                        <Typography sx={{ fontSize: 12, color: "#111827", fontWeight: 700 }}>{m.value}</Typography>
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {tab === "groups" && (
             <TeacherGroupsPage />
          )}

          {tab === "settings" && (
             <Box sx={{ maxWidth: 600, mx: "auto" }}>
               {profileLoading && (
                 <Alert severity="info" sx={{ mb: 2 }}>
                   Profil ma'lumotlari yuklanmoqda...
                 </Alert>
               )}

               <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #f3f4f6", textAlign: "center", mb: 3 }}>
                 <Avatar
                   src={profilePhotoPreview || toPhotoUrl(profileData?.photo) || undefined}
                   sx={{ width: 104, height: 104, bgcolor: ACCENT, fontSize: 38, fontWeight: 800, mx: "auto", mb: 2 }}
                 >
                   {!profilePhotoPreview && !toPhotoUrl(profileData?.photo) ? (profileData?.fullName?.[0] || "T") : null}
                 </Avatar>
                 <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}>{profileData?.fullName || user?.fullName || "—"}</Typography>
                 <Typography sx={{ color: "#6b7280", mb: 2 }}>{profileData?.position || "O'qituvchi"}</Typography>
                 <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                   <Chip label={profileData?.role || user?.role || "TEACHER"} sx={{ bgcolor: ACCENT + "18", color: ACCENT, fontWeight: 700 }} />
                   <Chip label={`ID: ${profileData?.id || user?.id || "—"}`} sx={{ bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} />
                 </Box>
               </Paper>

               <Paper elevation={0} sx={{ p: 0, borderRadius: 4, border: "1px solid #f3f4f6", overflow: "hidden" }}>
                 <Box sx={{ p: 2.5, px: 3, fontWeight: 700, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                   <Typography sx={{ fontWeight: 700 }}>Shaxsiy ma'lumotlar</Typography>
                   {!profileEdit ? (
                     <Button
                       size="small"
                       startIcon={<EditRoundedIcon />}
                       onClick={() => setProfileEdit(true)}
                       sx={{ textTransform: "none", borderRadius: 2 }}
                     >
                       Tahrirlash
                     </Button>
                   ) : (
                     <Box sx={{ display: "flex", gap: 1 }}>
                       <Button
                         size="small"
                         variant="outlined"
                         onClick={() => {
                           setProfileForm(buildProfileForm(profileData));
                           setProfilePhotoPreview(toPhotoUrl(profileData?.photo) || toPhotoUrl(user?.photo));
                           setProfileError("");
                           setProfileEdit(false);
                         }}
                         disabled={profileSaving}
                         sx={{ textTransform: "none", borderRadius: 2 }}
                       >
                         Bekor qilish
                       </Button>
                       <Button
                         size="small"
                         variant="contained"
                         onClick={handleProfileSave}
                         disabled={profileSaving}
                         sx={{ textTransform: "none", borderRadius: 2, bgcolor: ACCENT, boxShadow: "none", "&:hover": { bgcolor: "#6d28d9" } }}
                       >
                         {profileSaving ? "Saqlanmoqda..." : "Saqlash"}
                       </Button>
                     </Box>
                   )}
                 </Box>

                 {profileError && <Alert severity="error" sx={{ m: 2, mb: 0 }}>{profileError}</Alert>}

                 {profileEdit && profileForm ? (
                   <Box sx={{ p: 3, display: "grid", gap: 2 }}>
                     <TextField
                       label="To'liq ism"
                       value={profileForm?.fullName || ""}
                       onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                       fullWidth
                     />
                     <TextField
                       label="Email"
                       value={profileForm?.email || ""}
                       onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                       fullWidth
                     />
                     <TextField
                       label="Lavozim"
                       value={profileForm?.position || ""}
                       onChange={(e) => setProfileForm((prev) => ({ ...prev, position: e.target.value }))}
                       fullWidth
                     />
                     <TextField
                       label="Tajriba (yil)"
                       type="number"
                       value={profileForm?.experience ?? ""}
                       onChange={(e) => setProfileForm((prev) => ({ ...prev, experience: e.target.value }))}
                       fullWidth
                     />
                     <TextField
                       label="Yangi parol (ixtiyoriy)"
                       type="password"
                       value={profileForm?.password || ""}
                       onChange={(e) => setProfileForm((prev) => ({ ...prev, password: e.target.value }))}
                       fullWidth
                     />

                     <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                       <Button
                         variant="outlined"
                         startIcon={<PhotoCameraRoundedIcon />}
                         onClick={() => fileInputRef.current?.click()}
                         sx={{ textTransform: "none", borderRadius: 2 }}
                       >
                         Rasmni almashtirish
                       </Button>
                       {profileForm?.photo && <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{profileForm.photo.name}</Typography>}
                       <input ref={fileInputRef} hidden type="file" accept="image/*" onChange={handleProfilePhotoChange} />
                     </Box>
                   </Box>
                 ) : (
                   <List disablePadding>
                     <Box>
                       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3, gap: 2 }}>
                         <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                           <Avatar sx={{ width: 32, height: 32, bgcolor: "#f3f4f6", color: ACCENT }}>
                             <Typography sx={{ fontSize: 16 }}>👤</Typography>
                           </Avatar>
                           <Typography sx={{ color: "#6b7280", fontSize: 14 }}>To'liq ism</Typography>
                         </Box>
                         <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>
                           {profileData?.fullName || "—"}
                         </Typography>
                       </Box>
                       <Divider />
                     </Box>

                     <Box>
                       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3, gap: 2 }}>
                         <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                           <Avatar sx={{ width: 32, height: 32, bgcolor: "#f3f4f6", color: ACCENT }}>
                             <Typography sx={{ fontSize: 16 }}>📧</Typography>
                           </Avatar>
                           <Typography sx={{ color: "#6b7280", fontSize: 14 }}>Email</Typography>
                         </Box>
                         <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>
                           {profileData?.email || "—"}
                         </Typography>
                       </Box>
                       <Divider />
                     </Box>

                     <Box>
                       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3, gap: 2 }}>
                         <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                           <Avatar sx={{ width: 32, height: 32, bgcolor: "#f3f4f6", color: ACCENT }}>
                             <Typography sx={{ fontSize: 16 }}>💼</Typography>
                           </Avatar>
                           <Typography sx={{ color: "#6b7280", fontSize: 14 }}>Lavozim</Typography>
                         </Box>
                         <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>
                           {profileData?.position || "—"}
                         </Typography>
                       </Box>
                       <Divider />
                     </Box>

                     <Box>
                       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3, gap: 2 }}>
                         <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                           <Avatar sx={{ width: 32, height: 32, bgcolor: "#f3f4f6", color: ACCENT }}>
                             <Typography sx={{ fontSize: 16 }}>⭐</Typography>
                           </Avatar>
                           <Typography sx={{ color: "#6b7280", fontSize: 14 }}>Tajriba (yil)</Typography>
                         </Box>
                         <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>
                           {profileData?.experience ?? "—"}
                         </Typography>
                       </Box>
                       <Divider />
                     </Box>

                     <Box>
                       <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3, gap: 2 }}>
                         <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                           <Avatar sx={{ width: 32, height: 32, bgcolor: "#f3f4f6", color: ACCENT }}>
                             <Typography sx={{ fontSize: 16 }}>🏷️</Typography>
                           </Avatar>
                           <Typography sx={{ color: "#6b7280", fontSize: 14 }}>Rol</Typography>
                         </Box>
                         <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: 500 }}>
                           {profileData?.role || user?.role || "TEACHER"}
                         </Typography>
                       </Box>
                     </Box>
                   </List>
                 )}
               </Paper>

               <Snackbar
                 open={profileMessage.open}
                 autoHideDuration={3000}
                 onClose={() => setProfileMessage((prev) => ({ ...prev, open: false }))}
                 anchorOrigin={{ vertical: "top", horizontal: "right" }}
               >
                 <Alert
                   onClose={() => setProfileMessage((prev) => ({ ...prev, open: false }))}
                   severity={profileMessage.severity}
                   variant="filled"
                   sx={{ width: "100%" }}
                 >
                   {profileMessage.text}
                 </Alert>
               </Snackbar>
             </Box>
          )}

        </Box>
      </Box>
    </Box>
  );
}