import { useState, useEffect, useRef } from "react";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, AppBar, Toolbar,
  IconButton, Tooltip, Drawer, Grid, Paper, Button,
  TextField, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";

import { studentGroupApi, lessonApi, attendanceApi, studentApi } from "../../api/apiService.js";
import StudentGroupsTab from "./StudentGroupsTab.jsx";
import { API_BASE } from "../../utils/constants.js";
import { useAuth } from "../../context/AuthContext.jsx";

const FULL_W = 240;
const MINI_W = 68;
const ACCENT = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const toPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE.replace(/\/api\/?$/, "")}/${clean}`;
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const NAV = [
  { id: "dashboard", label: "Asosiy", Icon: DashboardRoundedIcon },
  { id: "groups", label: "Guruhlarim", Icon: GroupsRoundedIcon },
  { id: "profile", label: "Mening profilim", Icon: PersonRoundedIcon },
];

const TAB_TITLES = {
  dashboard: "Asosiy Paneli",
  groups: "Guruhlarim",
  profile: "Mening profilim",
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
              {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "S") : null}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{
                fontSize: 13, fontWeight: 600, color: "#111827",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.fullName}
              </Typography>
              <Chip label={user?.role || "STUDENT"} size="small" sx={{
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
            {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "S") : null}
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

export default function StudentDashboard({ user, onLogout }) {
  const { updateUser } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [stats, setStats] = useState({ groups: 0, attendance: "100%", homeworks: 0, score: 0 });
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(user);
  const [profileForm, setProfileForm] = useState(null);
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(toPhotoUrl(user?.photo));
  const [profileAlert, setProfileAlert] = useState({ open: false, severity: "success", text: "" });
  const [profileError, setProfileError] = useState("");
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const profileFileRef = useRef(null);

  const sidebarW = collapsed ? MINI_W : FULL_W;

  const buildProfileForm = (source) => ({
    fullName: source?.fullName || "",
    email: source?.email || "",
    birt_date: toDateInputValue(source?.birt_date),
    password: "",
    photo: null,
  });

  useEffect(() => {
    setProfileData(user);
    setProfilePhotoPreview(toPhotoUrl(user?.photo));
  }, [user]);

  useEffect(() => {
    if (tab !== "profile" || !user?.id) return;

    setProfileLoading(true);
    studentApi.getById(user.id)
      .then((res) => {
        const data = res?.data || res;
        if (!data) return;
        setProfileData((prev) => ({ ...prev, ...data }));
        setProfilePhotoPreview(toPhotoUrl(data.photo) || toPhotoUrl(user?.photo));
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [tab, user?.id]);

  useEffect(() => {
    if (tab !== "profile") return;
    setProfileForm(buildProfileForm(profileData));
    setProfileError("");
    setProfileEdit(false);
  }, [tab, profileData]);

  const profileHasUnsavedChanges = Boolean(
    profileEdit &&
    profileForm &&
    (
      profileForm.fullName !== (profileData?.fullName || "") ||
      profileForm.email !== (profileData?.email || "") ||
      profileForm.birt_date !== toDateInputValue(profileData?.birt_date) ||
      Boolean(profileForm.password?.trim()) ||
      Boolean(profileForm.photo)
    )
  );

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!profileHasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [profileHasUnsavedChanges]);

  const showProfileAlert = (text, severity = "success") => {
    setProfileAlert({ open: true, severity, text });
  };

  const handleProfileField = (key, value) => {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileForm((prev) => ({ ...prev, photo: file }));
    setProfilePhotoPreview(URL.createObjectURL(file));
  };

  const handleProfileCancel = () => {
    setProfileForm(buildProfileForm(profileData));
    setProfilePhotoPreview(toPhotoUrl(profileData?.photo) || toPhotoUrl(user?.photo));
    setProfileError("");
    setProfileEdit(false);
  };

  const handleTabChangeRequest = (nextTab) => {
    if (nextTab === tab) return;
    if (profileHasUnsavedChanges) {
      setPendingAction({ type: "tab", value: nextTab });
      setConfirmLeaveOpen(true);
      return;
    }
    setTab(nextTab);
  };

  const handleLogoutRequest = () => {
    if (profileHasUnsavedChanges) {
      setPendingAction({ type: "logout" });
      setConfirmLeaveOpen(true);
      return;
    }
    onLogout();
  };

  const handleConfirmLeave = () => {
    setConfirmLeaveOpen(false);
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.type === "tab") {
      setTab(action.value);
      return;
    }
    if (action.type === "logout") {
      onLogout();
    }
  };

  const handleStayEditing = () => {
    setConfirmLeaveOpen(false);
    setPendingAction(null);
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
      if (profileForm.birt_date) fd.append("birt_date", profileForm.birt_date);
      if (profileForm.password?.trim()) fd.append("password", profileForm.password.trim());
      if (profileForm.photo) fd.append("photo", profileForm.photo);

      const updated = await studentApi.update(user.id, fd);
      const next = updated?.data || updated;
      setProfileData((prev) => ({ ...prev, ...next }));
      updateUser(next);
      setProfileForm((prev) => ({ ...prev, password: "", photo: null }));
      setProfilePhotoPreview(toPhotoUrl(next?.photo) || profilePhotoPreview);
      setProfileEdit(false);
      showProfileAlert("Profil muvaffaqiyatli saqlandi.", "success");
    } catch (e) {
      const msg = e?.message || "Profilni saqlashda xatolik";
      setProfileError(msg);
      showProfileAlert(msg, "error");
    } finally {
      setProfileSaving(false);
    }
  };

  useEffect(() => {
    if (tab !== "dashboard") return;
    setLoading(true);
    Promise.all([
      studentGroupApi.getAllFull().catch(() => ({ data: [] })),
      attendanceApi.getAll().catch(() => []),
      studentApi.getStudentHomeworks().catch(() => ({ data: [] }))
    ]).then(([sgRes, attRes, hwRes]) => {
      const currentStudentId = Number(user?.id ?? user?.userId);
      const allSg = (sgRes?.data || sgRes || []);
      const myGroups = Array.isArray(allSg)
        ? allSg.filter((sg) => Number(sg.student?.id ?? sg.studentId) === currentStudentId)
        : [];

      const allAtt = (attRes?.data || attRes || []);
      const myAtt = Array.isArray(allAtt) ? allAtt.filter(a => Number(a.studentId) === currentStudentId) : [];
      const presentCount = myAtt.filter(a => a.isPresent).length;
      
      const attScore = myAtt.length > 0 ? Math.round((presentCount / myAtt.length) * 100) : 100;

      const myHwList = (hwRes?.data || hwRes || []);

      setStats({
        groups: myGroups.length,
        attendance: `${attScore}%`,
        homeworks: Array.isArray(myHwList) ? myHwList.length : 0,
        score: presentCount * 10
      });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id, tab]);

  const profileRows = [
    { label: "To'liq ism", value: profileData?.fullName, icon: BadgeRoundedIcon },
    { label: "Email", value: profileData?.email, icon: EmailRoundedIcon },
    { label: "Rol", value: profileData?.role || "STUDENT", icon: SchoolRoundedIcon },
    { label: "Lavozim", value: profileData?.position || "Talaba", icon: AutoAwesomeRoundedIcon },
    { label: "Tizim ID", value: `#${profileData?.id || user.id}`, icon: BadgeRoundedIcon },
    { label: "Tug'ilgan sana", value: profileData?.birt_date ? new Date(profileData.birt_date).toLocaleDateString("uz-UZ") : "—", icon: CalendarMonthRoundedIcon },
  ];

  const animatedStats = [
    { label: "O'qiyotgan Fanlar", value: loading ? "..." : stats.groups, bg: "#fef2f2", color: "#ef4444", icon: GroupsRoundedIcon },
    { label: "Davomat", value: loading ? "..." : stats.attendance, bg: "#f0fdf4", color: "#22c55e", icon: SchoolRoundedIcon },
    { label: "Topshiriqlar", value: loading ? "..." : stats.homeworks, bg: "#eff6ff", color: "#3b82f6", icon: CalendarMonthRoundedIcon },
    { label: "Umumiy Ball", value: loading ? "..." : stats.score, bg: "#fefce8", color: "#eab308", icon: AutoAwesomeRoundedIcon },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f6f7fb",
        backgroundImage: "radial-gradient(circle at 12% 0%, rgba(124,58,237,0.08) 0, rgba(124,58,237,0) 35%), radial-gradient(circle at 85% 100%, rgba(59,130,246,0.08) 0, rgba(59,130,246,0) 42%)",
      }}
    >
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
            user={user} tab={tab} setTab={handleTabChangeRequest}
            collapsed={collapsed} setCollapsed={setCollapsed}
            onLogout={handleLogoutRequest}
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
          user={user} tab={tab} setTab={handleTabChangeRequest}
          collapsed={false} setCollapsed={() => {}}
          onLogout={handleLogoutRequest} onClose={() => setMobileOpen(false)}
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
                Talaba boshqaruv paneli
              </Typography>
            </Box>
            <Chip label="● Online" size="small" sx={{
              bgcolor: "#f0fdf4", color: "#16a34a",
              fontWeight: 700, fontSize: 11,
              border: "1px solid #bbf7d0",
            }} />
            <Avatar src={toPhotoUrl(user?.photo) || undefined} sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, fontWeight: 700 }}>
              {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "S") : null}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 3 },
            overflow: "auto",
            "@keyframes fadeSlide": {
              "0%": { opacity: 0, transform: "translateY(10px)" },
              "100%": { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {tab === "dashboard" && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 4,
                  border: "1px solid #efe9ff",
                  background: "linear-gradient(125deg, #fcfbff 0%, #f5f3ff 42%, #eef2ff 100%)",
                  mb: 3,
                  position: "relative",
                  overflow: "hidden",
                  animation: "fadeSlide .45s ease",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: 220,
                    height: 220,
                    borderRadius: "50%",
                    right: -70,
                    top: -80,
                    background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0) 70%)",
                    pointerEvents: "none",
                  }}
                />

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", position: "relative" }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 0.8 }}>
                      Xush kelibsiz, {user.fullName}!
                    </Typography>
                    <Typography sx={{ color: "#6b7280", fontSize: 14, maxWidth: 560 }}>
                      Sizning kunlik o'quv holatingiz, davomat foizi va topshiriqlar progressi shu yerda jamlangan.
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip icon={<SchoolRoundedIcon />} label={`${loading ? "..." : stats.groups} ta guruh`} sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 700 }} />
                    <Chip icon={<AutoAwesomeRoundedIcon />} label={`Davomat ${loading ? "..." : stats.attendance}`} sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 700 }} />
                  </Box>
                </Box>
              </Paper>

              <Grid container spacing={3}>
                {animatedStats.map((stat, i) => (
                  <Grid item xs={12} sm={6} md={3} key={i}>
                    <Paper elevation={0} sx={{
                      p: 2.5, borderRadius: 3, border: "1px solid #f1f5f9",
                      display: "flex", flexDirection: "column", gap: 1.4,
                      transition: "all .2s",
                      animation: `fadeSlide .45s ease ${0.08 * (i + 1)}s both`,
                      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 10px 24px rgba(15,23,42,.08)", borderColor: "#e2e8f0" }
                    }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ color: "#6b7280", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          {stat.label}
                        </Typography>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: stat.bg, color: stat.color }}>
                          <stat.icon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </Box>
                      <Typography sx={{ fontSize: 32, fontWeight: 900, color: stat.color, lineHeight: 1 }}>
                        {stat.value}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: 3, border: "1px solid #f1f5f9", animation: "fadeSlide .55s ease .2s both" }}>
                <Typography sx={{ fontWeight: 700, color: "#111827", mb: 1.2 }}>
                  Tezkor Holat
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.6, borderRadius: 2, bgcolor: "#fafafa", border: "1px solid #f1f5f9" }}>
                      <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>Dars guruhlari</Typography>
                      <Typography sx={{ fontWeight: 800, color: "#111827" }}>{loading ? "..." : stats.groups} ta</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.6, borderRadius: 2, bgcolor: "#fafafa", border: "1px solid #f1f5f9" }}>
                      <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>Topsiriqlar</Typography>
                      <Typography sx={{ fontWeight: 800, color: "#111827" }}>{loading ? "..." : stats.homeworks} ta</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 1.6, borderRadius: 2, bgcolor: "#fafafa", border: "1px solid #f1f5f9" }}>
                      <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>Umumiy progress</Typography>
                      <Typography sx={{ fontWeight: 800, color: "#111827" }}>{loading ? "..." : stats.attendance}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}

          {tab === "profile" && (
            <Box sx={{ maxWidth: 600, mx: "auto" }}>
              <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid #f3f4f6", textAlign: "center", mb: 3 }}>
                <Avatar
                  src={profilePhotoPreview || toPhotoUrl(profileData?.photo) || undefined}
                  sx={{ width: 104, height: 104, bgcolor: ACCENT, fontSize: 38, fontWeight: 800, mx: "auto", mb: 2 }}
                >
                  {!profilePhotoPreview && !toPhotoUrl(profileData?.photo) ? (profileData?.fullName?.[0] || "S") : null}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}>{profileData?.fullName}</Typography>
                <Typography sx={{ color: "#6b7280", mb: 2 }}>{profileData?.position || "Talaba"}</Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1, flexWrap: "wrap" }}>
                  <Chip label={profileData?.role || "STUDENT"} sx={{ bgcolor: ACCENT + "18", color: ACCENT, fontWeight: 700 }} />
                  <Chip label={`ID: ${profileData?.id || user.id}`} sx={{ bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} />
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
                        onClick={handleProfileCancel}
                        disabled={profileSaving}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SaveRoundedIcon />}
                        onClick={handleProfileSave}
                        disabled={profileSaving}
                        sx={{ textTransform: "none", borderRadius: 2, bgcolor: ACCENT, boxShadow: "none", "&:hover": { bgcolor: "#6d28d9" } }}
                      >
                        {profileSaving ? "Saqlanmoqda..." : "Saqlash"}
                      </Button>
                    </Box>
                  )}
                </Box>

                {profileLoading && <Alert severity="info" sx={{ m: 2 }}>Profil ma'lumotlari yangilanmoqda...</Alert>}
                {profileError && <Alert severity="error" sx={{ m: 2, mb: 0 }}>{profileError}</Alert>}

                {profileEdit && profileForm ? (
                  <Box sx={{ p: 3, display: "grid", gap: 2 }}>
                    <TextField
                      label="To'liq ism"
                      value={profileForm.fullName}
                      onChange={(e) => handleProfileField("fullName", e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Email"
                      value={profileForm.email}
                      onChange={(e) => handleProfileField("email", e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Tug'ilgan sana"
                      type="date"
                      value={profileForm.birt_date}
                      onChange={(e) => handleProfileField("birt_date", e.target.value)}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Yangi parol (ixtiyoriy)"
                      type="password"
                      value={profileForm.password}
                      onChange={(e) => handleProfileField("password", e.target.value)}
                      fullWidth
                    />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Button
                        variant="outlined"
                        startIcon={<PhotoCameraRoundedIcon />}
                        onClick={() => profileFileRef.current?.click()}
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Rasmni almashtirish
                      </Button>
                      {profileForm.photo && <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{profileForm.photo.name}</Typography>}
                      <input ref={profileFileRef} hidden type="file" accept="image/*" onChange={handleProfilePhotoChange} />
                    </Box>
                  </Box>
                ) : (
                  <List disablePadding>
                    {profileRows.map((field, i) => (
                      <Box key={i}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 2, px: 3, gap: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: "#f3f4f6", color: ACCENT }}>
                              <field.icon sx={{ fontSize: 18 }} />
                            </Avatar>
                            <Typography sx={{ color: "#6b7280", fontSize: 14 }}>{field.label}</Typography>
                          </Box>
                          <Typography sx={{ color: "#111827", fontSize: 14, fontWeight: field.label === "Tizim ID" ? 700 : 500, fontFamily: field.label === "Tizim ID" ? "monospace" : "inherit" }}>
                            {field.value}
                          </Typography>
                        </Box>
                        {i < profileRows.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </Paper>

              <Snackbar
                open={profileAlert.open}
                autoHideDuration={3000}
                onClose={() => setProfileAlert((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <Alert
                  onClose={() => setProfileAlert((prev) => ({ ...prev, open: false }))}
                  severity={profileAlert.severity}
                  variant="filled"
                  sx={{ width: "100%" }}
                >
                  {profileAlert.text}
                </Alert>
              </Snackbar>

              <Dialog
                open={confirmLeaveOpen}
                onClose={handleStayEditing}
                fullWidth
                maxWidth="xs"
              >
                <DialogTitle>Saqlanmagan o'zgarishlar bor</DialogTitle>
                <DialogContent>
                  <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                    O'zgartirishlar saqlanmagan. Chiqsangiz, ular yo'qoladi.
                  </Typography>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleStayEditing} sx={{ textTransform: "none" }}>Qolish</Button>
                  <Button onClick={handleConfirmLeave} color="error" variant="contained" sx={{ textTransform: "none" }}>
                    Chiqish
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {tab === "groups" && (
            <StudentGroupsTab user={user} />
          )}

        </Box>
      </Box>
    </Box>
  );
}