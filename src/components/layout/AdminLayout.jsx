// src/components/layout/AdminLayout.jsx
import { useState } from "react";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, Chip, AppBar, Toolbar,
  IconButton, Tooltip, Drawer,
} from "@mui/material";
import DashboardRoundedIcon       from "@mui/icons-material/DashboardRounded";
import SchoolRoundedIcon          from "@mui/icons-material/SchoolRounded";
import PeopleAltRoundedIcon       from "@mui/icons-material/PeopleAltRounded";
import GroupsRoundedIcon          from "@mui/icons-material/GroupsRounded";
import SettingsRoundedIcon        from "@mui/icons-material/SettingsRounded";
import ManageAccountsRoundedIcon  from "@mui/icons-material/ManageAccountsRounded";
import LeaderboardRoundedIcon     from "@mui/icons-material/LeaderboardRounded";
import MenuBookRoundedIcon        from "@mui/icons-material/MenuBookRounded";
import MeetingRoomRoundedIcon     from "@mui/icons-material/MeetingRoomRounded";
import LogoutRoundedIcon          from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon            from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon     from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon    from "@mui/icons-material/ChevronRightRounded";
import ChevronRightIcon           from "@mui/icons-material/ChevronRight";
import BadgeRoundedIcon           from "@mui/icons-material/BadgeRounded";
import { API_BASE }               from "../../utils/constants.js";

const FULL_W    = 240;
const MINI_W    = 68;
const ACCENT    = "#7c3aed";
const ACCENT_BG = "#f5f3ff";

const toPhotoUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE.replace(/\/api\/?$/, "")}/${clean}`;
};

const NAV = [
  { id: "dashboard", label: "Asosiy",        Icon: DashboardRoundedIcon },
  { id: "teachers",  label: "O'qituvchilar", Icon: SchoolRoundedIcon },
  { id: "students",  label: "Talabalar",     Icon: PeopleAltRoundedIcon },
  { id: "groups",    label: "Guruhlar",      Icon: GroupsRoundedIcon },
  { id: "ratings",   label: "Reytinglar",    Icon: LeaderboardRoundedIcon },
  {
    id: "manage",
    label: "Boshqarish",
    Icon: ManageAccountsRoundedIcon,
    children: [
      { id: "courses", label: "Kurslar",  Icon: MenuBookRoundedIcon },
      { id: "rooms",   label: "Xonalar",  Icon: MeetingRoomRoundedIcon },
      { id: "staff",   label: "Hodimlar", Icon: BadgeRoundedIcon },
    ],
  },
  { id: "settings", label: "Sozlamalar", Icon: SettingsRoundedIcon },
];

export const TAB_TITLES = {
  dashboard: "Asosiy",
  teachers:  "O'qituvchilar",
  students:  "Talabalar",
  groups:    "Guruhlar",
  ratings:   "Reytinglar",
  courses:   "Kurslar",
  rooms:     "Xonalar",
  staff:     "Hodimlar",
  settings:  "Sozlamalar",
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ user, tab, setTab, collapsed, setCollapsed, onLogout, onClose }) {
  const [openMenu, setOpenMenu] = useState(null);

  const handleMenuClick = (itemId) => {
    setOpenMenu(p => p === itemId ? null : itemId);
  };

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
          onClick={() => { setCollapsed(p => !p); setOpenMenu(null); }}
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
              {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "U") : null}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{
                fontSize: 13, fontWeight: 600, color: "#111827",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.fullName}
              </Typography>
              <Chip label={user?.role} size="small" sx={{
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
            {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "U") : null}
          </Avatar>
        </Box>
      )}

      {/* Nav */}
      <List sx={{ flex: 1, py: 1.5, overflowY: "auto" }} disablePadding>
        {NAV.map(item => {

          // ── Submenu item ──
          if (item.children) {
            const isActive = item.children.some(c => c.id === tab);
            const isOpen   = openMenu === item.id;

            return (
              <Box key={item.id}>
                <Tooltip title={collapsed ? item.label : ""} placement="right">
                  <ListItemButton
                    onClick={() => handleMenuClick(item.id)}
                    sx={{
                      borderRadius: 2, mx: 1, mb: 0.5,
                      px: collapsed ? 0 : 1.5, py: 1,
                      justifyContent: collapsed ? "center" : "flex-start",
                      bgcolor:   isActive || isOpen ? ACCENT_BG : "transparent",
                      color:     isActive || isOpen ? ACCENT    : "#374151",
                      "&:hover": { bgcolor: isActive || isOpen ? ACCENT_BG : "#f9fafb" },
                      transition: "all .15s",
                    }}
                  >
                    <ListItemIcon sx={{
                      minWidth: collapsed ? 0 : 36,
                      color: isActive || isOpen ? ACCENT : "#6b7280",
                      justifyContent: "center",
                    }}>
                      <item.Icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    {!collapsed && (
                      <>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: isActive || isOpen ? 600 : 500,
                          }}
                        />
                        <ChevronRightIcon sx={{
                          fontSize: 16, color: "#9ca3af",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          transition: "transform .2s",
                        }} />
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>

                {/* Inline accordion */}
                {isOpen && !collapsed && (
                  <Box sx={{
                    mx: 1, mb: 0.5,
                    bgcolor: "#9ca3",
                    borderRadius: 3,
                    border: "1px solid #9cb5",
                    overflow: "hidden",
                    animation: "accordionIn .2s cubic-bezier(.4,0,.2,1)",
                    "@keyframes accordionIn": {
                      from: { opacity: 0, transform: "translateY(-8px)" },
                      to:   { opacity: 1, transform: "translateY(0)" },
                    },
                  }}>
                    {item.children.map((child) => {
                      const isSelected = tab === child.id;
                      return (
                        <ListItemButton
                          key={child.id}
                          onClick={() => { setTab(child.id); setOpenMenu(null); onClose?.(); }}
                          sx={{
                            px: 2, py: 0.9,
                            bgcolor:    isSelected ? ACCENT_BG : "transparent",
                            borderLeft: isSelected ? `3px solid ${ACCENT}` : "3px solid transparent",
                            "&:hover":  { bgcolor: "#f0ebff" },
                            transition: "all .12s",
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 34, color: isSelected ? ACCENT : "#9ca3af" }}>
                            <child.Icon sx={{ fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{
                              fontSize: 13.5,
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? ACCENT : "#374151",
                            }}
                          />
                          {isSelected && (
                            <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: ACCENT, flexShrink: 0 }} />
                          )}
                        </ListItemButton>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          }

          // ── Normal item ──
          const isSelected = tab === item.id;
          return (
            <Tooltip key={item.id} title={collapsed ? item.label : ""} placement="right">
              <ListItemButton
                onClick={() => { setTab(item.id); setOpenMenu(null); onClose?.(); }}
                selected={isSelected}
                sx={{
                  borderRadius: 2, mx: 1, mb: 0.5,
                  px: collapsed ? 0 : 1.5, py: 1,
                  justifyContent: collapsed ? "center" : "flex-start",
                  bgcolor:  isSelected ? ACCENT_BG : "transparent",
                  color:    isSelected ? ACCENT    : "#374151",
                  "&.Mui-selected":       { bgcolor: ACCENT_BG, color: ACCENT },
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

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function AdminLayout({ user, onLogout, children, tab, setTab }) {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? MINI_W : FULL_W;

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
                NajotCRM boshqaruv paneli
              </Typography>
            </Box>
            <Chip label="● Online" size="small" sx={{
              bgcolor: "#f0fdf4", color: "#16a34a",
              fontWeight: 700, fontSize: 11,
              border: "1px solid #bbf7d0",
            }} />
            <Avatar src={toPhotoUrl(user?.photo) || undefined} sx={{ width: 32, height: 32, bgcolor: ACCENT, fontSize: 13, fontWeight: 700 }}>
              {!toPhotoUrl(user?.photo) ? (user?.fullName?.[0] || "U") : null}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: "auto" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}