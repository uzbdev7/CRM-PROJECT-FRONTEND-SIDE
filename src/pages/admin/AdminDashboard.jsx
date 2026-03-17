// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import AdminLayout   from "../../components/layout/AdminLayout.jsx";
import DashboardTab  from "./DashboardTab.jsx";
import TeachersTab   from "./TeachersTab.jsx";
import StudentsTab   from "./StudentsTab.jsx";
import GroupsTab     from "./GroupsTab.jsx";
import HomeworkTab   from "./HomeworkTab.jsx";
import RatingsTab    from "./RatingsTab.jsx";
import CoursesTab    from "./CoursesTab.jsx";
import RoomsTab      from "./RoomsTab.jsx";
import StaffTab      from "./StaffTab.jsx";
import { Spinner }   from "../../components/ui/index.jsx";
import { teacherApi, studentApi, userApi, groupApi } from "../../api/apiService.js";

const VALID_TABS = [
  "dashboard", "teachers", "students", "groups",
  "courses", "rooms", "homework", "ratings",
  "filial", "staff", "faq", "verify", "settings",
];

function PlaceholderTab({ title }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Typography sx={{ color: "#9ca3af", fontSize: 15 }}>{title} — tez orada</Typography>
    </Box>
  );
}

export default function AdminDashboard({ user, onLogout }) {
  const navigate        = useNavigate();
  const { tab: urlTab } = useParams();

  const tab = VALID_TABS.includes(urlTab) ? urlTab : "dashboard";

  const [users,  setUsers]  = useState([]);
  const [groups, setGroups] = useState([]);
  const [load,   setLoad]   = useState(true);

  const setTab = (newTab) => navigate(`/admin/${newTab}`);

  useEffect(() => {
    if (!urlTab || !VALID_TABS.includes(urlTab)) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [urlTab, navigate]);

  useEffect(() => {
    Promise.all([
      teacherApi.getAll()
        .then(data => (Array.isArray(data) ? data : data?.data || [])
          .map(u => ({ ...u, role: u.role || "TEACHER" })))
        .catch(() => []),
      studentApi.getAll()
        .then(data => (Array.isArray(data) ? data : data?.data || [])
          .map(u => ({ ...u, role: u.role || "STUDENT" })))
        .catch(() => []),
      userApi.getAll()
        .then(data => (Array.isArray(data) ? data : data?.data || [])
          .filter(u => ["ADMIN", "SUPERADMIN", "ADMINISTRATOR", "MANAGEMENT"].includes(u.role)))
        .catch(() => []),
      groupApi.getAll()
        .then(data => Array.isArray(data) ? data : data?.data || [])
        .catch(() => []),
    ])
      .then(([teachers, students, admins, groupsData]) => {
        setUsers([...teachers, ...students, ...admins]);
        setGroups(groupsData);
      })
      .catch(() => {})
      .finally(() => setLoad(false));
  }, []);

  const renderTab = () => {
    if (load) return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 10 }}>
        <Spinner size={28} />
      </Box>
    );
    switch (tab) {
      case "dashboard": return <DashboardTab users={users} groups={groups} setTab={setTab} />;
      case "teachers":  return <TeachersTab />;
      case "students":  return <StudentsTab />;
      case "groups":    return <GroupsTab />;
      case "courses":   return <CoursesTab />;
      case "rooms":     return <RoomsTab />;
      case "homework":  return <HomeworkTab />;
      case "ratings":   return <RatingsTab />;
      case "staff":     return <StaffTab />;
      case "filial":    return <PlaceholderTab title="Filial" />;
      case "faq":       return <PlaceholderTab title="FAQ" />;
      case "verify":    return <PlaceholderTab title="Tekshiruv" />;
      case "settings":  return <PlaceholderTab title="Sozlamalar" />;
      default:          return null;
    }
  };

  return (
    <AdminLayout user={user} onLogout={onLogout} tab={tab} setTab={setTab}>
      {renderTab()}
    </AdminLayout>
  );
}